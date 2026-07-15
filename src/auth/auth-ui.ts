import type { AuthProfile, AuthSession } from './types';

export type AuthGateStatus = 'restoring' | 'signed_out' | 'signed_in' | 'auth_error';

export type AuthFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  form?: string;
};

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
};

export type AuthDisclosureCopy = {
  localData: string;
  accountAccess: string;
  currentScope: string;
};

export type ProfileAuthViewModel = {
  status: AuthGateStatus;
  title: string;
  description: string;
  localDataCopy: string;
  accountAccessCopy: string;
  currentScopeCopy: string;
  emailLabel?: string;
  displayNameLabel?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

export const AUTH_DISCLOSURE_COPY: AuthDisclosureCopy = {
  localData: 'Local data stays on this device.',
  accountAccess: 'Signing in enables account access for sync and backup.',
  currentScope: 'This build does not sync workouts, nutrition, or progress yet.',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeText = (value: string): string => value.trim();

const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(normalizeText(value));

export const getSafeLoginErrorMessage = (): string => 'Unable to sign in right now. Check your details and try again.';

export const getSafeRegisterErrorMessage = (): string => 'Unable to create your account right now. Check your details and try again.';

export const validateLoginForm = ({ email, password }: LoginFormValues): AuthFieldErrors => {
  const errors: AuthFieldErrors = {};

  if (!normalizeText(email)) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!normalizeText(password)) {
    errors.password = 'Password is required.';
  } else if (normalizeText(password).length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
};

export const validateRegisterForm = ({ email, password, confirmPassword, displayName }: RegisterFormValues): AuthFieldErrors => {
  const errors = validateLoginForm({ email, password });

  if (!normalizeText(confirmPassword)) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (normalizeText(confirmPassword) !== normalizeText(password)) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (displayName && normalizeText(displayName).length > 40) {
    errors.displayName = 'Display name must be 40 characters or less.';
  }

  return errors;
};

export const resolveAuthGateStatus = ({
  ready,
  session,
  error,
}: {
  ready: boolean;
  session: AuthSession | null;
  error: string | null;
}): AuthGateStatus => {
  if (!ready) {
    return 'restoring';
  }

  if (error) {
    return 'auth_error';
  }

  return session ? 'signed_in' : 'signed_out';
};

const resolveDisplayName = (profile: AuthProfile | null, session: AuthSession | null): string =>
  normalizeText(profile?.displayName ?? session?.user.displayName ?? '') || 'Not set';

const resolveEmail = (profile: AuthProfile | null, session: AuthSession | null): string =>
  profile?.email ?? session?.user.email ?? 'Not available';

export const buildProfileAuthViewModel = ({
  ready,
  session,
  profile,
  error,
}: {
  ready: boolean;
  session: AuthSession | null;
  profile: AuthProfile | null;
  error: string | null;
}): ProfileAuthViewModel => {
  const status = resolveAuthGateStatus({ ready, session, error });
  const accountProfile = profile ?? session?.user ?? null;

  if (status === 'restoring') {
    return {
      status,
      title: 'Restoring account',
      description: 'Checking your cached sign-in before you choose cloud mode.',
      localDataCopy: AUTH_DISCLOSURE_COPY.localData,
      accountAccessCopy: AUTH_DISCLOSURE_COPY.accountAccess,
      currentScopeCopy: AUTH_DISCLOSURE_COPY.currentScope,
    };
  }

  if (status === 'auth_error') {
    return {
      status,
      title: 'Account restore issue',
      description: 'We could not restore your account right now. Local data stays on this device.',
      localDataCopy: AUTH_DISCLOSURE_COPY.localData,
      accountAccessCopy: AUTH_DISCLOSURE_COPY.accountAccess,
      currentScopeCopy: AUTH_DISCLOSURE_COPY.currentScope,
      primaryActionLabel: 'Sign in',
      secondaryActionLabel: 'Create account',
    };
  }

  if (status === 'signed_out') {
    return {
      status,
      title: 'Sign in to sync',
      description: 'Local data stays on this device. Signing in enables account access for backup.',
      localDataCopy: AUTH_DISCLOSURE_COPY.localData,
      accountAccessCopy: AUTH_DISCLOSURE_COPY.accountAccess,
      currentScopeCopy: AUTH_DISCLOSURE_COPY.currentScope,
      primaryActionLabel: 'Sign in',
      secondaryActionLabel: 'Create account',
    };
  }

  return {
    status,
    title: 'Account',
    description: 'Your account is ready. Sync and backup are not active for workouts, nutrition, or progress yet.',
    localDataCopy: AUTH_DISCLOSURE_COPY.localData,
    accountAccessCopy: AUTH_DISCLOSURE_COPY.accountAccess,
    currentScopeCopy: AUTH_DISCLOSURE_COPY.currentScope,
    emailLabel: resolveEmail(accountProfile, session),
    displayNameLabel: resolveDisplayName(accountProfile, session),
    primaryActionLabel: 'Refresh profile',
    secondaryActionLabel: 'Logout',
  };
};
