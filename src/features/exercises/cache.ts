import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Exercise } from './types';

export const EXERCISE_CACHE_KEYS = {
  local: 'exercise-cache:local:v1',
  ossExerciseDb: 'exercise-cache:oss-exercisedb:v2',
} as const;

export type ExerciseCatalogCache = {
  exercises: Exercise[];
  providerVersion: string;
  refreshedAt: string;
};

export const loadExerciseCatalogCache = async (cacheKey: string): Promise<ExerciseCatalogCache | null> => {
  const raw = await AsyncStorage.getItem(cacheKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ExerciseCatalogCache>;

    if (!Array.isArray(parsed.exercises) || typeof parsed.refreshedAt !== 'string') {
      return null;
    }

    return {
      exercises: parsed.exercises,
      providerVersion: typeof parsed.providerVersion === 'string' ? parsed.providerVersion : 'unknown',
      refreshedAt: parsed.refreshedAt,
    };
  } catch {
    return null;
  }
};

export const saveExerciseCatalogCache = async (cacheKey: string, cache: ExerciseCatalogCache): Promise<void> => {
  await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
};
