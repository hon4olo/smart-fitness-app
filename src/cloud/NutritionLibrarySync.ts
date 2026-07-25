import AsyncStorage from '@react-native-async-storage/async-storage';

import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  getNutritionFoodLibraryStorageKey,
  parseNutritionFoodLibrary,
  serializeNutritionFoodLibrary,
  type NutritionLibraryFood,
} from '@/features/nutrition/nutritionFoodLibrary';

export const isNutritionLibraryEntity = (entityType: string): boolean =>
  entityType === 'nutritionLibraryItems' || entityType === 'nutrition_library_items';

export const isNutritionLibraryQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isNutritionLibraryEntity(operation.entityType);

const toPayload = (item: NutritionLibraryFood): Record<string, unknown> => ({
  schemaVersion: 1,
  libraryId: item.libraryId,
  kind: item.kind,
  name: item.name,
  ...(item.brandName?.trim() ? { brandName: item.brandName.trim() } : {}),
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fats: item.fats,
  servingSize: item.servingSize,
  servingUnit: item.servingUnit,
  quantity: item.quantity,
  source: item.source,
  ...(item.externalId?.trim() ? { externalId: item.externalId.trim() } : {}),
  ...(item.attribution ? { attribution: item.attribution } : {}),
  savedAt: item.savedAt,
  updatedAt: item.updatedAt,
  revision: item.revision,
});

export const createNutritionLibraryQueueOperation = (input: {
  item: NutritionLibraryFood;
  userId: string;
  deviceId: string;
}): OfflineSyncQueueOperation => {
  const action = input.item.deletedAt ? 'delete' : input.item.revision <= 1 ? 'create' : 'update';
  const baseRevisionNumber = Math.max(0, input.item.revision - 1);
  const baseRevision = {
    id: `rev-${baseRevisionNumber}`,
    number: baseRevisionNumber,
    createdAt: input.item.updatedAt,
  };
  const payload = action === 'delete'
    ? { libraryId: input.item.libraryId, deletedAt: input.item.deletedAt }
    : toPayload(input.item);
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'nutritionLibraryItems',
    entityId: input.item.libraryId,
    action,
    clientTimestamp: input.item.updatedAt,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `nutritionLibraryItems:${input.item.libraryId}`,
    entityType: 'nutritionLibraryItems',
    entityId: input.item.libraryId,
    action,
    payload,
    baseRevision,
    clientTimestamp: input.item.updatedAt,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'nutritionLibraryItems',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      requestId: idempotencyKey,
    },
  };
};

export const planNutritionLibrarySyncOperations = (input: {
  records: NutritionLibraryFood[];
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
}): OfflineSyncQueueOperation[] => {
  const pendingIds = new Set(
    input.pendingOperations
      .filter(isNutritionLibraryQueueOperation)
      .map((operation) => operation.entityId),
  );
  return input.records
    .filter((record) => record.revision > 0 && !pendingIds.has(record.libraryId))
    .map((record) => createNutritionLibraryQueueOperation({
      item: record,
      userId: input.userId,
      deviceId: input.deviceId,
    }));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseRemoteItem = (entity: {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
  revision?: number;
  appliedAt?: string | null;
}): NutritionLibraryFood | null => {
  const payload = isRecord(entity.payload) ? entity.payload : null;
  if (!payload || payload.schemaVersion !== 1) return null;
  const libraryId = typeof payload.libraryId === 'string' ? payload.libraryId : entity.entityId;
  if (!libraryId || typeof payload.name !== 'string') return null;
  if (payload.kind !== 'custom' && payload.kind !== 'provider-favorite') return null;
  const numericFields = ['calories', 'protein', 'carbs', 'fats', 'servingSize'] as const;
  if (numericFields.some((field) => typeof payload[field] !== 'number' || !Number.isFinite(payload[field]))) {
    return null;
  }
  if (
    typeof payload.servingUnit !== 'string' ||
    typeof payload.quantity !== 'string' ||
    typeof payload.source !== 'string' ||
    typeof payload.savedAt !== 'string' ||
    typeof payload.updatedAt !== 'string'
  ) return null;

  return {
    libraryId,
    kind: payload.kind,
    name: payload.name,
    ...(typeof payload.brandName === 'string' ? { brandName: payload.brandName } : {}),
    calories: payload.calories as number,
    protein: payload.protein as number,
    carbs: payload.carbs as number,
    fats: payload.fats as number,
    servingSize: payload.servingSize as number,
    servingUnit: payload.servingUnit,
    quantity: payload.quantity,
    source: payload.source,
    ...(typeof payload.externalId === 'string' ? { externalId: payload.externalId } : {}),
    ...(isRecord(payload.attribution) ? { attribution: payload.attribution as NutritionLibraryFood['attribution'] } : {}),
    savedAt: payload.savedAt,
    updatedAt: payload.updatedAt,
    revision: Math.max(0, Math.floor(entity.revision ?? Number(payload.revision) ?? 0)),
    deletedAt: null,
  };
};

const listeners = new Set<(userId: string) => void>();
export const subscribeNutritionLibrarySync = (listener: (userId: string) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = (userId: string) => listeners.forEach((listener) => listener(userId));

export const applyRemoteNutritionLibraryChanges = async (input: {
  userId: string;
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }>;
  deletedEntities: Array<{
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }>;
}): Promise<{ appliedRecordIds: string[]; deletedRecordIds: string[] }> => {
  const key = getNutritionFoodLibraryStorageKey(input.userId);
  const current = parseNutritionFoodLibrary(await AsyncStorage.getItem(key));
  const records = new Map(current.map((item) => [item.libraryId, item]));
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of input.changedEntities.filter((item) => isNutritionLibraryEntity(item.entityType))) {
    const item = parseRemoteItem(entity);
    if (!item) continue;
    records.set(item.libraryId, item);
    appliedRecordIds.push(item.libraryId);
  }
  for (const entity of input.deletedEntities.filter((item) => isNutritionLibraryEntity(item.entityType))) {
    const libraryId = entity.entityId?.trim();
    if (!libraryId) continue;
    const previous = records.get(libraryId);
    if (previous) {
      records.set(libraryId, {
        ...previous,
        revision: Math.max(previous.revision, entity.revision ?? previous.revision),
        updatedAt: entity.appliedAt ?? previous.updatedAt,
        deletedAt: entity.appliedAt ?? new Date().toISOString(),
      });
    }
    deletedRecordIds.push(libraryId);
  }

  if (appliedRecordIds.length || deletedRecordIds.length) {
    await AsyncStorage.setItem(key, serializeNutritionFoodLibrary([...records.values()]));
    notify(input.userId);
  }
  return { appliedRecordIds, deletedRecordIds };
};
