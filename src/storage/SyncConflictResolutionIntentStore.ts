import type { SyncConflictResolutionChoice } from '../cloud/SyncConflictResolutionApi';
import type { SyncConflictResolutionCandidate } from '../cloud/SyncConflictResolutionCandidate';
import { createDeterministicUuid, isUuid } from '../lib/ids';
import type { StorageAdapter } from './StorageAdapter';

export const SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY =
  '@smart_fitness_mvp_sync_conflict_resolution_intents';

export const SYNC_CONFLICT_RESOLUTION_INTENT_STATES = [
  'pending',
  'submitting',
  'retryable',
  'accepted',
  'stale',
  'completed',
] as const;

export type SyncConflictResolutionIntentState =
  (typeof SYNC_CONFLICT_RESOLUTION_INTENT_STATES)[number];

export type SyncConflictResolutionIntent = {
  conflictId: string;
  expectedConflictRevision: number;
  expectedRemoteRevision: number;
  choice: SyncConflictResolutionChoice;
  idempotencyKey: string;
  state: SyncConflictResolutionIntentState;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  resolutionRevision?: number;
};

export type SyncConflictResolutionIntentStore = {
  list(userId: string): Promise<SyncConflictResolutionIntent[]>;
  get(
    userId: string,
    conflictId: string,
  ): Promise<SyncConflictResolutionIntent | null>;
  create(
    userId: string,
    candidate: SyncConflictResolutionCandidate,
    choice: SyncConflictResolutionChoice,
  ): Promise<SyncConflictResolutionIntent>;
  transition(
    userId: string,
    conflictId: string,
    idempotencyKey: string,
    state: SyncConflictResolutionIntentState,
  ): Promise<SyncConflictResolutionIntent | null>;
  markAccepted(
    userId: string,
    conflictId: string,
    idempotencyKey: string,
    resolutionRevision: number,
  ): Promise<SyncConflictResolutionIntent | null>;
  removeTerminal(
    userId: string,
    conflictId: string,
    idempotencyKey: string,
  ): Promise<boolean>;
};

type StoredUserRecord = {
  userId?: unknown;
  intents?: unknown;
};

type StoredEnvelope = {
  version?: unknown;
  records?: unknown;
};

type ParsedState = {
  users: Map<string, Map<string, SyncConflictResolutionIntent>>;
  changed: boolean;
  repairable: boolean;
};

type StoreOptions = {
  now?: () => string;
};

const STATE_SET = new Set<SyncConflictResolutionIntentState>(
  SYNC_CONFLICT_RESOLUTION_INTENT_STATES,
);
const TERMINAL_STATES = new Set<SyncConflictResolutionIntentState>([
  'completed',
]);
const ALLOWED_TRANSITIONS: Record<
  SyncConflictResolutionIntentState,
  ReadonlySet<SyncConflictResolutionIntentState>
> = {
  pending: new Set(['submitting']),
  submitting: new Set(['retryable', 'stale']),
  retryable: new Set(['submitting']),
  accepted: new Set(['completed']),
  stale: new Set(['completed']),
  completed: new Set(),
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeTimestamp = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
};

const isRevision = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isChoice = (value: unknown): value is SyncConflictResolutionChoice =>
  value === 'keep_local' || value === 'keep_remote';

const isState = (value: unknown): value is SyncConflictResolutionIntentState =>
  typeof value === 'string' &&
  STATE_SET.has(value as SyncConflictResolutionIntentState);

export const createSyncConflictResolutionIntentIdempotencyKey = (input: {
  conflictId: string;
  expectedConflictRevision: number;
  expectedRemoteRevision: number;
  choice: SyncConflictResolutionChoice;
}): string => {
  const digest = createDeterministicUuid(
    [
      'sync-conflict-resolution-intent:v1',
      input.conflictId,
      input.expectedConflictRevision,
      input.expectedRemoteRevision,
      input.choice,
    ].join(':'),
  );
  return `conflict-resolution:v1:${digest}`;
};

