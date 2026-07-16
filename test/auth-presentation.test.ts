import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client/errors';
import { resolveAuthSubmissionErrorMessage } from '@/components/auth/auth-presentation';

describe('auth submission error presentation', () => {
  it('maps invalid input separately from authentication failure', () => {
    const authError = new ApiError({ code: 'unauthorized', message: 'Unauthorized', status: 401 });

    expect(resolveAuthSubmissionErrorMessage(authError, 'login')).toContain('Sign-in details were not accepted');
  });

  it('maps offline network errors to a friendly message', () => {
    const offlineError = new ApiError({ code: 'network_error', message: 'Network request failed', retryable: true });

    expect(resolveAuthSubmissionErrorMessage(offlineError, 'login')).toContain('offline right now');
  });

  it('maps server outages to a separate message', () => {
    const serverError = new ApiError({ code: 'unavailable', message: 'Service unavailable', status: 503, retryable: true });

    expect(resolveAuthSubmissionErrorMessage(serverError, 'register')).toContain('service is unavailable');
  });

  it('falls back to a generic failure for unknown errors', () => {
    expect(resolveAuthSubmissionErrorMessage(new Error('boom'), 'login')).toBe('Something went wrong. Please try again.');
  });
});
