import {
  parseSyncConflictResolutionIntentState,
  persistSyncConflictResolutionIntentState,
  sortSyncConflictResolutionIntents,
} from './SyncConflictResolutionIntentCodec';
import {
  ALLOWED_SYNC_CONFLICT_RESOLUTION_INTENT_TRANSITIONS,
  createSyncConflictResolutionIntentIdempotencyKey,
  isSyncConflictResolutionChoice,
  isSyncConflictResolutionIntentState,
  isSyncConflictResolutionRevision,
  isTerminalSyncConflictResolutionIntent,
  normalizeSyncConflictResolutionTimestamp,
  requireSyncConflictResolutionUserId,
  SYNC_CONFLICT_RESOLUTION_INTENT_STATES,
  SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
  type SyncConflictResolutionIntent,
  type SyncConflictResolutionIntentState,
  type SyncConflictResolutionIntentStore,
  validateSyncConflictResolutionCandidate,
} from './SyncConflictResolutionIntentModel';
import type { StorageAdapter } from './StorageAdapter';

export {
  createSyncConflictResolutionIntentIdempotencyKey,
  isTerminalSyncConflictResolutionIntent,
  SYNC_CONFLICT_RESOLUTION_INTENT_STATES,
  SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
};
export type {
  SyncConflictResolutionIntent,
  SyncConflictResolutionIntentState,
  SyncConflictResolutionIntentStore,
};

type StoreOptions = {
  now?: () => string;
};

export const createSyncConflictResolutionIntentStore = (
  storage: StorageAdapter,
  options: StoreOptions = {},
): SyncConflictResolutionIntentStore => {
  const now = () =>
    normalizeSyncConflictResolutionTimestamp(
      options.now?.() ?? new Date().toISOString(),
    );
  let mutationTail: Promise<void> = Promise.resolve();
  let initialized = false;

  const timestamp = (): string => {
    const value = now();
    if (!value) throw new Error('Invalid sync conflict resolution timestamp');
    return value;
  };

  const load = async () => {
    const parsed = await parseSyncConflictResolutionIntentState(
      storage,
      !initialized,
    );
    initialized = true;
    if (parsed.changed && parsed.repairable) {
      await persistSyncConflictResolutionIntentState(storage, parsed.users);
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

  const requireExisting = async (
    userId: string,
    conflictId: string,
    idempotencyKey: string,
  ) => {
    const normalizedUserId = requireSyncConflictResolutionUserId(userId);
    const users = await load();
    const intents = users.get(normalizedUserId);
    const existing = intents?.get(conflictId.trim());
    if (!existing) return { existing: null, intents, users };
    if (existing.idempotencyKey !== idempotencyKey) {
      throw new Error('Sync conflict resolution idempotency mismatch');
    }
    return { existing, intents, users };
  };

  return {
    async list(userId) {
      await mutationTail;
      const users = await load();
      return sortSyncConflictResolutionIntents(
        users.get(userId.trim())?.values() ?? [],
      );
    },

    async get(userId, conflictId) {
      await mutationTail;
      const users = await load();
      return users.get(userId.trim())?.get(conflictId.trim()) ?? null;
    },

    create(userId, candidate, choice) {
      return mutate(async () => {
        const normalizedUserId = requireSyncConflictResolutionUserId(userId);
        validateSyncConflictResolutionCandidate(candidate);
        if (!isSyncConflictResolutionChoice(choice)) {
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
        await persistSyncConflictResolutionIntentState(storage, users);
        return intent;
      });
    },

    transition(userId, conflictId, idempotencyKey, state) {
      return mutate(async () => {
        if (!isSyncConflictResolutionIntentState(state) || state === 'accepted') {
          throw new Error('Invalid sync conflict resolution intent state');
        }
        const { existing, intents, users } = await requireExisting(
          userId,
          conflictId,
          idempotencyKey,
        );
        if (!existing) return null;
        if (existing.state === state) return existing;
        if (
          !ALLOWED_SYNC_CONFLICT_RESOLUTION_INTENT_TRANSITIONS[
            existing.state
          ].has(state)
        ) {
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
        await persistSyncConflictResolutionIntentState(storage, users);
        return next;
      });
    },

    markAccepted(userId, conflictId, idempotencyKey, resolutionRevision) {
      return mutate(async () => {
        if (!isSyncConflictResolutionRevision(resolutionRevision)) {
          throw new Error('Invalid sync conflict resolution revision');
        }
        const { existing, intents, users } = await requireExisting(
          userId,
          conflictId,
          idempotencyKey,
        );
        if (!existing) return null;
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
        await persistSyncConflictResolutionIntentState(storage, users);
        return next;
      });
    },

    removeTerminal(userId, conflictId, idempotencyKey) {
      return mutate(async () => {
        const { existing, intents, users } = await requireExisting(
          userId,
          conflictId,
          idempotencyKey,
        );
        if (!existing) return false;
        if (!isTerminalSyncConflictResolutionIntent(existing)) return false;
        intents?.delete(existing.conflictId);
        await persistSyncConflictResolutionIntentState(storage, users);
        return true;
      });
    },
  };
};
