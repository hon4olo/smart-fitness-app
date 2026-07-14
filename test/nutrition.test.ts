import { foodCatalog } from '@/data/foods';
import { describe, expect, it } from 'vitest';

import {
  createMacroTotals,
  formatCompactMacroTotals,
  formatMacroTargetPair,
  getNutritionSummary,
  getServingInfo,
  getSimilarFoods,
  searchFoodCatalog,
  sumNutritionTotals,
} from '@/lib/nutrition';

describe('nutrition helpers', () => {
  it('creates and sums macro totals', () => {
    expect(createMacroTotals()).toEqual({ calories: 0, protein: 0, carbs: 0, fats: 0 });

    expect(
      sumNutritionTotals([
        { calories: 120, protein: 10, carbs: 8, fats: 4 },
        { calories: 80, protein: 5, carbs: 12, fats: 2 },
      ])
    ).toEqual({ calories: 200, protein: 15, carbs: 20, fats: 6 });
  });

  it('formats macro summaries and serving info', () => {
    expect(formatCompactMacroTotals({ calories: 250, protein: 24, carbs: 18, fats: 7 })).toBe(
      '250 kcal · 24P · 18C · 7F'
    );
    expect(formatMacroTargetPair(24, 30)).toBe('24 / 30 g');
    expect(formatMacroTargetPair(250, 300, 'kcal')).toBe('250 / 300 kcal');

    expect(getServingInfo({})).toBe('');
    expect(getServingInfo({ quantity: 2, servingUnit: 'cups' })).toBe('2 cups');
    expect(getServingInfo({ servingSize: 150, servingUnit: 'g' })).toBe('150 g');
  });

  it('searches aliases and ranks exact matches first', () => {
    const results = searchFoodCatalog(foodCatalog, 'pb');

    expect(results[0]?.id).toBe('peanut-butter');
    expect(results.some((food) => food.id === 'peanut-butter')).toBe(true);
  });

  it('finds similar foods in the same category', () => {
    const chickenBreast = foodCatalog.find((food) => food.id === 'chicken-breast');

    expect(chickenBreast).toBeTruthy();

    const similarFoods = getSimilarFoods(chickenBreast!, foodCatalog, 5);

    expect(similarFoods.length).toBeGreaterThan(0);
    expect(similarFoods.every((food) => food.category === chickenBreast!.category && food.id !== chickenBreast!.id)).toBe(
      true
    );
  });

  it('builds nutrition summary with progress and deficit state', () => {
    const summary = getNutritionSummary(
      { calories: 1500, protein: 120, carbs: 100, fats: 55 },
      { calories: 2000, protein: 140, carbs: 180, fats: 70 }
    );

    expect(summary.remaining).toEqual({ calories: 500, protein: 20, carbs: 80, fats: 15 });
    expect(summary.calorieProgress).toBe(0.75);
    expect(summary.isOverTarget).toBe(false);

    const overTarget = getNutritionSummary(
      { calories: 2200, protein: 150, carbs: 190, fats: 80 },
      { calories: 2000, protein: 140, carbs: 180, fats: 70 }
    );

    expect(overTarget.remaining.calories).toBe(-200);
    expect(overTarget.isOverTarget).toBe(true);
  });
});
