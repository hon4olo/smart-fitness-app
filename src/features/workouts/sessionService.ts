import type { Workout } from '@/types';

import {
  clearActiveWorkoutSessionDraft as storageClearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft as storageGetActiveWorkoutSessionDraft,
  getActiveWorkoutSessionStatus as storageGetActiveWorkoutSessionStatus,
  markActiveWorkoutSessionCompleted as storageMarkActiveWorkoutSessionCompleted,
  markActiveWorkoutSessionFinishing as storageMarkActiveWorkoutSessionFinishing,
  setActiveWorkoutSessionDraft,
} from './storage';
import type { WorkoutSessionDraft, WorkoutSessionStatus } from './types';

export const startWorkoutSession = (workout: Workout, startedAt = new Date().toISOString()) => {
  const draft: WorkoutSessionDraft = {
    id: `${Date.now()}`,
    workoutId: workout.id,
    workoutTitle: workout.title,
    startedAt,
    sets: [],
  };

  setActiveWorkoutSessionDraft(draft);
  return draft;
};

export const resumeActiveWorkoutSession = () => storageGetActiveWorkoutSessionDraft();

export const getActiveWorkoutSession = () => storageGetActiveWorkoutSessionDraft();
export const getActiveWorkoutSessionDraft = () => storageGetActiveWorkoutSessionDraft();

export const discardActiveWorkoutSession = () => storageClearActiveWorkoutSessionDraft();
export const clearActiveWorkoutSessionDraft = () => storageClearActiveWorkoutSessionDraft();

export const finishActiveWorkoutSession = () => storageMarkActiveWorkoutSessionFinishing();
export const markActiveWorkoutSessionFinishing = () => storageMarkActiveWorkoutSessionFinishing();

export const completeActiveWorkoutSession = () => storageMarkActiveWorkoutSessionCompleted();
export const markActiveWorkoutSessionCompleted = () => storageMarkActiveWorkoutSessionCompleted();

export const getActiveWorkoutSessionStatus = (): WorkoutSessionStatus => storageGetActiveWorkoutSessionStatus();

export const isActiveWorkoutSessionStatus = (status: WorkoutSessionStatus) => status === 'starting' || status === 'active' || status === 'finishing';
