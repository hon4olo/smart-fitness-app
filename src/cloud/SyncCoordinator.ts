import type { CloudProvider, CloudPullResult, CloudPushResult } from './CloudProvider';
import type { CloudError } from './CloudErrors';
import type { ConflictRecord, SyncBatch, SyncOperation, SyncRevision, SyncState } from './CloudSyncTypes';
import type { ConflictPolicy, ConflictPolicyRegistry } from './CloudConflictPolicies';
import type { ConflictResolver, ConflictResolutionResult } from './CloudConflictResolver';
import { createConflictPolicyRegistry } from './CloudConflictPolicies';
import { createConflictResolver } from './CloudConflictResolver';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { OfflineSyncQueueStore } from './CloudQueueStore';
import {
  dedupeOfflineSyncQueueOperations,
  filterFailedOfflineSyncQueueOperations,
  filterPendingOfflineSyncQueueOperations,
  sortOfflineSyncQueueOperations,
  toOfflineSyncQueueSyncOperation,
} from './CloudQueueHelpers';

export const SYNC_COORDINATOR_PHASES = [
  'Idle',
  'Preparing',
  'Uploading',
  'Downloading',
  'Resolving',
  'Completed',
  'Failed',
  'Offline',
  'NeedsAuthentication',
  'Conflict',
] as const;

export type SyncCoordinatorPhase = (typeof SYNC_COORDINATOR_PHASES)[number];

export type SyncCoordinatorStatus = {
  phase: SyncCoordinatorPhase;
  cancelled: boolean;
  reason?: string;
  lastSyncAt?: string;
  lastError?: CloudError;
};

export type SyncCoordinatorStatistics = {
  pendingOperations: number;
  failedOperations: number;
  queueSize: number;
  estimatedUploadCount: number;
  estimatedDownloadCount: number;
  conflictCount: number;
  lastSyncTimestamp?: string;
};

export type SyncPreviewPull = {
  estimatedOperationCount: number;
  expectedBatchId: string;
};

export type SyncPreparation = {
  phase: 'Preparing';
  operationsToUpload: OfflineSyncQueueOperation[];
  batch: SyncBatch;
  validation: SyncBatchValidation;
  expectedConflicts: ConflictRecord[];
  statistics: SyncCoordinatorStatistics;
  estimatedDurationMs: number;
};

export type SyncBatchValidation = {
  valid: boolean;
  errors: string[];
};

export type SyncPushSimulation = {
  phase: 'Uploading';
  attempted: boolean;
  state?: SyncState;
  result?: CloudPushResult;
};

export type SyncPullSimulation = {
  phase: 'Downloading';
  batch: Omit<SyncBatch, 'revision'> & Partial<SyncState> & { revision?: SyncRevision | number };
  operationCount: number;
  result?: CloudPullResult;
};

export type SyncConflictResolution = {
  phase: 'Resolving';
  records: ConflictRecord[];
  results: ConflictResolutionResult[];
  unresolvedCount: number;
};

export type SyncBuildResult = {
  phase: SyncCoordinatorPhase;
  status: SyncCoordinatorStatus;
  statistics: SyncCoordinatorStatistics;
  preparation: SyncPreparation;
  push?: SyncPushSimulation;
  pull?: SyncPullSimulation;
  conflicts: SyncConflictResolution;
  transitions: SyncCoordinatorPhase[];
  error?: CloudError;
};

export type SyncPreview = {
  phase: 'Preparing';
  operationsToUpload: OfflineSyncQueueOperation[];
  expectedPull: SyncPreviewPull;
  expectedConflicts: ConflictRecord[];
  estimatedDurationMs: number;
  statistics: SyncCoordinatorStatistics;
};

export type SyncCoordinatorDependencies = {
  queueStore: OfflineSyncQueueStore;
  provider: CloudProvider;
  resolver?: ConflictResolver;
  registry?: ConflictPolicyRegistry;
  now?: () => string;
};

export type SyncCoordinator = {
  prepare(): Promise<SyncPreparation>;
  syncNow(): Promise<SyncBuildResult>;
  cancel(): SyncCoordinatorStatus;
  resume(): SyncCoordinatorStatus;
  getStatus(): SyncCoordinatorStatus;
  getStatistics(): SyncCoordinatorStatistics;
  previewSync(): Promise<SyncPreview>;
  reset(): SyncCoordinatorStatus;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  return `{${Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(',')}}`;
};

const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)])) as T;
  }

  return value;
};

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).filter((key) => left[key] !== undefined).sort();
    const rightKeys = Object.keys(right).filter((key) => right[key] !== undefined).sort();
    if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) {
      return false;
    }

    return leftKeys.every((key) => deepEqual(left[key], right[key]));
  }

  return false;
};

