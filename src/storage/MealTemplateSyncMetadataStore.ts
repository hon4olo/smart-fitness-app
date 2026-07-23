import { isUuid } from '@/lib/ids';
import type { FoodAttribution, FoodEntry, MealType } from '@/types';

import type { StorageAdapter } from './StorageAdapter';

export const MEAL_TEMPLATE_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_meal_template_sync_metadata';

export type MealTemplateItemSyncSnapshot = {
  id: string;
  name: string;
  date: string;
  mealType: MealType;
  brandName: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  baseCalories: number | null;
  baseProtein: number | null;
  baseCarbs: number | null;
  baseFats: number | null;
  source: FoodEntry['source'];
  externalId: string | null;
  attribution: FoodAttribution | null;
  servingSize: number | null;
  servingUnit: string | null;
  quantity: number | null;
  createdAt: string;
};

export type MealTemplateSyncSnapshot = {
  name: string;
  items: MealTemplateItemSyncSnapshot[];
};

export type MealTemplateSyncMetadata = {
  id: string;
  userId: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  snapshot: MealTemplateSyncSnapshot;
  deletedAt?: string | null;
};

export type MealTemplateSyncMetadataStore = {
  load(): Promise<Map<string, MealTemplateSyncMetadata>>;
  get(id: string): Promise<MealTemplateSyncMetadata | null>;
  set(record: MealTemplateSyncMetadata): Promise<Map<string, MealTemplateSyncMetadata>>;
  clear(): Promise<void>;
};

const MEAL_TYPES = new Set<MealType>(['breakfast', 'lunch', 'dinner', 'snack']);
const FOOD_SOURCES = new Set<FoodEntry['source']>([
  'manual',
  'local',
  'fatsecret',
  'openfoodfacts',
  'custom',
  'usda',
]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  return value.trim() || null;
};

const readNullableNumber = (
  value: unknown,
  positive = false,
): number | null | undefined => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (positive ? value <= 0 : value < 0) return undefined;
  return value;
};

const readAttribution = (value: unknown): FoodAttribution | null | undefined => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const provider = typeof value.provider === 'string' ? value.provider.trim() : '';
  const text = typeof value.text === 'string' ? value.text.trim() : '';
  const url = readNullableString(value.url);
  if (!provider || !text || url === undefined) return undefined;
  return { provider, text, ...(url ? { url } : {}) };
};

const readItem = (value: unknown): MealTemplateItemSyncSnapshot | null => {
  if (!isRecord(value)) return null;
  const brandName = readNullableString(value.brandName);
  const baseCalories = readNullableNumber(value.baseCalories);
  const baseProtein = readNullableNumber(value.baseProtein);
  const baseCarbs = readNullableNumber(value.baseCarbs);
  const baseFats = readNullableNumber(value.baseFats);
  const externalId = readNullableString(value.externalId);
  const attribution = readAttribution(value.attribution);
  const servingSize = readNullableNumber(value.servingSize, true);
  const servingUnit = readNullableString(value.servingUnit);
  const quantity = readNullableNumber(value.quantity, true);
  if (
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.date !== 'string' ||
    !DATE_PATTERN.test(value.date) ||
    typeof value.mealType !== 'string' ||
    !MEAL_TYPES.has(value.mealType as MealType) ||
    brandName === undefined ||
    typeof value.calories !== 'number' ||
    !Number.isSafeInteger(value.calories) ||
    value.calories < 0 ||
    typeof value.protein !== 'number' ||
    !Number.isFinite(value.protein) ||
    value.protein < 0 ||
    typeof value.carbs !== 'number' ||
    !Number.isFinite(value.carbs) ||
    value.carbs < 0 ||
    typeof value.fats !== 'number' ||
    !Number.isFinite(value.fats) ||
    value.fats < 0 ||
    baseCalories === undefined ||
    baseProtein === undefined ||
    baseCarbs === undefined ||
    baseFats === undefined ||
    typeof value.source !== 'string' ||
    !FOOD_SOURCES.has(value.source as FoodEntry['source']) ||
    externalId === undefined ||
    attribution === undefined ||
    servingSize === undefined ||
    servingUnit === undefined ||
    quantity === undefined ||
    !isTimestamp(value.createdAt)
  ) {
    return null;
  }

  return {
    id: value.id.toLowerCase(),
    name: value.name.trim(),
    date: value.date,
    mealType: value.mealType as MealType,
    brandName,
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fats: value.fats,
    baseCalories,
    baseProtein,
    baseCarbs,
    baseFats,
    source: value.source as FoodEntry['source'],
    externalId,
    attribution,
    servingSize,
    servingUnit,
    quantity,
    createdAt: new Date(value.createdAt).toISOString(),
  };
};

const readSnapshot = (value: unknown): MealTemplateSyncSnapshot | null => {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !Array.isArray(value.items) ||
    value.items.length === 0
  ) {
    return null;
  }
  const items = value.items.map(readItem);
  if (items.some((item) => !item)) return null;
  const itemIds = new Set((items as MealTemplateItemSyncSnapshot[]).map((item) => item.id));
  if (itemIds.size !== items.length) return null;
  return { name: value.name.trim(), items: items as MealTemplateItemSyncSnapshot[] };
};

const normalize = (value: unknown): MealTemplateSyncMetadata | null => {
  const snapshot = isRecord(value) ? readSnapshot(value.snapshot) : null;
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    typeof value.userId !== 'string' ||
    !value.userId.trim() ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.syncedAt) ||
    !snapshot ||
    (value.deletedAt !== undefined && value.deletedAt !== null && !isTimestamp(value.deletedAt))
  ) {
    return null;
  }
  return {
    id: value.id.toLowerCase(),
    userId: value.userId.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    createdAt: new Date(value.createdAt).toISOString(),
    syncedAt: new Date(value.syncedAt).toISOString(),
    snapshot,
    ...(typeof value.deletedAt === 'string'
      ? { deletedAt: new Date(value.deletedAt).toISOString() }
      : value.deletedAt === null
        ? { deletedAt: null }
        : {}),
  };
};

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, MealTemplateSyncMetadata>> => {
  const raw = await storage.read(MEAL_TEMPLATE_SYNC_METADATA_STORAGE_KEY);
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.records)
        ? parsed.records
        : [];
    const records = values
      .map(normalize)
      .filter((record): record is MealTemplateSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [`${record.userId}:${record.id}`, record]));
  } catch {
    return new Map();
  }
};

export const createMealTemplateSyncMetadataStore = (
  storage: StorageAdapter,
): MealTemplateSyncMetadataStore => {
  const persist = async (
    records: Map<string, MealTemplateSyncMetadata>,
  ): Promise<Map<string, MealTemplateSyncMetadata>> => {
    await storage.write(
      MEAL_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        records: [...records.values()],
      }),
    );
    return records;
  };

  return {
    load: () => parse(storage),
    async get(id) {
      const records = await parse(storage);
      return [...records.values()].find((record) => record.id === id) ?? null;
    },
    async set(record) {
      const records = await parse(storage);
      records.set(`${record.userId}:${record.id}`, record);
      return persist(records);
    },
    async clear() {
      await storage.remove(MEAL_TEMPLATE_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
