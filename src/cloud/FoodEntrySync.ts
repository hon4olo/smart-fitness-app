import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { ensureUuid, isUuid } from '@/lib/ids';
import type { AppState, FoodAttribution, FoodEntry, MealType, NutritionState } from '@/types';
import type { FoodEntrySyncMetadata } from '@/storage/FoodEntrySyncMetadataStore';

const FOOD_ENTRY_SCHEMA_VERSION = 1 as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const FOOD_SOURCES: readonly FoodEntry['source'][] = [
  'manual',
  'local',
  'fatsecret',
  'openfoodfacts',
  'custom',
  'usda',
];

let foodEntryOutboxSuppressionDepth = 0;

export type FoodEntryRemoteRecord = FoodEntry & {
  consumedAt: string;
  revision: number;
  deviceId: string | null;
  deletedAt: string | null;
};

export type FoodEntrySyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: FoodEntrySyncMetadata[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidTimestamp = (value: string): boolean =>
  Number.isFinite(new Date(value).getTime());

const toFiniteNonnegative = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeDate = (date: unknown, fallbackTimestamp: string): string => {
  if (typeof date === 'string' && DATE_PATTERN.test(date)) {
    const parsed = new Date(`${date}T12:00:00.000Z`);
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
      return date;
    }
  }

  const fallback = new Date(fallbackTimestamp);
  return Number.isFinite(fallback.getTime())
    ? fallback.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
};

const normalizeTimestamp = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && isValidTimestamp(value)) {
    return new Date(value).toISOString();
  }
  return new Date(fallback).toISOString();
};

const toConsumedAt = (date: string): string => `${date}T12:00:00.000Z`;

const isMealType = (value: unknown): value is MealType =>
  typeof value === 'string' && MEAL_TYPES.includes(value as MealType);

const isFoodSource = (value: unknown): value is FoodEntry['source'] =>
  typeof value === 'string' && FOOD_SOURCES.includes(value as FoodEntry['source']);

const normalizeAttribution = (value: unknown): FoodAttribution | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const provider = typeof value.provider === 'string' ? value.provider.trim() : '';
  const text = typeof value.text === 'string' ? value.text.trim() : '';
  const url = typeof value.url === 'string' ? value.url.trim() : '';
  if (!provider || !text) {
    return undefined;
  }

  return {
    provider,
    text,
    ...(url ? { url } : {}),
  };
};

export const isFoodEntryEntity = (entityType: string): boolean =>
  entityType === 'foodEntries' || entityType === 'food_entries';

export const isFoodEntryQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isFoodEntryEntity(operation.entityType);

export const normalizeFoodEntryForSync = (entry: FoodEntry): FoodEntry => {
  const createdAt = normalizeTimestamp(entry.createdAt, new Date().toISOString());
  const date = normalizeDate(entry.date, createdAt);

  return {
    ...entry,
    id: ensureUuid(entry.id),
    name: entry.name.trim() || 'Food entry',
    date,
    mealType: isMealType(entry.mealType) ? entry.mealType : 'breakfast',
    calories: Math.max(0, Math.round(Number(entry.calories) || 0)),
    protein: Math.max(0, Number(entry.protein) || 0),
    carbs: Math.max(0, Number(entry.carbs) || 0),
    fats: Math.max(0, Number(entry.fats) || 0),
    source: isFoodSource(entry.source) ? entry.source : 'manual',
    createdAt,
  };
};

