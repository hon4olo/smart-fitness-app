import { formatShortDate } from '@/lib';
import type { AppState, WeightEntry } from '@/types';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { WeightSyncMetadata } from '@/storage/WeightSyncMetadataStore';

export type WeightHistoryRemoteRecord = {
  id: string;
  weight: number;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revision: number;
  deviceId: string | null;
};

export type WeightHistoryRemoteDelete = Pick<
  WeightHistoryRemoteRecord,
  'id' | 'deletedAt' | 'revision' | 'deviceId'
> & {
  appliedAt?: string | null;
};

export type WeightHistorySyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: WeightSyncMetadata[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isWeightHistoryEntity = (entityType: string): boolean =>
  entityType === 'weightHistory' || entityType === 'weight_history';

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toRevision = (value: unknown, fallback = 0): number => {
  const parsed = toFiniteNumber(value);
  return parsed === null ? fallback : Math.max(0, Math.floor(parsed));
};

export const getWeightHistoryRecordKey = (entry: WeightEntry): string => entry.id;

export const createWeightHistoryQueueOperation = (
  input: {
    action: 'create' | 'update' | 'delete';
    entry: WeightEntry;
    deviceId: string;
    baseRevision: number;
    actorId?: string;
    now?: string;
    previous?: WeightSyncMetadata | null;
  },
): OfflineSyncQueueOperation => {
  const now = input.now ?? new Date().toISOString();
  const operationId = `weightHistory:${input.entry.id}`;
  const clientTimestamp = now;
  const idempotencyKey = `queue:weightHistory:${input.entry.id}:${input.action}:${clientTimestamp}:${input.actorId ?? ''}:${input.baseRevision}:${input.entry.weight}:${input.entry.createdAt}`;
  const payload =
    input.action === 'delete'
      ? {
          id: input.entry.id,
          recordedAt: input.entry.createdAt,
          deletedAt: now,
          deviceId: input.deviceId,
        }
      : {
          id: input.entry.id,
          weight: input.entry.weight,
          recordedAt: input.entry.createdAt,
          createdAt: input.entry.createdAt,
          updatedAt: now,
          deviceId: input.deviceId,
        };

  return {
    opId: operationId,
    entityType: 'weightHistory',
    entityId: input.entry.id,
    action: input.action,
    payload,
    baseRevision: {
      id: input.previous ? `rev-${input.previous.revision}` : 'rev-0',
      number: input.baseRevision,
      createdAt: input.previous?.syncedAt ?? now,
    },
    clientTimestamp,
    actorId: input.actorId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'weightHistory',
      deviceId: input.deviceId,
      requestId: idempotencyKey,
      source: 'local',
      userId: input.actorId,
      lastSyncedAt: input.previous?.syncedAt,
    },
  };
};

export const isWeightHistoryQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isWeightHistoryEntity(operation.entityType);

export const filterWeightHistoryQueueOperations = (
  operations: OfflineSyncQueueOperation[],
): OfflineSyncQueueOperation[] => operations.filter(isWeightHistoryQueueOperation);

export const toLocalWeightEntry = (record: WeightHistoryRemoteRecord): WeightEntry => ({
  id: record.id,
  date: formatShortDate(record.recordedAt),
  weight: record.weight,
  createdAt: record.createdAt,
});

export const applyRemoteWeightHistoryChanges = (
  state: AppState,
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    operationType?: string;
    appliedAt?: string | null;
  }>,
  deletedEntities: Array<{
    id?: string;
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
    deviceId?: string | null;
  }> = [],
  existingMetadata: Map<string, WeightSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): WeightHistorySyncResult => {
  const metadata = new Map(existingMetadata);
  let nextWeightHistory = [...state.weightHistory];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  const upsertEntry = (entry: WeightEntry) => {
    const index = nextWeightHistory.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      nextWeightHistory[index] = entry;
    } else {
      nextWeightHistory = [entry, ...nextWeightHistory];
    }
  };

  const removeEntry = (id: string) => {
    nextWeightHistory = nextWeightHistory.filter((entry) => entry.id !== id);
  };

  const applyRecord = (record: WeightHistoryRemoteRecord) => {
    if (!record.id) {
      return;
    }

    if (record.deletedAt) {
      removeEntry(record.id);
      deletedRecordIds.push(record.id);
    } else {
      upsertEntry(toLocalWeightEntry(record));
      appliedRecordIds.push(record.id);
    }

    metadata.set(record.id, {
      id: record.id,
      revision: record.revision,
      deviceId: record.deviceId ?? 'unknown',
      recordedAt: record.recordedAt,
      syncedAt,
      deletedAt: record.deletedAt,
    });
  };

  const sortedChanged = [...changedEntities].sort((left, right) => {
    const leftRevision = toRevision(left.revision);
    const rightRevision = toRevision(right.revision);
    if (leftRevision !== rightRevision) {
      return leftRevision - rightRevision;
    }
    const leftTime = typeof left.appliedAt === 'string' ? Date.parse(left.appliedAt) : 0;
    const rightTime = typeof right.appliedAt === 'string' ? Date.parse(right.appliedAt) : 0;
    return leftTime - rightTime;
  });

  for (const entity of sortedChanged) {
    if (!isWeightHistoryEntity(entity.entityType)) {
      continue;
    }

    const payload = isRecord(entity.payload) ? entity.payload : null;
    if (!payload) {
      continue;
    }

    const id = typeof payload.id === 'string' ? payload.id : entity.entityId ?? '';
    const deletedAt = typeof payload.deletedAt === 'string' ? payload.deletedAt : null;
    const weight = toFiniteNumber(payload.weight);
    if (!id || (!deletedAt && weight === null)) {
      continue;
    }

    applyRecord({
      id,
      weight: weight ?? 0,
      recordedAt:
        typeof payload.recordedAt === 'string' ? payload.recordedAt : syncedAt,
      createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : syncedAt,
      updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : syncedAt,
      deletedAt,
      revision: toRevision(payload.revision, toRevision(entity.revision)),
      deviceId: typeof payload.deviceId === 'string' ? payload.deviceId : null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isWeightHistoryEntity(deleted.entityType)) {
      continue;
    }

    const id = deleted.entityId ?? deleted.id;
    if (!id) {
      continue;
    }

    removeEntry(id);
    deletedRecordIds.push(id);

    metadata.set(id, {
      id,
      revision: toRevision(deleted.revision),
      deviceId:
        typeof deleted.deviceId === 'string' && deleted.deviceId
          ? deleted.deviceId
          : 'unknown',
      recordedAt: syncedAt,
      syncedAt,
      deletedAt: deleted.appliedAt ?? syncedAt,
    });
  }

  return {
    nextState: {
      ...state,
      weightHistory: nextWeightHistory,
    },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
