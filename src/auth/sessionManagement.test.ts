import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import { getSafeSessionManagementError } from './sessionManagement';

describe('getSafeSessionManagementError', () => {
  it('maps network failures without exposing raw transport details', () => {
    expect(
      getSafeSessionManagementError(
        new ApiError({ code: 'network_error', message: 'private fetch details' }),
      ),
    ).toBe('Connect to the internet and try again.');
  });

  it('maps expired authentication to a sign-in instruction', () => {
    expect(
      getSafeSessionManagementError(
        new ApiError({
          code: 'unauthorized',
          message: 'private backend message',
          status: 401,
          body: { error: { code: 'AUTH_SESSION_REVOKED', message: 'private' } },
        }),
      ),
    ).toBe('Your session expired. Sign in again.');
  });

  it('uses a generic message for unknown errors', () => {
    expect(getSafeSessionManagementError(new Error('private details'))).toBe(
      'Unable to update your signed-in devices right now.',
    );
  });
});
