import type { MessageKey } from './messages';

type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

const validationKeys: Record<string, MessageKey> = {
  'Email is required.': 'auth.validation.emailRequired',
  'Enter a valid email address.': 'auth.validation.emailInvalid',
  'Password is required.': 'auth.validation.passwordRequired',
  'Password must be at least 8 characters.': 'auth.validation.passwordMin',
  'Confirm your password.': 'auth.validation.confirmRequired',
  'Passwords do not match.': 'auth.validation.passwordMismatch',
  'Display name must be 40 characters or less.': 'auth.validation.displayNameMax',
  'Enter a height from 50 to 300 cm.': 'auth.validation.heightRange',
  'Select training experience.': 'auth.validation.trainingExperienceRequired',
  'Enter your current password.': 'auth.validation.currentPasswordRequired',
  'Enter a new password.': 'auth.validation.newPasswordRequired',
  'Use a password different from your current password.': 'auth.validation.newPasswordDifferent',
  'Confirm your new password.': 'auth.validation.confirmNewPasswordRequired',
};

const submissionKeys: Record<string, MessageKey> = {
  'Connection looks offline right now. Check your internet connection and try again.':
    'auth.error.network',
  'The sign-in service is unavailable right now. Please try again in a moment.':
    'auth.error.server',
  'Sign-in details were not accepted. Check your email and password, then try again.':
    'auth.error.invalidCredentials',
  'We could not create your account right now. Check your details and try again.':
    'auth.error.register',
  'Something went wrong. Please try again.': 'auth.error.generic',
};

const changePasswordKeys: Record<string, MessageKey> = {
  'Current password is incorrect or your session has expired.':
    'changePassword.error.incorrect',
  'Connect to the internet and try again.': 'changePassword.error.offline',
  'Too many attempts. Wait a moment and try again.': 'changePassword.error.rateLimit',
  'Unable to change your password right now. Try again.': 'changePassword.error.generic',
};

const deletionKeys: Record<string, MessageKey> = {
  'Current password is incorrect.': 'deleteAccount.error.incorrect',
  'Your session expired. Sign in again before deleting the account.':
    'deleteAccount.error.expired',
  'Connect to the internet and try again. Account deletion cannot be completed offline.':
    'deleteAccount.error.offline',
  'Too many attempts. Wait a moment and try again.': 'deleteAccount.error.rateLimit',
  'Unable to delete your account right now. Try again.': 'deleteAccount.error.generic',
};

const sessionKeys: Record<string, MessageKey> = {
  'Connect to the internet and try again.': 'sessions.error.offline',
  'Your session expired. Sign in again.': 'sessions.error.expired',
  'Too many requests. Wait a moment and try again.': 'sessions.error.rateLimit',
  'Unable to update your signed-in devices right now.': 'sessions.error.generic',
};

const localize = (
  message: string | null | undefined,
  keys: Record<string, MessageKey>,
  fallback: MessageKey,
  t: Translate,
): string | undefined => {
  if (!message) return undefined;
  return t(keys[message] ?? fallback);
};

export const localizeAuthValidation = (message: string | undefined, t: Translate) =>
  localize(message, validationKeys, 'auth.error.generic', t);

export const localizeAuthSubmission = (message: string | null, t: Translate) =>
  localize(message, submissionKeys, 'auth.error.generic', t);

export const localizeChangePasswordMessage = (message: string | null | undefined, t: Translate) =>
  localize(message, { ...validationKeys, ...changePasswordKeys }, 'changePassword.error.generic', t);

export const localizeAccountDeletionMessage = (
  message: string | null | undefined,
  t: Translate,
) => localize(message, { ...validationKeys, ...deletionKeys }, 'deleteAccount.error.generic', t);

export const localizeSessionManagementMessage = (
  message: string | null | undefined,
  t: Translate,
) => localize(message, sessionKeys, 'sessions.error.generic', t);
