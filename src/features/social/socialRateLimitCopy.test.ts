import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import { getSocialRateLimitMessage } from './socialRateLimitCopy';

const rateLimitError = (retryAfterSeconds?: unknown): ApiError =>
  new ApiError({
    code: 'rate_limited',
    message: 'Too many social write requests',
    status: 429,
    body: {
      error: {
        code: 'SOCIAL_RATE_LIMITED',
        details:
          retryAfterSeconds === undefined ? undefined : { retryAfterSeconds },
      },
    },
  });

describe('social rate-limit copy', () => {
  it('formats bounded seconds and rounded minutes in English and Russian', () => {
    expect(getSocialRateLimitMessage(rateLimitError(42), 'en')).toBe(
      'Too many actions. Try again in 42 sec.',
    );
    expect(getSocialRateLimitMessage(rateLimitError(61), 'en')).toBe(
      'Too many actions. Try again in about 2 min.',
    );
    expect(getSocialRateLimitMessage(rateLimitError(61), 'ru')).toBe(
      'Слишком много действий. Повторите попытку примерно через 2 мин.',
    );
  });

  it('uses bounded fallback copy when details are missing or malformed', () => {
    expect(getSocialRateLimitMessage(rateLimitError(), 'ru')).toBe(
      'Слишком много действий. Повторите попытку позже.',
    );
    expect(getSocialRateLimitMessage(rateLimitError('soon'), 'en')).toBe(
      'Too many actions. Try again later.',
    );
  });

  it('returns null for unrelated failures', () => {
    expect(
      getSocialRateLimitMessage(
        new ApiError({
          code: 'network_error',
          message: 'offline',
        }),
        'en',
      ),
    ).toBeNull();
  });
});
