import { describe, expect, it } from 'vitest';

import {
  getNutritionFavoritesStorageKey,
  parseNutritionFavoriteIds,
  serializeNutritionFavoriteIds,
  toggleNutritionFavoriteId,
} from './nutritionFavorites';

describe('nutrition favorites', () => {
  it('scopes storage by user and keeps an anonymous local scope', () => {
    expect(getNutritionFavoritesStorageKey('user/1')).toContain('user%2F1');
    expect(getNutritionFavoritesStorageKey(null)).toContain(':local');
  });

  it('normalizes malformed and duplicate stored IDs', () => {
    expect(parseNutritionFavoriteIds('["rice", " rice ", 3, "", "milk"]')).toEqual([
      'rice',
      'milk',
    ]);
    expect(parseNutritionFavoriteIds('not-json')).toEqual([]);
  });

  it('adds and removes explicit favorites deterministically', () => {
    expect(toggleNutritionFavoriteId(['rice'], 'milk')).toEqual(['milk', 'rice']);
    expect(toggleNutritionFavoriteId(['milk', 'rice'], 'milk')).toEqual(['rice']);
    expect(serializeNutritionFavoriteIds(['rice', 'rice', ' milk '])).toBe(
      '["rice","milk"]',
    );
  });
});