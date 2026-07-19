import fixtureRows from './fixtures/exercises.json';
import { createExerciseDbProvider } from './provider';
import type { Exercise, ExerciseProvider } from './types';

const localProvider = createExerciseDbProvider(fixtureRows);

export type ExerciseRepository = {
  listExercises(): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
};

export const createExerciseRepository = (provider: ExerciseProvider = localProvider): ExerciseRepository => ({
  async listExercises() {
    const result = await provider.listExercises();
    return result.exercises;
  },
  getExerciseById(exerciseId) {
    return provider.getExerciseById(exerciseId);
  },
});

export const exerciseRepository = createExerciseRepository();
