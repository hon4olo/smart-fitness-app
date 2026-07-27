import type {
  CloudProvider,
  CloudPullResult,
  CloudPushResult,
  RejectedSyncOperation,
} from './CloudProvider';
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

type PushFailureDetails = {
  code?: string;
  details?: unknown;
  message: string;
  requestId?: string;
  status?: number;
};

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const readPushFailure = (error: unknown): PushFailureDetails => {
  const record = isSyncCoordinatorRecord(error) ? error : undefined;
  const body = record?.body;
  const bodyRecord = isSyncCoordinatorRecord(body) ? body : undefined;
  const nestedError = isSyncCoordinatorRecord(bodyRecord?.error)
    ? bodyRecord.error
    : undefined;
  const message =
    readOptionalString(nestedError?.message) ??
    readOptionalString(bodyRecord?.message) ??
    readOptionalString(bodyRecord?.error) ??
    readOptionalString(bodyRecord?.detail) ??
    readOptionalString(bodyRecord?.reason) ??
    readOptionalString(body) ??
    readOptionalString(record?.message) ??
    (error instanceof Error ? error.message : 'Sync operation rejected');
  const details =
    nestedError?.details ??
    nestedError?.issues ??
    nestedError?.errors ??
    bodyRecord?.details ??
    bodyRecord?.issues ??
    bodyRecord?.errors;
  const code =
    readOptionalString(nestedError?.code) ??
    readOptionalString(bodyRecord?.code) ??
    readOptionalString(bodyRecord?.errorCode) ??
    readOptionalString(record?.code);
  const requestId =
    readOptionalString(nestedError?.requestId) ??
    readOptionalString(bodyRecord?.requestId) ??
    readOptionalString(record?.requestId);

  return {
    message,
    ...(typeof record?.status === 'number' && Number.isFinite(record.status)
      ? { status: Math.floor(record.status) }
      : {}),
    ...(code ? { code } : {}),
    ...(requestId ? { requestId } : {}),
    ...(details === undefined ? {} : { details }),
  };
};

const isIsolatablePushFailure = (error: unknown): boolean => {
  const failure = readPushFailure(error);
  const backendCode = failure.code?.toUpperCase();
  return (
    failure.status === 400 ||
    failure.status === 422 ||
    failure.code === 'validation_error' ||
    (failure.status === 409 && backendCode === 'SYNC_IDEMPOTENCY_KEY_REUSE')
  );
};

const toRejectedSyncOperation = (
  operation: SyncBatch['operations'][number],
  error: unknown,
): RejectedSyncOperation => {
  const failure = readPushFailure(error);
  return {
    operationId: operation.id,
    entityType: operation.entity,
    ...(operation.entityId ? { entityId: operation.entityId } : {}),
    ...failure,
  };
};

const latestTimestamp = (values: Array<string | undefined>): string | undefined => {
  const timestamps = values.filter(
    (value): value is string => typeof value === 'string' && Boolean(value),
  );
  timestamps.sort();
  return timestamps[timestamps.length - 1];
};

const mergePushResults = (results: CloudPushResult[]): CloudPushResult => {
  const appliedOperations = [
    ...new Map(
      results
        .flatMap((result) => result.appliedOperations ?? [])
        .map((operation) => [operation.id, operation] as const),
    ).values(),
  ];
  const conflicts = [
    ...new Map(
      results
        .flatMap((result) => result.conflicts ?? [])
        .map((conflict) => [conflict.conflictId, conflict] as const),
    ).values(),
  ];
  const rejectedOperations = [
    ...new Map(
      results
        .flatMap((result) => result.rejectedOperations ?? [])
        .map((operation) => [operation.operationId, operation] as const),
    ).values(),
  ];
  const duplicateIdempotencyKeys = [
    ...new Set(results.flatMap((result) => result.duplicateIdempotencyKeys ?? [])),
  ];
  const revisions = results
    .map((result) => result.revision)
    .filter((revision): revision is number =>
      typeof revision === 'number' && Number.isFinite(revision),
    );
  const revision = revisions.length ? Math.max(...revisions) : undefined;
  const serverTimestamp = latestTimestamp(results.map((result) => result.serverTimestamp));
  const lastSyncedAt = latestTimestamp(
    results.map((result) => result.lastSyncedAt ?? result.serverTimestamp),
  );
  const reportedPending = results.reduce(
    (maximum, result) => Math.max(maximum, result.pendingOperations),
    0,
  );
  const reportedConflicts = results.reduce(
    (maximum, result) => Math.max(maximum, result.conflictCount),
    0,
  );
  const fallbackStatus = results.find((result) => result.status !== 'idle')?.status ?? 'idle';

  return {
    status: rejectedOperations.length
      ? 'error'
      : conflicts.length
        ? 'conflict'
        : fallbackStatus,
    pendingOperations: Math.max(rejectedOperations.length, reportedPending),
    conflictCount: Math.max(conflicts.length, reportedConflicts),
    ...(revision === undefined ? {} : { revision }),
    ...(serverTimestamp ? { serverTimestamp } : {}),
    ...(lastSyncedAt ? { lastSyncedAt } : {}),
    ...(appliedOperations.length ? { appliedOperations } : {}),
    ...(conflicts.length ? { conflicts } : {}),
    ...(duplicateIdempotencyKeys.length ? { duplicateIdempotencyKeys } : {}),
    ...(rejectedOperations.length ? { rejectedOperations } : {}),
  };
};

const pushBatchWithValidationIsolation = async (
  provider: CloudProvider,
  batch: SyncBatch,
): Promise<CloudPushResult> => {
  try {
    return await provider.pushOperations(batch);
  } catch (error) {
    if (!isIsolatablePushFailure(error)) throw error;

    if (batch.operations.length === 1) {
      return {
        status: 'error',
        pendingOperations: 1,
        conflictCount: 0,
        rejectedOperations: [toRejectedSyncOperation(batch.operations[0], error)],
      };
    }

    const midpoint = Math.ceil(batch.operations.length / 2);
    const partitions = [
      batch.operations.slice(0, midpoint),
      batch.operations.slice(midpoint),
    ].filter((operations) => operations.length > 0);
    const results: CloudPushResult[] = [];

    for (const [index, operations] of partitions.entries()) {
      results.push(
        await pushBatchWithValidationIsolation(provider, {
          ...batch,
          id: `${batch.id}:validation:${index}`,
          operations,
        }),
      );
    }

    return mergePushResults(results);
  }
};

export const simulatePush = async (
  dependencies: Pick<SyncCoordinatorDependencies, 'provider'>,
  batch: SyncBatch,
): Promise<SyncPushSimulation> => {
  if (batch.operations.length === 0) {
    return { phase: 'Uploading', attempted: false };
  }
  const state = await pushBatchWithValidationIsolation(dependencies.provider, batch);
  return {
    phase: 'Uploading',
    attempted: true,
    state,
    result: state,
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
