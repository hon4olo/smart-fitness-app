import type { CloudPullResult, CloudPushResult } from './CloudProvider';
import type { CloudError } from './CloudErrors';
import type {
  ConflictRecord,
  SyncBatch,
  SyncRevision,
  SyncState,
} from './CloudSyncTypes';
import { createConflictPolicyRegistry } from './CloudConflictPolicies';
import { createConflictResolver } from './CloudConflictResolver';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { OfflineSyncQueueStore } from './CloudQueueStore';
import {
  dedupeOfflineSyncQueueOperations,
  filterPendingOfflineSyncQueueOperations,
  sortOfflineSyncQueueOperations,
  toOfflineSyncQueueSyncOperation,
} from './CloudQueueHelpers';
import {
  areSyncCoordinatorValuesEqual,
  cloneSyncCoordinatorValue,
  estimateSyncCoordinatorDurationMs,
  isSyncCoordinatorRecord,
  makeSyncCoordinatorBatchId,
  makeSyncCoordinatorQueueOperationKey,
  makeSyncCoordinatorStatistics,
} from './SyncCoordinatorHelpers';
import type {
  SyncBatchValidation,
  SyncBuildResult,
  SyncConflictResolution,
  SyncCoordinatorDependencies,
  SyncCoordinatorPhase,
  SyncCoordinatorStatistics,
  SyncCoordinatorStatus,
  SyncPreparation,
  SyncPullSimulation,
  SyncPushSimulation,
} from './SyncCoordinatorTypes';

export const collectPendingOperations = async (
  queueStore: OfflineSyncQueueStore,
): Promise<OfflineSyncQueueOperation[]> => {
  const operations = await queueStore.loadOperations();
  return sortOfflineSyncQueueOperations(
    dedupeOfflineSyncQueueOperations(
      filterPendingOfflineSyncQueueOperations(operations),
    ),
  );
};

export const buildSyncBatch = (
  operations: OfflineSyncQueueOperation[],
  now: string,
): SyncBatch => ({
  id: makeSyncCoordinatorBatchId(
    operations.map((operation) =>
      toOfflineSyncQueueSyncOperation(operation),
    ),
    now,
  ),
  operations: operations.map((operation) =>
    toOfflineSyncQueueSyncOperation(operation),
  ),
  createdAt: now,
  metadata: { source: 'local', lastSyncedAt: now },
});

export const validateBatch = (batch: SyncBatch): SyncBatchValidation => {
  const errors: string[] = [];
  const seen = new Set<string>();

  if (!batch.id.trim()) errors.push('batch id is required');
  if (!batch.createdAt.trim()) errors.push('batch createdAt is required');

  for (const operation of batch.operations) {
    if (!operation.id.trim()) errors.push('operation id is required');
    const key = `${operation.entity}:${operation.id}`;
    if (seen.has(key)) errors.push(`duplicate operation ${key}`);
    seen.add(key);
  }

  return { valid: errors.length === 0, errors };
};

export const prepareSync = async (
  dependencies: SyncCoordinatorDependencies,
  now = dependencies.now?.() ?? new Date().toISOString(),
): Promise<SyncPreparation> => {
  const queueOperations = await dependencies.queueStore.loadOperations();
  const operationsToUpload = sortOfflineSyncQueueOperations(
    dedupeOfflineSyncQueueOperations(
      filterPendingOfflineSyncQueueOperations(queueOperations),
    ),
  );
  const batch = buildSyncBatch(operationsToUpload, now);
  const validation = validateBatch(batch);
  const expectedConflicts: ConflictRecord[] = [];
  const statistics = makeSyncCoordinatorStatistics(
    queueOperations,
    operationsToUpload,
    expectedConflicts,
    undefined,
    0,
  );

  return {
    phase: 'Preparing',
    operationsToUpload,
    batch,
    validation,
    expectedConflicts,
    statistics,
    estimatedDurationMs: estimateSyncCoordinatorDurationMs(statistics),
  };
};

