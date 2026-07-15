import type { CloudError } from './CloudErrors';
import { CLOUD_ERROR_CODES } from './CloudErrors';
import type { OfflineSyncQueueAction, OfflineSyncQueueOperation, OfflineSyncQueueStatus } from './CloudQueueTypes';
import { OFFLINE_SYNC_QUEUE_ACTIONS, OFFLINE_SYNC_QUEUE_STATUSES } from './CloudQueueTypes';
import type { SyncOperation, SyncRevision } from './CloudSyncTypes';

const DEFAULT_RETRY_BASE_MS = 1_000;
const DEFAULT_RETRY_MAX_MS = 15 * 60 * 1_000;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const includesString = <T extends string>(values: readonly T[], value: unknown): value is T => typeof value === 'string' && (values as readonly string[]).includes(value);

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

const clampRetryCount = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
const normalizeTimestamp = (value: unknown, fallback: string): string => (isString(value) ? value : fallback);
const normalizeString = (value: unknown, fallback: string): string => (isString(value) ? value.trim() : fallback);
const normalizePayload = (value: unknown): Record<string, unknown> | undefined => (isRecord(value) ? value : undefined);

const normalizeRevision = (value: unknown): SyncRevision | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = isString(value.id) ? value.id.trim() : undefined;
  const number = typeof value.number === 'number' && Number.isFinite(value.number) ? Math.floor(value.number) : undefined;
  const createdAt = isString(value.createdAt) ? value.createdAt : undefined;

  if (!id || number === undefined || !createdAt) {
    return undefined;
  }

  const revision: SyncRevision = { id, number, createdAt };

  if (isString(value.parentRevisionId)) {
    revision.parentRevisionId = value.parentRevisionId.trim();
  }

  if (value.source === 'local' || value.source === 'remote') {
    revision.source = value.source;
  }

  return revision;
};

const normalizeCloudError = (value: unknown): CloudError | undefined => {
  if (!isRecord(value) || !includesString(CLOUD_ERROR_CODES, value.code) || !isString(value.message)) {
    return undefined;
  }

  const error: CloudError = {
    code: value.code,
    message: value.message.trim(),
  };

  if (isRecord(value.details)) {
    error.details = value.details;
  }

  if (typeof value.retryable === 'boolean') {
    error.retryable = value.retryable;
  }

  return error;
};

const normalizeAction = (value: unknown): OfflineSyncQueueAction => (includesString(OFFLINE_SYNC_QUEUE_ACTIONS, value) ? value : 'update');
const normalizeStatus = (value: unknown): OfflineSyncQueueStatus => (includesString(OFFLINE_SYNC_QUEUE_STATUSES, value) ? value : 'pending');

export const isOfflineSyncQueueIdempotencyKey = (value: unknown): value is string => isString(value) && value.startsWith('queue:') && value.split(':').length >= 5;

export const createOfflineSyncQueueIdempotencyKey = (
  operation: Pick<OfflineSyncQueueOperation, 'entityId' | 'entityType' | 'action' | 'clientTimestamp'> & {
    actorId?: string;
    baseRevision?: SyncRevision;
    payload?: Record<string, unknown>;
  },
): string =>
  [
    'queue',
    operation.entityType,
    operation.entityId,
    operation.action,
    operation.clientTimestamp,
    operation.actorId ?? '',
    operation.baseRevision ? `${operation.baseRevision.id}:${operation.baseRevision.number}` : '',
    stableStringify(operation.payload ?? {}),
  ].join(':');

export const createOfflineSyncQueueBackoff = (retryCount: number, now = new Date().toISOString(), baseDelayMs = DEFAULT_RETRY_BASE_MS, maxDelayMs = DEFAULT_RETRY_MAX_MS) => {
  const attempts = Math.max(0, Math.floor(retryCount));
  const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** attempts);

  return {
    retryCount: attempts,
    nextRetryAt: new Date(Date.parse(now) + delayMs).toISOString(),
  };
};

export const incrementOfflineSyncQueueRetry = (
  operation: OfflineSyncQueueOperation,
  error: CloudError,
  now = new Date().toISOString(),
  baseDelayMs = DEFAULT_RETRY_BASE_MS,
  maxDelayMs = DEFAULT_RETRY_MAX_MS,
): OfflineSyncQueueOperation => {
  const nextRetryCount = operation.retryCount + 1;
  const { nextRetryAt } = createOfflineSyncQueueBackoff(nextRetryCount, now, baseDelayMs, maxDelayMs);

  return {
    ...operation,
    retryCount: nextRetryCount,
    status: 'failed',
    lastError: error,
    nextRetryAt,
    updatedAt: now,
  };
};

