import { describe, expect, it } from 'vitest';

import type {
  SyncConflictResolutionCandidate,
  SyncConflictResolutionChoice,
} from '@/cloud';

import type { StorageAdapter } from './StorageAdapter';
import {
  createSyncConflictResolutionIntentStore,
  type SyncConflictResolutionIntentState,
  type SyncConflictResolutionIntentStore,
} from './SyncConflictResolutionIntentStore';

type Actor = 'a' | 'b';
type Action =
  | 'accept'
  | 'complete'
  | 'create'
  | 'invalid-revision'
  | 'list'
  | 'remove'
  | 'restart'
  | 'retry'
  | 'stale'
  | 'submit'
  | 'wrong-key';

type Command = {
  action: Action;
  actor: Actor;
  choice: SyncConflictResolutionChoice;
  revision: number;
};

type ModelIntent = {
  choice: SyncConflictResolutionChoice;
  idempotencyKey: string;
  resolutionRevision?: number;
  state: SyncConflictResolutionIntentState;
};

const candidate: SyncConflictResolutionCandidate = {
  conflictId: '11111111-1111-4111-8111-111111111111',
  entityType: 'weightHistory',
  entityId: '22222222-2222-4222-8222-222222222222',
  expectedConflictRevision: 11,
  expectedRemoteRevision: 8,
  localKind: 'delete',
  remoteKind: 'upsert',
  detectedAt: '2026-08-04T10:30:00.000Z',
};

const actors: Record<Actor, string> = {
  a: 'user-a',
  b: 'user-b',
};

const actions: Action[] = [
  'create',
  'submit',
  'retry',
  'accept',
  'stale',
  'complete',
  'remove',
  'restart',
  'wrong-key',
  'invalid-revision',
  'list',
];

const createMemoryStorage = (): StorageAdapter => {
  const values = new Map<string, string>();
  return {
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
  };
};

const createRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
};

const generateCommands = (seed: number): Command[] => {
  const random = createRandom(seed);
  const length = 20 + (random() % 41);
  return Array.from({ length }, () => ({
    action: actions[random() % actions.length]!,
    actor: random() % 2 === 0 ? 'a' : 'b',
    choice: random() % 2 === 0 ? 'keep_local' : 'keep_remote',
    revision: 12 + (random() % 3),
  }));
};

const expectRejected = async (operation: Promise<unknown>) => {
  await expect(operation).rejects.toBeInstanceOf(Error);
};

const assertStoreMatchesModel = async (
  store: SyncConflictResolutionIntentStore,
  model: Map<string, ModelIntent>,
) => {
  for (const userId of Object.values(actors)) {
    const actual = await store.list(userId);
    const expected = model.get(userId);
    expect(actual).toHaveLength(expected ? 1 : 0);
    if (!expected) continue;
    expect(actual[0]).toMatchObject({
      choice: expected.choice,
      conflictId: candidate.conflictId,
      expectedConflictRevision: candidate.expectedConflictRevision,
      expectedRemoteRevision: candidate.expectedRemoteRevision,
      idempotencyKey: expected.idempotencyKey,
      state: expected.state,
    });
    expect(actual[0]?.resolutionRevision).toBe(expected.resolutionRevision);
  }
};