const normalizeIntent = (
  value: unknown,
  recoverSubmitting: boolean,
): { intent: SyncConflictResolutionIntent; changed: boolean } | null => {
  if (!isRecord(value)) return null;

  const conflictId = nonEmptyString(value.conflictId);
  const choice = value.choice;
  const storedState = value.state;
  const createdAt = normalizeTimestamp(value.createdAt);
  const normalizedUpdatedAt = normalizeTimestamp(value.updatedAt);
  const resolutionRevision =
    value.resolutionRevision === undefined
      ? undefined
      : isRevision(value.resolutionRevision)
        ? value.resolutionRevision
        : null;
  const resolutionRevisionAllowed =
    storedState === 'accepted' || storedState === 'completed';

  if (
    !conflictId ||
    !isUuid(conflictId) ||
    !isRevision(value.expectedConflictRevision) ||
    !isRevision(value.expectedRemoteRevision) ||
    !isChoice(choice) ||
    !isState(storedState) ||
    !createdAt ||
    !normalizedUpdatedAt ||
    resolutionRevision === null ||
    (storedState === 'accepted' && resolutionRevision === undefined) ||
    (!resolutionRevisionAllowed && resolutionRevision !== undefined)
  ) {
    return null;
  }

  const expectedKey = createSyncConflictResolutionIntentIdempotencyKey({
    conflictId,
    expectedConflictRevision: value.expectedConflictRevision,
    expectedRemoteRevision: value.expectedRemoteRevision,
    choice,
  });
  if (value.idempotencyKey !== expectedKey) return null;

  const updatedAt =
    normalizedUpdatedAt < createdAt ? createdAt : normalizedUpdatedAt;
  const parsedLastAttemptAt = normalizeTimestamp(value.lastAttemptAt);
  const state =
    recoverSubmitting && storedState === 'submitting'
      ? 'retryable'
      : storedState;
  const lastAttemptAt =
    parsedLastAttemptAt ?? (storedState === 'submitting' ? updatedAt : undefined);
  const intent: SyncConflictResolutionIntent = {
    conflictId,
    expectedConflictRevision: value.expectedConflictRevision,
    expectedRemoteRevision: value.expectedRemoteRevision,
    choice,
    idempotencyKey: expectedKey,
    state,
    createdAt,
    updatedAt,
    ...(lastAttemptAt ? { lastAttemptAt } : {}),
    ...(resolutionRevision === undefined ? {} : { resolutionRevision }),
  };

  return {
    intent,
    changed:
      state !== storedState ||
      createdAt !== value.createdAt ||
      updatedAt !== value.updatedAt ||
      lastAttemptAt !== value.lastAttemptAt,
  };
};

const sortIntents = (
  intents: Iterable<SyncConflictResolutionIntent>,
): SyncConflictResolutionIntent[] =>
  [...intents].sort((left, right) =>
    left.createdAt === right.createdAt
      ? left.conflictId.localeCompare(right.conflictId)
      : left.createdAt.localeCompare(right.createdAt),
  );

const parse = async (
  storage: StorageAdapter,
  recoverSubmitting: boolean,
): Promise<ParsedState> => {
  const raw = await storage.read(SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY);
  if (!raw) return { users: new Map(), changed: false, repairable: true };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { users: new Map(), changed: false, repairable: false };
  }

  if (
    !isRecord(parsed) ||
    (parsed as StoredEnvelope).version !== 1 ||
    !Array.isArray((parsed as StoredEnvelope).records)
  ) {
    return { users: new Map(), changed: false, repairable: false };
  }

  const users = new Map<
    string,
    Map<string, SyncConflictResolutionIntent>
  >();
  const corrupted = new Map<string, Set<string>>();
  let changed = false;

  for (const rawRecord of (parsed as StoredEnvelope).records as unknown[]) {
    if (!isRecord(rawRecord)) {
      changed = true;
      continue;
    }
    const record = rawRecord as StoredUserRecord;
    const userId = nonEmptyString(record.userId);
    if (!userId || !Array.isArray(record.intents)) {
      changed = true;
      continue;
    }

    const intents = users.get(userId) ?? new Map();
    const invalidIds = corrupted.get(userId) ?? new Set<string>();
    for (const rawIntent of record.intents) {
      const normalized = normalizeIntent(rawIntent, recoverSubmitting);
      if (!normalized) {
        changed = true;
        continue;
      }
      const { intent } = normalized;
      if (invalidIds.has(intent.conflictId)) {
        changed = true;
        continue;
      }
      const existing = intents.get(intent.conflictId);
      if (existing && JSON.stringify(existing) !== JSON.stringify(intent)) {
        intents.delete(intent.conflictId);
        invalidIds.add(intent.conflictId);
        changed = true;
        continue;
      }
      intents.set(intent.conflictId, intent);
      changed = changed || normalized.changed || Boolean(existing);
    }
    users.set(userId, intents);
    corrupted.set(userId, invalidIds);
  }

  return { users, changed, repairable: true };
};