export const simulatePush = async (
  dependencies: Pick<SyncCoordinatorDependencies, 'provider'>,
  batch: SyncBatch,
): Promise<SyncPushSimulation> => {
  if (batch.operations.length === 0) {
    return { phase: 'Uploading', attempted: false };
  }
  const state = await dependencies.provider.pushOperations(batch);
  return {
    phase: 'Uploading',
    attempted: true,
    state,
    result: state as CloudPushResult,
  };
};

export const simulatePull = async (
  dependencies: Pick<SyncCoordinatorDependencies, 'provider'>,
  now: string,
): Promise<SyncPullSimulation> => {
  const batch = await dependencies.provider.pullChanges();
  return {
    phase: 'Downloading',
    batch: {
      ...batch,
      createdAt: batch.createdAt || now,
      id: batch.id || makeSyncCoordinatorBatchId(batch.operations, now),
    },
    operationCount: batch.operations.length,
    result: batch as CloudPullResult,
  };
};

export const resolveConflicts = async (
  dependencies: Pick<SyncCoordinatorDependencies, 'resolver' | 'registry'>,
  localOperations: OfflineSyncQueueOperation[],
  remoteBatch: Omit<SyncBatch, 'revision'> &
    Partial<SyncState> & { revision?: SyncRevision | number },
  now: string,
): Promise<SyncConflictResolution> => {
  const resolver =
    dependencies.resolver ??
    createConflictResolver(
      dependencies.registry ?? createConflictPolicyRegistry(),
    );
  const localByKey = new Map<string, OfflineSyncQueueOperation[]>();

  for (const operation of localOperations) {
    const key = makeSyncCoordinatorQueueOperationKey(operation);
    const bucket = localByKey.get(key) ?? [];
    bucket.push(operation);
    localByKey.set(key, bucket);
  }

  const records: ConflictRecord[] = [];
  for (const remoteOperation of remoteBatch.operations) {
    const key = `${remoteOperation.entity}:${remoteOperation.entityId ?? remoteOperation.id}`;
    const matchingLocal = localByKey.get(key);
    if (!matchingLocal?.length) continue;

    const localOperation = matchingLocal[0];
    const localVersion = cloneSyncCoordinatorValue(
      localOperation.payload ??
        localOperation.syncOperation?.payload ??
        localOperation,
    );
    const remoteVersion = cloneSyncCoordinatorValue(
      remoteOperation.payload ?? remoteOperation,
    );
    if (areSyncCoordinatorValuesEqual(localVersion, remoteVersion)) continue;

    const detected = resolver.detectConflict({
      entityType: localOperation.entityType,
      entityId: localOperation.entityId,
      localVersion,
      remoteVersion,
      baseVersion: undefined,
      localRevision: localOperation.baseRevision,
      remoteRevision: remoteOperation.revision,
      detectedAt: now,
      metadata: localOperation.metadata,
      localOperation:
        localOperation.syncOperation ??
        toOfflineSyncQueueSyncOperation(localOperation),
      remoteOperation: {
        id: remoteOperation.id,
        entity: remoteOperation.entity,
        entityId: remoteOperation.entityId ?? remoteOperation.id,
        action: 'merge',
        payload: isSyncCoordinatorRecord(remoteOperation.payload)
          ? remoteOperation.payload
          : undefined,
        revision: remoteOperation.revision,
        metadata: remoteOperation.metadata,
        createdAt: remoteOperation.createdAt,
      },
    });
    if (detected) records.push(detected);
  }

  const results = records.length
    ? resolver.resolveBatch(
        records,
        dependencies.registry ?? createConflictPolicyRegistry(),
      )
    : [];
  return {
    phase: 'Resolving',
    records,
    results,
    unresolvedCount: results.filter((result) => result.requiresManualReview)
      .length,
  };
};

export const buildSyncResult = (
  status: SyncCoordinatorStatus,
  statistics: SyncCoordinatorStatistics,
  preparation: SyncPreparation,
  conflicts: SyncConflictResolution,
  transitions: SyncCoordinatorPhase[],
  push?: SyncPushSimulation,
  pull?: SyncPullSimulation,
  error?: CloudError,
): SyncBuildResult => ({
  phase: status.phase,
  status,
  statistics,
  preparation,
  conflicts,
  transitions,
  push,
  pull,
  error,
});
