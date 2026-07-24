import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import type {
  AppMutationOutboxRecoveryRecord,
  AppMutationOutboxRecoveryStore,
} from '@/storage/AppMutationOutboxRecoveryStore';

export const createRecoverableOutboxStep = ({
  buildOperation,
  label,
  now = () => new Date().toISOString(),
  queueStore,
  recoveryStore,
}: {
  buildOperation(): Promise<OfflineSyncQueueOperation>;
  label: string;
  now?: () => string;
  queueStore: Pick<OfflineSyncQueueStore, 'enqueue'>;
  recoveryStore: AppMutationOutboxRecoveryStore;
}): (() => Promise<void>) => {
  let operationPromise: Promise<OfflineSyncQueueOperation> | null = null;

  return async () => {
    operationPromise ??= buildOperation();
    const operation = await operationPromise;
    const record: AppMutationOutboxRecoveryRecord = {
      id: operation.opId,
      label,
      operation,
      createdAt: now(),
    };

    await recoveryStore.put(record);
    await queueStore.enqueue(operation);
    await recoveryStore.remove(record.id);
  };
};

export const recoverAppMutationOutbox = async ({
  queueStore,
  recoveryStore,
}: {
  queueStore: Pick<OfflineSyncQueueStore, 'enqueue'>;
  recoveryStore: AppMutationOutboxRecoveryStore;
}): Promise<number> => {
  const records = await recoveryStore.list();
  let recoveredCount = 0;

  for (const record of records) {
    await queueStore.enqueue(record.operation);
    await recoveryStore.remove(record.id);
    recoveredCount += 1;
  }

  return recoveredCount;
};
