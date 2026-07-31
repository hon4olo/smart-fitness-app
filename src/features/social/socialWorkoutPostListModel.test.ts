import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialWorkoutPostDto } from '@/api/social';

import {
  getSocialWorkoutPostListError,
  getSocialWorkoutPostStats,
  mergeSocialWorkoutPostPages,
} from './socialWorkoutPostListModel';

const profile = {
  schemaVersion: 1 as const,
  username: 'coach_ivan',
  displayName: 'Ivan',
  bio: null,
  avatarUrl: null,
  visibility: 'public' as const,
  createdAt: '2026-07-31T08:00:00.000Z',
  updatedAt: '2026-07-31T08:00:00.000Z',
};

const post = (id: string, createdAt: string): SocialWorkoutPostDto => ({
  schemaVersion: 1,
  id,
  author: profile,
  caption: null,
  workout: {
    schemaVersion: 1,
    durationMinutes: 45,
    exercises: [
      { name: 'Bench Press', sets: [{ reps: 8 }, { reps: 10 }] },
    ],
    totalVolume: 1340,
  },
  createdAt,
});

describe('social workout post list model', () => {
  it('merges cursor pages without duplicates and keeps newest first', () => {
    const older = post(
      '4d1792e8-7fe8-4dde-96c9-760f696529a8',
      '2026-07-30T09:00:00.000Z',
    );
    const newer = post(
      '5d1792e8-7fe8-4dde-96c9-760f696529a9',
      '2026-07-31T09:00:00.000Z',
    );
    expect(mergeSocialWorkoutPostPages([older], [newer, older])).toEqual([
      newer,
      older,
    ]);
  });

  it('derives only bounded public workout stats', () => {
    expect(
      getSocialWorkoutPostStats(
        post(
          '4d1792e8-7fe8-4dde-96c9-760f696529a8',
          '2026-07-31T09:00:00.000Z',
        ),
      ),
    ).toEqual({
      durationMinutes: 45,
      exerciseCount: 1,
      setCount: 2,
      totalVolume: 1340,
    });
  });

  it('contains API failures in bounded list states', () => {
    expect(
      getSocialWorkoutPostListError(
        new ApiError({ code: 'network_error', message: 'offline' }),
      ),
    ).toBe('offline');
    expect(
      getSocialWorkoutPostListError(
        new ApiError({
          code: 'forbidden',
          message: 'private',
          status: 403,
          body: { code: 'SOCIAL_PROFILE_PRIVATE' },
        }),
      ),
    ).toBe('unavailable');
  });
});
