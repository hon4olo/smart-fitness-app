export const SOCIAL_PROFILE_DTO_SCHEMA_VERSION = 1 as const;
export const SOCIAL_RELATIONSHIP_DTO_SCHEMA_VERSION = 1 as const;

export type SocialProfileVisibility = 'public' | 'private';

export type SocialProfileDto = {
  schemaVersion: typeof SOCIAL_PROFILE_DTO_SCHEMA_VERSION;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: SocialProfileVisibility;
  createdAt: string;
  updatedAt: string;
};

export type SocialRelationshipDto = {
  schemaVersion: typeof SOCIAL_RELATIONSHIP_DTO_SCHEMA_VERSION;
  following: boolean;
  followedBy: boolean;
  outgoingRequest: boolean;
  incomingRequest: boolean;
  blockedByViewer: boolean;
  blocksViewer: boolean;
};

export type SocialProfileViewDto = {
  profile: SocialProfileDto;
  relationship: SocialRelationshipDto;
};

export type UpsertOwnSocialProfileInput = {
  username: string;
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  visibility?: SocialProfileVisibility;
};

export const SOCIAL_API_ERROR_CODES = [
  'SOCIAL_FOLLOW_REQUEST_NOT_FOUND',
  'SOCIAL_PROFILE_BLOCKED_BY_VIEWER',
  'SOCIAL_PROFILE_NOT_FOUND',
  'SOCIAL_PROFILE_PRIVATE',
  'SOCIAL_PROFILE_REQUIRED',
  'SOCIAL_RELATION_BLOCKED',
  'SOCIAL_SELF_RELATION',
  'SOCIAL_USERNAME_TAKEN',
  'SOCIAL_WORKOUT_POST_EMPTY',
  'SOCIAL_WORKOUT_POST_INVALID_CURSOR',
  'SOCIAL_WORKOUT_POST_NOT_FOUND',
  'SOCIAL_WORKOUT_SOURCE_NOT_COMPLETED',
  'SOCIAL_WORKOUT_SOURCE_NOT_FOUND',
  'SOCIAL_WORKOUT_SOURCE_TOO_LARGE',
] as const;

export type SocialApiErrorCode = (typeof SOCIAL_API_ERROR_CODES)[number];

export type SocialApiAuth = {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
};
