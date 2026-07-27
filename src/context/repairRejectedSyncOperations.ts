import { repairOfflineSyncQueueOperationIdempotencyKey } from '@/cloud';
import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { RejectedSyncOperation } from '@/cloud/CloudProvider';

export const repairRejectedSyncIdempotencyKeys = async (
  queueStore: OfflineSyncQueueStore,
  rejectedOperations: RejectedSyncOperation[],
): Promise<number> => {
  const rejectedIds = new Set(
    rejectedOperations
      .filter(
        (operation) =>
          operation.status === 409 &&
          operation.code?.toUpperCase() === 'SYNC_IDEMPOTENCY_KEY_REUSE',
      )
      .map((operation) => operation.operationId),
  );
  if (rejectedIds.size === 0) return 0;

  let repairedCount = 0;
  for (const operation of await queueStore.loadOperations()) {
    if (!rejectedIds.has(operation.opId)) continue;
    const repaired = repairOfflineSyncQueueOperationIdempotencyKey(operation);
    if (repaired.idempotencyKey === operation.idempotencyKey) continue;
    await queueStore.updateOperation(operation.opId, {
      idempotencyKey: repaired.idempotencyKey,
      metadata: repaired.metadata,
      status: 'pending',
      lastError: undefined,
      nextRetryAt: undefined,
    });
    repairedCount += 1;
  }
  return repairedCount;
};
