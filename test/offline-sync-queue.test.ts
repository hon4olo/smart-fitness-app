import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createOfflineSyncQueueBackoff,
  createOfflineSyncQueueIdempotencyKey,
  incrementOfflineSyncQueueRetry,
} from '@/cloud';
import { createAsyncStorageOperationQueueStore, OFFLINE_SYNC_QUEUE_STORAGE_KEY } from '@/storage';
import type { StorageAdapter } from '@/storage';

const FIXED_NOW = new Date('2026-01-02T03:04:05.000Z');

const createMemoryStorage = () => {
  const data = new Map<string, string>();

  const read = vi.fn<StorageAdapter['read']>(async (key) => (data.has(key) ? data.get(key)! : null));
  const write = vi.fn<StorageAdapter['write']>(async (key, value) => {
    data.set(key, value);
  });
  const remove = vi.fn<StorageAdapter['remove']>(async (key) => {
    data.delete(key);
  });

  return {
    data,
    read,
    write,
    remove,
    storage: { read, write, remove } satisfies StorageAdapter,
  };
};

const createOperation = (overrides: Partial<Record<string, unknown>> = {}) => {
  const entityType = (overrides.entityType as string | undefined) ?? 'workoutSessions';
  const entityId = (overrides.entityId as string | undefined) ?? 'session-1';
  const action = (overrides.action as 'create' | 'update' | 'delete' | 'append' | 'merge' | 'reorder' | undefined) ?? 'create';
  const clientTimestamp = (overrides.clientTimestamp as string | undefined) ?? '2026-01-02T01:00:00.000Z';
  const actorId = (overrides.actorId as string | undefined) ?? 'actor-1';
  const baseRevision = (overrides.baseRevision as { id: string; number: number; createdAt: string } | undefined) ?? {
    id: 'rev-1',
    number: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const payload = (overrides.payload as Record<string, unknown> | undefined) ?? { value: entityId };
  const idempotencyKey =
    (overrides.idempotencyKey as string | undefined) ??
    createOfflineSyncQueueIdempotencyKey({ entityType, entityId, action, clientTimestamp, actorId, baseRevision, payload });

  return {
    opId: (overrides.opId as string | undefined) ?? `op-${entityId}`,
    entityType,
    entityId,
    action,
    payload,
    baseRevision,
    clientTimestamp,
    actorId,
    idempotencyKey,
    retryCount: (overrides.retryCount as number | undefined) ?? 0,
    status: (overrides.status as 'pending' | 'processing' | 'failed' | 'acknowledged' | undefined) ?? 'pending',
    lastError: overrides.lastError as { code: 'offline'; message: string } | undefined,
  };
};

describe('offline sync queue store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enqueue preserves order', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    const first = createOperation({ opId: 'op-1', entityId: 'a' });
    const second = createOperation({ opId: 'op-2', entityId: 'b', clientTimestamp: '2026-01-02T01:00:01.000Z' });

    await store.enqueue(first);
    await store.enqueue(second);

    expect(await store.loadOperations()).toHaveLength(2);
    expect((await store.loadOperations()).map((operation) => operation.opId)).toEqual(['op-1', 'op-2']);
  });

  it('enqueueBatch preserves order', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    const operations = [
      createOperation({ opId: 'op-1', entityId: 'a' }),
      createOperation({ opId: 'op-2', entityId: 'b', clientTimestamp: '2026-01-02T01:00:01.000Z' }),
      createOperation({ opId: 'op-3', entityId: 'c', clientTimestamp: '2026-01-02T01:00:02.000Z' }),
    ];

    await store.enqueueBatch(operations);

    expect((await store.loadOperations()).map((operation) => operation.opId)).toEqual(['op-1', 'op-2', 'op-3']);
  });

  it('deduplicates duplicate opId entries by updating the existing operation', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    await store.enqueue(createOperation({ opId: 'op-1', entityId: 'a', payload: { value: 1 } }));
    await store.enqueue(createOperation({ opId: 'op-1', entityId: 'a', payload: { value: 2 }, status: 'failed' }));

    const operations = await store.loadOperations();

    expect(operations).toHaveLength(1);
    expect(operations[0].payload).toEqual({ value: 2 });
    expect(operations[0].status).toBe('failed');
  });

  it('deduplicates duplicate idempotency keys without creating a second record', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);
    const idempotencyKey = 'queue:workoutSessions:session-1:create:2026-01-02T01:00:00.000Z:actor-1:{}';

    await store.enqueue(createOperation({ opId: 'op-1', entityId: 'a', idempotencyKey, payload: { value: 1 } }));
    await store.enqueue(createOperation({ opId: 'op-2', entityId: 'b', idempotencyKey, payload: { value: 2 } }));

    const operations = await store.loadOperations();

    expect(operations).toHaveLength(1);
    expect(operations[0].opId).toBe('op-2');
    expect(operations[0].payload).toEqual({ value: 2 });
  });

  it('supports acknowledge and update behavior', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    await store.enqueue(createOperation({ opId: 'op-1', entityId: 'a', retryCount: 1, status: 'pending' }));
    await store.updateOperation('op-1', {
      status: 'processing',
      retryCount: 2,
      lastError: { code: 'offline', message: 'offline' },
    });

    let operation = (await store.loadOperations())[0];
    expect(operation.status).toBe('processing');
    expect(operation.retryCount).toBe(2);
    expect(operation.lastError).toEqual({ code: 'offline', message: 'offline' });

    await store.acknowledge('op-1');

    operation = (await store.loadOperations())[0];
    expect(operation.status).toBe('acknowledged');
    expect(operation.lastError).toBeUndefined();
  });

  it('returns failed operations only from getFailed', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    await store.enqueueBatch([
      createOperation({ opId: 'op-1', entityId: 'a', status: 'pending' }),
      createOperation({ opId: 'op-2', entityId: 'b', status: 'failed' }),
      createOperation({ opId: 'op-3', entityId: 'c', status: 'failed' }),
    ]);

    expect((await store.getFailed()).map((operation) => operation.opId)).toEqual(['op-2', 'op-3']);
  });

  it('increments retry metadata deterministically', () => {
    const operation = createOperation({ opId: 'op-1', entityId: 'a', retryCount: 2, status: 'processing' });
    const next = incrementOfflineSyncQueueRetry(operation, { code: 'offline', message: 'temporary offline' }, FIXED_NOW.toISOString());

    expect(next.retryCount).toBe(3);
    expect(next.status).toBe('failed');
    expect(next.lastError).toEqual({ code: 'offline', message: 'temporary offline' });
    expect(next.nextRetryAt).toBe(createOfflineSyncQueueBackoff(3, FIXED_NOW.toISOString()).nextRetryAt);
  });

  it('recovers safely from malformed stored data', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    memory.data.set(
      OFFLINE_SYNC_QUEUE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        operations: [
          { entityType: 'workoutSessions', entityId: 'session-1', action: 'update', status: 'failed', retryCount: 2 },
          null,
          42,
        ],
      }),
    );

    const operations = await store.loadOperations();

    expect(operations).toHaveLength(1);
    expect(operations[0].status).toBe('failed');
    expect(operations[0].retryCount).toBe(2);
    expect(operations[0].opId).toContain('queue-0');
  });

  it('returns an empty list for empty storage', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    expect(await store.loadOperations()).toEqual([]);
    expect(await store.getPending()).toEqual([]);
    expect(await store.getFailed()).toEqual([]);
  });

  it('removeAcknowledged removes acknowledged operations only', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    await store.enqueueBatch([
      createOperation({ opId: 'op-1', entityId: 'a', status: 'acknowledged' }),
      createOperation({ opId: 'op-2', entityId: 'b', status: 'pending' }),
    ]);

    await store.removeAcknowledged();

    expect((await store.loadOperations()).map((operation) => operation.opId)).toEqual(['op-2']);
  });

  it('clear removes the dedicated storage key', async () => {
    const memory = createMemoryStorage();
    const store = createAsyncStorageOperationQueueStore(memory.storage);

    await store.enqueue(createOperation({ opId: 'op-1', entityId: 'a' }));
    await store.clear();

    expect(memory.data.has(OFFLINE_SYNC_QUEUE_STORAGE_KEY)).toBe(false);
    expect(await store.loadOperations()).toEqual([]);
  });
});
