export const SOCIAL_PROFILE_DTO_SCHEMA_VERSION = 1 as const;
export const SOCIAL_PROFILE_LIST_DTO_SCHEMA_VERSION = 1 as const;
export const SOCIAL_RELATIONSHIP_DTO_SCHEMA_VERSION = 1 as const;

export type SocialProfileVisibility = "public" | "private";

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

export type SocialProfileListItemDto = {
  profile: SocialProfileDto;
  createdAt: string;
};

export type SocialProfileListPageDto = {
  schemaVersion: typeof SOCIAL_PROFILE_LIST_DTO_SCHEMA_VERSION;
  items: SocialProfileListItemDto[];
  nextCursor: string | null;
};

export type ListSocialProfilesInput = {
  limit?: number;
  cursor?: string;
};

export type UpsertOwnSocialProfileInput = {
  username: string;
  displayName?: string;
  bio?: string | null;
  visibility?: SocialProfileVisibility;
};

export const SOCIAL_CONTENT_MODERATION_ERROR_CODES = [
  "SOCIAL_CONTENT_MODERATION_REJECTED",
  "SOCIAL_CONTENT_MODERATION_REVIEW_REQUIRED",
  "SOCIAL_CONTENT_MODERATION_UNAVAILABLE",
  "SOCIAL_CONTENT_MODERATION_TIMEOUT",
  "SOCIAL_CONTENT_MODERATION_RETRYABLE_FAILURE",
  "SOCIAL_CONTENT_MODERATION_INVALID_RESULT",
] as const;

export type SocialContentModerationErrorCode =
  (typeof SOCIAL_CONTENT_MODERATION_ERROR_CODES)[number];

export const SOCIAL_API_ERROR_CODES = [
  "SOCIAL_CONTENT_MODERATION_REJECTED",
  "SOCIAL_CONTENT_MODERATION_REVIEW_REQUIRED",
  "SOCIAL_CONTENT_MODERATION_UNAVAILABLE",
  "SOCIAL_CONTENT_MODERATION_TIMEOUT",
  "SOCIAL_CONTENT_MODERATION_RETRYABLE_FAILURE",
  "SOCIAL_CONTENT_MODERATION_INVALID_RESULT",
  "SOCIAL_FOLLOW_REQUEST_NOT_FOUND",
  "SOCIAL_MEDIA_ASSET_NOT_FOUND",
  "SOCIAL_MEDIA_AVATAR_INVALID_TYPE",
  "SOCIAL_MEDIA_AVATAR_NOT_APPROVED",
  "SOCIAL_MEDIA_AVATAR_NOT_FOUND",
  "SOCIAL_MEDIA_AVATAR_STALE_STATE",
  "SOCIAL_MEDIA_UPLOADS_UNAVAILABLE",
  "SOCIAL_MEDIA_UPLOAD_EXPIRED",
  "SOCIAL_MEDIA_UPLOAD_FINALIZED",
  "SOCIAL_MEDIA_UPLOAD_IDEMPOTENCY_KEY_REUSE",
  "SOCIAL_MEDIA_UPLOAD_OBJECT_MISMATCH",
  "SOCIAL_MEDIA_UPLOAD_OBJECT_MISSING",
  "SOCIAL_MEDIA_UPLOAD_STALE_STATE",
  "SOCIAL_MEDIA_UPLOAD_STORAGE_UNAVAILABLE",
  "SOCIAL_MEDIA_UPLOAD_VALIDATION_FAILED",
  "SOCIAL_NOTIFICATION_INVALID_CURSOR",
  "SOCIAL_NOTIFICATION_NOT_FOUND",
  "SOCIAL_PROFILE_BLOCKED_BY_VIEWER",
  "SOCIAL_PROFILE_NOT_FOUND",
  "SOCIAL_PROFILE_PRIVATE",
  "SOCIAL_PROFILE_REQUIRED",
  "SOCIAL_RATE_LIMITED",
  "SOCIAL_RELATION_BLOCKED",
  "SOCIAL_RELATION_LIST_INVALID_CURSOR",
  "SOCIAL_REPORT_SELF_NOT_ALLOWED",
  "SOCIAL_REPORT_TARGET_NOT_FOUND",
  "SOCIAL_SELF_RELATION",
  "SOCIAL_USERNAME_TAKEN",
  "SOCIAL_WORKOUT_COMMENT_IDEMPOTENCY_KEY_REUSE",
  "SOCIAL_WORKOUT_COMMENT_INVALID_CURSOR",
  "SOCIAL_WORKOUT_COMMENT_NOT_FOUND",
  "SOCIAL_WORKOUT_POST_EMPTY",
  "SOCIAL_WORKOUT_POST_INVALID_CURSOR",
  "SOCIAL_WORKOUT_POST_NOT_FOUND",
  "SOCIAL_WORKOUT_SOURCE_NOT_COMPLETED",
  "SOCIAL_WORKOUT_SOURCE_NOT_FOUND",
  "SOCIAL_WORKOUT_SOURCE_TOO_LARGE",
] as const;

export type SocialApiErrorCode = (typeof SOCIAL_API_ERROR_CODES)[number];

export type SocialApiAuth = {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
};
