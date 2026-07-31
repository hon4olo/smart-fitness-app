import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialProfileDto,
  type SocialProfileVisibility,
  type UpsertOwnSocialProfileInput,
} from '@/api/social';

export type SocialProfileFormValues = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  visibility: SocialProfileVisibility;
};

export type SocialProfileFormErrors = Partial<
  Record<'username' | 'displayName' | 'bio' | 'avatarUrl', string>
>;

export type SocialProfileRequestError =
  | 'username_taken'
  | 'offline'
  | 'session_expired'
  | 'generic';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;

export const createSocialProfileFormValues = (
  profile: SocialProfileDto | null,
  fallbackDisplayName: string,
): SocialProfileFormValues => ({
  username: profile?.username ?? '',
  displayName: profile?.displayName ?? fallbackDisplayName.trim(),
  bio: profile?.bio ?? '',
  avatarUrl: profile?.avatarUrl ?? '',
  visibility: profile?.visibility ?? 'public',
});

const isValidUrl = (value: string): boolean => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
};

export const validateSocialProfileForm = (
  values: SocialProfileFormValues,
): SocialProfileFormErrors => {
  const errors: SocialProfileFormErrors = {};
  const username = values.username.trim();
  const displayName = values.displayName.trim();
  const bio = values.bio.trim();
  const avatarUrl = values.avatarUrl.trim();

  if (!username) errors.username = 'required';
  else if (!USERNAME_PATTERN.test(username)) errors.username = 'format';

  if (!displayName) errors.displayName = 'required';
  else if (displayName.length > 80) errors.displayName = 'length';

  if (bio.length > 280) errors.bio = 'length';
  if (!isValidUrl(avatarUrl)) errors.avatarUrl = 'invalid';

  return errors;
};

export const buildSocialProfileInput = (
  values: SocialProfileFormValues,
): UpsertOwnSocialProfileInput => ({
  username: values.username.trim(),
  displayName: values.displayName.trim(),
  bio: values.bio.trim() || null,
  avatarUrl: values.avatarUrl.trim() || null,
  visibility: values.visibility,
});

export const getSocialProfileRequestError = (
  error: unknown,
): SocialProfileRequestError => {
  if (getSocialApiErrorCode(error) === 'SOCIAL_USERNAME_TAKEN') {
    return 'username_taken';
  }
  if (isApiError(error)) {
    if (error.status === 401 || error.code === 'unauthorized') {
      return 'session_expired';
    }
    if (error.code === 'network_error' || error.code === 'timeout') {
      return 'offline';
    }
  }
  if (
    error instanceof Error &&
    (error.message === 'Social authentication expired' ||
      error.message === 'Social authentication is required')
  ) {
    return 'session_expired';
  }
  return 'generic';
};
