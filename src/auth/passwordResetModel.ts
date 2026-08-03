import { isApiError } from '@/api/client';

import { isValidPasswordResetToken } from './passwordResetLink';

export type ForgotPasswordErrors = {
  email?: string;
};

export type ResetPasswordErrors = {
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateForgotPassword = (email: string): ForgotPasswordErrors => {
  const normalized = email.trim();
  if (!normalized) return { email: 'Email is required.' };
  if (!EMAIL_PATTERN.test(normalized)) return { email: 'Enter a valid email address.' };
  return {};
};

export const validateResetPassword = (input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): ResetPasswordErrors => {
  const errors: ResetPasswordErrors = {};
  if (!isValidPasswordResetToken(input.token.trim())) {
    errors.token = 'This reset link is invalid or incomplete.';
  }
  if (!input.newPassword) {
    errors.newPassword = 'Enter a new password.';
  } else if (input.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters.';
  }
  if (!input.confirmPassword) {
    errors.confirmPassword = 'Confirm your new password.';
  } else if (input.confirmPassword !== input.newPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
};

export type PasswordResetSubmissionMode = 'forgot' | 'reset';

export const isRejectedPasswordResetTokenError = (error: unknown): boolean =>
  isApiError(error) &&
  (error.code === 'validation_error' ||
    error.code === 'unauthorized' ||
    error.code === 'not_found' ||
    error.code === 'conflict' ||
    error.status === 400 ||
    error.status === 401 ||
    error.status === 404 ||
    error.status === 409);

export const resolvePasswordResetSubmissionError = (
  error: unknown,
  mode: PasswordResetSubmissionMode,
): string => {
  if (!isApiError(error)) {
    return mode === 'forgot'
      ? 'Unable to request a reset link right now. Try again.'
      : 'Unable to reset your password right now. Try again.';
  }

  if (error.code === 'network_error' || error.code === 'timeout') {
    return 'Connect to the internet and try again.';
  }
  if (error.code === 'rate_limited' || error.status === 429) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (mode === 'reset' && isRejectedPasswordResetTokenError(error)) {
    return 'This reset link is invalid or expired. Request a new one.';
  }
  if (error.code === 'unavailable' || (error.status ?? 0) >= 500) {
    return 'The account service is unavailable right now. Try again later.';
  }

  return mode === 'forgot'
    ? 'Unable to request a reset link right now. Try again.'
    : 'Unable to reset your password right now. Try again.';
};
