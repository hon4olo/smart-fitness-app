import { describe, expect, it } from 'vitest';

import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import { createAsyncStorageOperationQueueStore } from './AsyncStorageOperationQueueStore';
import type { StorageAdapter } from './StorageAdapter';

const makeOperation = (
  entityType: string,
  entityId: string,
): OfflineSyncQueueOperation => ({
  opId: `${entityType}:${entityId}`,
  entityType,
  entityId,
  action: 'create',
  payload: { id: entityId },
  clientTimestamp: '2026-07-22T12:00:00.000Z',
  idempotencyKey: `queue:${entityType}:${entityId}`,
  retryCount: 0,
  status: 'pending',
});

const createDelayedMemoryStorage = (): StorageAdapter => {
  const values = new Map<string, string>();
  const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 1));

  return {
    async read(key) {
      await pause();
      return values.get(key) ?? null;
    },
    async write(key, value) {
      await pause();
      values.set(key, value);
    },
    async remove(key) {
      await pause();
      values.delete(key);
    },
  };
};

describe('offline queue mutation lock', () => {
  it('preserves concurrent enqueues from independent store instances', async () => {
    const storage = createDelayedMemoryStorage();
    const weightStore = createAsyncStorageOperationQueueStore(storage);
    const foodStore = createAsyncStorageOperationQueueStore(storage);

    await Promise.all([
      weightStore.enqueue(
        makeOperation('weightHistory', '11111111-1111-4111-8111-111111111111'),
      ),
      foodStore.enqueue(
        makeOperation('foodEntries', '22222222-2222-4222-8222-222222222222'),
      ),
    ]);

    const operations = await weightStore.loadOperations();
    expect(operations).toHaveLength(2);
    expect(operations.map((operation) => operation.entityType).sort()).toEqual([
      'foodEntries',
      'weightHistory',
    ]);
  });
});