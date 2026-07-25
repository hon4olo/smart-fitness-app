import { isApiError } from '@/api/client';

export type AccountDeletionValidation = {
  valid: boolean;
  error?: string;
};

const readBackendErrorCode = (body: unknown): string | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const error = (body as Record<string, unknown>).error;
  if (!error || typeof error !== 'object' || Array.isArray(error)) return null;
  const code = (error as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
};

export const validateAccountDeletionPassword = (
  password: string,
): AccountDeletionValidation => {
  const normalized = password.trim();
  if (!normalized) {
    return { valid: false, error: 'Enter your current password.' };
  }
  if (normalized.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters.' };
  }
  return { valid: true };
};

export const getSafeAccountDeletionErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) {
    return 'Unable to delete your account right now. Try again.';
  }

  const backendCode = readBackendErrorCode(error.body);
  if (backendCode === 'AUTH_INVALID_CREDENTIALS') {
    return 'Current password is incorrect.';
  }
  if (
    backendCode === 'AUTH_INVALID_TOKEN' ||
    backendCode === 'AUTH_SESSION_REVOKED' ||
    error.code === 'unauthorized'
  ) {
    return 'Your session expired. Sign in again before deleting the account.';
  }
  if (
    error.code === 'network_error' ||
    error.code === 'timeout' ||
    error.code === 'unavailable'
  ) {
    return 'Connect to the internet and try again. Account deletion cannot be completed offline.';
  }
  if (error.code === 'rate_limited') {
    return 'Too many attempts. Wait a moment and try again.';
  }

  return 'Unable to delete your account right now. Try again.';
};
