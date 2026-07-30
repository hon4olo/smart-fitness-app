import type {
  CloudProvider,
  CloudPushResult,
  RejectedSyncOperation,
} from './CloudProvider';
import type { SyncBatch } from './CloudSyncTypes';
import { isSyncCoordinatorRecord } from './SyncCoordinatorHelpers';
import type {
  SyncCoordinatorDependencies,
  SyncPushSimulation,
} from './SyncCoordinatorTypes';

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
