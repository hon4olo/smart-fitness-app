import type { FoodEntry, MealType, NutritionTargets, ProfileGoalType } from '@/types';

import { getNutritionSummary, sumNutritionTotals, type MacroTotals } from '@/lib/nutrition';

import { DeterministicRecommendation, uniqueValues } from './ruleEngine';

export type NutritionAdvisorInput = {
  entries: FoodEntry[];
  goalType?: ProfileGoalType;
  targets: NutritionTargets;
};

export type NutritionAdvisorResult = {
  caloriesRemaining: number;
  consumed: MacroTotals;
  macroBalance: string;
  missedMeals: MealType[];
  primaryRecommendation: string;
  recommendations: DeterministicRecommendation[];
  status: 'On track' | 'Under-eating' | 'Over-eating' | 'Protein short' | 'Missed meals';
  target: MacroTotals;
  proteinRemaining: number;
};

const expectedMealsByGoal: Record<ProfileGoalType, MealType[]> = {
  gain_muscle: ['breakfast', 'lunch', 'dinner'],
  lose_fat: ['breakfast', 'lunch', 'dinner'],
  maintain: ['breakfast', 'lunch', 'dinner'],
};

const formatGap = (value: number, unit: string) => `${Math.round(Math.abs(value))}${unit}`;

export const getNutritionAdvisor = ({ entries, goalType = 'maintain', targets }: NutritionAdvisorInput): NutritionAdvisorResult => {
  const consumed = sumNutritionTotals(entries);
  const summary = getNutritionSummary(consumed, targets);
  const expectedMeals = expectedMealsByGoal[goalType];
  const presentMeals = uniqueValues(entries.map((entry) => entry.mealType));
  const missedMeals = expectedMeals.filter((mealType) => !presentMeals.includes(mealType));
  const caloriesRemaining = summary.remaining.calories;
  const proteinRemaining = summary.remaining.protein;

  const macroBalance =
    proteinRemaining > 25
      ? 'Protein is low'
      : summary.remaining.fats > 20
        ? 'Fats are low'
        : summary.remaining.carbs > 50
          ? 'Carbs are low'
          : summary.isOverTarget
            ? 'Calories are over target'
            : 'Macros look balanced';

  const recommendations: DeterministicRecommendation[] = [
    ...(caloriesRemaining > 250
      ? [
          {
            id: 'under-eating',
            title: 'Under-eating',
            detail: `You have ${formatGap(caloriesRemaining, ' kcal')} remaining for today.`,
            priority: 100,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(caloriesRemaining < -250
      ? [
          {
            id: 'over-eating',
            title: 'Over-eating',
            detail: `You are ${formatGap(caloriesRemaining, ' kcal')} over target.`,
            priority: 95,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(proteinRemaining > 20
      ? [
          {
            id: 'protein-remaining',
            title: 'Protein remaining',
            detail: `You still need ${formatGap(proteinRemaining, ' g')} protein.`,
            priority: 90,
            tone: 'neutral' as const,
          },
        ]
      : []),
    ...(missedMeals.length > 0
      ? [
          {
            id: 'missed-meals',
            title: 'Missed meals',
            detail: `Missing ${missedMeals.join(', ')}.`,
            priority: 85,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(caloriesRemaining >= -250 && caloriesRemaining <= 250 && proteinRemaining <= 20 && missedMeals.length === 0
      ? [
          {
            id: 'balanced',
            title: 'Macro balance looks good',
            detail: 'Calories and macros are close to target.',
            priority: 60,
            tone: 'positive' as const,
          },
        ]
      : []),
  ].sort((left, right) => right.priority - left.priority);

  const status: NutritionAdvisorResult['status'] =
    caloriesRemaining < -250
      ? 'Over-eating'
      : missedMeals.length > 0
        ? 'Missed meals'
        : proteinRemaining > 20
          ? 'Protein short'
          : caloriesRemaining > 250
            ? 'Under-eating'
            : 'On track';

  const primaryRecommendation = recommendations[0]?.title ?? 'Macros are on track';

  return {
    caloriesRemaining,
    consumed,
    macroBalance,
    missedMeals,
    primaryRecommendation,
    recommendations,
    status,
    target: targets,
    proteinRemaining,
  };
};
