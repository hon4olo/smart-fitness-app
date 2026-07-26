import AsyncStorage from '@react-native-async-storage/async-storage';

import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  getNutritionFoodLibraryStorageKey,
  getNutritionLibraryId,
  getNutritionLibrarySyncEntityId,
  parseNutritionFoodLibrary,
  serializeNutritionFoodLibrary,
  type NutritionLibraryFood,
} from '@/features/nutrition/nutritionFoodLibrary';

const FOOD_SOURCES: readonly NutritionLibraryFood['source'][] = [
  'local',
  'fatsecret',
  'openfoodfacts',
  'custom',
  'manual',
  'usda',
];

const getSyncedRevision = (item: NutritionLibraryFood): number =>
  typeof item.syncedRevision === 'number' && Number.isFinite(item.syncedRevision)
    ? Math.max(0, Math.floor(item.syncedRevision))
    : Math.max(0, Math.floor(item.revision) - 1);

export const isNutritionLibraryEntity = (entityType: string): boolean =>
  entityType === 'nutritionLibraryItems' || entityType === 'nutrition_library_items';

export const isNutritionLibraryQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isNutritionLibraryEntity(operation.entityType);

const toPayload = (
  item: NutritionLibraryFood,
  syncEntityId: string,
): Record<string, unknown> => ({
  schemaVersion: 1,
  libraryId: syncEntityId,
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
  const syncedRevision = getSyncedRevision(input.item);
  const syncEntityId = getNutritionLibrarySyncEntityId(input.item.libraryId);
  const action = input.item.deletedAt ? 'delete' : syncedRevision === 0 ? 'create' : 'update';
  const baseRevision = {
    id: `rev-${syncedRevision}`,
    number: syncedRevision,
    createdAt: input.item.updatedAt,
  };
  const payload = action === 'delete'
    ? { libraryId: syncEntityId, deletedAt: input.item.deletedAt }
    : toPayload(input.item, syncEntityId);
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'nutritionLibraryItems',
    entityId: syncEntityId,
    action,
    clientTimestamp: input.item.updatedAt,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `nutritionLibraryItems:${syncEntityId}`,
    entityType: 'nutritionLibraryItems',
    entityId: syncEntityId,
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
      clientId: input.item.libraryId,
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
      .map((operation) => operation.metadata?.clientId ?? operation.entityId),
  );
  return input.records
    .filter(
      (record) => record.revision > getSyncedRevision(record) && !pendingIds.has(record.libraryId),
    )
    .map((record) => createNutritionLibraryQueueOperation({
      item: record,
      userId: input.userId,
      deviceId: input.deviceId,
    }));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFoodSource = (value: unknown): value is NutritionLibraryFood['source'] =>
  typeof value === 'string' && FOOD_SOURCES.includes(value as NutritionLibraryFood['source']);

const parseRemoteItem = (entity: {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
  revision?: number;
  appliedAt?: string | null;
}): NutritionLibraryFood | null => {
  const payload = isRecord(entity.payload) ? entity.payload : null;
  if (!payload || payload.schemaVersion !== 1 || typeof payload.name !== 'string') return null;
  if (payload.kind !== 'custom' && payload.kind !== 'provider-favorite') return null;
  const numericFields = ['calories', 'protein', 'carbs', 'fats', 'servingSize'] as const;
  if (numericFields.some((field) => typeof payload[field] !== 'number' || !Number.isFinite(payload[field]))) {
    return null;
  }
  if (
    typeof payload.servingUnit !== 'string' ||
    typeof payload.quantity !== 'string' ||
    !isFoodSource(payload.source) ||
    typeof payload.savedAt !== 'string' ||
    typeof payload.updatedAt !== 'string'
  ) return null;

  const revision = Math.max(0, Math.floor(entity.revision ?? Number(payload.revision) ?? 0));
  const libraryId = getNutritionLibraryId({
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
    ...(isRecord(payload.attribution)
      ? { attribution: payload.attribution as NutritionLibraryFood['attribution'] }
      : {}),
  });
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
    revision,
    syncedRevision: revision,
    deletedAt: null,
  };
};

const listeners = new Set<(userId: string) => void>();
export const subscribeNutritionLibrarySync = (listener: (userId: string) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = (userId: string) => listeners.forEach((listener) => listener(userId));

export const acknowledgeNutritionLibraryOperations = async (input: {
  userId: string;
  appliedOperations: Array<{
    entityId: string;
    entityType: string;
    revision?: number;
  }>;
}): Promise<string[]> => {
  const acknowledged = input.appliedOperations.filter((operation) =>
    isNutritionLibraryEntity(operation.entityType),
  );
  if (!acknowledged.length) return [];

  const key = getNutritionFoodLibraryStorageKey(input.userId);
  const current = parseNutritionFoodLibrary(await AsyncStorage.getItem(key));
  const revisions = new Map(
    acknowledged.map((operation) => [
      operation.entityId,
      Math.max(0, Math.floor(operation.revision ?? 0)),
    ]),
  );
  let changed = false;
  const next = current.map((item) => {
    const revision =
      revisions.get(item.libraryId) ??
      revisions.get(getNutritionLibrarySyncEntityId(item.libraryId));
    const syncedRevision = getSyncedRevision(item);
    if (revision === undefined || revision <= syncedRevision) return item;
    changed = true;
    return {
      ...item,
      syncedRevision: Math.min(item.revision, revision),
    };
  });
  if (changed) {
    await AsyncStorage.setItem(key, serializeNutritionFoodLibrary(next));
    notify(input.userId);
  }
  return [...revisions.keys()];
};

const resolveExistingLibraryId = (
  records: Map<string, NutritionLibraryFood>,
  remoteEntityId: string | undefined,
): string | undefined => {
  if (!remoteEntityId) return undefined;
  if (records.has(remoteEntityId)) return remoteEntityId;
  return [...records.keys()].find(
    (candidate) => getNutritionLibrarySyncEntityId(candidate) === remoteEntityId,
  );
};

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
    const parsedItem = parseRemoteItem(entity);
    if (!parsedItem) continue;
    const existingLibraryId = resolveExistingLibraryId(records, entity.entityId?.trim());
    const item = existingLibraryId
      ? { ...parsedItem, libraryId: existingLibraryId }
      : parsedItem;
    const previous = records.get(item.libraryId);
    if (previous && previous.revision > item.revision) continue;
    records.set(item.libraryId, item);
    appliedRecordIds.push(item.libraryId);
  }
  for (const entity of input.deletedEntities.filter((item) => isNutritionLibraryEntity(item.entityType))) {
    const libraryId = resolveExistingLibraryId(records, entity.entityId?.trim());
    if (!libraryId) continue;
    const previous = records.get(libraryId);
    const remoteRevision = Math.max(0, Math.floor(entity.revision ?? 0));
    if (previous && previous.revision > remoteRevision) continue;
    if (previous) {
      records.set(libraryId, {
        ...previous,
        revision: Math.max(previous.revision, remoteRevision),
        syncedRevision: Math.max(getSyncedRevision(previous), remoteRevision),
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
