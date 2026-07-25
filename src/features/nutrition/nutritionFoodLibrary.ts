import type { DraftItem } from './addFoodModel';

export type NutritionLibraryFood = DraftItem & {
  libraryId: string;
  kind: 'custom' | 'provider-favorite';
  savedAt: string;
  updatedAt: string;
  revision: number;
  syncedRevision?: number;
  deletedAt: string | null;
};

const STORAGE_PREFIX = 'smart-fitness:nutrition-food-library:v1';

export const getNutritionFoodLibraryStorageKey = (ownerId: string | null): string =>
  `${STORAGE_PREFIX}:${ownerId ?? 'anonymous'}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeLibraryFood = (value: unknown): NutritionLibraryFood | null => {
  if (!isRecord(value)) return null;
  const item = value as Partial<NutritionLibraryFood>;
  if (
    typeof item.libraryId !== 'string' ||
    (item.kind !== 'custom' && item.kind !== 'provider-favorite') ||
    typeof item.savedAt !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.calories !== 'number' ||
    typeof item.protein !== 'number' ||
    typeof item.carbs !== 'number' ||
    typeof item.fats !== 'number' ||
    typeof item.servingSize !== 'number' ||
    typeof item.servingUnit !== 'string' ||
    typeof item.quantity !== 'string' ||
    typeof item.source !== 'string'
  ) {
    return null;
  }

  const revision =
    typeof item.revision === 'number' && Number.isFinite(item.revision)
      ? Math.max(0, Math.floor(item.revision))
      : 0;
  const syncedRevision =
    typeof item.syncedRevision === 'number' && Number.isFinite(item.syncedRevision)
      ? Math.min(revision, Math.max(0, Math.floor(item.syncedRevision)))
      : 0;

  return {
    ...(item as NutritionLibraryFood),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : item.savedAt,
    revision,
    syncedRevision,
    deletedAt: typeof item.deletedAt === 'string' ? item.deletedAt : null,
  };
};

export const parseNutritionFoodLibrary = (raw: string | null): NutritionLibraryFood[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .map(normalizeLibraryFood)
      .filter((item): item is NutritionLibraryFood => Boolean(item))
      .filter((item) => {
        if (seen.has(item.libraryId)) return false;
        seen.add(item.libraryId);
        return true;
      });
  } catch {
    return [];
  }
};

export const serializeNutritionFoodLibrary = (items: NutritionLibraryFood[]): string =>
  JSON.stringify(items);

export const getNutritionLibraryId = (draft: DraftItem): string =>
  draft.externalId
    ? `${draft.source}:${draft.externalId}`
    : `custom:${draft.name.trim().toLowerCase()}:${draft.brandName?.trim().toLowerCase() ?? ''}`;

export const getActiveNutritionLibraryFoods = (
  items: NutritionLibraryFood[],
): NutritionLibraryFood[] => items.filter((item) => item.deletedAt === null);

export const upsertNutritionLibraryFood = (
  items: NutritionLibraryFood[],
  draft: DraftItem,
  kind: NutritionLibraryFood['kind'],
  updatedAt: string,
): NutritionLibraryFood[] => {
  const libraryId = getNutritionLibraryId(draft);
  const previous = items.find((item) => item.libraryId === libraryId);
  const next: NutritionLibraryFood = {
    ...draft,
    libraryId,
    kind,
    savedAt: previous?.savedAt ?? updatedAt,
    updatedAt,
    revision: (previous?.revision ?? 0) + 1,
    syncedRevision: previous?.syncedRevision ?? 0,
    deletedAt: null,
  };
  return [next, ...items.filter((item) => item.libraryId !== libraryId)].slice(0, 200);
};

export const tombstoneNutritionLibraryFood = (
  items: NutritionLibraryFood[],
  libraryId: string,
  deletedAt: string,
): NutritionLibraryFood[] =>
  items.map((item) =>
    item.libraryId === libraryId
      ? {
          ...item,
          updatedAt: deletedAt,
          revision: item.revision + 1,
          deletedAt,
        }
      : item,
  );