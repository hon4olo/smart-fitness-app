import type { CloudPullResult, CloudProvider, CloudPushResult } from './CloudProvider';
import type { CloudError } from './CloudErrors';
import type { ConflictRecord, SyncBatch, SyncRevision, SyncState } from './CloudSyncTypes';
import type { ConflictPolicyRegistry } from './CloudConflictPolicies';
import type { ConflictResolver, ConflictResolutionResult } from './CloudConflictResolver';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { OfflineSyncQueueStore } from './CloudQueueStore';

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
