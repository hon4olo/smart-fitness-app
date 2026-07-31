import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialWorkoutShareControls,
} from '@/api/social';
import type { WorkoutSession } from '@/types';

import {
  getSocialContentModerationUiState,
  requiresSocialContentEdit,
  type SocialContentModerationUiState,
} from './socialContentModerationUi';

export const DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS: SocialWorkoutShareControls = {
  title: true,
  duration: true,
  exercises: true,
  sets: true,
  load: true,
  repetitions: true,
  rpe: false,
  volume: true,
};

export type ShareWorkoutPreview = {
  title: string | null;
  durationMinutes: number | null;
  exerciseCount: number | null;
  setCount: number | null;
  totalVolume: number | null;
  includesLoad: boolean;
  includesRepetitions: boolean;
  includesRpe: boolean;
};

export type ShareWorkoutError =
  | 'profile_required'
  | 'source_not_ready'
  | 'offline'
  | 'session_expired'
  | 'unavailable'
  | 'generic'
  | SocialContentModerationUiState;

export const normalizeSocialWorkoutShareControls = (
  controls: SocialWorkoutShareControls,
): SocialWorkoutShareControls => {
  if (!controls.exercises) {
    return {
      ...controls,
      exercises: false,
      sets: false,
      load: false,
      repetitions: false,
      rpe: false,
    };
  }
  if (!controls.sets) {
    return {
      ...controls,
      sets: false,
      load: false,
      repetitions: false,
      rpe: false,
    };
  }
  return controls;
};

export const updateSocialWorkoutShareControl = (
  controls: SocialWorkoutShareControls,
  key: keyof SocialWorkoutShareControls,
  value: boolean,
): SocialWorkoutShareControls =>
  normalizeSocialWorkoutShareControls({ ...controls, [key]: value });

export const buildShareWorkoutPreview = (
  session: WorkoutSession,
  controls: SocialWorkoutShareControls,
): ShareWorkoutPreview => {
  const normalized = normalizeSocialWorkoutShareControls(controls);
  const completedSets = session.sets.filter((set) => set.completed !== false);
  const exerciseCount = new Set(completedSets.map((set) => set.exerciseId)).size;
  const startedAt = new Date(session.startedAt).getTime();
  const finishedAt = new Date(session.finishedAt).getTime();
  const durationMinutes = Math.max(
    0,
    Math.floor((finishedAt - startedAt) / 60_000),
  );

  return {
    title: normalized.title ? session.workoutTitle : null,
    durationMinutes: normalized.duration ? durationMinutes : null,
    exerciseCount: normalized.exercises ? exerciseCount : null,
    setCount:
      normalized.exercises && normalized.sets ? completedSets.length : null,
    totalVolume: normalized.volume
      ? completedSets.reduce(
          (total, set) =>
            total + Math.max(0, set.weight) * Math.max(0, set.reps),
          0,
        )
      : null,
    includesLoad:
      normalized.exercises && normalized.sets && normalized.load,
    includesRepetitions:
      normalized.exercises && normalized.sets && normalized.repetitions,
    includesRpe: normalized.exercises && normalized.sets && normalized.rpe,
  };
};

export const canPublishSocialWorkout = (
  caption: string,
  controls: SocialWorkoutShareControls,
): boolean =>
  Boolean(caption.trim()) ||
  Object.values(normalizeSocialWorkoutShareControls(controls)).some(Boolean);

export const getShareWorkoutError = (error: unknown): ShareWorkoutError => {
  const moderationState = getSocialContentModerationUiState(error);
  if (moderationState) return moderationState;

  const socialCode = getSocialApiErrorCode(error);
  if (socialCode === 'SOCIAL_PROFILE_REQUIRED') return 'profile_required';
  if (
    socialCode === 'SOCIAL_WORKOUT_SOURCE_NOT_FOUND' ||
    socialCode === 'SOCIAL_WORKOUT_SOURCE_NOT_COMPLETED'
  ) {
    return 'source_not_ready';
  }
  if (
    socialCode === 'SOCIAL_RELATION_BLOCKED' ||
    socialCode === 'SOCIAL_WORKOUT_POST_EMPTY' ||
    socialCode === 'SOCIAL_WORKOUT_SOURCE_TOO_LARGE'
  ) {
    return 'unavailable';
  }
  if (isApiError(error)) {
    if (error.status === 401 || error.code === 'unauthorized') {
      return 'session_expired';
    }
    if (error.code === 'network_error' || error.code === 'timeout') {
      return 'offline';
    }
  }
  return 'generic';
};

export const shareWorkoutErrorRequiresEdit = (
  error: ShareWorkoutError | 'empty' | null,
): boolean =>
  error !== null &&
  error !== 'empty' &&
  requiresSocialContentEditIfModeration(error);

const requiresSocialContentEditIfModeration = (
  error: ShareWorkoutError,
): boolean => {
  const moderationStates: SocialContentModerationUiState[] = [
    'rejected',
    'review_required',
    'unavailable',
    'timeout',
    'retryable_failure',
    'invalid_result',
  ];
  return moderationStates.includes(error as SocialContentModerationUiState)
    ? requiresSocialContentEdit(error as SocialContentModerationUiState)
    : false;
};
