import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialApi } from '@/api/social';

import {
  getSocialReportSubmitError,
  submitSocialReport,
} from './socialReportModel';

const receipt = { schemaVersion: 1, received: true } as const;

const createApi = () =>
  ({
    reportProfile: vi.fn().mockResolvedValue(receipt),
    reportWorkoutPost: vi.fn().mockResolvedValue(receipt),
    reportWorkoutComment: vi.fn().mockResolvedValue(receipt),
  }) as unknown as SocialApi;

describe('social report presentation model', () => {
  it('routes each target through the matching API method', async () => {
    const api = createApi();

    await submitSocialReport(api, { type: 'profile', username: 'coach' }, 'spam');
    await submitSocialReport(
      api,
      { type: 'workout_post', postId: 'post-id' },
      'privacy',
    );
    await submitSocialReport(
      api,
      {
        type: 'workout_comment',
        postId: 'post-id',
        commentId: 'comment-id',
      },
      'harassment',
    );

    expect(api.reportProfile).toHaveBeenCalledWith('coach', { reason: 'spam' });
    expect(api.reportWorkoutPost).toHaveBeenCalledWith('post-id', {
      reason: 'privacy',
    });
    expect(api.reportWorkoutComment).toHaveBeenCalledWith(
      'post-id',
      'comment-id',
      { reason: 'harassment' },
    );
  });

  it.each([
    [
      new ApiError({
        code: 'rate_limited',
        message: 'Limited',
        status: 429,
        body: { error: { code: 'SOCIAL_RATE_LIMITED' } },
      }),
      'rate_limited',
    ],
    [
      new ApiError({
        code: 'not_found',
        message: 'Missing',
        status: 404,
        body: { error: { code: 'SOCIAL_REPORT_TARGET_NOT_FOUND' } },
      }),
      'unavailable',
    ],
    [
      new ApiError({
        code: 'validation_error',
        message: 'Self',
        status: 400,
        body: { error: { code: 'SOCIAL_REPORT_SELF_NOT_ALLOWED' } },
      }),
      'unavailable',
    ],
    [new ApiError({ code: 'network_error', message: 'Offline' }), 'offline'],
    [
      new ApiError({
        code: 'unauthorized',
        message: 'Expired',
        status: 401,
      }),
      'session_expired',
    ],
    [new Error('unknown'), 'generic'],
  ] as const)('maps submit failures to bounded states', (error, expected) => {
    expect(getSocialReportSubmitError(error)).toBe(expected);
  });
});
