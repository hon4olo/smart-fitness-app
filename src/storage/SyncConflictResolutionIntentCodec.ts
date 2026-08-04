import { isUuid } from '../lib/ids';
import type { StorageAdapter } from './StorageAdapter';
import {
  createSyncConflictResolutionIntentIdempotencyKey,
  isSyncConflictResolutionChoice,
  isSyncConflictResolutionIntentState,
  isSyncConflictResolutionRevision,
  normalizeSyncConflictResolutionTimestamp,
  SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
  type SyncConflictResolutionIntent,
} from './SyncConflictResolutionIntentModel';

type StoredUserRecord = {
  userId?: unknown;
  intents?: unknown;
};

type StoredEnvelope = {
  version?: unknown;
  records?: unknown;
};

export type ParsedSyncConflictResolutionIntentState = {
  users: Map<string, Map<string, SyncConflictResolutionIntent>>;
  changed: boolean;
  repairable: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeIntent = (
  value: unknown,
  recoverSubmitting: boolean,
): { intent: SyncConflictResolutionIntent; changed: boolean } | null => {
  if (!isRecord(value)) return null;

  const conflictId = nonEmptyString(value.conflictId);
  const choice = value.choice;
  const storedState = value.state;
  const createdAt = normalizeSyncConflictResolutionTimestamp(value.createdAt);
  const normalizedUpdatedAt = normalizeSyncConflictResolutionTimestamp(
    value.updatedAt,
  );
  const resolutionRevision =
    value.resolutionRevision === undefined
      ? undefined
      : isSyncConflictResolutionRevision(value.resolutionRevision)
        ? value.resolutionRevision
        : null;
  const resolutionRevisionAllowed =
    storedState === 'accepted' || storedState === 'completed';

  if (
    !conflictId ||
    !isUuid(conflictId) ||
    !isSyncConflictResolutionRevision(value.expectedConflictRevision) ||
    !isSyncConflictResolutionRevision(value.expectedRemoteRevision) ||
    !isSyncConflictResolutionChoice(choice) ||
    !isSyncConflictResolutionIntentState(storedState) ||
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
  const parsedLastAttemptAt = normalizeSyncConflictResolutionTimestamp(
    value.lastAttemptAt,
  );
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

export const sortSyncConflictResolutionIntents = (
  intents: Iterable<SyncConflictResolutionIntent>,
): SyncConflictResolutionIntent[] =>
  [...intents].sort((left, right) =>
    left.createdAt === right.createdAt
      ? left.conflictId.localeCompare(right.conflictId)
      : left.createdAt.localeCompare(right.createdAt),
  );

export const parseSyncConflictResolutionIntentState = async (
  storage: StorageAdapter,
  recoverSubmitting: boolean,
): Promise<ParsedSyncConflictResolutionIntentState> => {
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
        intents: sortSyncConflictResolutionIntents(intents.values()),
      })),
  });

export const persistSyncConflictResolutionIntentState = async (
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