const makeBatchId = (operations: SyncOperation[], now: string): string => `sync:${now}:${operations.map((operation) => operation.id).join('|') || 'empty'}`;

const makeQueueOperationKey = (operation: OfflineSyncQueueOperation): string => `${operation.entityType}:${operation.entityId}`;

const makeSyncStatistics = (
  queueOperations: OfflineSyncQueueOperation[],
  pendingOperations: OfflineSyncQueueOperation[],
  conflicts: ConflictRecord[] = [],
  lastSyncTimestamp?: string,
  estimatedDownloadCount = 0,
): SyncCoordinatorStatistics => {
  const failedOperations = filterFailedOfflineSyncQueueOperations(queueOperations).length;

  return {
    pendingOperations: pendingOperations.length,
    failedOperations,
    queueSize: queueOperations.length,
    estimatedUploadCount: pendingOperations.length,
    estimatedDownloadCount,
    conflictCount: conflicts.length,
    lastSyncTimestamp,
  };
};

const estimateDurationMs = (statistics: SyncCoordinatorStatistics): number =>
  150 + statistics.pendingOperations * 25 + statistics.estimatedDownloadCount * 30 + statistics.conflictCount * 40 + statistics.failedOperations * 10;

export const collectPendingOperations = async (queueStore: OfflineSyncQueueStore): Promise<OfflineSyncQueueOperation[]> => {
  const operations = await queueStore.loadOperations();
  return sortOfflineSyncQueueOperations(dedupeOfflineSyncQueueOperations(filterPendingOfflineSyncQueueOperations(operations)));
};

export const buildSyncBatch = (operations: OfflineSyncQueueOperation[], now: string): SyncBatch => ({
  id: makeBatchId(operations.map((operation) => toOfflineSyncQueueSyncOperation(operation)), now),
  operations: operations.map((operation) => toOfflineSyncQueueSyncOperation(operation)),
  createdAt: now,
  metadata: {
    source: 'local',
    lastSyncedAt: now,
  },
});

