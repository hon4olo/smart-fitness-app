import Constants from 'expo-constants';

import { EXERCISE_CACHE_KEYS, loadExerciseCatalogCache, saveExerciseCatalogCache } from './cache';
import { localExerciseProvider } from './localProvider';
import { createOssExerciseDbProvider } from './ossExerciseDbProvider';
import { normalizeExerciseQuery } from './provider';
import type { Exercise, ExerciseFilters, ExerciseProvider } from './types';

const isExpoConfigOssExerciseDbEnabled = () => {
  const manifestExtra = Constants.manifest && 'extra' in Constants.manifest ? (Constants.manifest.extra as Record<string, unknown>) : undefined;
  const extra = Constants.expoConfig?.extra ?? manifestExtra;
  return extra?.enableOssExerciseDb === true || extra?.EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB === 'true';
};

export const isOssExerciseDbEnabled = () =>
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB === 'true' ||
  isExpoConfigOssExerciseDbEnabled();

export type ExerciseRepositoryDiagnostics = {
  exerciseCount: number;
  lastError: string | null;
  loadSource: 'cache' | 'local' | 'local-fallback' | 'network' | null;
  selectedProvider: 'local-fixture' | 'oss-exercisedb';
};

export type ExerciseRepository = {
  getAllExercises(filters?: ExerciseFilters): Promise<Exercise[]>;
  listExercises(): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
  searchExercises(query: string, filters?: ExerciseFilters): Promise<Exercise[]>;
  getEquipmentOptions(): Promise<string[]>;
  getMuscleOptions(): Promise<string[]>;
  getDiagnostics(): ExerciseRepositoryDiagnostics;
  getLastLoadSource(): ExerciseRepositoryDiagnostics['loadSource'];
};

const matchesFilters = (exercise: Exercise, filters: ExerciseFilters = {}) => {
  const muscle = normalizeExerciseQuery(filters.muscle ?? '');
  const equipment = normalizeExerciseQuery(filters.equipment ?? '');
  const muscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles].map(normalizeExerciseQuery);

  return (
    (!muscle || muscles.includes(muscle)) &&
    (!equipment || exercise.equipment.map(normalizeExerciseQuery).includes(equipment))
  );
};

const matchesQuery = (exercise: Exercise, query: string) => {
  const normalizedQuery = normalizeExerciseQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  const fields = [
    exercise.id,
    exercise.name,
    exercise.bodyPart,
    ...exercise.aliases,
    ...exercise.equipment,
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
  ].map(normalizeExerciseQuery);

  return fields.some((field) => field.includes(normalizedQuery));
};

const sortExercises = (exercises: Exercise[]) =>
  [...exercises].sort((left, right) => left.name.localeCompare(right.name));

export const createExerciseRepository = (provider?: ExerciseProvider): ExerciseRepository => {
  const selectedProviderName: ExerciseRepositoryDiagnostics['selectedProvider'] = provider
    ? 'local-fixture'
    : isOssExerciseDbEnabled()
      ? 'oss-exercisedb'
      : 'local-fixture';
  const selectedProvider = provider ?? (selectedProviderName === 'oss-exercisedb' ? createOssExerciseDbProvider() : localExerciseProvider);
  const cacheKey = selectedProviderName === 'oss-exercisedb' ? EXERCISE_CACHE_KEYS.ossExerciseDb : EXERCISE_CACHE_KEYS.local;
  let cachedExercises: Exercise[] | null = null;
  let lastError: string | null = null;
  let lastLoadSource: ExerciseRepositoryDiagnostics['loadSource'] = null;

  const loadProviderExercises = async () => {
    if (cachedExercises) {
      return cachedExercises;
    }

    try {
      const result = await selectedProvider.listExercises();
      cachedExercises = result.exercises;
      lastError = null;
      lastLoadSource = selectedProviderName === 'oss-exercisedb' ? 'network' : 'local';

      if (selectedProviderName === 'oss-exercisedb') {
        await saveExerciseCatalogCache(cacheKey, {
          exercises: result.exercises,
          providerVersion: result.providerVersion ?? 'oss-exercisedb-v2',
          refreshedAt: result.refreshedAt ?? new Date().toISOString(),
        });
      }

      return cachedExercises;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown exercise provider error';
      // The free OSS ExerciseDB endpoint is for development/prototypes/internal testing only.
      // App Store production builds must omit EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB or set it to false.
      const cache = selectedProviderName === 'oss-exercisedb' ? await loadExerciseCatalogCache(cacheKey) : null;
      if (cache) {
        cachedExercises = cache.exercises;
        lastLoadSource = 'cache';
        return cachedExercises;
      }

      const localResult = await localExerciseProvider.listExercises();
      cachedExercises = localResult.exercises;
      lastLoadSource = selectedProviderName === 'oss-exercisedb' ? 'local-fallback' : 'local';
      return cachedExercises;
    }
  };

  const loadExercises = async (filters?: ExerciseFilters) => {
    const exercises = await loadProviderExercises();
    return sortExercises(exercises.filter((exercise) => matchesFilters(exercise, filters)));
  };

  return {
    getAllExercises: loadExercises,
    listExercises: loadExercises,
    async getExerciseById(exerciseId) {
      const exercises = await loadProviderExercises();
      return exercises.find((exercise) => exercise.id === exerciseId) ?? null;
    },
    async searchExercises(query, filters) {
      const exercises = await loadExercises(filters);
      return exercises.filter((exercise) => matchesQuery(exercise, query));
    },
    async getEquipmentOptions() {
      const exercises = await loadExercises();
      return Array.from(new Set(exercises.flatMap((exercise) => exercise.equipment))).sort((left, right) => left.localeCompare(right));
    },
    async getMuscleOptions() {
      const exercises = await loadExercises();
      return Array.from(new Set(exercises.flatMap((exercise) => exercise.primaryMuscles))).sort((left, right) => left.localeCompare(right));
    },
    getDiagnostics() {
      return {
        exerciseCount: cachedExercises?.length ?? 0,
        lastError,
        loadSource: lastLoadSource,
        selectedProvider: selectedProviderName,
      };
    },
    getLastLoadSource() {
      return lastLoadSource;
    },
  };
};

export const exerciseRepository = createExerciseRepository();
