import { describe, expect, it, vi } from 'vitest';

import { createWeightHistoryQueueOperation } from '@/cloud/WeightHistorySync';
import {
  APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY,
  createAppMutationOutboxRecoveryStore,
  type StorageAdapter,
} from '@/storage';

import {
  createRecoverableOutboxStep,
  recoverAppMutationOutbox,
} from './AppMutationOutboxRecovery';

const createMemoryStorage = (): StorageAdapter & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    read: async (key) => values.get(key) ?? null,
    write: async (key, value) => {
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
  };
};

const createOperation = () =>
  createWeightHistoryQueueOperation({
    action: 'create',
    entry: {
      id: '11111111-1111-4111-8111-111111111111',
      date: '24 Jul',
      weight: 79.5,
      createdAt: '2026-07-24T05:00:00.000Z',
    },
    deviceId: 'device-a',
    baseRevision: 0,
    actorId: 'user-a',
    now: '2026-07-24T05:00:00.000Z',
  });

describe('durable app mutation outbox recovery', () => {
  it('persists a strict recovery record and removes it after queue acceptance', async () => {
    const storage = createMemoryStorage();
    const recoveryStore = createAppMutationOutboxRecoveryStore(storage);
    const operation = createOperation();

    await recoveryStore.put({
      id: operation.opId,
      label: 'Save weight entry',
      operation,
      createdAt: '2026-07-24T05:00:01.000Z',
    });

    expect(await recoveryStore.list()).toEqual([
      expect.objectContaining({ id: operation.opId, label: 'Save weight entry', operation }),
    ]);

    await recoveryStore.remove(operation.opId);
    expect(await recoveryStore.list()).toEqual([]);
    expect(storage.values.has(APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY)).toBe(false);
  });

  it('keeps malformed stored records fail-closed', async () => {
    const storage = createMemoryStorage();
    storage.values.set(
      APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        records: [
          { id: 'wrong-id', label: 'Broken', createdAt: 'not-a-date', operation: createOperation() },
          { id: 'missing-operation', label: 'Broken', createdAt: '2026-07-24T05:00:00.000Z' },
        ],
      }),
    );

    const recoveryStore = createAppMutationOutboxRecoveryStore(storage);
    expect(await recoveryStore.list()).toEqual([]);
  });

  it('journals the exact operation before enqueue and retains it after enqueue failure', async () => {
    const storage = createMemoryStorage();
    const recoveryStore = createAppMutationOutboxRecoveryStore(storage);
    const operation = createOperation();
    const buildOperation = vi.fn().mockResolvedValue(operation);
    const enqueue = vi.fn().mockRejectedValueOnce(new Error('Queue write failed'));
    const step = createRecoverableOutboxStep({
      buildOperation,
      label: 'Save weight entry',
      now: () => '2026-07-24T05:00:01.000Z',
      queueStore: { enqueue },
      recoveryStore,
    });

    await expect(step()).rejects.toThrow('Queue write failed');

    expect(buildOperation).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(operation);
    expect(await recoveryStore.list()).toEqual([
      expect.objectContaining({ id: operation.opId, operation }),
    ]);
  });

  it('retries with the same operation and clears the journal after success', async () => {
    const storage = createMemoryStorage();
    const recoveryStore = createAppMutationOutboxRecoveryStore(storage);
    const operation = createOperation();
    const buildOperation = vi.fn().mockResolvedValue(operation);
    const enqueue = vi
      .fn()
      .mockRejectedValueOnce(new Error('Queue write failed'))
      .mockResolvedValueOnce([operation]);
    const step = createRecoverableOutboxStep({
      buildOperation,
      label: 'Save weight entry',
      now: () => '2026-07-24T05:00:01.000Z',
      queueStore: { enqueue },
      recoveryStore,
    });

    await expect(step()).rejects.toThrow('Queue write failed');
    await expect(step()).resolves.toBeUndefined();

    expect(buildOperation).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenNthCalledWith(1, operation);
    expect(enqueue).toHaveBeenNthCalledWith(2, operation);
    expect(await recoveryStore.list()).toEqual([]);
  });

  it('replays persisted operations after restart and removes only accepted records', async () => {
    const storage = createMemoryStorage();
    const recoveryStore = createAppMutationOutboxRecoveryStore(storage);
    const operation = createOperation();
    await recoveryStore.put({
      id: operation.opId,
      label: 'Save weight entry',
      operation,
      createdAt: '2026-07-24T05:00:01.000Z',
    });

    const failedEnqueue = vi.fn().mockRejectedValue(new Error('Still offline'));
    await expect(
      recoverAppMutationOutbox({ queueStore: { enqueue: failedEnqueue }, recoveryStore }),
    ).rejects.toThrow('Still offline');
    expect(await recoveryStore.list()).toHaveLength(1);

    const successfulEnqueue = vi.fn().mockResolvedValue([operation]);
    await expect(
      recoverAppMutationOutbox({ queueStore: { enqueue: successfulEnqueue }, recoveryStore }),
    ).resolves.toBe(1);

    expect(successfulEnqueue).toHaveBeenCalledWith(operation);
    expect(await recoveryStore.list()).toEqual([]);
  });
});
