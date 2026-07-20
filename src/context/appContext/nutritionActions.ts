import type { AppState, FoodEntry, NutritionState } from '@/types';

export function normalizeFoodEntry(entry: FoodEntry, fallbackCreatedAt: string): FoodEntry {
  return {
    ...entry,
    mealType: entry.mealType ?? 'breakfast',
    source: entry.source ?? 'manual',
    createdAt: entry.createdAt ?? fallbackCreatedAt,
  };
}

export function addNutritionTotals(current: NutritionState, added: NutritionState): NutritionState {
  return {
    calories: current.calories + added.calories,
    protein: current.protein + added.protein,
    carbs: current.carbs + added.carbs,
    fats: current.fats + added.fats,
  };
}

export function subtractNutritionTotals(current: NutritionState, removed: NutritionState): NutritionState {
  return {
    calories: Math.max(0, current.calories - removed.calories),
    protein: Math.max(0, current.protein - removed.protein),
    carbs: Math.max(0, current.carbs - removed.carbs),
    fats: Math.max(0, current.fats - removed.fats),
  };
}

export function updateNutritionTotals(
  current: NutritionState,
  previous: NutritionState,
  next: NutritionState
): NutritionState {
  return {
    calories: Math.max(0, current.calories - previous.calories + next.calories),
    protein: Math.max(0, current.protein - previous.protein + next.protein),
    carbs: Math.max(0, current.carbs - previous.carbs + next.carbs),
    fats: Math.max(0, current.fats - previous.fats + next.fats),
  };
}

export function sumFoodEntryNutrition(entries: FoodEntry[]): NutritionState {
  return entries.reduce(
    (totals, entry) => addNutritionTotals(totals, entry),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export function addFoodEntryToState(currentState: AppState, foodEntry: FoodEntry): AppState {
  return {
    ...currentState,
    foodEntries: [foodEntry, ...currentState.foodEntries],
    nutrition: addNutritionTotals(currentState.nutrition, foodEntry),
  };
}

export function addFoodEntriesToState(currentState: AppState, foodEntries: FoodEntry[]): AppState {
  return {
    ...currentState,
    foodEntries: [...foodEntries, ...currentState.foodEntries],
    nutrition: addNutritionTotals(currentState.nutrition, sumFoodEntryNutrition(foodEntries)),
  };
}

export function updateFoodEntryInState(
  currentState: AppState,
  entryId: string,
  previousEntry: FoodEntry,
  nextEntry: FoodEntry
): AppState {
  return {
    ...currentState,
    foodEntries: currentState.foodEntries.map((entry) => (entry.id === entryId ? nextEntry : entry)),
    nutrition: updateNutritionTotals(currentState.nutrition, previousEntry, nextEntry),
  };
}

export function deleteFoodEntryFromState(currentState: AppState, entry: FoodEntry): AppState {
  return {
    ...currentState,
    foodEntries: currentState.foodEntries.filter((foodEntry) => foodEntry.id !== entry.id),
    nutrition: subtractNutritionTotals(currentState.nutrition, entry),
  };
}