const serialize = (
  users: Map<string, Map<string, SyncConflictResolutionIntent>>,
): string =>
  JSON.stringify({
    version: 1,
    records: [...users.entries()]
      .filter(([, intents]) => intents.size > 0)
      .map(([userId, intents]) => ({
        userId,
        intents: sortIntents(intents.values()),
      })),
  });

const persist = async (
  storage: StorageAdapter,
  users: Map<string, Map<string, SyncConflictResolutionIntent>>,
): Promise<void> => {
  for (const [userId, intents] of users) {
    if (intents.size === 0) users.delete(userId);
  }
  if (users.size === 0) {
    await storage.remove(SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY);
    return;
  }
  await storage.write(
    SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
    serialize(users),
  );
};

const requireUserId = (userId: string): string => {
  const normalized = userId.trim();
  if (!normalized) throw new Error('Invalid sync conflict resolution user');
  return normalized;
};

const validateCandidate = (
  candidate: SyncConflictResolutionCandidate,
): void => {
  if (
    !isUuid(candidate.conflictId) ||
    !isRevision(candidate.expectedConflictRevision) ||
    !isRevision(candidate.expectedRemoteRevision) ||
    candidate.localKind === candidate.remoteKind
  ) {
    throw new Error('Invalid sync conflict resolution candidate');
  }
};

export const isTerminalSyncConflictResolutionIntent = (
  intent: SyncConflictResolutionIntent,
): boolean => TERMINAL_STATES.has(intent.state);