export const createFoodEntryQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  entry: FoodEntry;
  deviceId: string;
  baseRevision: number;
  actorId?: string;
  now?: string;
  previous?: FoodEntrySyncMetadata | null;
}): OfflineSyncQueueOperation => {
  const now = normalizeTimestamp(input.now, new Date().toISOString());
  const entry = normalizeFoodEntryForSync(input.entry);
  const baseRevision = {
    id: input.previous ? `rev-${input.previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: input.previous?.syncedAt ?? now,
  };
  const payload = input.action === 'delete'
    ? {
        id: entry.id,
        consumedAt: toConsumedAt(entry.date),
        deletedAt: now,
        deviceId: input.deviceId,
      }
    : {
        schemaVersion: FOOD_ENTRY_SCHEMA_VERSION,
        id: entry.id,
        name: entry.name,
        date: entry.date,
        consumedAt: toConsumedAt(entry.date),
        mealType: entry.mealType,
        ...(entry.brandName?.trim() ? { brandName: entry.brandName.trim() } : {}),
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fats: entry.fats,
        ...(entry.baseCalories === undefined ? {} : { baseCalories: Math.max(0, entry.baseCalories) }),
        ...(entry.baseProtein === undefined ? {} : { baseProtein: Math.max(0, entry.baseProtein) }),
        ...(entry.baseCarbs === undefined ? {} : { baseCarbs: Math.max(0, entry.baseCarbs) }),
        ...(entry.baseFats === undefined ? {} : { baseFats: Math.max(0, entry.baseFats) }),
        source: entry.source,
        ...(entry.externalId?.trim() ? { externalId: entry.externalId.trim() } : {}),
        ...(entry.attribution ? { attribution: { ...entry.attribution } } : {}),
        ...(toPositiveNumber(entry.servingSize) === undefined ? {} : { servingSize: toPositiveNumber(entry.servingSize) }),
        ...(entry.servingUnit?.trim() ? { servingUnit: entry.servingUnit.trim() } : {}),
        ...(toPositiveNumber(entry.quantity) === undefined ? {} : { quantity: toPositiveNumber(entry.quantity) }),
        createdAt: entry.createdAt,
        updatedAt: now,
        deviceId: input.deviceId,
      };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'foodEntries',
    entityId: entry.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.actorId,
    baseRevision,
    payload,
  });

  return {
    opId: `foodEntries:${entry.id}`,
    entityType: 'foodEntries',
    entityId: entry.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.actorId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'foodEntries',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.actorId,
      lastSyncedAt: input.previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

const parseRemoteFoodEntry = (entity: {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
}): { entry: FoodEntry; consumedAt: string; deviceId: string | null } | null => {
  const payload = isRecord(entity.payload) ? entity.payload : null;
  if (!payload || payload.schemaVersion !== FOOD_ENTRY_SCHEMA_VERSION) {
    return null;
  }

  const rawId = typeof payload.id === 'string' ? payload.id : entity.entityId ?? '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const date = typeof payload.date === 'string' ? payload.date : '';
  const consumedAt = typeof payload.consumedAt === 'string' ? payload.consumedAt : '';
  const createdAt = typeof payload.createdAt === 'string' ? payload.createdAt : '';
  const calories = toFiniteNonnegative(payload.calories);
  const protein = toFiniteNonnegative(payload.protein);
  const carbs = toFiniteNonnegative(payload.carbs);
  const fats = toFiniteNonnegative(payload.fats);

  if (
    !isUuid(rawId) ||
    !name ||
    !DATE_PATTERN.test(date) ||
    !isValidTimestamp(consumedAt) ||
    consumedAt.slice(0, 10) !== date ||
    !isValidTimestamp(createdAt) ||
    !isMealType(payload.mealType) ||
    !isFoodSource(payload.source) ||
    calories === null ||
    !Number.isInteger(calories) ||
    protein === null ||
    carbs === null ||
    fats === null
  ) {
    return null;
  }

  const entry: FoodEntry = {
    id: rawId.toLowerCase(),
    name,
    date,
    mealType: payload.mealType,
    calories,
    protein,
    carbs,
    fats,
    source: payload.source,
    createdAt: new Date(createdAt).toISOString(),
  };

  if (typeof payload.brandName === 'string' && payload.brandName.trim()) {
    entry.brandName = payload.brandName.trim();
  }
  if (typeof payload.externalId === 'string' && payload.externalId.trim()) {
    entry.externalId = payload.externalId.trim();
  }
  const attribution = normalizeAttribution(payload.attribution);
  if (attribution) {
    entry.attribution = attribution;
  }

  const numericOptionalFields: Array<
    ['baseCalories' | 'baseProtein' | 'baseCarbs' | 'baseFats' | 'servingSize' | 'quantity', unknown]
  > = [
    ['baseCalories', payload.baseCalories],
    ['baseProtein', payload.baseProtein],
    ['baseCarbs', payload.baseCarbs],
    ['baseFats', payload.baseFats],
    ['servingSize', payload.servingSize],
    ['quantity', payload.quantity],
  ];
  for (const [field, rawValue] of numericOptionalFields) {
    if (rawValue === undefined) {
      continue;
    }
    const parsed = field === 'servingSize' || field === 'quantity'
      ? toPositiveNumber(rawValue)
      : toFiniteNonnegative(rawValue) ?? undefined;
    if (parsed === undefined) {
      return null;
    }
    entry[field] = parsed;
  }
  if (typeof payload.servingUnit === 'string' && payload.servingUnit.trim()) {
    entry.servingUnit = payload.servingUnit.trim();
  }

  return {
    entry,
    consumedAt: new Date(consumedAt).toISOString(),
    deviceId: typeof payload.deviceId === 'string' && payload.deviceId.trim()
      ? payload.deviceId.trim()
      : null,
  };
};

const calculateNutrition = (entries: FoodEntry[]): NutritionState =>
  entries.reduce<NutritionState>(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

export const applyRemoteFoodEntryChanges = (
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
  }> = [],
  existingMetadata: Map<string, FoodEntrySyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): FoodEntrySyncResult => {
  const metadata = new Map(existingMetadata);
  let entries = [...state.foodEntries];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  const upsertEntry = (entry: FoodEntry) => {
    const index = entries.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries = [entry, ...entries];
    }
  };

  const removeEntry = (id: string) => {
    entries = entries.filter((entry) => entry.id !== id);
  };

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (!isFoodEntryEntity(entity.entityType) || entity.operationType === 'delete') {
      continue;
    }

    const parsed = parseRemoteFoodEntry(entity);
    if (!parsed) {
      continue;
    }

    upsertEntry(parsed.entry);
    appliedRecordIds.push(parsed.entry.id);
    metadata.set(parsed.entry.id, {
      id: parsed.entry.id,
      revision: typeof entity.revision === 'number' && Number.isFinite(entity.revision)
        ? Math.max(0, Math.floor(entity.revision))
        : 0,
      deviceId: parsed.deviceId ?? 'unknown',
      consumedAt: parsed.consumedAt,
      syncedAt,
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isFoodEntryEntity(deleted.entityType)) {
      continue;
    }

    const rawId = deleted.entityId ?? deleted.id;
    if (!isUuid(rawId)) {
      continue;
    }

    const id = rawId.toLowerCase();
    removeEntry(id);
    deletedRecordIds.push(id);
    metadata.set(id, {
      id,
      revision: typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
        ? Math.max(0, Math.floor(deleted.revision))
        : 0,
      deviceId: 'unknown',
      consumedAt: syncedAt,
      syncedAt,
      deletedAt: deleted.appliedAt ?? syncedAt,
    });
  }

  entries.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return {
    nextState: {
      ...state,
      foodEntries: entries,
      nutrition: calculateNutrition(entries),
    },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};

export const isFoodEntryOutboxSuppressed = (): boolean =>
  foodEntryOutboxSuppressionDepth > 0;

export const runWithoutFoodEntryOutbox = <T>(operation: () => T): T => {
  foodEntryOutboxSuppressionDepth += 1;
  try {
    return operation();
  } finally {
    foodEntryOutboxSuppressionDepth -= 1;
  }
};