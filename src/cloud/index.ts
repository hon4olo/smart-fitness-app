// Cloud Foundation 1.0
//
// Intended data flow:
// UI -> AppContext -> Repository -> Local Repository -> Future Cloud Provider
//
// This package defines sync contracts only.
// No networking, authentication, synchronization execution, or persistence changes.

export type { CloudError, CloudErrorCode } from './CloudErrors';
export { CLOUD_ERROR_CODES } from './CloudErrors';
export type { CloudProvider } from './CloudProvider';
export type { CloudSyncStatus } from './CloudSyncStatus';
export { CLOUD_SYNC_STATUSES } from './CloudSyncStatus';
export type {
  ConflictRecord,
  SyncBatch,
  SyncMetadata,
  SyncOperation,
  SyncRevision,
  SyncSnapshot,
  SyncState,
} from './CloudSyncTypes';
