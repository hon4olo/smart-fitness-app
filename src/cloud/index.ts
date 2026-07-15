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
  ConflictResolutionStrategy,
  ConflictStatus,
  SyncBatch,
  SyncMetadata,
  SyncOperation,
  SyncRevision,
  SyncSnapshot,
  SyncState,
} from './CloudSyncTypes';
export {
  CLOUD_CONFLICT_RESOLUTION_STRATEGIES,
  CLOUD_CONFLICT_STATUSES,
} from './CloudSyncTypes';
export type {
  ConflictDetectionInput,
  ConflictResolutionOutcome,
  ConflictResolutionResult,
  ConflictResolver,
} from './CloudConflictResolver';
export {
  createConflictResolver,
} from './CloudConflictResolver';
export type {
  ConflictPolicy,
  ConflictPolicyRegistry,
} from './CloudConflictPolicies';
export {
  DEFAULT_CONFLICT_POLICY,
  DEFAULT_CONFLICT_POLICIES,
  createConflictPolicyRegistry,
} from './CloudConflictPolicies';
export type {
  OfflineSyncQueueAction,
  OfflineSyncQueueOperation,
  OfflineSyncQueueOperationPatch,
  OfflineSyncQueueStatus,
} from './CloudQueueTypes';
export {
  OFFLINE_SYNC_QUEUE_ACTIONS,
  OFFLINE_SYNC_QUEUE_STATUSES,
} from './CloudQueueTypes';
export type { OfflineSyncQueueStore } from './CloudQueueStore';
export {
  createOfflineSyncQueueBackoff,
  createOfflineSyncQueueIdempotencyKey,
  dedupeOfflineSyncQueueOperations,
  filterFailedOfflineSyncQueueOperations,
  filterPendingOfflineSyncQueueOperations,
  incrementOfflineSyncQueueRetry,
  isOfflineSyncQueueIdempotencyKey,
  normalizeOfflineSyncQueueOperation,
  sortOfflineSyncQueueOperations,
  toOfflineSyncQueueSyncOperation,
} from './CloudQueueHelpers';
