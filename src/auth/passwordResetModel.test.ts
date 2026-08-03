import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import { PASSWORD_RESET_TOKEN_LENGTH } from './passwordResetLink';
import {
  isRejectedPasswordResetTokenError,
  resolvePasswordResetSubmissionError,
  validateForgotPassword,
  validateResetPassword,
} from './passwordResetModel';

const validToken = 'a'.repeat(PASSWORD_RESET_TOKEN_LENGTH);

describe('password reset model', () => {
  it('validates forgot-password email without account disclosure', () => {
    expect(validateForgotPassword('')).toEqual({ email: 'Email is required.' });
    expect(validateForgotPassword('invalid')).toEqual({
      email: 'Enter a valid email address.',
    });
    expect(validateForgotPassword('user@example.com')).toEqual({});
  });

  it('validates exact reset token and matching password fields', () => {
    expect(
      validateResetPassword({ token: 'short', newPassword: '123', confirmPassword: '456' }),
    ).toEqual({
      token: 'This reset link is invalid or incomplete.',
      newPassword: 'Password must be at least 8 characters.',
      confirmPassword: 'Passwords do not match.',
    });
    expect(
      validateResetPassword({
        token: validToken,
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    ).toEqual({});
    expect(
      validateResetPassword({
        token: `${'a'.repeat(PASSWORD_RESET_TOKEN_LENGTH - 1)}=`,
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    ).toEqual({ token: 'This reset link is invalid or incomplete.' });
  });

  it('identifies terminal reset-token rejection without reflecting details', () => {
    expect(
      isRejectedPasswordResetTokenError(
        new ApiError({ code: 'validation_error', message: 'token hash mismatch', status: 400 }),
      ),
    ).toBe(true);
    expect(
      isRejectedPasswordResetTokenError(
        new ApiError({ code: 'network_error', message: 'socket details' }),
      ),
    ).toBe(false);
  });

  it('maps network, rate-limit, invalid-token, and service failures safely', () => {
    expect(
      resolvePasswordResetSubmissionError(
        new ApiError({ code: 'network_error', message: 'raw network details' }),
        'forgot',
      ),
    ).toBe('Connect to the internet and try again.');
    expect(
      resolvePasswordResetSubmissionError(
        new ApiError({ code: 'rate_limited', message: 'raw limit details', status: 429 }),
        'forgot',
      ),
    ).toBe('Too many attempts. Wait a moment and try again.');
    expect(
      resolvePasswordResetSubmissionError(
        new ApiError({ code: 'validation_error', message: 'token hash mismatch', status: 400 }),
        'reset',
      ),
    ).toBe('This reset link is invalid or expired. Request a new one.');
    expect(
      resolvePasswordResetSubmissionError(
        new ApiError({ code: 'unavailable', message: 'database failed', status: 503 }),
        'reset',
      ),
    ).toBe('The account service is unavailable right now. Try again later.');
  });
});
