import { isApiError } from '@/api/client/errors';

type AuthAction = 'login' | 'register';

const NETWORK_MESSAGE = 'Connection looks offline right now. Check your internet connection and try again.';
const SERVER_MESSAGE = 'The sign-in service is unavailable right now. Please try again in a moment.';
const AUTH_MESSAGE = 'Sign-in details were not accepted. Check your email and password, then try again.';
const REGISTER_MESSAGE = 'We could not create your account right now. Check your details and try again.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

const isNetworkLikeError = (error: unknown): boolean => {
  if (!isApiError(error)) {
    return error instanceof TypeError || (error instanceof Error && /network|fetch/i.test(error.message));
  }

  return error.code === 'network_error' || error.code === 'timeout';
};

const isServerLikeError = (error: unknown): boolean => {
  if (!isApiError(error)) {
    return false;
  }

  return error.code === 'unavailable' || (typeof error.status === 'number' && error.status >= 500);
};

const isAuthFailure = (error: unknown): boolean => {
  if (!isApiError(error)) {
    return false;
  }

  return error.code === 'unauthorized' || error.code === 'forbidden' || error.status === 401 || error.status === 403;
};

export const resolveAuthSubmissionErrorMessage = (error: unknown, action: AuthAction): string => {
  if (isNetworkLikeError(error)) {
    return NETWORK_MESSAGE;
  }

  if (isServerLikeError(error)) {
    return SERVER_MESSAGE;
  }

  if (isAuthFailure(error)) {
    return AUTH_MESSAGE;
  }

  if (action === 'register') {
    return REGISTER_MESSAGE;
  }

  return GENERIC_MESSAGE;
};
