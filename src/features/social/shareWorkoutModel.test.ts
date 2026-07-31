import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import type { WorkoutSession } from '@/types';

import {
  buildShareWorkoutPreview,
  canPublishSocialWorkout,
  DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS,
  getShareWorkoutError,
  updateSocialWorkoutShareControl,
} from './shareWorkoutModel';

const session: WorkoutSession = {
  id: '4d1792e8-7fe8-4dde-96c9-760f696529a8',
  workoutId: 'workout-1',
  workoutTitle: 'Upper body',
  startedAt: '2026-07-31T08:00:00.000Z',
  finishedAt: '2026-07-31T08:45:00.000Z',
  sets: [
    {
      id: 'set-1',
      exerciseId: 'bench',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
      actualRpe: 8.5,
    },
    {
      id: 'set-2',
      exerciseId: 'bench',
      exerciseName: 'Bench Press',
      weight: 70,
      reps: 10,
      completed: true,
      actualRpe: 9,
    },
  ],
};

describe('share workout model', () => {
  it('builds the preview only from explicitly selected fields', () => {
    expect(
      buildShareWorkoutPreview(session, {
        ...DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS,
        load: false,
        rpe: false,
      }),
    ).toEqual({
      title: 'Upper body',
      durationMinutes: 45,
      exerciseCount: 1,
      setCount: 2,
      totalVolume: 1340,
      includesLoad: false,
      includesRepetitions: true,
      includesRpe: false,
    });
  });

  it('turns off dependent set fields when exercises or sets are hidden', () => {
    expect(
      updateSocialWorkoutShareControl(
        DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS,
        'exercises',
        false,
      ),
    ).toMatchObject({
      exercises: false,
      sets: false,
      load: false,
      repetitions: false,
      rpe: false,
    });
    expect(
      updateSocialWorkoutShareControl(
        DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS,
        'sets',
        false,
      ),
    ).toMatchObject({
      exercises: true,
      sets: false,
      load: false,
      repetitions: false,
      rpe: false,
    });
  });

  it('requires caption or at least one selected workout field', () => {
    const hidden = Object.fromEntries(
      Object.keys(DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS).map((key) => [key, false]),
    ) as typeof DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS;
    expect(canPublishSocialWorkout('', hidden)).toBe(false);
    expect(canPublishSocialWorkout('Progress', hidden)).toBe(true);
  });

  it('maps retryable and private failures to bounded presentation states', () => {
    const socialError = (code: string) =>
      new ApiError({
        code: 'not_found',
        message: 'Private diagnostic',
        status: 404,
        body: { code },
      });
    expect(getShareWorkoutError(socialError('SOCIAL_PROFILE_REQUIRED'))).toBe(
      'profile_required',
    );
    expect(
      getShareWorkoutError(socialError('SOCIAL_WORKOUT_SOURCE_NOT_FOUND')),
    ).toBe('source_not_ready');
    expect(
      getShareWorkoutError(
        new ApiError({ code: 'network_error', message: 'offline' }),
      ),
    ).toBe('offline');
  });
});
