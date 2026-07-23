import { resolveExerciseByName } from '@/lib/workouts';
import type { Exercise, Workout, WorkoutSet } from '@/types';

import type { SessionExercise } from './components/session/types';
import type { WorkoutPlanExercise, WorkoutSessionDraft } from './types';

type ExerciseIdentity = Pick<Exercise, 'id' | 'name'>;

const uniqueExercisesFromSets = (
  setNames: Array<{ exerciseId: string; exerciseName: string }>,
  catalog: Exercise[],
): ExerciseIdentity[] => {
  const seen = new Set<string>();
  return setNames
    .map(
      (entry): ExerciseIdentity =>
        resolveExerciseByName(entry.exerciseName, catalog) ??
        catalog.find((exercise) => exercise.id === entry.exerciseId) ?? {
          id: entry.exerciseId,
          name: entry.exerciseName,
        },
    )
    .filter((exercise) => {
      if (seen.has(exercise.id)) return false;
      seen.add(exercise.id);
      return true;
    });
};

export const buildVisibleSessionExercises = ({
  catalog,
  draft,
  hiddenExerciseIds,
  isEmptyWorkout,
  planExercises,
  workout,
}: {
  catalog: Exercise[];
  draft: WorkoutSessionDraft | null;
  hiddenExerciseIds: Set<string>;
  isEmptyWorkout: boolean;
  planExercises: WorkoutPlanExercise[];
  workout: Workout | null;
}): SessionExercise[] => {
  if (!draft) return [];

  if (isEmptyWorkout) {
    return uniqueExercisesFromSets(draft.sets, catalog).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      notes: undefined,
      restSeconds: undefined,
      targetReps: undefined,
      targetSets: undefined,
    }));
  }

  const templateExercises = (workout?.exercises ?? [])
    .filter((exercise) => !hiddenExerciseIds.has(exercise.id))
    .map((exercise, index) => ({
      id: exercise.id,
      name: exercise.name,
      notes: planExercises[index]?.notes,
      restSeconds: planExercises[index]?.restSeconds,
      targetReps: planExercises[index]?.targetReps,
      targetSets: planExercises[index]?.targetSets,
    }));
  const templateIds = new Set(templateExercises.map((exercise) => exercise.id));
  const sessionOnlyExercises = uniqueExercisesFromSets(draft.sets, catalog)
    .filter((exercise) => !templateIds.has(exercise.id) && !hiddenExerciseIds.has(exercise.id))
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      notes: undefined,
      restSeconds: undefined,
      targetReps: undefined,
      targetSets: undefined,
    }));

  return [...templateExercises, ...sessionOnlyExercises];
};

export const buildWorkoutSessionLiveSummary = (
  draft: WorkoutSessionDraft,
  rpeSetId: string | null,
): {
  completedReps: number;
  completedSets: WorkoutSet[];
  completedVolume: number;
  rpeSet: WorkoutSet | undefined;
  rpeSetLabel: string;
} => {
  const completedSets = draft.sets.filter((set) => set.completed !== false);
  const rpeSet = rpeSetId ? draft.sets.find((set) => set.id === rpeSetId) : undefined;
  const rpeSetIndex = rpeSet
    ? draft.sets
        .filter((set) => set.exerciseId === rpeSet.exerciseId)
        .findIndex((set) => set.id === rpeSet.id)
    : -1;

  return {
    completedReps: completedSets.reduce((total, set) => total + set.reps, 0),
    completedSets,
    completedVolume: completedSets.reduce((total, set) => total + set.reps * set.weight, 0),
    rpeSet,
    rpeSetLabel: rpeSetIndex >= 0 ? `Set ${rpeSetIndex + 1}` : 'Set',
  };
};
