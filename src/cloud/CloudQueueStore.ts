import type { OfflineSyncQueueOperation, OfflineSyncQueueOperationPatch } from './CloudQueueTypes';

export type OfflineSyncQueueStore = {
  loadOperations(): Promise<OfflineSyncQueueOperation[]>;
  enqueue(operation: OfflineSyncQueueOperation): Promise<OfflineSyncQueueOperation[]>;
  enqueueBatch(operations: OfflineSyncQueueOperation[]): Promise<OfflineSyncQueueOperation[]>;
  updateOperation(opId: string, patch: OfflineSyncQueueOperationPatch): Promise<OfflineSyncQueueOperation[]>;
  acknowledge(opId: string): Promise<OfflineSyncQueueOperation[]>;
  removeAcknowledged(): Promise<OfflineSyncQueueOperation[]>;
  clear(): Promise<void>;
  getPending(): Promise<OfflineSyncQueueOperation[]>;
  getFailed(): Promise<OfflineSyncQueueOperation[]>;
};
