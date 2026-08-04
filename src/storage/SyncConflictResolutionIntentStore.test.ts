import { describe, expect, it } from 'vitest';

import type { SyncConflictResolutionCandidate } from '../cloud/SyncConflictResolutionCandidate';
import type { StorageAdapter } from './StorageAdapter';
import {
  createSyncConflictResolutionIntentIdempotencyKey,
  createSyncConflictResolutionIntentStore,
  SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
} from './SyncConflictResolutionIntentStore';

const firstConflictId = '11111111-1111-4111-8111-111111111111';
const secondConflictId = '22222222-2222-4222-8222-222222222222';

const createMemoryStorage = (): StorageAdapter & {
  values: Map<string, string>;
} => {
  const values = new Map<string, string>();
  return {
    values,
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

const createClock = (...timestamps: string[]) => {
  let index = 0;
  return () => timestamps[Math.min(index++, timestamps.length - 1)]!;
};

const createCandidate = (
  overrides: Partial<SyncConflictResolutionCandidate> = {},
): SyncConflictResolutionCandidate => ({
  conflictId: firstConflictId,
  entityType: 'weightHistory',
  entityId: '33333333-3333-4333-8333-333333333333',
  expectedConflictRevision: 11,
  expectedRemoteRevision: 8,
  localKind: 'delete',
  remoteKind: 'upsert',
  detectedAt: '2026-08-04T10:30:00.000Z',
  ...overrides,
});

describe('SyncConflictResolutionIntentStore', () => {
  it('persists one stable intent and reuses its idempotency identity', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictResolutionIntentStore(storage, {
      now: () => '2026-08-04T11:00:00.000Z',
    });
    const candidate = createCandidate();

    const first = await store.create('user-a', candidate, 'keep_local');
    const replay = await store.create('user-a', candidate, 'keep_local');

    expect(replay).toEqual(first);
    expect(first.idempotencyKey).toBe(
      createSyncConflictResolutionIntentIdempotencyKey({
        conflictId: firstConflictId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        choice: 'keep_local',
      }),
    );
    await expect(
      createSyncConflictResolutionIntentStore(storage).list('user-a'),
    ).resolves.toEqual([first]);
  });

  it('prohibits changing immutable choice or revisions for one conflict', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictResolutionIntentStore(storage, {
      now: () => '2026-08-04T11:00:00.000Z',
    });
    const candidate = createCandidate();
    const original = await store.create('user-a', candidate, 'keep_local');

    await expect(
      store.create('user-a', candidate, 'keep_remote'),
    ).rejects.toThrow('different immutable fields');
    await expect(
      store.create(
        'user-a',
        createCandidate({ expectedRemoteRevision: 9 }),
        'keep_local',
      ),
    ).rejects.toThrow('different immutable fields');
    await expect(store.get('user-a', firstConflictId)).resolves.toEqual(
      original,
    );
  });

  it('recovers an interrupted submitting attempt as retryable after restart', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictResolutionIntentStore(storage, {
      now: createClock(
        '2026-08-04T11:00:00.000Z',
        '2026-08-04T11:01:00.000Z',
      ),
    });
    const created = await store.create(
      'user-a',
      createCandidate(),
      'keep_remote',
    );
    const submitting = await store.transition(
      'user-a',
      firstConflictId,
      created.idempotencyKey,
      'submitting',
    );

    const restored = createSyncConflictResolutionIntentStore(storage);
    await expect(restored.get('user-a', firstConflictId)).resolves.toEqual({
      ...submitting,
      state: 'retryable',
    });
    expect(
      storage.values.get(SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY),
    ).toContain('"state":"retryable"');
  });

  it('fails closed on malformed records while repairing safe timestamps', async () => {
    const storage = createMemoryStorage();
    const validKey = createSyncConflictResolutionIntentIdempotencyKey({
      conflictId: firstConflictId,
      expectedConflictRevision: 11,
      expectedRemoteRevision: 8,
      choice: 'keep_local',
    });
    storage.values.set(
      SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        records: [
          {
            userId: 'user-a',
            intents: [
              {
                conflictId: firstConflictId,
                expectedConflictRevision: 11,
                expectedRemoteRevision: 8,
                choice: 'keep_local',
                idempotencyKey: validKey,
                state: 'pending',
                createdAt: '2026-08-04T11:00:00Z',
                updatedAt: '2026-08-04T10:59:00Z',
              },
              {
                conflictId: secondConflictId,
                expectedConflictRevision: 12,
                expectedRemoteRevision: 9,
                choice: 'keep_remote',
                idempotencyKey: 'wrong-key',
                state: 'pending',
                createdAt: '2026-08-04T11:00:00.000Z',
                updatedAt: '2026-08-04T11:00:00.000Z',
              },
            ],
          },
        ],
      }),
    );

    await expect(
      createSyncConflictResolutionIntentStore(storage).list('user-a'),
    ).resolves.toEqual([
      {
        conflictId: firstConflictId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        choice: 'keep_local',
        idempotencyKey: validKey,
        state: 'pending',
        createdAt: '2026-08-04T11:00:00.000Z',
        updatedAt: '2026-08-04T11:00:00.000Z',
      },
    ]);
    const repaired = storage.values.get(
      SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
    );
    expect(repaired).not.toContain(secondConflictId);
  });

  it('isolates users and removes only a terminal intent for that user', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictResolutionIntentStore(storage, {
      now: createClock(
        '2026-08-04T11:00:00.000Z',
        '2026-08-04T11:01:00.000Z',
        '2026-08-04T11:02:00.000Z',
        '2026-08-04T11:03:00.000Z',
        '2026-08-04T11:04:00.000Z',
      ),
    });
    const first = await store.create(
      'user-a',
      createCandidate(),
      'keep_local',
    );
    const second = await store.create(
      'user-b',
      createCandidate({ conflictId: secondConflictId }),
      'keep_remote',
    );

    await expect(
      store.removeTerminal('user-a', firstConflictId, first.idempotencyKey),
    ).resolves.toBe(false);
    await store.transition(
      'user-a',
      firstConflictId,
      first.idempotencyKey,
      'submitting',
    );
    await store.transition(
      'user-a',
      firstConflictId,
      first.idempotencyKey,
      'accepted',
    );
    await store.transition(
      'user-a',
      firstConflictId,
      first.idempotencyKey,
      'completed',
    );
    await expect(
      store.removeTerminal('user-a', firstConflictId, first.idempotencyKey),
    ).resolves.toBe(true);

    await expect(store.list('user-a')).resolves.toEqual([]);
    await expect(store.list('user-b')).resolves.toEqual([second]);
  });

  it('preserves the key through retries and rejects a mismatched key', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictResolutionIntentStore(storage, {
      now: createClock(
        '2026-08-04T11:00:00.000Z',
        '2026-08-04T11:01:00.000Z',
        '2026-08-04T11:02:00.000Z',
        '2026-08-04T11:03:00.000Z',
      ),
    });
    const created = await store.create(
      'user-a',
      createCandidate(),
      'keep_local',
    );

    await expect(
      store.transition('user-a', firstConflictId, 'wrong-key', 'submitting'),
    ).rejects.toThrow('idempotency mismatch');
    const submitting = await store.transition(
      'user-a',
      firstConflictId,
      created.idempotencyKey,
      'submitting',
    );
    const retryable = await store.transition(
      'user-a',
      firstConflictId,
      created.idempotencyKey,
      'retryable',
    );
    const retried = await store.transition(
      'user-a',
      firstConflictId,
      created.idempotencyKey,
      'submitting',
    );

    expect(submitting?.idempotencyKey).toBe(created.idempotencyKey);
    expect(retryable?.idempotencyKey).toBe(created.idempotencyKey);
    expect(retried?.idempotencyKey).toBe(created.idempotencyKey);
    expect(retried?.lastAttemptAt).toBe('2026-08-04T11:03:00.000Z');
  });
});
