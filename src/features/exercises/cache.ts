import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Exercise } from './types';

const CACHE_KEY = 'exercise-catalog-cache-v1';

export type ExerciseCatalogCache = {
  exercises: Exercise[];
  providerVersion: string;
  refreshedAt: string;
};

export const loadExerciseCatalogCache = async (): Promise<ExerciseCatalogCache | null> => {
  const raw = await AsyncStorage.getItem(CACHE_KEY);

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

export const saveExerciseCatalogCache = async (cache: ExerciseCatalogCache): Promise<void> => {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};
