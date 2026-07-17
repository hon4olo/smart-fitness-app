import type { Workout, WorkoutSession, WorkoutSet } from '@/types';

import { buildCompletedWorkoutSessionSnapshot } from './sessionModel';
import type { WorkoutSessionDraft } from './types';

type WorkoutSessionSetField = 'reps' | 'weight';

const cloneSet = (set: WorkoutSet) => ({ ...set });

const createWorkoutSessionSetId = (draft: WorkoutSessionDraft) => `${draft.id}-${draft.sets.length + 1}-${Date.now()}`;

const parseWorkoutSessionFieldValue = (value: string) => {
  const parsed = Number.parseFloat(value.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export const createWorkoutSessionDraft = (workout: Workout, existingDraft?: WorkoutSessionDraft | null): WorkoutSessionDraft => {
  if (existingDraft) {
    return {
      ...existingDraft,
      sets: existingDraft.sets.map(cloneSet),
    };
  }

  return {
    id: `${Date.now()}`,
    workoutId: workout.id,
    workoutTitle: workout.title,
    startedAt: new Date().toISOString(),
    sets: [],
  };
};

export const addWorkoutSessionSet = (
  draft: WorkoutSessionDraft,
  exercise: { id: string; name: string; targetReps?: number },
  previousSet?: WorkoutSet,
) => {
  const nextSet: WorkoutSet = {
    id: createWorkoutSessionSetId(draft),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    weight: previousSet?.weight ?? 60,
    reps: previousSet?.reps ?? exercise.targetReps ?? 8,
    completed: false,
  };

  return {
    ...draft,
    sets: [...draft.sets.map(cloneSet), nextSet],
  } satisfies WorkoutSessionDraft;
};

export const updateWorkoutSessionSetField = (draft: WorkoutSessionDraft, setId: string, field: WorkoutSessionSetField, value: string) => {
  return {
    ...draft,
    sets: draft.sets.map((set) => (set.id === setId ? { ...set, [field]: parseWorkoutSessionFieldValue(value) } : cloneSet(set))),
  } satisfies WorkoutSessionDraft;
};

export const toggleWorkoutSessionSetCompletion = (draft: WorkoutSessionDraft, setId: string) => {
  return {
    ...draft,
    sets: draft.sets.map((set) => (set.id === setId ? { ...set, completed: !set.completed } : cloneSet(set))),
  } satisfies WorkoutSessionDraft;
};

export const clearWorkoutSessionSetsForExercise = (draft: WorkoutSessionDraft, exerciseId: string) => {
  return {
    ...draft,
    sets: draft.sets.filter((set) => set.exerciseId !== exerciseId).map(cloneSet),
  } satisfies WorkoutSessionDraft;
};

export const removeWorkoutSessionSet = (draft: WorkoutSessionDraft, setId: string) => {
  return {
    ...draft,
    sets: draft.sets.filter((set) => set.id !== setId).map(cloneSet),
  } satisfies WorkoutSessionDraft;
};

export const getWorkoutSessionCompletedSetCount = (draft: WorkoutSessionDraft | null | undefined) => {
  return draft?.sets.filter((set) => set.completed !== false).length ?? 0;
};

export const buildCompletedWorkoutSessionSnapshotFromDraft = (
  draft: WorkoutSessionDraft,
  options: { finishedAt?: string; notes?: string } = {},
) => {
  const completedDraft: WorkoutSessionDraft = {
    ...draft,
    sets: draft.sets.filter((set) => set.completed !== false).map(cloneSet),
  };

  return buildCompletedWorkoutSessionSnapshot(completedDraft, options);
};

export const getWorkoutSessionSetPreviousLabel = (draft: WorkoutSessionDraft, exerciseId: string, currentIndex: number) => {
  const exerciseSets = draft.sets.filter((set) => set.exerciseId === exerciseId);
  const previousSet = exerciseSets[currentIndex - 1];

  if (!previousSet) {
    return '—';
  }

  return `${previousSet.weight} kg · ${previousSet.reps} reps`;
};
