import { describe, expect, it } from 'vitest';

import type { FoodItem } from '@/api/foods';
import type { FoodEntry } from '@/types';

import {
  buildCustomFoodEntry,
  buildFoodEntryFromDraft,
  buildRecentFoodItems,
  createDraftFromFoodEntry,
  createDraftFromFoodItem,
} from './addFoodModel';

const entry: FoodEntry = {
  id: 'entry-1',
  name: 'Rice',
  date: '2026-07-23',
  mealType: 'lunch',
  calories: 260,
  protein: 5,
  carbs: 56,
  fats: 1,
  baseCalories: 130,
  baseProtein: 2.5,
  baseCarbs: 28,
  baseFats: 0.5,
  source: 'manual',
  servingSize: 100,
  servingUnit: 'g',
  quantity: 200,
  createdAt: '2026-07-23T12:00:00.000Z',
};

describe('add food model', () => {
  it('creates a provider draft using the provider serving multiplier', () => {
    const food: FoodItem = {
      id: 'provider-food',
      name: 'Milk',
      brand: 'Example',
      source: { provider: 'fatsecret' },
      servingBase: '100ml',
      servings: [{ quantity: 250, unit: 'ml' }],
      nutrientsPer100ml: { calories: 50, protein: 3, carbs: 5, fat: 2 },
    };

    expect(createDraftFromFoodItem(food)).toMatchObject({
      calories: 125,
      protein: 7.5,
      carbs: 12.5,
      fats: 5,
      quantity: '250',
      servingSize: 250,
      servingUnit: 'ml',
      source: 'fatsecret',
    });
  });

  it('round-trips an existing entry through an editable draft', () => {
    const draft = createDraftFromFoodEntry(entry);
    const rebuilt = buildFoodEntryFromDraft({
      createdAt: entry.createdAt,
      date: entry.date,
      draft,
      mealType: entry.mealType,
    });

    expect(rebuilt).toEqual(entry);
  });

  it('rejects non-positive draft quantities', () => {
    const draft = { ...createDraftFromFoodEntry(entry), quantity: '0' };

    expect(
      buildFoodEntryFromDraft({
        createdAt: entry.createdAt,
        date: entry.date,
        draft,
        mealType: entry.mealType,
      }),
    ).toBeNull();
  });

  it('deduplicates recent entries by normalized food identity', () => {
    const duplicate = {
      ...entry,
      id: 'entry-2',
      createdAt: '2026-07-23T13:00:00.000Z',
    };

    const recent = buildRecentFoodItems([entry, duplicate]);

    expect(recent).toHaveLength(1);
    expect(recent[0].entry.id).toBe('entry-2');
  });

  it('builds custom food totals from serving and quantity values', () => {
    const custom = buildCustomFoodEntry({
      date: '2026-07-23',
      mealType: 'dinner',
      values: {
        brand: '',
        calories: '100',
        carbs: '10',
        fats: '2',
        name: 'Custom food',
        protein: '5',
        quantity: '150',
        servingSize: '100',
        servingUnit: 'g',
      },
    });

    expect(custom).toMatchObject({
      calories: 150,
      protein: 7.5,
      carbs: 15,
      fats: 3,
      quantity: 150,
      servingSize: 100,
      servingUnit: 'g',
    });
  });
});