export const createSyncConflictResolutionIntentStore = (
  storage: StorageAdapter,
  options: StoreOptions = {},
): SyncConflictResolutionIntentStore => {
  const now = () => normalizeTimestamp(options.now?.() ?? new Date().toISOString());
  let mutationTail: Promise<void> = Promise.resolve();
  let initialized = false;

  const timestamp = (): string => {
    const value = now();
    if (!value) throw new Error('Invalid sync conflict resolution timestamp');
    return value;
  };

  const load = async () => {
    const parsed = await parse(storage, !initialized);
    initialized = true;
    if (parsed.changed && parsed.repairable) {
      await persist(storage, parsed.users);
    }
    return parsed.users;
  };

  const mutate = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = mutationTail.then(operation, operation);
    mutationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  return {
    async list(userId) {
      await mutationTail;
      const users = await load();
      return sortIntents(users.get(userId.trim())?.values() ?? []);
    },

    async get(userId, conflictId) {
      await mutationTail;
      const users = await load();
      return users.get(userId.trim())?.get(conflictId.trim()) ?? null;
    },

    create(userId, candidate, choice) {
      return mutate(async () => {
        const normalizedUserId = requireUserId(userId);
        validateCandidate(candidate);
        if (!isChoice(choice)) {
          throw new Error('Invalid sync conflict resolution choice');
        }

        const users = await load();
        const intents = users.get(normalizedUserId) ?? new Map();
        const existing = intents.get(candidate.conflictId);
        if (existing) {
          if (
            existing.expectedConflictRevision ===
              candidate.expectedConflictRevision &&
            existing.expectedRemoteRevision === candidate.expectedRemoteRevision &&
            existing.choice === choice
          ) {
            return existing;
          }
          throw new Error(
            'Sync conflict resolution intent already exists with different immutable fields',
          );
        }

        const createdAt = timestamp();
        const intent: SyncConflictResolutionIntent = {
          conflictId: candidate.conflictId,
          expectedConflictRevision: candidate.expectedConflictRevision,
          expectedRemoteRevision: candidate.expectedRemoteRevision,
          choice,
          idempotencyKey:
            createSyncConflictResolutionIntentIdempotencyKey({
              conflictId: candidate.conflictId,
              expectedConflictRevision: candidate.expectedConflictRevision,
              expectedRemoteRevision: candidate.expectedRemoteRevision,
              choice,
            }),
          state: 'pending',
          createdAt,
          updatedAt: createdAt,
        };
        intents.set(intent.conflictId, intent);
        users.set(normalizedUserId, intents);
        await persist(storage, users);
        return intent;
      });
    },

    transition(userId, conflictId, idempotencyKey, state) {
      return mutate(async () => {
        const normalizedUserId = requireUserId(userId);
        if (!isState(state) || state === 'accepted') {
          throw new Error('Invalid sync conflict resolution intent state');
        }
        const users = await load();
        const intents = users.get(normalizedUserId);
        const existing = intents?.get(conflictId.trim());
        if (!existing) return null;
        if (existing.idempotencyKey !== idempotencyKey) {
          throw new Error('Sync conflict resolution idempotency mismatch');
        }
        if (existing.state === state) return existing;
        if (!ALLOWED_TRANSITIONS[existing.state].has(state)) {
          throw new Error('Invalid sync conflict resolution intent transition');
        }

        const updatedAt = timestamp();
        const next: SyncConflictResolutionIntent = {
          ...existing,
          state,
          updatedAt,
          ...(state === 'submitting'
            ? { lastAttemptAt: updatedAt }
            : existing.lastAttemptAt
              ? { lastAttemptAt: existing.lastAttemptAt }
              : {}),
        };
        intents?.set(next.conflictId, next);
        await persist(storage, users);
        return next;
      });
    },

    markAccepted(userId, conflictId, idempotencyKey, resolutionRevision) {
      return mutate(async () => {
        const normalizedUserId = requireUserId(userId);
        if (!isRevision(resolutionRevision)) {
          throw new Error('Invalid sync conflict resolution revision');
        }
        const users = await load();
        const intents = users.get(normalizedUserId);
        const existing = intents?.get(conflictId.trim());
        if (!existing) return null;
        if (existing.idempotencyKey !== idempotencyKey) {
          throw new Error('Sync conflict resolution idempotency mismatch');
        }
        if (existing.state === 'accepted') {
          if (existing.resolutionRevision !== resolutionRevision) {
            throw new Error('Sync conflict resolution revision mismatch');
          }
          return existing;
        }
        if (existing.state !== 'submitting') {
          throw new Error('Invalid sync conflict resolution intent transition');
        }

        const next: SyncConflictResolutionIntent = {
          ...existing,
          state: 'accepted',
          resolutionRevision,
          updatedAt: timestamp(),
        };
        intents?.set(next.conflictId, next);
        await persist(storage, users);
        return next;
      });
    },

    removeTerminal(userId, conflictId, idempotencyKey) {
      return mutate(async () => {
        const normalizedUserId = requireUserId(userId);
        const users = await load();
        const intents = users.get(normalizedUserId);
        const existing = intents?.get(conflictId.trim());
        if (!existing) return false;
        if (existing.idempotencyKey !== idempotencyKey) {
          throw new Error('Sync conflict resolution idempotency mismatch');
        }
        if (!isTerminalSyncConflictResolutionIntent(existing)) return false;
        intents?.delete(existing.conflictId);
        await persist(storage, users);
        return true;
      });
    },
  };
};
