import type { ConflictRecord, SyncBatch, SyncOperation, SyncRevision, SyncSnapshot, SyncState } from './CloudSyncTypes';

export type CloudPushResult = SyncState & {
  revision?: number;
  serverTimestamp?: string;
  appliedOperations?: SyncOperation[];
  conflicts?: ConflictRecord[];
  duplicateIdempotencyKeys?: string[];
};

export type CloudPullResult = Omit<SyncBatch, 'revision'> & Partial<SyncState> & {
  revision?: SyncRevision | number;
  serverRevision?: number;
  serverTimestamp?: string;
  changedEntities?: Array<Record<string, unknown>>;
  deletedEntities?: Array<Record<string, unknown>>;
  conflicts?: ConflictRecord[];
  metadata?: Record<string, unknown>;
};

export type CloudProvider = {
  healthCheck(): Promise<SyncState>;
  status?(): Promise<SyncState>;
  pullChanges(): Promise<CloudPullResult>;
  pushOperations(batch: SyncBatch): Promise<CloudPushResult>;
  getSnapshot(): Promise<SyncSnapshot>;
  uploadSnapshot(snapshot: SyncSnapshot): Promise<SyncState>;
  resolveConflict(conflict: ConflictRecord): Promise<SyncState>;
};
