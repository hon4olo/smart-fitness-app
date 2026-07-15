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

export type WeightHistoryRemoteDelete = Pick<WeightHistoryRemoteRecord, 'id' | 'deletedAt' | 'revision' | 'deviceId'> & {
  appliedAt?: string | null;
};

export type WeightHistorySyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: WeightSyncMetadata[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isWeightHistoryEntity = (entityType: string): boolean => entityType === 'weightHistory' || entityType === 'weight_history';

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
  const payload = input.action === 'delete'
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
    idempotencyKey: `queue:weightHistory:${input.entry.id}:${input.action}:${clientTimestamp}:${input.actorId ?? ''}:${input.baseRevision}:${input.entry.weight}:${input.entry.createdAt}`,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'weightHistory',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.actorId,
      lastSyncedAt: input.previous?.syncedAt,
    },
  };
};

export const isWeightHistoryQueueOperation = (operation: OfflineSyncQueueOperation): boolean => isWeightHistoryEntity(operation.entityType);

export const filterWeightHistoryQueueOperations = (operations: OfflineSyncQueueOperation[]): OfflineSyncQueueOperation[] =>
  operations.filter(isWeightHistoryQueueOperation);

export const toLocalWeightEntry = (record: WeightHistoryRemoteRecord): WeightEntry => ({
  id: record.id,
  date: formatShortDate(record.recordedAt),
  weight: record.weight,
  createdAt: record.createdAt,
});

export const applyRemoteWeightHistoryChanges = (
  state: AppState,
  changedEntities: Array<{ payload?: Record<string, unknown> | null; entityId?: string | null; entityType: string; revision?: number; operationType?: string; appliedAt?: string | null }>,
  deletedEntities: Array<{ id?: string; entityId?: string; entityType: string; revision?: number; appliedAt?: string | null }> = [],
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
    if (!isRecord(record) || !record.id) {
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
    const leftRevision = typeof left.revision === 'number' ? left.revision : 0;
    const rightRevision = typeof right.revision === 'number' ? right.revision : 0;
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

    applyRecord({
      id: typeof payload.id === 'string' ? payload.id : entity.entityId ?? '',
      weight: typeof payload.weight === 'number' ? payload.weight : Number(payload.weight ?? 0),
      recordedAt: typeof payload.recordedAt === 'string' ? payload.recordedAt : syncedAt,
      createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : syncedAt,
      updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : syncedAt,
      deletedAt: typeof payload.deletedAt === 'string' ? payload.deletedAt : null,
      revision: typeof payload.revision === 'number' ? payload.revision : 0,
      deviceId: typeof payload.deviceId === 'string' ? payload.deviceId : null,
    });
  }

  for (const deleted of deletedEntities) {
    const id = deleted.id ?? deleted.entityId;
    if (!id) {
      continue;
    }

    removeEntry(id);
    deletedRecordIds.push(id);

    metadata.set(id, {
      id,
      revision: typeof deleted.revision === 'number' ? deleted.revision : 0,
      deviceId: 'unknown',
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