const runSequence = async (commands: readonly Command[]) => {
  const storage = createMemoryStorage();
  const model = new Map<string, ModelIntent>();
  let tick = 0;
  const now = () =>
    new Date(Date.UTC(2026, 7, 4, 11, 0, tick++)).toISOString();
  let store = createSyncConflictResolutionIntentStore(storage, { now });

  for (const command of commands) {
    const userId = actors[command.actor];
    const existing = model.get(userId);

    if (command.action === 'create') {
      if (!existing) {
        const created = await store.create(userId, candidate, command.choice);
        model.set(userId, {
          choice: command.choice,
          idempotencyKey: created.idempotencyKey,
          state: 'pending',
        });
      } else if (existing.choice === command.choice) {
        const replay = await store.create(userId, candidate, command.choice);
        expect(replay.idempotencyKey).toBe(existing.idempotencyKey);
        expect(replay.state).toBe(existing.state);
      } else {
        await expectRejected(store.create(userId, candidate, command.choice));
      }
    } else if (command.action === 'submit') {
      if (!existing) {
        await expect(
          store.transition(userId, candidate.conflictId, 'missing-key', 'submitting'),
        ).resolves.toBeNull();
      } else if (existing.state === 'pending' || existing.state === 'retryable') {
        await store.transition(
          userId,
          candidate.conflictId,
          existing.idempotencyKey,
          'submitting',
        );
        existing.state = 'submitting';
      } else if (existing.state === 'submitting') {
        await expect(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'submitting',
          ),
        ).resolves.toMatchObject({ state: 'submitting' });
      } else {
        await expectRejected(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'submitting',
          ),
        );
      }
    } else if (command.action === 'retry') {
      if (existing?.state === 'submitting') {
        await store.transition(
          userId,
          candidate.conflictId,
          existing.idempotencyKey,
          'retryable',
        );
        existing.state = 'retryable';
      } else if (existing?.state === 'retryable') {
        await expect(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'retryable',
          ),
        ).resolves.toMatchObject({ state: 'retryable' });
      } else if (!existing) {
        await expect(
          store.transition(userId, candidate.conflictId, 'missing-key', 'retryable'),
        ).resolves.toBeNull();
      } else {
        await expectRejected(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'retryable',
          ),
        );
      }
    } else if (command.action === 'accept') {
      if (existing?.state === 'submitting') {
        await store.markAccepted(
          userId,
          candidate.conflictId,
          existing.idempotencyKey,
          command.revision,
        );
        existing.state = 'accepted';
        existing.resolutionRevision = command.revision;
      } else if (
        existing?.state === 'accepted' &&
        existing.resolutionRevision === command.revision
      ) {
        await expect(
          store.markAccepted(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            command.revision,
          ),
        ).resolves.toMatchObject({
          resolutionRevision: command.revision,
          state: 'accepted',
        });
      } else if (!existing) {
        await expect(
          store.markAccepted(
            userId,
            candidate.conflictId,
            'missing-key',
            command.revision,
          ),
        ).resolves.toBeNull();
      } else {
        await expectRejected(
          store.markAccepted(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            command.revision,
          ),
        );
      }
    } else if (command.action === 'stale') {
      if (existing?.state === 'submitting') {
        await store.transition(
          userId,
          candidate.conflictId,
          existing.idempotencyKey,
          'stale',
        );
        existing.state = 'stale';
      } else if (existing?.state === 'stale') {
        await expect(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'stale',
          ),
        ).resolves.toMatchObject({ state: 'stale' });
      } else if (!existing) {
        await expect(
          store.transition(userId, candidate.conflictId, 'missing-key', 'stale'),
        ).resolves.toBeNull();
      } else {
        await expectRejected(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'stale',
          ),
        );
      }
    } else if (command.action === 'complete') {
      if (existing?.state === 'accepted' || existing?.state === 'stale') {
        await store.transition(
          userId,
          candidate.conflictId,
          existing.idempotencyKey,
          'completed',
        );
        existing.state = 'completed';
      } else if (existing?.state === 'completed') {
        await expect(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'completed',
          ),
        ).resolves.toMatchObject({ state: 'completed' });
      } else if (!existing) {
        await expect(
          store.transition(userId, candidate.conflictId, 'missing-key', 'completed'),
        ).resolves.toBeNull();
      } else {
        await expectRejected(
          store.transition(
            userId,
            candidate.conflictId,
            existing.idempotencyKey,
            'completed',
          ),
        );
      }
    } else if (command.action === 'remove') {
      const removed = await store.removeTerminal(
        userId,
        candidate.conflictId,
        existing?.idempotencyKey ?? 'missing-key',
      );
      expect(removed).toBe(existing?.state === 'completed');
      if (removed) model.delete(userId);
    } else if (command.action === 'wrong-key') {
      if (existing) {
        await expectRejected(
          store.transition(
            userId,
            candidate.conflictId,
            'wrong-key',
            'submitting',
          ),
        );
      } else {
        await expect(
          store.transition(userId, candidate.conflictId, 'wrong-key', 'submitting'),
        ).resolves.toBeNull();
      }
    } else if (command.action === 'invalid-revision') {
      await expectRejected(
        store.markAccepted(
          userId,
          candidate.conflictId,
          existing?.idempotencyKey ?? 'missing-key',
          -1,
        ),
      );
    } else if (command.action === 'restart') {
      store = createSyncConflictResolutionIntentStore(storage, { now });
      for (const intent of model.values()) {
        if (intent.state === 'submitting') intent.state = 'retryable';
      }
    } else {
      await store.list(userId);
    }

    await assertStoreMatchesModel(store, model);
  }
};

const sequenceFails = async (commands: readonly Command[]): Promise<boolean> => {
  try {
    await runSequence(commands);
    return false;
  } catch {
    return true;
  }
};

const shrinkFailingSequence = async (
  commands: readonly Command[],
): Promise<Command[]> => {
  let current = [...commands];
  let chunkSize = Math.max(1, Math.floor(current.length / 2));

  while (chunkSize >= 1) {
    let reduced = false;
    for (let start = 0; start < current.length; start += chunkSize) {
      const candidateSequence = [
        ...current.slice(0, start),
        ...current.slice(start + chunkSize),
      ];
      if (candidateSequence.length === 0) continue;
      if (await sequenceFails(candidateSequence)) {
        current = candidateSequence;
        reduced = true;
        break;
      }
    }
    if (!reduced) chunkSize = Math.floor(chunkSize / 2);
  }

  return current;
};

describe('SyncConflictResolutionIntentStore generated model sequences', () => {
  it('preserves identity, transitions, restart recovery and user isolation', async () => {
    for (let seed = 1; seed <= 128; seed += 1) {
      const commands = generateCommands(seed);
      try {
        await runSequence(commands);
      } catch (error) {
        const shrunk = await shrinkFailingSequence(commands);
        let shrunkError: unknown;
        try {
          await runSequence(shrunk);
        } catch (failure) {
          shrunkError = failure;
        }
        throw new Error(
          `Generated sequence failed; seed=${seed}; commands=${JSON.stringify(shrunk)}`,
          { cause: shrunkError ?? error },
        );
      }
    }
  });

  it('shrinks a failing sequence to the relevant command', async () => {
    const commands = generateCommands(73);
    const failing = [...commands, {
      action: 'invalid-revision',
      actor: 'a',
      choice: 'keep_local',
      revision: 12,
    } satisfies Command];
    const artificialFailure = async (sequence: readonly Command[]) =>
      sequence.some(
        (command) =>
          command.action === 'invalid-revision' && command.actor === 'a',
      );

    let current = [...failing];
    let chunkSize = Math.max(1, Math.floor(current.length / 2));
    while (chunkSize >= 1) {
      let reduced = false;
      for (let start = 0; start < current.length; start += chunkSize) {
        const trial = [
          ...current.slice(0, start),
          ...current.slice(start + chunkSize),
        ];
        if (trial.length > 0 && (await artificialFailure(trial))) {
          current = trial;
          reduced = true;
          break;
        }
      }
      if (!reduced) chunkSize = Math.floor(chunkSize / 2);
    }

    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({
      action: 'invalid-revision',
      actor: 'a',
    });
  });
});
