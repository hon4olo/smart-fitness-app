import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import {
  getSafeChangePasswordErrorMessage,
  validateChangePasswordForm,
} from './changePasswordModel';

describe('validateChangePasswordForm', () => {
  it('requires complete matching credentials', () => {
    expect(
      validateChangePasswordForm({
        currentPassword: '',
        newPassword: 'short',
        confirmPassword: 'different',
      }),
    ).toEqual({
      valid: false,
      errors: {
        currentPassword: 'Enter your current password.',
        newPassword: 'Password must be at least 8 characters.',
        confirmPassword: 'Passwords do not match.',
      },
    });
  });

  it('rejects reuse of the current password', () => {
    expect(
      validateChangePasswordForm({
        currentPassword: 'StrongPass123!',
        newPassword: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      }),
    ).toEqual({
      valid: false,
      errors: {
        newPassword: 'Use a password different from your current password.',
      },
    });
  });

  it('returns trimmed valid values', () => {
    expect(
      validateChangePasswordForm({
        currentPassword: ' StrongPass123! ',
        newPassword: ' NewStrongPass456! ',
        confirmPassword: ' NewStrongPass456! ',
      }),
    ).toEqual({
      valid: true,
      value: {
        currentPassword: 'StrongPass123!',
        newPassword: 'NewStrongPass456!',
      },
    });
  });
});

describe('getSafeChangePasswordErrorMessage', () => {
  it('does not expose backend messages', () => {
    expect(
      getSafeChangePasswordErrorMessage(
        new ApiError({
          code: 'unauthorized',
          status: 401,
          message: 'private backend details',
          body: { error: { message: 'private' } },
        }),
      ),
    ).toBe('Current password is incorrect or your session has expired.');
  });

  it('maps network failures to an actionable message', () => {
    expect(
      getSafeChangePasswordErrorMessage(
        new ApiError({ code: 'network_error', message: 'raw fetch error' }),
      ),
    ).toBe('Connect to the internet and try again.');
  });
});
