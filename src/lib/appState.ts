import type { BodyMeasurement, Exercise, FoodEntry, MealTemplate, WeightEntry, WorkoutSession } from '@/types';

export { createWorkoutExerciseId as createExerciseId, normalizeWorkouts, normalizeWorkoutSessions } from '@/features/workouts';

export const normalizeExercises = (exercises: Exercise[]) => {
  return exercises.map((exercise) => ({
    ...exercise,
    isCustom: exercise.isCustom ?? false,
    createdAt: exercise.createdAt ?? new Date().toISOString(),
  }));
};

export const normalizeFoodEntries = (foodEntries: FoodEntry[]) => {
  return foodEntries.map((entry) => ({
    ...entry,
    date: entry.date ?? (entry.createdAt ? entry.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    mealType: entry.mealType ?? 'breakfast',
    carbs: entry.carbs ?? 0,
    fats: entry.fats ?? 0,
    source: entry.source ?? 'manual',
    createdAt: entry.createdAt ?? new Date().toISOString(),
  }));
};

export const normalizeMealTemplates = (mealTemplates: MealTemplate[]) => {
  return mealTemplates.map((template) => ({
    ...template,
    createdAt: template.createdAt ?? new Date().toISOString(),
    items: normalizeFoodEntries(template.items ?? []).map((item, index) => ({
      ...item,
      id: `${template.id}-item-${index}`,
    })),
  }));
};

export const normalizeWeightHistory = (weightHistory: WeightEntry[]) => {
  return weightHistory
    .map((entry) => {
      const parsedDate = new Date(`${entry.date} 2026`);

      return {
        ...entry,
        createdAt:
          entry.createdAt ??
          (Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const normalizeBodyMeasurements = (bodyMeasurements: BodyMeasurement[]) => {
  return bodyMeasurements
    .map((entry) => ({
      ...entry,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getLastWorkoutSession = (workoutSessions: WorkoutSession[]) => {
  return workoutSessions.at(-1) ?? null;
};
