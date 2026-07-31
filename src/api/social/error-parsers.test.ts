import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import {
  getSocialApiErrorCode,
  getSocialRateLimitRetryAfterSeconds,
} from './error-parsers';

const apiError = (body: unknown): ApiError =>
  new ApiError({
    code: 'rate_limited',
    message: 'Too many social write requests',
    status: 429,
    body,
  });

describe('social API error parsers', () => {
  it('parses the backend nested error envelope and legacy flat shape', () => {
    expect(
      getSocialApiErrorCode(
        apiError({
          error: {
            code: 'SOCIAL_RATE_LIMITED',
            message: 'Too many social write requests',
            details: { retryAfterSeconds: 42 },
          },
        }),
      ),
    ).toBe('SOCIAL_RATE_LIMITED');
    expect(
      getSocialApiErrorCode(
        apiError({ code: 'SOCIAL_WORKOUT_POST_NOT_FOUND' }),
      ),
    ).toBe('SOCIAL_WORKOUT_POST_NOT_FOUND');
  });

  it('rejects unknown, malformed, and non-API error values', () => {
    expect(getSocialApiErrorCode(apiError({ error: { code: 'PRIVATE_SQL' } }))).toBeNull();
    expect(getSocialApiErrorCode(apiError({ error: 'SOCIAL_RATE_LIMITED' }))).toBeNull();
    expect(getSocialApiErrorCode(new Error('offline'))).toBeNull();
  });

  it('returns only bounded integer retry-after details for rate limits', () => {
    expect(
      getSocialRateLimitRetryAfterSeconds(
        apiError({
          error: {
            code: 'SOCIAL_RATE_LIMITED',
            details: { retryAfterSeconds: 42 },
          },
        }),
      ),
    ).toBe(42);
    expect(
      getSocialRateLimitRetryAfterSeconds(
        apiError({
          error: {
            code: 'SOCIAL_RATE_LIMITED',
            details: { retryAfterSeconds: 1.5 },
          },
        }),
      ),
    ).toBeNull();
    expect(
      getSocialRateLimitRetryAfterSeconds(
        apiError({
          error: {
            code: 'SOCIAL_RATE_LIMITED',
            details: { retryAfterSeconds: 86_401 },
          },
        }),
      ),
    ).toBeNull();
    expect(
      getSocialRateLimitRetryAfterSeconds(
        apiError({
          error: {
            code: 'SOCIAL_PROFILE_NOT_FOUND',
            details: { retryAfterSeconds: 42 },
          },
        }),
      ),
    ).toBeNull();
  });
});
