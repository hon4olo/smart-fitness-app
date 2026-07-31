import { isApiError } from '@/api/client';

import {
  SOCIAL_API_ERROR_CODES,
  SOCIAL_PROFILE_DTO_SCHEMA_VERSION,
  SOCIAL_RELATIONSHIP_DTO_SCHEMA_VERSION,
  type SocialApiErrorCode,
  type SocialProfileDto,
  type SocialProfileViewDto,
  type SocialRelationshipDto,
} from './contracts';

const PROFILE_KEYS = [
  'schemaVersion',
  'username',
  'displayName',
  'bio',
  'avatarUrl',
  'visibility',
  'createdAt',
  'updatedAt',
] as const;

const RELATIONSHIP_KEYS = [
  'schemaVersion',
  'following',
  'followedBy',
  'outgoingRequest',
  'incomingRequest',
  'blockedByViewer',
  'blocksViewer',
] as const;

const SOCIAL_ERROR_CODES = new Set<string>(SOCIAL_API_ERROR_CODES);
const SOCIAL_USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
};

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));

const isNullableBoundedString = (
  value: unknown,
  maximumLength: number,
): value is string | null =>
  value === null || (typeof value === 'string' && value.length <= maximumLength);

const isNullableUrl = (value: unknown): value is string | null => {
  if (value === null) return true;
  if (typeof value !== 'string' || value.length === 0 || value.length > 2_048) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const parseSocialProfileDto = (value: unknown): SocialProfileDto => {
  if (!isRecord(value) || !hasExactKeys(value, PROFILE_KEYS)) {
    throw new Error('Invalid social profile response');
  }

  if (
    value.schemaVersion !== SOCIAL_PROFILE_DTO_SCHEMA_VERSION ||
    typeof value.username !== 'string' ||
    !SOCIAL_USERNAME_PATTERN.test(value.username) ||
    typeof value.displayName !== 'string' ||
    value.displayName.length < 1 ||
    value.displayName.length > 80 ||
    !isNullableBoundedString(value.bio, 280) ||
    !isNullableUrl(value.avatarUrl) ||
    (value.visibility !== 'public' && value.visibility !== 'private') ||
    !isIsoDate(value.createdAt) ||
    !isIsoDate(value.updatedAt)
  ) {
    throw new Error('Invalid social profile response');
  }

  return {
    schemaVersion: SOCIAL_PROFILE_DTO_SCHEMA_VERSION,
    username: value.username,
    displayName: value.displayName,
    bio: value.bio,
    avatarUrl: value.avatarUrl,
    visibility: value.visibility,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

export const parseSocialRelationshipDto = (
  value: unknown,
): SocialRelationshipDto => {
  if (!isRecord(value) || !hasExactKeys(value, RELATIONSHIP_KEYS)) {
    throw new Error('Invalid social relationship response');
  }

  if (
    value.schemaVersion !== SOCIAL_RELATIONSHIP_DTO_SCHEMA_VERSION ||
    typeof value.following !== 'boolean' ||
    typeof value.followedBy !== 'boolean' ||
    typeof value.outgoingRequest !== 'boolean' ||
    typeof value.incomingRequest !== 'boolean' ||
    typeof value.blockedByViewer !== 'boolean' ||
    typeof value.blocksViewer !== 'boolean'
  ) {
    throw new Error('Invalid social relationship response');
  }

  return {
    schemaVersion: SOCIAL_RELATIONSHIP_DTO_SCHEMA_VERSION,
    following: value.following,
    followedBy: value.followedBy,
    outgoingRequest: value.outgoingRequest,
    incomingRequest: value.incomingRequest,
    blockedByViewer: value.blockedByViewer,
    blocksViewer: value.blocksViewer,
  };
};

export const parseOwnSocialProfileResponse = (
  value: unknown,
): SocialProfileDto | null => {
  if (!isRecord(value) || !hasExactKeys(value, ['profile'])) {
    throw new Error('Invalid own social profile response');
  }

  return value.profile === null ? null : parseSocialProfileDto(value.profile);
};

export const parseSocialProfileResponse = (value: unknown): SocialProfileDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['profile'])) {
    throw new Error('Invalid social profile response');
  }

  return parseSocialProfileDto(value.profile);
};

export const parseSocialProfileViewResponse = (
  value: unknown,
): SocialProfileViewDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['profile', 'relationship'])) {
    throw new Error('Invalid social profile view response');
  }

  return {
    profile: parseSocialProfileDto(value.profile),
    relationship: parseSocialRelationshipDto(value.relationship),
  };
};

export const parseSocialRelationshipResponse = (
  value: unknown,
): SocialRelationshipDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['relationship'])) {
    throw new Error('Invalid social relationship response');
  }

  return parseSocialRelationshipDto(value.relationship);
};

export const getSocialApiErrorCode = (
  error: unknown,
): SocialApiErrorCode | null => {
  if (!isApiError(error) || !isRecord(error.body)) return null;
  const candidate = error.body.code ?? error.body.error;
  return typeof candidate === 'string' && SOCIAL_ERROR_CODES.has(candidate)
    ? (candidate as SocialApiErrorCode)
    : null;
};
