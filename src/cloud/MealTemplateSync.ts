import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { normalizeFoodEntryForSync } from './FoodEntrySync';
import { ensureUuid, isUuid } from '@/lib/ids';
import type {
  MealTemplateItemSyncSnapshot,
  MealTemplateSyncMetadata,
  MealTemplateSyncSnapshot,
} from '@/storage';
import type { FoodAttribution, FoodEntry, MealTemplate } from '@/types';

export const isMealTemplateEntity = (entityType: string): boolean =>
  entityType === 'mealTemplates' || entityType === 'meal_templates';

export const isMealTemplateQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isMealTemplateEntity(operation.entityType);

export const getMealTemplateEntityId = (templateId: string): string =>
  ensureUuid(templateId);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const normalizeNullableString = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

const normalizeNonnegative = (value: number | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;

const normalizePositive = (value: number | undefined): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;

const normalizeAttribution = (
  value: FoodAttribution | undefined,
): FoodAttribution | undefined => {
  const provider = value?.provider.trim();
  const text = value?.text.trim();
  const url = value?.url?.trim();
  if (!provider || !text) return undefined;
  return { provider, text, ...(url ? { url } : {}) };
};

const resolveItemId = (
  item: FoodEntry,
  templateId: string,
  index: number,
  usedIds: Set<string>,
): string => {
  const candidate = isUuid(item.id)
    ? item.id.toLowerCase()
    : ensureUuid(`${templateId}:item:${item.id || index}`);
  if (!usedIds.has(candidate)) {
    usedIds.add(candidate);
    return candidate;
  }
  const unique = ensureUuid(`${templateId}:item:${item.id || 'item'}:${index}`);
  usedIds.add(unique);
  return unique;
};

const normalizeTemplateItem = (
  item: FoodEntry,
  templateId: string,
  index: number,
  usedIds: Set<string>,
): FoodEntry => {
  const id = resolveItemId(item, templateId, index, usedIds);
  const normalized = normalizeFoodEntryForSync({ ...item, id });
  const brandName = normalizeNullableString(normalized.brandName);
  const externalId = normalizeNullableString(normalized.externalId);
  const servingUnit = normalizeNullableString(normalized.servingUnit);
  const attribution = normalizeAttribution(normalized.attribution);
  const baseCalories = normalizeNonnegative(normalized.baseCalories);
  const baseProtein = normalizeNonnegative(normalized.baseProtein);
  const baseCarbs = normalizeNonnegative(normalized.baseCarbs);
  const baseFats = normalizeNonnegative(normalized.baseFats);
  const servingSize = normalizePositive(normalized.servingSize);
  const quantity = normalizePositive(normalized.quantity);

  return {
    id,
    name: normalized.name,
    date: normalized.date,
    mealType: normalized.mealType,
    ...(brandName ? { brandName } : {}),
    calories: normalized.calories,
    protein: normalized.protein,
    carbs: normalized.carbs,
    fats: normalized.fats,
    ...(baseCalories === undefined ? {} : { baseCalories }),
    ...(baseProtein === undefined ? {} : { baseProtein }),
    ...(baseCarbs === undefined ? {} : { baseCarbs }),
    ...(baseFats === undefined ? {} : { baseFats }),
    source: normalized.source,
    ...(externalId ? { externalId } : {}),
    ...(attribution ? { attribution } : {}),
    ...(servingSize === undefined ? {} : { servingSize }),
    ...(servingUnit ? { servingUnit } : {}),
    ...(quantity === undefined ? {} : { quantity }),
    createdAt: normalized.createdAt,
  };
};

export const normalizeMealTemplateForSync = (
  template: MealTemplate,
  now = new Date().toISOString(),
): MealTemplate => {
  const id = getMealTemplateEntityId(template.id);
  const createdAt = isTimestamp(template.createdAt)
    ? new Date(template.createdAt).toISOString()
    : now;
  const usedIds = new Set<string>();
  return {
    id,
    name: template.name.trim(),
    items: template.items.map((item, index) =>
      normalizeTemplateItem(item, id, index, usedIds),
    ),
    createdAt,
  };
};

const toItemSnapshot = (item: FoodEntry): MealTemplateItemSyncSnapshot => ({
  id: item.id,
  name: item.name.trim(),
  date: item.date,
  mealType: item.mealType,
  brandName: item.brandName?.trim() || null,
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fats: item.fats,
  baseCalories: item.baseCalories ?? null,
  baseProtein: item.baseProtein ?? null,
  baseCarbs: item.baseCarbs ?? null,
  baseFats: item.baseFats ?? null,
  source: item.source,
  externalId: item.externalId?.trim() || null,
  attribution: normalizeAttribution(item.attribution) ?? null,
  servingSize: item.servingSize ?? null,
  servingUnit: item.servingUnit?.trim() || null,
  quantity: item.quantity ?? null,
  createdAt: item.createdAt,
});

export const toMealTemplateSyncSnapshot = (
  template: MealTemplate,
): MealTemplateSyncSnapshot => ({
  name: template.name.trim(),
  items: template.items.map(toItemSnapshot),
});

export const areMealTemplateSnapshotsEqual = (
  left: MealTemplateSyncSnapshot,
  right: MealTemplateSyncSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

const itemFromSnapshot = (item: MealTemplateItemSyncSnapshot): FoodEntry => ({
  id: item.id,
  name: item.name,
  date: item.date,
  mealType: item.mealType,
  ...(item.brandName ? { brandName: item.brandName } : {}),
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fats: item.fats,
  ...(item.baseCalories === null ? {} : { baseCalories: item.baseCalories }),
  ...(item.baseProtein === null ? {} : { baseProtein: item.baseProtein }),
  ...(item.baseCarbs === null ? {} : { baseCarbs: item.baseCarbs }),
  ...(item.baseFats === null ? {} : { baseFats: item.baseFats }),
  source: item.source,
  ...(item.externalId ? { externalId: item.externalId } : {}),
  ...(item.attribution ? { attribution: { ...item.attribution } } : {}),
  ...(item.servingSize === null ? {} : { servingSize: item.servingSize }),
  ...(item.servingUnit ? { servingUnit: item.servingUnit } : {}),
  ...(item.quantity === null ? {} : { quantity: item.quantity }),
  createdAt: item.createdAt,
});

export const mealTemplateFromMetadata = (
  metadata: MealTemplateSyncMetadata,
): MealTemplate => ({
  id: metadata.id,
  name: metadata.snapshot.name,
  items: metadata.snapshot.items.map(itemFromSnapshot),
  createdAt: metadata.createdAt,
});

const toItemPayload = (item: MealTemplateItemSyncSnapshot): Record<string, unknown> => ({
  id: item.id,
  name: item.name,
  date: item.date,
  mealType: item.mealType,
  ...(item.brandName ? { brandName: item.brandName } : {}),
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fats: item.fats,
  ...(item.baseCalories === null ? {} : { baseCalories: item.baseCalories }),
  ...(item.baseProtein === null ? {} : { baseProtein: item.baseProtein }),
  ...(item.baseCarbs === null ? {} : { baseCarbs: item.baseCarbs }),
  ...(item.baseFats === null ? {} : { baseFats: item.baseFats }),
  source: item.source,
  ...(item.externalId ? { externalId: item.externalId } : {}),
  ...(item.attribution ? { attribution: item.attribution } : {}),
  ...(item.servingSize === null ? {} : { servingSize: item.servingSize }),
  ...(item.servingUnit ? { servingUnit: item.servingUnit } : {}),
  ...(item.quantity === null ? {} : { quantity: item.quantity }),
  createdAt: item.createdAt,
});

export const createMealTemplateQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  template: MealTemplate;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: MealTemplateSyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const now = isTimestamp(input.now)
    ? new Date(input.now).toISOString()
    : new Date().toISOString();
  const template = normalizeMealTemplateForSync(input.template, now);
  const snapshot = toMealTemplateSyncSnapshot(template);
  const previous = input.previous?.userId === input.userId ? input.previous : null;
  const baseRevision = {
    id: previous ? `rev-${previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: previous?.syncedAt ?? now,
  };
  const createdAt = previous?.createdAt ?? template.createdAt;
  const payload =
    input.action === 'delete'
      ? { id: template.id, deletedAt: now }
      : {
          schemaVersion: 1,
          id: template.id,
          name: snapshot.name,
          items: snapshot.items.map(toItemPayload),
          createdAt,
          updatedAt: now,
        };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'mealTemplates',
    entityId: template.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `mealTemplates:${template.id}`,
    entityType: 'mealTemplates',
    entityId: template.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'mealTemplates',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};
