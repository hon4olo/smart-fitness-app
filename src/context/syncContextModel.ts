import { isApiError } from '@/api/client';
import type { CloudPushResult } from '@/cloud/CloudProvider';
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
