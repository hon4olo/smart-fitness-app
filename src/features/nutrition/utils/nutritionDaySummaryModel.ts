import { sumNutritionTotals } from '@/lib';
import type { FoodEntry, MealType } from '@/types';

import { mealTypeOrder, type MealSummary } from './nutritionScreenUtils';

export const buildMealSummaries = (entries: FoodEntry[]): MealSummary[] => {
  const entriesByMeal = new Map<MealType, FoodEntry[]>();

  for (const mealType of mealTypeOrder) {
    entriesByMeal.set(mealType, []);
  }

  for (const entry of entries) {
    entriesByMeal.get(entry.mealType)?.push(entry);
  }

  return mealTypeOrder.map((mealType) => {
    const mealEntries = entriesByMeal.get(mealType) ?? [];
    return {
      entries: mealEntries,
      mealType,
      subtotal: sumNutritionTotals(mealEntries),
    };
  });
};

export const countMountedFoodEntryRows = (
  meals: MealSummary[],
  expandedMeals: MealType[],
): number => {
  const expandedSet = new Set(expandedMeals);
  return meals.reduce(
    (count, meal) => count + (expandedSet.has(meal.mealType) ? meal.entries.length : 0),
    0,
  );
};
