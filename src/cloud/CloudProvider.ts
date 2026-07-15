import type { ConflictRecord, SyncBatch, SyncSnapshot, SyncState } from './CloudSyncTypes';

export type CloudProvider = {
  healthCheck(): Promise<SyncState>;
  pullChanges(): Promise<SyncBatch>;
  pushOperations(batch: SyncBatch): Promise<SyncState>;
  getSnapshot(): Promise<SyncSnapshot>;
  uploadSnapshot(snapshot: SyncSnapshot): Promise<SyncState>;
  resolveConflict(conflict: ConflictRecord): Promise<SyncState>;
};
