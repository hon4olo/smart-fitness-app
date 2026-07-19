import fixtureRows from '@/data/exercises/exercises.json';

import { createExerciseDbProvider } from './provider';

export const localExerciseProvider = createExerciseDbProvider(fixtureRows);
