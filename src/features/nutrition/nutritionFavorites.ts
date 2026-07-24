const NUTRITION_FAVORITES_STORAGE_PREFIX = 'smart-fitness:nutrition-favorites:v1';

export const getNutritionFavoritesStorageKey = (userId: string | null): string =>
  `${NUTRITION_FAVORITES_STORAGE_PREFIX}:${encodeURIComponent(userId ?? 'local')}`;

export const normalizeNutritionFavoriteIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

export const parseNutritionFavoriteIds = (raw: string | null): string[] => {
  if (!raw) return [];

  try {
    return normalizeNutritionFavoriteIds(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const serializeNutritionFavoriteIds = (favoriteIds: string[]): string =>
  JSON.stringify(normalizeNutritionFavoriteIds(favoriteIds));

export const toggleNutritionFavoriteId = (
  favoriteIds: string[],
  foodId: string,
): string[] => {
  const normalizedFoodId = foodId.trim();
  if (!normalizedFoodId) return normalizeNutritionFavoriteIds(favoriteIds);

  const normalizedIds = normalizeNutritionFavoriteIds(favoriteIds);
  return normalizedIds.includes(normalizedFoodId)
    ? normalizedIds.filter((item) => item !== normalizedFoodId)
    : [normalizedFoodId, ...normalizedIds];
};