import type { WorkoutSet, WorkoutSession } from '@/context/AppContext';

import { getWorkoutSessionPreviousSets, type PlannedExercise, type WorkoutSessionPreviousSet } from '@/lib/workouts/workout-session';

export type SessionDraftInputs = Record<string, { reps: string; weight: string }>;

export type SessionRow = {
  exercise: PlannedExercise;
  exerciseSets: WorkoutSet[];
  previous: WorkoutSessionPreviousSet | null;
};

export const syncDraftInputs = (current: SessionDraftInputs, sets: WorkoutSet[]) => {
  const next: SessionDraftInputs = { ...current };
  const ids = new Set(sets.map((set) => set.id));

  for (const id of Object.keys(next)) {
    if (!ids.has(id)) {
      delete next[id];
    }
  }

  for (const set of sets) {
    if (!next[set.id]) {
      next[set.id] = { reps: `${set.reps}`, weight: `${set.weight}` };
    }
  }

  return next;
};

export const parseDraftValue = (value: { reps: string; weight: string }) => {
  const weight = Number.parseFloat(value.weight);
  const reps = Number.parseInt(value.reps, 10);

  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight < 0 || reps <= 0) {
    return null;
  }

  return { reps, weight };
};

export const isSetCompleted = (set: WorkoutSet) => set.completed !== false;

export const buildSessionRows = (workoutExercises: PlannedExercise[], sets: WorkoutSet[], workoutSessions: WorkoutSession[]): SessionRow[] =>
  workoutExercises.map((exercise) => ({
    exercise,
    exerciseSets: sets.filter((set) => set.exerciseId === exercise.id),
    previous: getWorkoutSessionPreviousSets(exercise, workoutSessions)[0] ?? null,
  }));
