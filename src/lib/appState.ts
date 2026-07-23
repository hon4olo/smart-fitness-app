import type {
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  WeightEntry,
  WorkoutSession,
} from '@/types';

import { ensureUuid } from './ids';

export {
  createWorkoutExerciseId as createExerciseId,
  normalizeWorkouts,
  normalizeWorkoutSessions,
} from '@/features/workouts';

export const normalizeExercises = (exercises: Exercise[]) => {
  return exercises.map((exercise) => {
    const isCustom = exercise.isCustom ?? false;
    return {
      ...exercise,
      id: isCustom ? ensureUuid(exercise.id) : exercise.id,
      isCustom,
      createdAt: exercise.createdAt ?? new Date().toISOString(),
      ...(isCustom &&
      exercise.source !== 'imported' &&
      exercise.source !== 'remote'
        ? { source: 'user' as const }
        : {}),
    };
  });
};

export const normalizeFoodEntries = (foodEntries: FoodEntry[]) => {
  return foodEntries.map((entry) => ({
    ...entry,
    id: ensureUuid(entry.id),
    date:
      entry.date ??
      (entry.createdAt
        ? entry.createdAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10)),
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

const resolveWeightCreatedAt = (entry: WeightEntry): string => {
  if (entry.createdAt && Number.isFinite(Date.parse(entry.createdAt))) {
    return new Date(entry.createdAt).toISOString();
  }

  const parsedDate = Date.parse(entry.date);
  return Number.isFinite(parsedDate)
    ? new Date(parsedDate).toISOString()
    : new Date().toISOString();
};

export const normalizeWeightHistory = (weightHistory: WeightEntry[]) => {
  return weightHistory
    .map((entry) => ({
      ...entry,
      id: ensureUuid(entry.id),
      createdAt: resolveWeightCreatedAt(entry),
    }))
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
