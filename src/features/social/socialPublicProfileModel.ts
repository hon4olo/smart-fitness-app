import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialRelationshipDto,
} from '@/api/social';

export type SocialProfileLoadError =
  | 'private'
  | 'blocked'
  | 'blocked_by_viewer'
  | 'not_found'
  | 'offline'
  | 'session_expired'
  | 'generic';

export type SocialActionError =
  | 'offline'
  | 'session_expired'
  | 'unavailable'
  | 'generic';

export type SocialPrimaryAction =
  | 'follow'
  | 'unfollow'
  | 'cancel_request'
  | null;

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;

export const validateSocialLookupUsername = (
  username: string,
): 'required' | 'format' | null => {
  const trimmed = username.trim();
  if (!trimmed) return 'required';
  return USERNAME_PATTERN.test(trimmed) ? null : 'format';
};

export const normalizeSocialLookupUsername = (username: string): string =>
  username.trim().toLowerCase();

export const getSocialProfileLoadError = (
  error: unknown,
): SocialProfileLoadError => {
  const socialCode = getSocialApiErrorCode(error);
  if (socialCode === 'SOCIAL_PROFILE_PRIVATE') return 'private';
  if (socialCode === 'SOCIAL_PROFILE_BLOCKED_BY_VIEWER') {
    return 'blocked_by_viewer';
  }
  if (socialCode === 'SOCIAL_RELATION_BLOCKED') return 'blocked';
  if (socialCode === 'SOCIAL_PROFILE_NOT_FOUND') return 'not_found';
  if (isApiError(error)) {
    if (error.status === 401 || error.code === 'unauthorized') {
      return 'session_expired';
    }
    if (error.code === 'network_error' || error.code === 'timeout') {
      return 'offline';
    }
  }
  return 'generic';
};

export const getSocialActionError = (error: unknown): SocialActionError => {
  const socialCode = getSocialApiErrorCode(error);
  if (
    socialCode === 'SOCIAL_FOLLOW_REQUEST_NOT_FOUND' ||
    socialCode === 'SOCIAL_PROFILE_BLOCKED_BY_VIEWER' ||
    socialCode === 'SOCIAL_PROFILE_NOT_FOUND' ||
    socialCode === 'SOCIAL_PROFILE_PRIVATE' ||
    socialCode === 'SOCIAL_RELATION_BLOCKED' ||
    socialCode === 'SOCIAL_SELF_RELATION'
  ) {
    return 'unavailable';
  }
  if (isApiError(error)) {
    if (error.status === 401 || error.code === 'unauthorized') {
      return 'session_expired';
    }
    if (error.code === 'network_error' || error.code === 'timeout') {
      return 'offline';
    }
  }
  return 'generic';
};

export const getSocialPrimaryAction = (
  relationship: SocialRelationshipDto | null,
): SocialPrimaryAction => {
  if (relationship?.following) return 'unfollow';
  if (relationship?.outgoingRequest) return 'cancel_request';
  return 'follow';
};
