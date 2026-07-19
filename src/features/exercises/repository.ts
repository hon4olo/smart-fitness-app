import { loadExerciseCatalogCache, saveExerciseCatalogCache } from './cache';
import { localExerciseProvider } from './localProvider';
import { createOssExerciseDbProvider } from './ossExerciseDbProvider';
import { normalizeExerciseQuery } from './provider';
import type { Exercise, ExerciseFilters, ExerciseProvider } from './types';

const isDevelopmentBuild = () => typeof __DEV__ !== 'undefined' && __DEV__;

export type ExerciseRepository = {
  getAllExercises(filters?: ExerciseFilters): Promise<Exercise[]>;
  listExercises(): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
  searchExercises(query: string, filters?: ExerciseFilters): Promise<Exercise[]>;
  getEquipmentOptions(): Promise<string[]>;
  getMuscleOptions(): Promise<string[]>;
  getLastLoadSource(): 'cache' | 'local' | 'oss-exercisedb' | null;
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
  const selectedProvider = provider ?? (isDevelopmentBuild() ? createOssExerciseDbProvider() : localExerciseProvider);
  let cachedExercises: Exercise[] | null = null;
  let lastLoadSource: 'cache' | 'local' | 'oss-exercisedb' | null = null;

  const loadProviderExercises = async () => {
    if (cachedExercises) {
      return cachedExercises;
    }

    try {
      const result = await selectedProvider.listExercises();
      cachedExercises = result.exercises;
      lastLoadSource = result.exercises.some((exercise) => exercise.source.provider === 'oss-exercisedb') ? 'oss-exercisedb' : 'local';

      if (lastLoadSource === 'oss-exercisedb') {
        await saveExerciseCatalogCache({
          exercises: result.exercises,
          providerVersion: result.providerVersion ?? 'oss-exercisedb-v1',
          refreshedAt: result.refreshedAt ?? new Date().toISOString(),
        });
      }

      return cachedExercises;
    } catch {
      // The free OSS ExerciseDB endpoint is development/prototype/non-commercial only.
      // Release builds never select it, and dev builds fall back to cached metadata or the local JSON fixture.
      const cache = isDevelopmentBuild() ? await loadExerciseCatalogCache() : null;
      if (cache) {
        cachedExercises = cache.exercises;
        lastLoadSource = 'cache';
        return cachedExercises;
      }

      const localResult = await localExerciseProvider.listExercises();
      cachedExercises = localResult.exercises;
      lastLoadSource = 'local';
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
    getLastLoadSource() {
      return lastLoadSource;
    },
  };
};

export const exerciseRepository = createExerciseRepository();
