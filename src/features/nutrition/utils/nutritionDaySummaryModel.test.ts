import { describe, expect, test } from 'vitest';

import type { FoodEntry, MealType } from '@/types';

import { buildMealSummaries, countMountedFoodEntryRows } from './nutritionDaySummaryModel';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const createEntries = (count: number): FoodEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `food-${index + 1}`,
    name: `Food ${index + 1}`,
    date: '2026-08-01',
    mealType: mealTypes[index % mealTypes.length],
    calories: 100,
    protein: 10,
    carbs: 10,
    fats: 2,
    source: 'manual',
    createdAt: `2026-08-01T12:${String(index % 60).padStart(2, '0')}:00.000Z`,
  }));

describe('nutrition day summary model', () => {
  test('groups 500 entries in one pass with stable meal ordering', () => {
    const meals = buildMealSummaries(createEntries(500));

    expect(meals.map((meal) => meal.mealType)).toEqual(mealTypes);
    expect(meals.map((meal) => meal.entries.length)).toEqual([125, 125, 125, 125]);
    expect(meals.reduce((count, meal) => count + meal.entries.length, 0)).toBe(500);
  });

  test('records current mounted-row cost for expanded meal groups', () => {
    const meals = buildMealSummaries(createEntries(500));

    expect(countMountedFoodEntryRows(meals, [])).toBe(0);
    expect(countMountedFoodEntryRows(meals, ['breakfast'])).toBe(125);
    expect(countMountedFoodEntryRows(meals, mealTypes)).toBe(500);
  });

  test('preserves nutrition subtotals while grouping', () => {
    const meals = buildMealSummaries(createEntries(8));

    for (const meal of meals) {
      expect(meal.entries).toHaveLength(2);
      expect(meal.subtotal.calories).toBe(200);
      expect(meal.subtotal.protein).toBe(20);
      expect(meal.subtotal.carbs).toBe(20);
      expect(meal.subtotal.fats).toBe(4);
    }
  });
});
