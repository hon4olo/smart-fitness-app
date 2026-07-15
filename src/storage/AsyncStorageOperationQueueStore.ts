import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { OfflineSyncQueueOperation, OfflineSyncQueueOperationPatch } from '@/cloud/CloudQueueTypes';
import {
  dedupeOfflineSyncQueueOperations,
  filterFailedOfflineSyncQueueOperations,
  filterPendingOfflineSyncQueueOperations,
  normalizeOfflineSyncQueueOperation,
} from '@/cloud/CloudQueueHelpers';

import type { StorageAdapter } from './StorageAdapter';

export const OFFLINE_SYNC_QUEUE_STORAGE_KEY = '@smart_fitness_mvp_offline_sync_queue';

type OfflineSyncQueueEnvelope = {
  version?: unknown;
  operations?: unknown;
  updatedAt?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const serializeEnvelope = (operations: OfflineSyncQueueOperation[]): string =>
  JSON.stringify({
    version: 1,
    operations,
    updatedAt: new Date().toISOString(),
  });

const parseStoredOperations = (value: string | null): OfflineSyncQueueOperation[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    const rawOperations = Array.isArray(parsed) ? parsed : isRecord(parsed) ? (parsed as OfflineSyncQueueEnvelope).operations : [];

    if (!Array.isArray(rawOperations)) {
      return [];
    }

    const now = new Date().toISOString();
    const normalized = rawOperations
      .map((operation, index) => normalizeOfflineSyncQueueOperation(operation, index, now))
      .filter((operation): operation is OfflineSyncQueueOperation => Boolean(operation));

    return dedupeOfflineSyncQueueOperations(normalized);
  } catch {
    return [];
  }
};

const persistOperations = async (storage: StorageAdapter, operations: OfflineSyncQueueOperation[]): Promise<void> => {
  if (operations.length === 0) {
    await storage.remove(OFFLINE_SYNC_QUEUE_STORAGE_KEY);
    return;
  }

  await storage.write(OFFLINE_SYNC_QUEUE_STORAGE_KEY, serializeEnvelope(operations));
};

const upsertOperation = (operations: OfflineSyncQueueOperation[], operation: OfflineSyncQueueOperation): OfflineSyncQueueOperation[] => {
  const nextOperations = operations.map((existing) => (existing.opId === operation.opId || existing.idempotencyKey === operation.idempotencyKey ? { ...existing, ...operation } : existing));

  if (!nextOperations.some((existing) => existing.opId === operation.opId || existing.idempotencyKey === operation.idempotencyKey)) {
    nextOperations.push(operation);
  }

  return dedupeOfflineSyncQueueOperations(nextOperations);
};

const updateOperationInList = (operations: OfflineSyncQueueOperation[], opId: string, patch: OfflineSyncQueueOperationPatch): OfflineSyncQueueOperation[] =>
  operations.map((operation) =>
    operation.opId === opId
      ? normalizeOfflineSyncQueueOperation(
          {
            ...operation,
            ...patch,
            opId: operation.opId,
          },
          0,
        ) ?? operation
      : operation,
  );

export const createAsyncStorageOperationQueueStore = (storage: StorageAdapter): OfflineSyncQueueStore => {
  const loadOperations = async (): Promise<OfflineSyncQueueOperation[]> => parseStoredOperations(await storage.read(OFFLINE_SYNC_QUEUE_STORAGE_KEY));

  const persistAndReturn = async (operations: OfflineSyncQueueOperation[]): Promise<OfflineSyncQueueOperation[]> => {
    await persistOperations(storage, operations);
    return operations;
  };

  const updateOperation = async (opId: string, patch: OfflineSyncQueueOperationPatch): Promise<OfflineSyncQueueOperation[]> => {
    const currentOperations = await loadOperations();
    const nextOperations = dedupeOfflineSyncQueueOperations(
      updateOperationInList(currentOperations, opId, patch).map((operation) => normalizeOfflineSyncQueueOperation(operation) ?? operation),
    );

    return persistAndReturn(nextOperations);
  };

  const store: OfflineSyncQueueStore = {
    loadOperations,
    async enqueue(operation) {
      const currentOperations = await loadOperations();
      const normalized = normalizeOfflineSyncQueueOperation(operation, currentOperations.length) ?? operation;
      return persistAndReturn(upsertOperation(currentOperations, normalized));
    },
    async enqueueBatch(operations) {
      let currentOperations = await loadOperations();

      for (const operation of operations) {
        const normalized = normalizeOfflineSyncQueueOperation(operation, currentOperations.length) ?? operation;
        currentOperations = upsertOperation(currentOperations, normalized);
      }

      return persistAndReturn(currentOperations);
    },
    updateOperation,
    async acknowledge(opId) {
      return updateOperation(opId, { status: 'acknowledged', lastError: undefined });
    },
    async removeAcknowledged() {
      const currentOperations = await loadOperations();
      return persistAndReturn(currentOperations.filter((operation) => operation.status !== 'acknowledged'));
    },
    async clear() {
      await storage.remove(OFFLINE_SYNC_QUEUE_STORAGE_KEY);
    },
    async getPending() {
      return filterPendingOfflineSyncQueueOperations(await loadOperations());
    },
    async getFailed() {
      return filterFailedOfflineSyncQueueOperations(await loadOperations());
    },
  };

  return store;
};
