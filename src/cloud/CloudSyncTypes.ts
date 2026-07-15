import type { DomainEntityName } from '@/domain';

import type { CloudError } from './CloudErrors';
import type { CloudSyncStatus } from './CloudSyncStatus';

export const CLOUD_CONFLICT_STATUSES = ['unresolved', 'autoResolved', 'needsReview', 'resolved', 'ignored'] as const;
export const CLOUD_CONFLICT_RESOLUTION_STRATEGIES = ['localWins', 'remoteWins', 'lastWriteWins', 'mergeFields', 'appendUnion', 'manualReview'] as const;

export type ConflictStatus = (typeof CLOUD_CONFLICT_STATUSES)[number];
export type ConflictResolutionStrategy = (typeof CLOUD_CONFLICT_RESOLUTION_STRATEGIES)[number];

export type SyncRevision = {
  id: string;
  number: number;
  createdAt: string;
  parentRevisionId?: string;
  source?: 'local' | 'remote';
};

export type SyncMetadata = {
  appVersion?: string;
  clientId?: string;
  deviceId?: string;
  entityName?: DomainEntityName | string;
  lastSyncedAt?: string;
  requestId?: string;
  source?: 'local' | 'remote';
  userId?: string;
};

export type SyncOperation = {
  id: string;
  entity: DomainEntityName;
  action: 'upsert' | 'delete' | 'merge';
  payload?: Record<string, unknown>;
  revision?: SyncRevision;
  metadata?: SyncMetadata;
  createdAt: string;
};

export type SyncBatch = {
  id: string;
  operations: SyncOperation[];
  metadata?: SyncMetadata;
  revision?: SyncRevision;
  createdAt: string;
};

export type SyncSnapshot = {
  id: string;
  revision: SyncRevision;
  metadata?: SyncMetadata;
  state: Record<string, unknown>;
  createdAt: string;
};

export type ConflictRecord = {
  conflictId: string;
  entityType: string;
  entity: string;
  entityId: string;
  localVersion: unknown;
  remoteVersion: unknown;
  baseVersion?: unknown;
  localRevision?: SyncRevision;
  remoteRevision?: SyncRevision;
  detectedAt: string;
  status: ConflictStatus;
  resolutionStrategy?: ConflictResolutionStrategy;
  resolvedVersion?: unknown;
  reason: string;
  metadata?: SyncMetadata;
  localOperation?: SyncOperation;
  remoteOperation?: SyncOperation;
};

export type SyncState = {
  status: CloudSyncStatus;
  pendingOperations: number;
  conflictCount: number;
  lastSyncedAt?: string;
  metadata?: SyncMetadata;
  error?: CloudError;
};
