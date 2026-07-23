import { isUuid } from '@/lib/ids';
import type { MealTemplateSyncMetadata } from '@/storage';
import type { AppState, FoodAttribution, FoodEntry, MealTemplate, MealType } from '@/types';

import {
  getMealTemplateEntityId,
  isMealTemplateEntity,
  toMealTemplateSyncSnapshot,
} from './MealTemplateSync';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MEAL_TYPES = new Set<MealType>(['breakfast', 'lunch', 'dinner', 'snack']);
const FOOD_SOURCES = new Set<FoodEntry['source']>([
  'manual',
  'local',
  'fatsecret',
  'openfoodfacts',
  'custom',
  'usda',
]);
const TEMPLATE_KEYS = new Set([
  'schemaVersion',
  'id',
  'name',
  'items',
  'createdAt',
  'updatedAt',
]);
const ITEM_KEYS = new Set([
  'id',
  'name',
  'date',
  'mealType',
  'brandName',
  'calories',
  'protein',
  'carbs',
  'fats',
  'baseCalories',
  'baseProtein',
  'baseCarbs',
  'baseFats',
  'source',
  'externalId',
  'attribution',
  'servingSize',
  'servingUnit',
  'quantity',
  'createdAt',
]);
const ATTRIBUTION_KEYS = new Set(['provider', 'text', 'url']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, keys: Set<string>): boolean =>
  Object.keys(value).every((key) => keys.has(key));

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const isDateOnly = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim();
};

const readOptionalNumber = (
  value: unknown,
  positive = false,
): number | null | undefined => {
  if (value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (positive ? value <= 0 : value < 0) return undefined;
  return value;
};

const readAttribution = (value: unknown): FoodAttribution | null | undefined => {
  if (value === undefined) return null;
  if (!isRecord(value) || !hasOnlyKeys(value, ATTRIBUTION_KEYS)) return undefined;
  const provider = typeof value.provider === 'string' ? value.provider.trim() : '';
  const text = typeof value.text === 'string' ? value.text.trim() : '';
  const url = readNullableString(value.url);
  if (!provider || !text || url === undefined) return undefined;
  return { provider, text, ...(url ? { url } : {}) };
};

const readItem = (value: unknown): FoodEntry | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, ITEM_KEYS)) return null;
  const brandName = readNullableString(value.brandName);
  const baseCalories = readOptionalNumber(value.baseCalories);
  const baseProtein = readOptionalNumber(value.baseProtein);
  const baseCarbs = readOptionalNumber(value.baseCarbs);
  const baseFats = readOptionalNumber(value.baseFats);
  const externalId = readNullableString(value.externalId);
  const attribution = readAttribution(value.attribution);
  const servingSize = readOptionalNumber(value.servingSize, true);
  const servingUnit = readNullableString(value.servingUnit);
  const quantity = readOptionalNumber(value.quantity, true);
  if (
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !isDateOnly(value.date) ||
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
    ...(brandName ? { brandName } : {}),
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fats: value.fats,
    ...(baseCalories === null ? {} : { baseCalories }),
    ...(baseProtein === null ? {} : { baseProtein }),
    ...(baseCarbs === null ? {} : { baseCarbs }),
    ...(baseFats === null ? {} : { baseFats }),
    source: value.source as FoodEntry['source'],
    ...(externalId ? { externalId } : {}),
    ...(attribution ? { attribution } : {}),
    ...(servingSize === null ? {} : { servingSize }),
    ...(servingUnit ? { servingUnit } : {}),
    ...(quantity === null ? {} : { quantity }),
    createdAt: new Date(value.createdAt).toISOString(),
  };
};

const readRemoteTemplate = (payload: Record<string, unknown>): MealTemplate | null => {
  if (
    !hasOnlyKeys(payload, TEMPLATE_KEYS) ||
    payload.schemaVersion !== 1 ||
    typeof payload.id !== 'string' ||
    !isUuid(payload.id) ||
    typeof payload.name !== 'string' ||
    !payload.name.trim() ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0 ||
    payload.items.length > 200 ||
    !isTimestamp(payload.createdAt) ||
    (payload.updatedAt !== undefined && !isTimestamp(payload.updatedAt))
  ) {
    return null;
  }
  const items = payload.items.map(readItem);
  if (items.some((item) => !item)) return null;
  const itemIds = new Set((items as FoodEntry[]).map((item) => item.id));
  if (itemIds.size !== items.length) return null;
  return {
    id: payload.id.toLowerCase(),
    name: payload.name.trim(),
    items: items as FoodEntry[],
    createdAt: new Date(payload.createdAt).toISOString(),
  };
};

export type MealTemplateSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: MealTemplateSyncMetadata[];
};

const metadataKey = (userId: string, id: string): string => `${userId}:${id}`;

export const applyRemoteMealTemplateChanges = (
  state: AppState,
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    operationType?: string;
  }>,
  deletedEntities: Array<{
    id?: string;
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }>,
  userId: string,
  existingMetadata: Map<string, MealTemplateSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): MealTemplateSyncResult => {
  const metadata = new Map(existingMetadata);
  let mealTemplates = [...state.mealTemplates];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (!isMealTemplateEntity(entity.entityType) || entity.operationType === 'delete') {
      continue;
    }
    const payload = isRecord(entity.payload) ? entity.payload : null;
    const template = payload ? readRemoteTemplate(payload) : null;
    const entityId = entity.entityId ?? template?.id ?? '';
    if (!template || template.id !== entityId) continue;

    mealTemplates = [
      template,
      ...mealTemplates.filter(
        (item) => getMealTemplateEntityId(item.id) !== template.id,
      ),
    ];
    appliedRecordIds.push(template.id);
    metadata.set(metadataKey(userId, template.id), {
      id: template.id,
      userId,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId: 'unknown',
      createdAt: template.createdAt,
      syncedAt,
      snapshot: toMealTemplateSyncSnapshot(template),
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isMealTemplateEntity(deleted.entityType)) continue;
    const id = deleted.entityId ?? deleted.id;
    if (!id || !isUuid(id)) continue;
    const normalizedId = id.toLowerCase();
    mealTemplates = mealTemplates.filter(
      (item) => getMealTemplateEntityId(item.id) !== normalizedId,
    );
    deletedRecordIds.push(normalizedId);
    const key = metadataKey(userId, normalizedId);
    const previous = metadata.get(key);
    if (previous) {
      metadata.set(key, {
        ...previous,
        revision:
          typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
            ? Math.max(0, Math.floor(deleted.revision))
            : previous.revision,
        syncedAt,
        deletedAt: deleted.appliedAt ?? syncedAt,
      });
    }
  }

  return {
    nextState: { ...state, mealTemplates },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