export const toOfflineSyncQueueSyncOperation = (operation: OfflineSyncQueueOperation): SyncOperation => ({
  id: operation.opId,
  entity: operation.entityType as unknown as SyncOperation['entity'],
  action: operation.action === 'delete' ? 'delete' : operation.action === 'merge' ? 'merge' : 'upsert',
  payload: operation.payload,
  revision: operation.baseRevision,
  metadata: operation.metadata,
  createdAt: operation.clientTimestamp,
});

export const normalizeOfflineSyncQueueOperation = (operation: unknown, index = 0, now = new Date().toISOString()): OfflineSyncQueueOperation | null => {
  if (!isRecord(operation)) {
    return null;
  }

  const entityType = normalizeString(operation.entityType ?? operation.entity, 'unknown');
  const entityId = normalizeString(operation.entityId ?? operation.targetId ?? operation.id, `entity-${index}`);
  const clientTimestamp = normalizeTimestamp(operation.clientTimestamp ?? operation.createdAt ?? operation.timestamp, now);
  const opId = normalizeString(operation.opId ?? operation.id ?? operation.operationId, `queue-${index}-${entityType}-${entityId}`);
  const action = normalizeAction(operation.action ?? operation.type);
  const payload = normalizePayload(operation.payload ?? operation.data);
  const baseRevision = normalizeRevision(operation.baseRevision ?? operation.revision);
  const lastError = normalizeCloudError(operation.lastError ?? operation.error);
  const retryCount = clampRetryCount(operation.retryCount);
  const status = normalizeStatus(operation.status ?? operation.state);
  const actorId = isString(operation.actorId) ? operation.actorId.trim() : undefined;
  const metadata = isRecord(operation.metadata) ? operation.metadata : undefined;
  const idempotencyKey = isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)
    ? operation.idempotencyKey
    : createOfflineSyncQueueIdempotencyKey({
        entityType,
        entityId,
        action,
        clientTimestamp,
        actorId,
        baseRevision,
        payload,
      });

  const normalized: OfflineSyncQueueOperation = {
    opId,
    entityType,
    entityId,
    action,
    clientTimestamp,
    idempotencyKey,
    retryCount,
    status,
  };

  if (payload) {
    normalized.payload = payload;
  }

  if (baseRevision) {
    normalized.baseRevision = baseRevision;
  }

  if (actorId) {
    normalized.actorId = actorId;
  }

  if (lastError) {
    normalized.lastError = lastError;
  }

  if (metadata) {
    normalized.metadata = metadata;
  }

  if (isString(operation.nextRetryAt)) {
    normalized.nextRetryAt = operation.nextRetryAt.trim();
  }

  if (isString(operation.createdAt)) {
    normalized.createdAt = operation.createdAt.trim();
  }

  if (isString(operation.updatedAt)) {
    normalized.updatedAt = operation.updatedAt.trim();
  }

  if (isRecord(operation.syncOperation)) {
    normalized.syncOperation = toOfflineSyncQueueSyncOperation(normalized);
  }

  return normalized;
};

export const sortOfflineSyncQueueOperations = (operations: OfflineSyncQueueOperation[]): OfflineSyncQueueOperation[] =>
  operations
    .map((operation, index) => ({ operation, index }))
    .sort((left, right) => {
      const leftTime = Date.parse(left.operation.clientTimestamp);
      const rightTime = Date.parse(right.operation.clientTimestamp);

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      const leftCreatedAt = left.operation.createdAt ? Date.parse(left.operation.createdAt) : leftTime;
      const rightCreatedAt = right.operation.createdAt ? Date.parse(right.operation.createdAt) : rightTime;

      if (leftCreatedAt !== rightCreatedAt) {
        return leftCreatedAt - rightCreatedAt;
      }

      if (left.operation.opId !== right.operation.opId) {
        return left.operation.opId.localeCompare(right.operation.opId);
      }

      return left.index - right.index;
    })
    .map(({ operation }) => operation);

export const filterPendingOfflineSyncQueueOperations = (operations: OfflineSyncQueueOperation[]): OfflineSyncQueueOperation[] =>
  operations.filter((operation) => operation.status === 'pending' || operation.status === 'processing');

export const filterFailedOfflineSyncQueueOperations = (operations: OfflineSyncQueueOperation[]): OfflineSyncQueueOperation[] =>
  operations.filter((operation) => operation.status === 'failed');

export const dedupeOfflineSyncQueueOperations = (operations: OfflineSyncQueueOperation[]): OfflineSyncQueueOperation[] => {
  const seenOpIds = new Set<string>();
  const seenIdempotencyKeys = new Set<string>();
  const deduped: OfflineSyncQueueOperation[] = [];

  for (const operation of operations) {
    if (seenOpIds.has(operation.opId) || seenIdempotencyKeys.has(operation.idempotencyKey)) {
      continue;
    }

    seenOpIds.add(operation.opId);
    seenIdempotencyKeys.add(operation.idempotencyKey);
    deduped.push(operation);
  }

  return deduped;
};
