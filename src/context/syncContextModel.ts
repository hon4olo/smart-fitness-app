import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import { isFitnessProfileQueueOperation } from '@/cloud/FitnessProfileSync';
import { isFoodEntryQueueOperation } from '@/cloud/FoodEntrySync';
import { isNutritionTargetQueueOperation } from '@/cloud/NutritionTargetSync';
import { isSafetyRecoveryQueueOperation } from '@/cloud/SafetyRecoverySync';
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
        operation.entity !== 'workoutSessions' &&
        operation.entity !== 'workouts' &&
        operation.entity !== 'foodEntries' &&
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
  operations.filter(isWorkoutSessionQueueOperation).length +
  operations.filter(isWorkoutTemplateQueueOperation).length +
  operations.filter(isFoodEntryQueueOperation).length +
  operations.filter(isNutritionTargetQueueOperation).length +
  operations.filter(isFitnessProfileQueueOperation).length +
  operations.filter(isSafetyRecoveryQueueOperation).length;
