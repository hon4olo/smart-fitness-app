import { createDeterministicUuid } from '@/lib/ids';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { SyncRevision } from './CloudSyncTypes';

export const MAX_SYNC_IDEMPOTENCY_KEY_LENGTH = 255;

const isString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

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
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableStringify(entryValue)}`,
    )
    .join(',')}}`;
};

export const isOfflineSyncQueueIdempotencyKey = (
  value: unknown,
): value is string =>
  isString(value) && value.startsWith('queue:') && value.split(':').length >= 5;

export const isServerCompatibleOfflineSyncQueueIdempotencyKey = (
  value: unknown,
): value is string =>
  isOfflineSyncQueueIdempotencyKey(value) &&
  value.length <= MAX_SYNC_IDEMPOTENCY_KEY_LENGTH;

export const createOfflineSyncQueueIdempotencyKey = (
  operation: Pick<
    OfflineSyncQueueOperation,
    'entityId' | 'entityType' | 'action' | 'clientTimestamp'
  > & {
    actorId?: string;
    baseRevision?: SyncRevision;
    payload?: Record<string, unknown>;
  },
): string => {
  const canonicalOperation = stableStringify({
    action: operation.action,
    actorId: operation.actorId ?? null,
    baseRevision: operation.baseRevision ?? null,
    clientTimestamp: operation.clientTimestamp,
    entityId: operation.entityId,
    entityType: operation.entityType,
    payload: operation.payload ?? {},
  });
  const digest = createDeterministicUuid(
    `offline-sync-idempotency:v2:${canonicalOperation}`,
  );

  return ['queue', 'v2', 'op', operation.action, digest].join(':');
};

export const repairOfflineSyncQueueOperationIdempotencyKey = (
  operation: OfflineSyncQueueOperation,
): OfflineSyncQueueOperation => {
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: operation.entityType,
    entityId: operation.entityId,
    action: operation.action,
    clientTimestamp: operation.clientTimestamp,
    actorId: operation.actorId,
    baseRevision: operation.baseRevision,
    payload: operation.payload,
  });
  if (idempotencyKey === operation.idempotencyKey) return operation;
  return {
    ...operation,
    idempotencyKey,
    metadata: {
      ...operation.metadata,
      requestId: idempotencyKey,
    },
  };
};
