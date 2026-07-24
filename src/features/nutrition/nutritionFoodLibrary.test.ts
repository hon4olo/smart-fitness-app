import { describe, expect, it } from 'vitest';

import type { DraftItem } from './addFoodModel';
import {
  getNutritionFoodLibraryStorageKey,
  parseNutritionFoodLibrary,
  removeNutritionLibraryFood,
  serializeNutritionFoodLibrary,
  upsertNutritionLibraryFood,
} from './nutritionFoodLibrary';

const draft: DraftItem = {
  calories: 120,
  carbs: 10,
  externalId: 'provider-1',
  fats: 3,
  name: 'Provider food',
  protein: 12,
  quantity: '100',
  servingSize: 100,
  servingUnit: 'g',
  source: 'fatsecret',
};

describe('nutrition food library', () => {
  it('scopes storage by account with an anonymous fallback', () => {
    expect(getNutritionFoodLibraryStorageKey('user-1')).toContain('user-1');
    expect(getNutritionFoodLibraryStorageKey(null)).toContain('anonymous');
  });

  it('round-trips provider favorite snapshots', () => {
    const items = upsertNutritionLibraryFood([], draft, 'provider-favorite', '2026-07-25T00:00:00.000Z');
    expect(parseNutritionFoodLibrary(serializeNutritionFoodLibrary(items))).toEqual(items);
  });

  it('upserts a snapshot instead of duplicating it', () => {
    const first = upsertNutritionLibraryFood([], draft, 'provider-favorite', '2026-07-25T00:00:00.000Z');
    const second = upsertNutritionLibraryFood(first, { ...draft, calories: 125 }, 'provider-favorite', '2026-07-25T01:00:00.000Z');
    expect(second).toHaveLength(1);
    expect(second[0].calories).toBe(125);
  });

  it('fails closed on malformed storage and removes by stable id', () => {
    expect(parseNutritionFoodLibrary('{broken')).toEqual([]);
    const items = upsertNutritionLibraryFood([], draft, 'provider-favorite', '2026-07-25T00:00:00.000Z');
    expect(removeNutritionLibraryFood(items, items[0].libraryId)).toEqual([]);
  });
});
