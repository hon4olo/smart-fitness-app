import type { SocialProfileDto } from './contracts';

export const SOCIAL_MEDIA_SCHEMA_VERSION = 1 as const;
export const SOCIAL_MEDIA_UPLOAD_SCHEMA_VERSION = 1 as const;
export const SOCIAL_MEDIA_MODERATION_POLICY_VERSION = 'social-image-v1' as const;

export const SOCIAL_MEDIA_STATES = [
  'upload_pending',
  'quarantined',
  'processing',
  'review_required',
  'approved',
  'rejected',
  'failed',
  'deleted',
] as const;
export type SocialMediaState = (typeof SOCIAL_MEDIA_STATES)[number];

export const SOCIAL_MEDIA_STATE_REASON_CODES = [
  'upload_expired',
  'worker_lease_expired',
  'validation_failed',
  'moderation_review_required',
  'moderation_rejected',
  'processing_failed',
  'delivery_generation_failed',
  'user_deleted',
  'account_deleted',
  'retention_expired',
] as const;
export type SocialMediaStateReasonCode =
  (typeof SOCIAL_MEDIA_STATE_REASON_CODES)[number];

export const SOCIAL_MEDIA_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;
export type SocialMediaUploadType = (typeof SOCIAL_MEDIA_UPLOAD_TYPES)[number];

export const SOCIAL_MEDIA_MODERATION_DECISIONS = [
  'allow',
  'review_required',
  'reject',
] as const;
export type SocialMediaModerationDecision =
  (typeof SOCIAL_MEDIA_MODERATION_DECISIONS)[number];

export const SOCIAL_MEDIA_MODERATION_REASON_CODES = [
  'explicit_sexual_content',
  'sexualized_minor_safety',
  'graphic_violent_content',
  'hateful_symbol',
  'self_harm_content',
  'personal_data_exposure',
  'spam_or_scam',
  'ambiguous_nudity',
  'ambiguous_sensitive_context',
  'ocr_rejected',
  'ocr_review_required',
  'classifier_unavailable',
  'classifier_timeout',
  'classifier_invalid_result',
  'classifier_failed',
  'ocr_unavailable',
  'ocr_timeout',
  'ocr_invalid_result',
  'ocr_failed',
] as const;
export type SocialMediaModerationReasonCode =
  (typeof SOCIAL_MEDIA_MODERATION_REASON_CODES)[number];

export const SOCIAL_MEDIA_MODERATION_FAILURE_CODES = [
  'classifier_unavailable',
  'classifier_timeout',
  'classifier_retry_exhausted',
  'classifier_invalid_result',
  'classifier_non_retryable_failure',
  'ocr_unavailable',
  'ocr_timeout',
  'ocr_retry_exhausted',
  'ocr_invalid_result',
  'ocr_non_retryable_failure',
] as const;
export type SocialMediaModerationFailureCode =
  (typeof SOCIAL_MEDIA_MODERATION_FAILURE_CODES)[number];

export type SocialMediaVariantName =
  | 'avatar_64'
  | 'avatar_128'
  | 'avatar_256'
  | 'avatar_512'
  | 'post_320'
  | 'post_640'
  | 'post_1080'
  | 'post_1440';

export type SocialMediaVariantDto = {
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  contentHash: string;
  url: string;
};

export type SocialMediaPublicDescriptorDto = {
  schemaVersion: typeof SOCIAL_MEDIA_SCHEMA_VERSION;
  assetId: string;
  assetType: 'avatar' | 'workout_post_image';
  width: number;
  height: number;
  aspectRatio: number;
  placeholder:
    | { type: 'blurhash'; value: string }
    | { type: 'thumbhash'; value: string }
    | { type: 'average_color'; value: string };
  variants: Partial<Record<SocialMediaVariantName, SocialMediaVariantDto>>;
};

export type SocialMediaValidatedSourceDto = {
  validationVersion: 1;
  mediaType: SocialMediaUploadType;
  byteSize: number;
  width: number;
  height: number;
  pixelCount: number;
  sha256: string;
};

export type SocialMediaOwnerModerationDto = {
  schemaVersion: 1;
  policyVersion: typeof SOCIAL_MEDIA_MODERATION_POLICY_VERSION;
  decision: SocialMediaModerationDecision;
  reasonCodes: SocialMediaModerationReasonCode[];
  failureCode: SocialMediaModerationFailureCode | null;
  normalizedAt: string;
  moderatedAt: string;
};

export type SocialMediaOwnerAssetDto = {
  schemaVersion: typeof SOCIAL_MEDIA_SCHEMA_VERSION;
  assetId: string;
  assetType: 'avatar' | 'workout_post_image';
  state: SocialMediaState;
  stateVersion: number;
  stateReasonCode: SocialMediaStateReasonCode | null;
  uploadExpiresAt: string | null;
  declaredMediaType: SocialMediaUploadType | null;
  declaredByteSize: number | null;
  source: SocialMediaValidatedSourceDto | null;
  moderation: SocialMediaOwnerModerationDto | null;
  publicDescriptor: SocialMediaPublicDescriptorDto | null;
  createdAt: string;
  updatedAt: string;
  quarantinedAt: string | null;
  failedAt: string | null;
  deletedAt: string | null;
};

export type SignedSocialMediaUploadDto = {
  schemaVersion: typeof SOCIAL_MEDIA_UPLOAD_SCHEMA_VERSION;
  method: 'PUT';
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export type CreateSocialMediaUploadInput = {
  schemaVersion: typeof SOCIAL_MEDIA_UPLOAD_SCHEMA_VERSION;
  assetType: 'avatar';
  mediaType: SocialMediaUploadType;
  byteSize: number;
  idempotencyKey: string;
};

export type CreateSocialMediaUploadResult = {
  asset: SocialMediaOwnerAssetDto;
  upload: SignedSocialMediaUploadDto;
};

export type BindSocialManagedAvatarInput = {
  schemaVersion: typeof SOCIAL_MEDIA_SCHEMA_VERSION;
  assetId: string;
  expectedStateVersion: number;
};

export type BindSocialManagedAvatarResult = {
  profile: SocialProfileDto;
  asset: SocialMediaOwnerAssetDto;
};

export const SOCIAL_MEDIA_API_ERROR_CODES = [
  'SOCIAL_MEDIA_UPLOADS_UNAVAILABLE',
  'SOCIAL_MEDIA_UPLOAD_STORAGE_UNAVAILABLE',
  'SOCIAL_MEDIA_ASSET_NOT_FOUND',
  'SOCIAL_MEDIA_UPLOAD_EXPIRED',
  'SOCIAL_MEDIA_UPLOAD_VALIDATION_FAILED',
  'SOCIAL_MEDIA_UPLOAD_IDEMPOTENCY_KEY_REUSE',
  'SOCIAL_MEDIA_UPLOAD_FINALIZED',
  'SOCIAL_MEDIA_UPLOAD_OBJECT_MISSING',
  'SOCIAL_MEDIA_UPLOAD_OBJECT_MISMATCH',
  'SOCIAL_MEDIA_UPLOAD_STALE_STATE',
  'SOCIAL_MEDIA_AVATAR_NOT_FOUND',
  'SOCIAL_MEDIA_AVATAR_INVALID_TYPE',
  'SOCIAL_MEDIA_AVATAR_NOT_APPROVED',
  'SOCIAL_MEDIA_AVATAR_STALE_STATE',
] as const;
export type SocialMediaApiErrorCode =
  (typeof SOCIAL_MEDIA_API_ERROR_CODES)[number];
