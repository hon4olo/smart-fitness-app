import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import { getSocialWorkoutReactionError } from './socialWorkoutReactionModel';

const apiError = (code: string, status: number) =>
  new ApiError({ code, message: code, status });

describe('social workout reaction model', () => {
  it('maps bounded Social and transport failures', () => {
    expect(
      getSocialWorkoutReactionError(apiError('SOCIAL_PROFILE_REQUIRED', 409)),
    ).toBe('profile_required');
    expect(
      getSocialWorkoutReactionError(apiError('SOCIAL_WORKOUT_POST_NOT_FOUND', 404)),
    ).toBe('unavailable');
    expect(
      getSocialWorkoutReactionError(apiError('SOCIAL_PROFILE_PRIVATE', 403)),
    ).toBe('unavailable');
    expect(
      getSocialWorkoutReactionError(apiError('SOCIAL_RELATION_BLOCKED', 403)),
    ).toBe('unavailable');
    expect(getSocialWorkoutReactionError(apiError('unauthorized', 401))).toBe(
      'session_expired',
    );
    expect(getSocialWorkoutReactionError(apiError('network_error', 0))).toBe(
      'offline',
    );
    expect(getSocialWorkoutReactionError(apiError('timeout', 0))).toBe(
      'offline',
    );
  });

  it('uses a bounded generic fallback', () => {
    expect(getSocialWorkoutReactionError(new Error('unexpected'))).toBe(
      'generic',
    );
  });
});