export const validateBatch = (batch: SyncBatch): SyncBatchValidation => {
  const errors: string[] = [];
  const seen = new Set<string>();

  if (!batch.id.trim()) {
    errors.push('batch id is required');
  }

  if (!batch.createdAt.trim()) {
    errors.push('batch createdAt is required');
  }

  for (const operation of batch.operations) {
    if (!operation.id.trim()) {
      errors.push('operation id is required');
    }

    const key = `${operation.entity}:${operation.id}`;
    if (seen.has(key)) {
      errors.push(`duplicate operation ${key}`);
    }
    seen.add(key);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const prepareSync = async (
  dependencies: SyncCoordinatorDependencies,
  now = dependencies.now?.() ?? new Date().toISOString(),
): Promise<SyncPreparation> => {
  const queueOperations = await dependencies.queueStore.loadOperations();
  const operationsToUpload = sortOfflineSyncQueueOperations(dedupeOfflineSyncQueueOperations(filterPendingOfflineSyncQueueOperations(queueOperations)));
  const batch = buildSyncBatch(operationsToUpload, now);
  const validation = validateBatch(batch);
  const expectedConflicts: ConflictRecord[] = [];
  const statistics = makeSyncStatistics(queueOperations, operationsToUpload, expectedConflicts, undefined, 0);

  return {
    phase: 'Preparing',
    operationsToUpload,
    batch,
    validation,
    expectedConflicts,
    statistics,
    estimatedDurationMs: estimateDurationMs(statistics),
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
  return { phase: 'Uploading', attempted: true, state, result: state as CloudPushResult };
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
      id: batch.id || makeBatchId(batch.operations, now),
    },
    operationCount: batch.operations.length,
    result: batch as CloudPullResult,
  };
};

export const resolveConflicts = async (
  dependencies: Pick<SyncCoordinatorDependencies, 'resolver' | 'registry'>,
  localOperations: OfflineSyncQueueOperation[],
  remoteBatch: Omit<SyncBatch, 'revision'> & Partial<SyncState> & { revision?: SyncRevision | number },
  now: string,
): Promise<SyncConflictResolution> => {
  const resolver = dependencies.resolver ?? createConflictResolver(dependencies.registry ?? createConflictPolicyRegistry());
  const localByKey = new Map<string, OfflineSyncQueueOperation[]>();

  for (const operation of localOperations) {
    const key = makeQueueOperationKey(operation);
    const bucket = localByKey.get(key) ?? [];
    bucket.push(operation);
    localByKey.set(key, bucket);
  }

  const records: ConflictRecord[] = [];

  for (const remoteOperation of remoteBatch.operations) {
    const key = `${remoteOperation.entity}:${remoteOperation.entityId ?? remoteOperation.id}`;
    const matchingLocal = localByKey.get(key);
    if (!matchingLocal || matchingLocal.length === 0) {
      continue;
    }

    const localOperation = matchingLocal[0];
    const localVersion = cloneValue(localOperation.payload ?? localOperation.syncOperation?.payload ?? localOperation);
    const remoteVersion = cloneValue(remoteOperation.payload ?? remoteOperation);

    if (deepEqual(localVersion, remoteVersion)) {
      continue;
    }

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
      localOperation: localOperation.syncOperation ?? toOfflineSyncQueueSyncOperation(localOperation),
      remoteOperation: {
        id: remoteOperation.id,
        entity: remoteOperation.entity,
        entityId: remoteOperation.entityId ?? remoteOperation.id,
        action: 'merge',
        payload: isRecord(remoteOperation.payload) ? remoteOperation.payload : undefined,
        revision: remoteOperation.revision,
        metadata: remoteOperation.metadata,
        createdAt: remoteOperation.createdAt,
      },
    });

    if (detected) {
      records.push(detected);
    }
  }

  const results = records.length > 0 ? resolver.resolveBatch(records, dependencies.registry ?? createConflictPolicyRegistry()) : [];

  return {
    phase: 'Resolving',
    records,
    results,
    unresolvedCount: results.filter((result) => result.requiresManualReview).length,
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

export const createSyncCoordinator = (dependencies: SyncCoordinatorDependencies): SyncCoordinator => {
  const resolver = dependencies.resolver ?? createConflictResolver(dependencies.registry ?? createConflictPolicyRegistry());
  const registry = dependencies.registry ?? createConflictPolicyRegistry();
  let status: SyncCoordinatorStatus = { phase: 'Idle', cancelled: false };
  let lastStatistics: SyncCoordinatorStatistics = {
    pendingOperations: 0,
    failedOperations: 0,
    queueSize: 0,
    estimatedUploadCount: 0,
    estimatedDownloadCount: 0,
    conflictCount: 0,
  };
  let lastSyncTimestamp: string | undefined;

  const updateStatus = (next: Partial<SyncCoordinatorStatus> & Pick<SyncCoordinatorStatus, 'phase'>) => {
    status = {
      ...status,
      ...next,
    };
    return status;
  };

  const captureStatistics = (preparation: SyncPreparation, conflicts: SyncConflictResolution, pull?: SyncPullSimulation): SyncCoordinatorStatistics => {
    lastStatistics = {
      ...preparation.statistics,
      estimatedDownloadCount: pull?.operationCount ?? preparation.statistics.estimatedDownloadCount,
      conflictCount: conflicts.records.length,
      lastSyncTimestamp,
    };
    return lastStatistics;
  };

  const prepare = async (): Promise<SyncPreparation> => {
    if (status.cancelled) {
      updateStatus({ phase: 'Idle', reason: 'cancelled' });
      return {
        phase: 'Preparing',
        operationsToUpload: [],
        batch: buildSyncBatch([], dependencies.now?.() ?? new Date().toISOString()),
        validation: { valid: true, errors: [] },
        expectedConflicts: [],
        statistics: lastStatistics,
        estimatedDurationMs: estimateDurationMs(lastStatistics),
      };
    }

    updateStatus({ phase: 'Preparing', reason: undefined, lastError: undefined });
    const preparation = await prepareSync(dependencies, dependencies.now?.() ?? new Date().toISOString());
    lastStatistics = preparation.statistics;
    return preparation;
  };

  const previewSync = async (): Promise<SyncPreview> => {
    const preparation = await prepare();
    const expectedPull: SyncPreviewPull = {
      estimatedOperationCount: 0,
      expectedBatchId: `preview:${preparation.batch.id}`,
    };

    return {
      phase: 'Preparing',
      operationsToUpload: preparation.operationsToUpload,
      expectedPull,
      expectedConflicts: preparation.expectedConflicts,
      estimatedDurationMs: preparation.estimatedDurationMs,
      statistics: preparation.statistics,
    };
  };

  const syncNow = async (): Promise<SyncBuildResult> => {
    if (status.cancelled) {
      const now = dependencies.now?.() ?? new Date().toISOString();
      const preparation = await prepareSync(dependencies, now);
      const conflicts: SyncConflictResolution = { phase: 'Resolving', records: [], results: [], unresolvedCount: 0 };
      const statistics = captureStatistics(preparation, conflicts);
      updateStatus({ phase: 'Idle', reason: 'cancelled' });
      return buildSyncResult(status, statistics, preparation, conflicts, ['Idle'], undefined, undefined);
    }

    const transitions: SyncCoordinatorPhase[] = ['Idle'];
    const now = dependencies.now?.() ?? new Date().toISOString();
    updateStatus({ phase: 'Preparing', reason: undefined, lastError: undefined });
    transitions.push('Preparing');

    try {
      const preparation = await prepareSync(dependencies, now);
      lastStatistics = preparation.statistics;

      if (!preparation.validation.valid) {
        const error: CloudError = { code: 'unknown', message: 'batch validation failed' };
        updateStatus({ phase: 'Failed', reason: 'validation failed', lastError: error });
        const conflicts: SyncConflictResolution = { phase: 'Resolving', records: [], results: [], unresolvedCount: 0 };
        return buildSyncResult(status, preparation.statistics, preparation, conflicts, [...transitions, 'Failed'], undefined, undefined, error);
      }

      const health = await dependencies.provider.healthCheck();
      if (health.status === 'offline' || health.error?.code === 'offline') {
        updateStatus({ phase: 'Offline', reason: 'provider offline', lastError: health.error });
        const conflicts: SyncConflictResolution = { phase: 'Resolving', records: [], results: [], unresolvedCount: 0 };
        return buildSyncResult(status, preparation.statistics, preparation, conflicts, [...transitions, 'Offline'], undefined, undefined, health.error);
      }

      if (health.status === 'needsAuthentication' || health.error?.code === 'authentication_required') {
        updateStatus({ phase: 'NeedsAuthentication', reason: 'authentication required', lastError: health.error });
        const conflicts: SyncConflictResolution = { phase: 'Resolving', records: [], results: [], unresolvedCount: 0 };
        return buildSyncResult(status, preparation.statistics, preparation, conflicts, [...transitions, 'NeedsAuthentication'], undefined, undefined, health.error);
      }

      updateStatus({ phase: 'Uploading' });
      transitions.push('Uploading');
      const push = await simulatePush(dependencies, preparation.batch);

      updateStatus({ phase: 'Downloading' });
      transitions.push('Downloading');
      const pull = await simulatePull(dependencies, now);

      updateStatus({ phase: 'Resolving' });
      transitions.push('Resolving');
      const conflicts = await resolveConflicts({ resolver, registry }, preparation.operationsToUpload, pull.batch, now);
      const unresolved = conflicts.results.filter((result) => result.requiresManualReview);

      if (unresolved.length > 0) {
        updateStatus({ phase: 'Conflict', reason: 'conflicts require review' });
        lastSyncTimestamp = now;
        const statistics = captureStatistics(preparation, conflicts, pull);
        return buildSyncResult(status, statistics, preparation, conflicts, [...transitions, 'Conflict'], push, pull);
      }

      lastSyncTimestamp = now;
      const statistics = captureStatistics(preparation, conflicts, pull);
      updateStatus({ phase: 'Completed', reason: 'sync completed', lastSyncAt: now });
      return buildSyncResult(status, statistics, preparation, conflicts, [...transitions, 'Completed'], push, pull);
    } catch (cause) {
      const error: CloudError = {
        code: 'unknown',
        message: 'sync failed',
        cause,
      };
      updateStatus({ phase: 'Failed', reason: 'sync failed', lastError: error });
      const preparation = await prepareSync(dependencies, now);
      const conflicts: SyncConflictResolution = { phase: 'Resolving', records: [], results: [], unresolvedCount: 0 };
      const statistics = captureStatistics(preparation, conflicts);
      return buildSyncResult(status, statistics, preparation, conflicts, [...transitions, 'Failed'], undefined, undefined, error);
    }
  };

  const cancel = (): SyncCoordinatorStatus => updateStatus({ phase: 'Idle', cancelled: true, reason: 'cancelled' });
  const resume = (): SyncCoordinatorStatus => updateStatus({ phase: 'Idle', cancelled: false, reason: undefined });
  const reset = (): SyncCoordinatorStatus => {
    lastStatistics = {
      pendingOperations: 0,
      failedOperations: 0,
      queueSize: 0,
      estimatedUploadCount: 0,
      estimatedDownloadCount: 0,
      conflictCount: 0,
    };
    lastSyncTimestamp = undefined;
    status = { phase: 'Idle', cancelled: false };
    return status;
  };

  const getStatus = (): SyncCoordinatorStatus => ({
    ...status,
    lastSyncAt: lastSyncTimestamp,
  });

  const getStatistics = (): SyncCoordinatorStatistics => ({
    ...lastStatistics,
    lastSyncTimestamp,
  });

  return {
    prepare,
    syncNow,
    cancel,
    resume,
    getStatus,
    getStatistics,
    previewSync,
    reset,
  };
};

export type { ConflictPolicy, ConflictPolicyRegistry, ConflictResolver };
