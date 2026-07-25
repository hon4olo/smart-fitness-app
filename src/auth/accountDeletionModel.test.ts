import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import {
  getSafeAccountDeletionErrorMessage,
  validateAccountDeletionPassword,
} from './accountDeletionModel';

describe('validateAccountDeletionPassword', () => {
  it('requires the current password', () => {
    expect(validateAccountDeletionPassword('')).toEqual({
      valid: false,
      error: 'Enter your current password.',
    });
    expect(validateAccountDeletionPassword('short')).toEqual({
      valid: false,
      error: 'Password must be at least 8 characters.',
    });
    expect(validateAccountDeletionPassword('StrongPass123!')).toEqual({ valid: true });
  });
});

describe('getSafeAccountDeletionErrorMessage', () => {
  it('distinguishes invalid credentials without exposing backend copy', () => {
    const error = new ApiError({
      code: 'unauthorized',
      message: 'private backend message',
      status: 401,
      body: { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'private' } },
    });

    expect(getSafeAccountDeletionErrorMessage(error)).toBe(
      'Current password is incorrect.',
    );
  });

  it('requires an online connection for network failures', () => {
    expect(
      getSafeAccountDeletionErrorMessage(
        new ApiError({ code: 'network_error', message: 'raw fetch failure' }),
      ),
    ).toBe(
      'Connect to the internet and try again. Account deletion cannot be completed offline.',
    );
  });

  it('uses a generic message for unknown failures', () => {
    expect(getSafeAccountDeletionErrorMessage(new Error('private details'))).toBe(
      'Unable to delete your account right now. Try again.',
    );
  });
});
