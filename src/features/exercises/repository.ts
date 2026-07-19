import fixtureRows from '@/data/exercises/exercises.json';
import { createExerciseDbProvider, normalizeExerciseQuery } from './provider';
import type { Exercise, ExerciseFilters, ExerciseProvider } from './types';

const localProvider = createExerciseDbProvider(fixtureRows);

export type ExerciseRepository = {
  getAllExercises(filters?: ExerciseFilters): Promise<Exercise[]>;
  listExercises(): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
  searchExercises(query: string, filters?: ExerciseFilters): Promise<Exercise[]>;
  getEquipmentOptions(): Promise<string[]>;
  getMuscleOptions(): Promise<string[]>;
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

export const createExerciseRepository = (provider: ExerciseProvider = localProvider): ExerciseRepository => {
  const loadExercises = async (filters?: ExerciseFilters) => {
    const result = await provider.listExercises();
    return sortExercises(result.exercises.filter((exercise) => matchesFilters(exercise, filters)));
  };

  return {
    getAllExercises: loadExercises,
    listExercises: loadExercises,
    async getExerciseById(exerciseId) {
      return provider.getExerciseById(exerciseId);
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
  };
};

export const exerciseRepository = createExerciseRepository();
