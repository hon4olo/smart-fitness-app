import type { DraftItem } from './addFoodModel';

export type NutritionLibraryFood = DraftItem & {
  libraryId: string;
  kind: 'custom' | 'provider-favorite';
  savedAt: string;
};

const STORAGE_PREFIX = 'smart-fitness:nutrition-food-library:v1';

export const getNutritionFoodLibraryStorageKey = (ownerId: string | null): string =>
  `${STORAGE_PREFIX}:${ownerId ?? 'anonymous'}`;

const isLibraryFood = (value: unknown): value is NutritionLibraryFood => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<NutritionLibraryFood>;
  return (
    typeof item.libraryId === 'string' &&
    (item.kind === 'custom' || item.kind === 'provider-favorite') &&
    typeof item.savedAt === 'string' &&
    typeof item.name === 'string' &&
    typeof item.calories === 'number' &&
    typeof item.protein === 'number' &&
    typeof item.carbs === 'number' &&
    typeof item.fats === 'number' &&
    typeof item.servingSize === 'number' &&
    typeof item.servingUnit === 'string' &&
    typeof item.quantity === 'string' &&
    typeof item.source === 'string'
  );
};

export const parseNutritionFoodLibrary = (raw: string | null): NutritionLibraryFood[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.filter(isLibraryFood).filter((item) => {
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

export const upsertNutritionLibraryFood = (
  items: NutritionLibraryFood[],
  draft: DraftItem,
  kind: NutritionLibraryFood['kind'],
  savedAt: string,
): NutritionLibraryFood[] => {
  const libraryId = getNutritionLibraryId(draft);
  const next: NutritionLibraryFood = { ...draft, libraryId, kind, savedAt };
  return [next, ...items.filter((item) => item.libraryId !== libraryId)].slice(0, 100);
};

export const removeNutritionLibraryFood = (
  items: NutritionLibraryFood[],
  libraryId: string,
): NutritionLibraryFood[] => items.filter((item) => item.libraryId !== libraryId);
