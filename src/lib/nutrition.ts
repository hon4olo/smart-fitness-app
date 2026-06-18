import type { FoodEntry, ProfileGoalType } from '@/types';

export type MacroTotals = {
  calories: number;
  carbs: number;
  fats: number;
  protein: number;
};

export const createMacroTotals = (): MacroTotals => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
});

export const sumNutritionTotals = (entries: Pick<FoodEntry, 'calories' | 'protein' | 'carbs' | 'fats'>[]) => {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    createMacroTotals()
  );
};

export const formatNumber = (value: number) => {
  return `${Math.round(value * 10) / 10}`;
};

export const formatMacroTotals = (entryTotals: MacroTotals) => {
  return `${formatNumber(entryTotals.calories)} kcal / ${formatNumber(entryTotals.protein)} g protein / ${formatNumber(entryTotals.carbs)} g carbs / ${formatNumber(entryTotals.fats)} g fats`;
};

export const getClampedProgress = (total: number, target: number) => {
  if (target <= 0) {
    return total > 0 ? 1 : 0;
  }

  return Math.min(1, Math.max(0, total / target));
};

export const formatGoalType = (value: ProfileGoalType) => {
  if (value === 'lose_fat') {
    return 'Lose fat';
  }

  if (value === 'gain_muscle') {
    return 'Gain muscle';
  }

  return 'Maintain';
};

export const parsePositiveNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

export const parseOptionalPositiveNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
};

export const parseNonNegativeNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
};

export const formatRemaining = (remaining: number, unit: string) => {
  const formattedValue = `${formatNumber(Math.abs(remaining))}${unit}`;

  return remaining < 0 ? `Over by ${formattedValue}` : `Remaining ${formattedValue}`;
};

export const getServingInfo = (entry: {
  servingSize?: number;
  servingUnit?: string;
  quantity?: number;
}) => {
  if (!entry.servingSize && !entry.servingUnit && !entry.quantity) {
    return '';
  }

  if (entry.quantity && entry.servingUnit) {
    return `${entry.quantity} ${entry.servingUnit}`;
  }

  return [entry.quantity ?? entry.servingSize, entry.servingUnit].filter(Boolean).join(' ') || 'serving';
};

export const calculateSuggestedTargets = (latestWeightKg: number, goalType: ProfileGoalType) => {
  if (!Number.isFinite(latestWeightKg) || latestWeightKg <= 0) {
    return null;
  }

  const maintenanceCalories = latestWeightKg * 33;
  const baseCalories =
    goalType === 'lose_fat'
      ? maintenanceCalories - 300
      : goalType === 'gain_muscle'
        ? maintenanceCalories + 250
        : maintenanceCalories;
  const suggestedCalories = Math.round(baseCalories / 10) * 10;
  const suggestedProtein = Math.round(latestWeightKg * 2);
  const suggestedFats = Math.round(latestWeightKg * 0.8);
  const proteinCalories = suggestedProtein * 4;
  const fatCalories = suggestedFats * 9;
  const suggestedCarbs = Math.max(0, Math.round((suggestedCalories - proteinCalories - fatCalories) / 4));

  return {
    calories: suggestedCalories,
    protein: suggestedProtein,
    carbs: suggestedCarbs,
    fats: suggestedFats,
  };
};

export const getLatestWeightKg = (weightHistory: { weight: number }[], fallbackWeight: string) => {
  const latestWeightEntry = weightHistory[0];
  return latestWeightEntry?.weight ?? Number(fallbackWeight);
};
