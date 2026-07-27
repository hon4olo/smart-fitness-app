import { isApiError } from '@/api/client';
import type {
  CloudPushResult,
  RejectedSyncOperation,
} from '@/cloud/CloudProvider';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import { isBodyMeasurementQueueOperation } from '@/cloud/BodyMeasurementSync';
import { isCustomExerciseQueueOperation } from '@/cloud/CustomExerciseSync';
import { isFitnessProfileQueueOperation } from '@/cloud/FitnessProfileSync';
import { isFoodEntryQueueOperation } from '@/cloud/FoodEntrySync';
import { isMealTemplateQueueOperation } from '@/cloud/MealTemplateSync';
import { isNutritionLibraryQueueOperation } from '@/cloud/NutritionLibrarySync';
import { isNutritionTargetQueueOperation } from '@/cloud/NutritionTargetSync';
import { isSafetyRecoveryQueueOperation } from '@/cloud/SafetyRecoverySync';
import { isTrainingProgramQueueOperation } from '@/cloud/TrainingProgramSync';
import { filterWeightHistoryQueueOperations } from '@/cloud/WeightHistorySync';
import { isWorkoutSessionQueueOperation } from '@/cloud/WorkoutSessionSync';
import { isWorkoutTemplateQueueOperation } from '@/cloud/WorkoutTemplateSync';
import type { WeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';

export type WeightSyncStatus =
  | 'local-only'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'conflict'
  | 'error';

export type WeightSyncContextValue = {
  status: WeightSyncStatus;
  lastSyncAt: string | null;
  pendingOperations: number;
  conflictCount: number;
  diagnostic: string | null;
  error: string | null;
  syncNow(): Promise<void>;
};

export const collectAcknowledgedSyncOperationKeys = (
  pushResult?: Pick<CloudPushResult, 'appliedOperations' | 'duplicateIdempotencyKeys'> | null,
): Set<string> =>
  new Set([
    ...(pushResult?.appliedOperations ?? []).map((operation) => operation.id),
    ...(pushResult?.duplicateIdempotencyKeys ?? []),
  ].filter((key): key is string => typeof key === 'string' && Boolean(key.trim())));

const SAFE_DIAGNOSTIC_DETAIL_KEYS = new Set([
  'code',
  'entityType',
  'existingEntityId',
  'existingEntityType',
  'expected',
  'field',
  'message',
  'path',
  'reason',
  'received',
  'requestedEntityId',
  'requestedEntityType',
]);

const sanitizeDiagnosticDetails = (value: unknown, depth = 0): unknown => {
  if (depth > 3 || value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim().slice(0, 240);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => sanitizeDiagnosticDetails(item, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof value !== 'object') return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => SAFE_DIAGNOSTIC_DETAIL_KEYS.has(key))
    .map(([key, entryValue]) => [
      key,
      sanitizeDiagnosticDetails(entryValue, depth + 1),
    ] as const)
    .filter(([, entryValue]) => entryValue !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const formatRejectedDetails = (details: unknown): string | null => {
  const safeDetails = sanitizeDiagnosticDetails(details);
  if (safeDetails === undefined) return null;
  if (typeof safeDetails === 'string') return safeDetails;
  try {
    return JSON.stringify(safeDetails).slice(0, 800);
  } catch {
    return null;
  }
};

export const formatRejectedSyncOperationsError = (
  operations: RejectedSyncOperation[],
): string | null => {
  if (!operations.length) return null;
  const first = operations[0];
  const countLabel = operations.length === 1
    ? '1 sync operation rejected'
    : `${operations.length} sync operations rejected`;
  const identity = [first.entityType, first.entityId].filter(Boolean).join(' • ');
  const transport = [
    first.status === undefined ? null : `HTTP ${first.status}`,
    first.code,
    first.requestId ? `request ${first.requestId}` : null,
  ].filter((value): value is string => Boolean(value));
  const details = formatRejectedDetails(first.details);
  const description = [
    first.message,
    details && details !== first.message ? details : null,
  ].filter((value): value is string => Boolean(value));

  return `${countLabel}: ${[identity, ...transport].filter(Boolean).join(' • ')} — ${description.join(' • ')}`;
};

const isDiagnosticRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const readDiagnosticString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const resolveSyncFailureStage = (transitions: string[]): string => {
  if (transitions.includes('Resolving')) return 'conflict resolution';
  if (transitions.includes('Downloading')) return 'download';
  if (transitions.includes('Uploading')) return 'upload';
  if (transitions.includes('Preparing')) return 'preparation';
  return 'synchronization';
};

export const formatSyncFailureDiagnostic = (
  error: unknown,
  stage: string,
): string => {
  const record = isDiagnosticRecord(error) ? error : undefined;
  const body = isApiError(error) ? error.body : record?.body;
  const bodyRecord = isDiagnosticRecord(body) ? body : undefined;
  const nestedError = isDiagnosticRecord(bodyRecord?.error)
    ? bodyRecord.error
    : undefined;
  const message =
    readDiagnosticString(nestedError?.message) ??
    readDiagnosticString(bodyRecord?.message) ??
    readDiagnosticString(bodyRecord?.error) ??
    readDiagnosticString(bodyRecord?.detail) ??
    readDiagnosticString(bodyRecord?.reason) ??
    readDiagnosticString(record?.message) ??
    (error instanceof Error ? error.message : 'Unknown synchronization error');
  const status = isApiError(error)
    ? error.status
    : typeof record?.status === 'number' && Number.isFinite(record.status)
      ? Math.floor(record.status)
      : undefined;
  const code =
    readDiagnosticString(nestedError?.code) ??
    readDiagnosticString(bodyRecord?.code) ??
    readDiagnosticString(bodyRecord?.errorCode) ??
    (isApiError(error) ? error.code : readDiagnosticString(record?.code));
  const requestId =
    readDiagnosticString(nestedError?.requestId) ??
    readDiagnosticString(bodyRecord?.requestId) ??
    (isApiError(error) ? error.requestId : readDiagnosticString(record?.requestId));
  const transport = [
    `stage ${stage}`,
    status === undefined ? null : `HTTP ${status}`,
    code,
    requestId ? `request ${requestId}` : null,
  ].filter((value): value is string => Boolean(value));
  return `Synchronization failed: ${transport.join(' • ')} — ${message}`;
};

export const resolveSyncFailureStatus = (error: unknown): WeightSyncStatus => {
  if (isApiError(error)) {
    if (error.code === 'unauthorized' || error.status === 401) return 'local-only';
    if (
      error.code === 'network_error' ||
      error.code === 'timeout' ||
      error.code === 'unavailable'
    ) {
      return 'offline';
    }
    return 'error';
  }

  return error instanceof Error && error.message.toLowerCase().includes('auth')
    ? 'local-only'
    : 'error';
};

export type RemoteChangedEntity = {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
  entityType: string;
  revision?: number;
  operationType?: string;
  appliedAt?: string | null;
};

export type RemoteDeletedEntity = {
  id?: string;
  entityId?: string;
  entityType: string;
  revision?: number;
  appliedAt?: string | null;
};

export type SyncPullResult = {
  serverTimestamp?: string;
  changedEntities?: unknown[];
  deletedEntities?: unknown[];
  operations: Array<{ entity: string }>;
  metadata?: Record<string, unknown>;
  serverRevision?: number;
  revision?: number | { number: number };
};

type SyncConflictLike = {
  status?: unknown;
};

const TERMINAL_SYNC_CONFLICT_STATUSES = new Set(['autoResolved', 'resolved', 'ignored']);

export const isUnresolvedSyncConflict = (conflict: SyncConflictLike): boolean =>
  typeof conflict.status !== 'string' ||
  !TERMINAL_SYNC_CONFLICT_STATUSES.has(conflict.status);

export const countUnresolvedSyncConflicts = ({
  localUnresolvedCount,
  pullConflicts = [],
  pushConflicts = [],
}: {
  localUnresolvedCount: number;
  pullConflicts?: SyncConflictLike[];
  pushConflicts?: SyncConflictLike[];
}): number =>
  Math.max(0, Math.floor(localUnresolvedCount)) +
  pushConflicts.filter(isUnresolvedSyncConflict).length +
  pullConflicts.filter(isUnresolvedSyncConflict).length;

export const shouldClearPersistedSyncConflicts = (
  phase: string,
  activeCycleConflictCount: number,
): boolean => phase !== 'Failed' && activeCycleConflictCount === 0;

export const resolveStatus = (
  phase: string,
  hasConflicts: boolean,
  sessionActive: boolean,
): WeightSyncStatus => {
  if (!sessionActive || phase === 'NeedsAuthentication') return 'local-only';
  if (phase === 'Offline') return 'offline';
  if (phase === 'Failed') return 'error';
  if (hasConflicts || phase === 'Conflict') return 'conflict';
  if (
    phase === 'Uploading' ||
    phase === 'Downloading' ||
    phase === 'Preparing' ||
    phase === 'Resolving'
  ) {
    return 'syncing';
  }
  return 'synced';
};

export const saveWeightMetadataRecords = async (
  metadataStore: WeightSyncMetadataStore,
  records: Awaited<ReturnType<WeightSyncMetadataStore['load']>>,
): Promise<void> => {
  await metadataStore.clear();
  for (const record of records.values()) {
    await metadataStore.set(record);
  }
};

export const resolvePulledRevision = (pullResult: SyncPullResult): number | null => {
  if (
    typeof pullResult.serverRevision === 'number' &&
    Number.isFinite(pullResult.serverRevision)
  ) {
    return Math.max(0, Math.floor(pullResult.serverRevision));
  }
  if (typeof pullResult.revision === 'number' && Number.isFinite(pullResult.revision)) {
    return Math.max(0, Math.floor(pullResult.revision));
  }
  if (
    typeof pullResult.revision === 'object' &&
    pullResult.revision !== null &&
    typeof pullResult.revision.number === 'number' &&
    Number.isFinite(pullResult.revision.number)
  ) {
    return Math.max(0, Math.floor(pullResult.revision.number));
  }
  return null;
};

export const hasUnsupportedRemoteEntities = (pullResult: SyncPullResult): boolean => {
  const unsupportedEntityCount = pullResult.metadata?.unsupportedEntityCount;
  return (
    (typeof unsupportedEntityCount === 'number' && unsupportedEntityCount > 0) ||
    pullResult.operations.some(
      (operation) =>
        operation.entity !== 'weightHistory' &&
        operation.entity !== 'bodyMeasurements' &&
        operation.entity !== 'body_measurements' &&
        operation.entity !== 'customExercises' &&
        operation.entity !== 'custom_exercises' &&
        operation.entity !== 'workoutSessions' &&
        operation.entity !== 'workouts' &&
        operation.entity !== 'trainingPrograms' &&
        operation.entity !== 'training_programs' &&
        operation.entity !== 'foodEntries' &&
        operation.entity !== 'mealTemplates' &&
        operation.entity !== 'meal_templates' &&
        operation.entity !== 'nutritionLibraryItems' &&
        operation.entity !== 'nutrition_library_items' &&
        operation.entity !== 'nutritionTargets' &&
        operation.entity !== 'fitnessProfiles' &&
        operation.entity !== 'userLimitations' &&
        operation.entity !== 'recoveryCheckIns',
    )
  );
};

export const countSupportedQueueOperations = (
  operations: OfflineSyncQueueOperation[],
): number =>
  filterWeightHistoryQueueOperations(operations).length +
  operations.filter(isBodyMeasurementQueueOperation).length +
  operations.filter(isCustomExerciseQueueOperation).length +
  operations.filter(isWorkoutSessionQueueOperation).length +
  operations.filter(isWorkoutTemplateQueueOperation).length +
  operations.filter(isTrainingProgramQueueOperation).length +
  operations.filter(isFoodEntryQueueOperation).length +
  operations.filter(isMealTemplateQueueOperation).length +
  operations.filter(isNutritionLibraryQueueOperation).length +
  operations.filter(isNutritionTargetQueueOperation).length +
  operations.filter(isFitnessProfileQueueOperation).length +
  operations.filter(isSafetyRecoveryQueueOperation).length;
