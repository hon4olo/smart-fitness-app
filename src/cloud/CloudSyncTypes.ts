import type { DomainEntityName } from '@/domain';

import type { CloudError } from './CloudErrors';
import type { CloudSyncStatus } from './CloudSyncStatus';

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
  entityName?: DomainEntityName;
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
  id: string;
  entity: DomainEntityName;
  localOperation?: SyncOperation;
  remoteOperation?: SyncOperation;
  localRevision?: SyncRevision;
  remoteRevision?: SyncRevision;
  metadata?: SyncMetadata;
  createdAt: string;
};

export type SyncState = {
  status: CloudSyncStatus;
  pendingOperations: number;
  conflictCount: number;
  lastSyncedAt?: string;
  metadata?: SyncMetadata;
  error?: CloudError;
};
