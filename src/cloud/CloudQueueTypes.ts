import type { CloudError } from './CloudErrors';
import type { SyncMetadata, SyncOperation, SyncRevision } from './CloudSyncTypes';

export const OFFLINE_SYNC_QUEUE_ACTIONS = ['create', 'update', 'delete', 'append', 'merge', 'reorder'] as const;
export const OFFLINE_SYNC_QUEUE_STATUSES = ['pending', 'processing', 'failed', 'acknowledged'] as const;

export type OfflineSyncQueueAction = (typeof OFFLINE_SYNC_QUEUE_ACTIONS)[number];
export type OfflineSyncQueueStatus = (typeof OFFLINE_SYNC_QUEUE_STATUSES)[number];

export type OfflineSyncQueueOperation = {
  opId: string;
  entityType: string;
  entityId: string;
  action: OfflineSyncQueueAction;
  payload?: Record<string, unknown>;
  baseRevision?: SyncRevision;
  clientTimestamp: string;
  actorId?: string;
  idempotencyKey: string;
  retryCount: number;
  status: OfflineSyncQueueStatus;
  lastError?: CloudError;
  nextRetryAt?: string;
  metadata?: SyncMetadata;
  syncOperation?: SyncOperation;
  createdAt?: string;
  updatedAt?: string;
};

export type OfflineSyncQueueOperationPatch = Partial<Omit<OfflineSyncQueueOperation, 'opId'>>;

export type OfflineSyncQueueEnvelope = {
  version: 1;
  operations: OfflineSyncQueueOperation[];
  updatedAt: string;
};
