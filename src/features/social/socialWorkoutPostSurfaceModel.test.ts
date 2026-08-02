import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialWorkoutPostDto } from '@/api/social';

import {
  countSocialWorkoutPostSets,
  getSocialWorkoutPostLoadError,
  mergeSocialWorkoutPosts,
  removeSocialWorkoutPost,
} from './socialWorkoutPostSurfaceModel';

const post = (id: string): SocialWorkoutPostDto => ({
  schemaVersion: 2,
  id,
  author: {
    schemaVersion: 1,
    username: 'coach_ivan',
    displayName: 'Ivan',
    bio: null,
    avatarUrl: null,
    visibility: 'public',
    createdAt: '2026-07-31T08:00:00.000Z',
    updatedAt: '2026-07-31T08:00:00.000Z',
  },
  caption: null,
  workout: {
    schemaVersion: 1,
    exercises: [
      { name: 'Squat', sets: [{ weight: 100, reps: 5 }, { reps: 5 }] },
      { name: 'Pull-up' },
    ],
  },
  image: null,
  createdAt: '2026-07-31T08:15:00.000Z',
});

describe('social workout post surface model', () => {
  it('merges cursor pages without duplicate post ids', () => {
    expect(
      mergeSocialWorkoutPosts(
        [post('00000000-0000-4000-8000-000000000001')],
        [
          post('00000000-0000-4000-8000-000000000001'),
          post('00000000-0000-4000-8000-000000000002'),
        ],
      ).map((value) => value.id),
    ).toEqual([
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
    ]);
  });

  it('removes a deleted post and counts only disclosed sets', () => {
    const first = post('00000000-0000-4000-8000-000000000001');
    const second = post('00000000-0000-4000-8000-000000000002');
    expect(removeSocialWorkoutPost([first, second], first.id)).toEqual([second]);
    expect(countSocialWorkoutPostSets(first)).toBe(2);
  });

  it('maps bounded post, profile, cursor, auth, and network errors', () => {
    const apiError = (code: string, status = 403) =>
      new ApiError({
        code: status === 401 ? 'unauthorized' : 'validation_error',
        message: code,
        status,
        body: { code },
      });

    expect(
      getSocialWorkoutPostLoadError(
        apiError('SOCIAL_WORKOUT_POST_INVALID_CURSOR', 400),
      ),
    ).toBe('invalid_cursor');
    expect(
      getSocialWorkoutPostLoadError(apiError('SOCIAL_WORKOUT_POST_NOT_FOUND', 404)),
    ).toBe('not_found');
    expect(
      getSocialWorkoutPostLoadError(apiError('SOCIAL_PROFILE_PRIVATE')),
    ).toBe('private');
    expect(
      getSocialWorkoutPostLoadError(apiError('SOCIAL_RELATION_BLOCKED')),
    ).toBe('blocked');
    expect(
      getSocialWorkoutPostLoadError(apiError('AUTH_INVALID_TOKEN', 401)),
    ).toBe('session_expired');
    expect(
      getSocialWorkoutPostLoadError(
        new ApiError({ code: 'network_error', message: 'Offline' }),
      ),
    ).toBe('offline');
    expect(getSocialWorkoutPostLoadError(new Error('unknown'))).toBe('generic');
  });
});
