import { DEFAULT_WORKOUT_PROGRAM_ID } from './defaults';
import type { Workout } from '@/types';

import type { WorkoutSessionDraft } from './types';

export const resolveWorkoutTemplateRouteState = ({
  workoutId,
  workouts,
  isRestoringState,
}: {
  workoutId?: string | null;
  workouts: Workout[];
  isRestoringState: boolean;
}): { status: 'loading' } | { status: 'not-found' } | { status: 'ready'; workoutId: string } => {
  if (isRestoringState) {
    return { status: 'loading' };
  }

  if (!workoutId) {
    return { status: 'not-found' };
  }

  return workouts.some((workout) => workout.id === workoutId)
    ? { status: 'ready', workoutId }
    : { status: 'not-found' };
};

export const resolveWorkoutProgramRouteState = ({
  programId,
  workouts,
  isRestoringState,
}: {
  programId?: string | null;
  workouts: Workout[];
  isRestoringState: boolean;
}): { status: 'loading' } | { status: 'not-found' } | { status: 'ready'; workoutId: string } => {
  if (isRestoringState) {
    return { status: 'loading' };
  }

  if (!programId) {
    return { status: 'not-found' };
  }

  const workoutIds = new Set(workouts.map((workout) => workout.id));
  if (programId === DEFAULT_WORKOUT_PROGRAM_ID) {
    return { status: 'ready', workoutId: programId };
  }

  return workoutIds.has(programId) ? { status: 'ready', workoutId: programId } : { status: 'not-found' };
};

export const resolveWorkoutSessionRouteState = ({
  workoutId,
  activeDraft,
  workouts,
  isRestoringState,
}: {
  workoutId?: string | null;
  activeDraft: WorkoutSessionDraft | null | undefined;
  workouts: Workout[];
  isRestoringState: boolean;
}): { status: 'loading' } | { status: 'not-found' } | { status: 'ready'; workoutId: string } => {
  if (isRestoringState || activeDraft === undefined) {
    return { status: 'loading' };
  }

  const resolvedWorkoutId = activeDraft?.workoutId ?? workoutId;

  if (!resolvedWorkoutId) {
    return { status: 'not-found' };
  }

  if (resolvedWorkoutId === 'empty-workout') {
    return { status: 'ready', workoutId: resolvedWorkoutId };
  }

  return workouts.some((workout) => workout.id === resolvedWorkoutId)
    ? { status: 'ready', workoutId: resolvedWorkoutId }
    : { status: 'not-found' };
};
