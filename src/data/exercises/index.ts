import type { Exercise } from '@/domain/models';

import { armsExercises } from './arms';
import { backExercises } from './back';
import { cardioExercises } from './cardio';
import { chestExercises } from './chest';
import { coreExercises } from './core';
import { legsExercises } from './legs';
import { mobilityExercises } from './mobility';
import { shouldersExercises } from './shoulders';
import { createExerciseLookup, mergeExerciseCatalog, matchesExerciseQuery, exerciseSearchIndex } from './shared';

export const exerciseDatabase = [
  ...chestExercises,
  ...backExercises,
  ...shouldersExercises,
  ...armsExercises,
  ...legsExercises,
  ...coreExercises,
  ...cardioExercises,
  ...mobilityExercises,
] satisfies Exercise[];

export const exerciseCatalogLookup = createExerciseLookup(exerciseDatabase);
export { createExerciseLookup, mergeExerciseCatalog, matchesExerciseQuery, exerciseSearchIndex };
