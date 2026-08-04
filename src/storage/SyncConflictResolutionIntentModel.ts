import type { SyncConflictResolutionChoice } from '../cloud/SyncConflictResolutionApi';
import type { SyncConflictResolutionCandidate } from '../cloud/SyncConflictResolutionCandidate';
import { createDeterministicUuid, isUuid } from '../lib/ids';

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

export const ALLOWED_SYNC_CONFLICT_RESOLUTION_INTENT_TRANSITIONS: Record<
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

const STATE_SET = new Set<SyncConflictResolutionIntentState>(
  SYNC_CONFLICT_RESOLUTION_INTENT_STATES,
);

export const isSyncConflictResolutionIntentState = (
  value: unknown,
): value is SyncConflictResolutionIntentState =>
  typeof value === 'string' &&
  STATE_SET.has(value as SyncConflictResolutionIntentState);

export const isSyncConflictResolutionRevision = (
  value: unknown,
): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const isSyncConflictResolutionChoice = (
  value: unknown,
): value is SyncConflictResolutionChoice =>
  value === 'keep_local' || value === 'keep_remote';

export const normalizeSyncConflictResolutionTimestamp = (
  value: unknown,
): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
};

export const requireSyncConflictResolutionUserId = (userId: string): string => {
  const normalized = userId.trim();
  if (!normalized) throw new Error('Invalid sync conflict resolution user');
  return normalized;
};

export const validateSyncConflictResolutionCandidate = (
  candidate: SyncConflictResolutionCandidate,
): void => {
  if (
    !isUuid(candidate.conflictId) ||
    !isSyncConflictResolutionRevision(candidate.expectedConflictRevision) ||
    !isSyncConflictResolutionRevision(candidate.expectedRemoteRevision) ||
    candidate.localKind === candidate.remoteKind
  ) {
    throw new Error('Invalid sync conflict resolution candidate');
  }
};

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

export const isTerminalSyncConflictResolutionIntent = (
  intent: SyncConflictResolutionIntent,
): boolean => intent.state === 'completed';
