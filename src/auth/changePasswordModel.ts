import { isApiError } from '@/api/client';

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordValidation =
  | { valid: true; value: { currentPassword: string; newPassword: string } }
  | { valid: false; errors: Partial<Record<keyof ChangePasswordFormValues, string>> };

export const validateChangePasswordForm = (
  values: ChangePasswordFormValues,
): ChangePasswordValidation => {
  const currentPassword = values.currentPassword.trim();
  const newPassword = values.newPassword.trim();
  const confirmPassword = values.confirmPassword.trim();
  const errors: Partial<Record<keyof ChangePasswordFormValues, string>> = {};

  if (!currentPassword) errors.currentPassword = 'Enter your current password.';
  else if (currentPassword.length < 8) errors.currentPassword = 'Password must be at least 8 characters.';

  if (!newPassword) errors.newPassword = 'Enter a new password.';
  else if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.';
  else if (newPassword === currentPassword) errors.newPassword = 'Use a password different from your current password.';

  if (!confirmPassword) errors.confirmPassword = 'Confirm your new password.';
  else if (confirmPassword !== newPassword) errors.confirmPassword = 'Passwords do not match.';

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true, value: { currentPassword, newPassword } };
};

export const getSafeChangePasswordErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    if (error.status === 401) return 'Current password is incorrect or your session has expired.';
    if (error.code === 'network_error' || error.code === 'timeout') {
      return 'Connect to the internet and try again.';
    }
    if (error.status === 429) return 'Too many attempts. Wait a moment and try again.';
  }

  return 'Unable to change your password right now. Try again.';
};
