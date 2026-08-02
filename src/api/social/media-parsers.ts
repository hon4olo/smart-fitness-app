import { parseSocialProfileDto } from "./parsers";
import {
  SOCIAL_MEDIA_MODERATION_DECISIONS,
  SOCIAL_MEDIA_MODERATION_FAILURE_CODES,
  SOCIAL_MEDIA_MODERATION_POLICY_VERSION,
  SOCIAL_MEDIA_MODERATION_REASON_CODES,
  SOCIAL_MEDIA_SCHEMA_VERSION,
  SOCIAL_MEDIA_STATE_REASON_CODES,
  SOCIAL_MEDIA_STATES,
  SOCIAL_MEDIA_UPLOAD_SCHEMA_VERSION,
  SOCIAL_MEDIA_UPLOAD_TYPES,
  type BindSocialManagedAvatarResult,
  type CreateSocialMediaUploadResult,
  type SignedSocialMediaUploadDto,
  type SocialMediaOwnerAssetDto,
  type SocialMediaOwnerModerationDto,
  type SocialMediaPublicDescriptorDto,
  type SocialMediaValidatedSourceDto,
  type SocialMediaVariantDto,
  type SocialMediaVariantName,
} from "./media-contracts";

const OWNER_ASSET_KEYS = [
  "schemaVersion",
  "assetId",
  "assetType",
  "state",
  "stateVersion",
  "stateReasonCode",
  "uploadExpiresAt",
  "declaredMediaType",
  "declaredByteSize",
  "source",
  "moderation",
  "publicDescriptor",
  "createdAt",
  "updatedAt",
  "quarantinedAt",
  "failedAt",
  "deletedAt",
] as const;
const DESCRIPTOR_KEYS = [
  "schemaVersion",
  "assetId",
  "assetType",
  "width",
  "height",
  "aspectRatio",
  "placeholder",
  "variants",
] as const;
const VARIANT_KEYS = [
  "width",
  "height",
  "mimeType",
  "contentHash",
  "url",
] as const;
const SOURCE_KEYS = [
  "validationVersion",
  "mediaType",
  "byteSize",
  "width",
  "height",
  "pixelCount",
  "sha256",
] as const;
const MODERATION_KEYS = [
  "schemaVersion",
  "policyVersion",
  "decision",
  "reasonCodes",
  "failureCode",
  "normalizedAt",
  "moderatedAt",
] as const;

const stateSet = new Set<string>(SOCIAL_MEDIA_STATES);
const reasonSet = new Set<string>(SOCIAL_MEDIA_STATE_REASON_CODES);
const uploadTypeSet = new Set<string>(SOCIAL_MEDIA_UPLOAD_TYPES);
const moderationDecisionSet = new Set<string>(
  SOCIAL_MEDIA_MODERATION_DECISIONS,
);
const moderationReasonSet = new Set<string>(
  SOCIAL_MEDIA_MODERATION_REASON_CODES,
);
const moderationFailureSet = new Set<string>(
  SOCIAL_MEDIA_MODERATION_FAILURE_CODES,
);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === expectedKeys.length &&
    expectedKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(value, key),
    )
  );
};

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  !Number.isNaN(Date.parse(value));
const isNullableIsoDate = (value: unknown): value is string | null =>
  value === null || isIsoDate(value);
const isPositiveInteger = (value: unknown, maximum: number): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value > 0 &&
  value <= maximum;

const parseVariant = (
  value: unknown,
  assetId: string,
  name: SocialMediaVariantName,
): SocialMediaVariantDto => {
  if (!isRecord(value) || !hasExactKeys(value, VARIANT_KEYS)) {
    throw new Error("Invalid managed media variant response");
  }
  if (
    !isPositiveInteger(value.width, 4096) ||
    !isPositiveInteger(value.height, 4096) ||
    value.mimeType !== "image/jpeg" ||
    typeof value.contentHash !== "string" ||
    !SHA256_PATTERN.test(value.contentHash) ||
    typeof value.url !== "string" ||
    value.url.length > 2048
  ) {
    throw new Error("Invalid managed media variant response");
  }
  const url = new URL(value.url);
  const expectedPath = `/public/social-media/v1/${assetId}/${name}/${value.contentHash}.jpg`;
  if (url.protocol !== "https:" || url.pathname !== expectedPath) {
    throw new Error("Invalid managed media variant response");
  }
  return {
    width: value.width,
    height: value.height,
    mimeType: "image/jpeg",
    contentHash: value.contentHash,
    url: value.url,
  };
};

const parsePlaceholder = (
  value: unknown,
): SocialMediaPublicDescriptorDto["placeholder"] => {
  if (!isRecord(value) || !hasExactKeys(value, ["type", "value"])) {
    throw new Error("Invalid managed media placeholder response");
  }
  if (value.type === "average_color") {
    if (
      typeof value.value !== "string" ||
      !/^#[0-9a-f]{6}$/u.test(value.value)
    ) {
      throw new Error("Invalid managed media placeholder response");
    }
    return { type: "average_color", value: value.value };
  }
  if (value.type === "blurhash" || value.type === "thumbhash") {
    if (
      typeof value.value !== "string" ||
      value.value.length < 6 ||
      value.value.length > 512
    ) {
      throw new Error("Invalid managed media placeholder response");
    }
    return { type: value.type, value: value.value };
  }
  throw new Error("Invalid managed media placeholder response");
};

export const parseSocialMediaPublicDescriptorDto = (
  value: unknown,
): SocialMediaPublicDescriptorDto => {
  if (!isRecord(value) || !hasExactKeys(value, DESCRIPTOR_KEYS)) {
    throw new Error("Invalid managed media descriptor response");
  }
  if (
    value.schemaVersion !== SOCIAL_MEDIA_SCHEMA_VERSION ||
    typeof value.assetId !== "string" ||
    !UUID_PATTERN.test(value.assetId) ||
    (value.assetType !== "avatar" &&
      value.assetType !== "workout_post_image") ||
    !isPositiveInteger(value.width, 4096) ||
    !isPositiveInteger(value.height, 4096) ||
    typeof value.aspectRatio !== "number" ||
    !Number.isFinite(value.aspectRatio) ||
    value.aspectRatio <= 0 ||
    Math.abs(value.aspectRatio - value.width / value.height) > 0.001 ||
    !isRecord(value.variants)
  ) {
    throw new Error("Invalid managed media descriptor response");
  }
  const expectedNames: SocialMediaVariantName[] =
    value.assetType === "avatar"
      ? ["avatar_64", "avatar_128", "avatar_256", "avatar_512"]
      : ["post_320", "post_640", "post_1080", "post_1440"];
  if (!hasExactKeys(value.variants, expectedNames)) {
    throw new Error("Invalid managed media descriptor response");
  }
  const variants: SocialMediaPublicDescriptorDto["variants"] = {};
  for (const name of expectedNames) {
    variants[name] = parseVariant(value.variants[name], value.assetId, name);
  }
  return {
    schemaVersion: SOCIAL_MEDIA_SCHEMA_VERSION,
    assetId: value.assetId,
    assetType: value.assetType,
    width: value.width,
    height: value.height,
    aspectRatio: value.aspectRatio,
    placeholder: parsePlaceholder(value.placeholder),
    variants,
  };
};

const parseSource = (value: unknown): SocialMediaValidatedSourceDto => {
  if (!isRecord(value) || !hasExactKeys(value, SOURCE_KEYS)) {
    throw new Error("Invalid managed media source response");
  }
  if (
    value.validationVersion !== 1 ||
    typeof value.mediaType !== "string" ||
    !uploadTypeSet.has(value.mediaType) ||
    !isPositiveInteger(value.byteSize, 15 * 1024 * 1024) ||
    !isPositiveInteger(value.width, 12_000) ||
    !isPositiveInteger(value.height, 12_000) ||
    value.pixelCount !== value.width * value.height ||
    typeof value.sha256 !== "string" ||
    !SHA256_PATTERN.test(value.sha256)
  ) {
    throw new Error("Invalid managed media source response");
  }
  return value as SocialMediaValidatedSourceDto;
};

const parseModeration = (value: unknown): SocialMediaOwnerModerationDto => {
  if (!isRecord(value) || !hasExactKeys(value, MODERATION_KEYS)) {
    throw new Error("Invalid managed media moderation response");
  }
  if (
    value.schemaVersion !== 1 ||
    value.policyVersion !== SOCIAL_MEDIA_MODERATION_POLICY_VERSION ||
    typeof value.decision !== "string" ||
    !moderationDecisionSet.has(value.decision) ||
    !Array.isArray(value.reasonCodes) ||
    value.reasonCodes.length > 16 ||
    !value.reasonCodes.every(
      (reason) => typeof reason === "string" && moderationReasonSet.has(reason),
    ) ||
    (value.failureCode !== null &&
      (typeof value.failureCode !== "string" ||
        !moderationFailureSet.has(value.failureCode))) ||
    !isIsoDate(value.normalizedAt) ||
    !isIsoDate(value.moderatedAt)
  ) {
    throw new Error("Invalid managed media moderation response");
  }
  return value as SocialMediaOwnerModerationDto;
};

export const parseSocialMediaOwnerAssetDto = (
  value: unknown,
): SocialMediaOwnerAssetDto => {
  if (!isRecord(value) || !hasExactKeys(value, OWNER_ASSET_KEYS)) {
    throw new Error("Invalid managed media asset response");
  }
  if (
    value.schemaVersion !== SOCIAL_MEDIA_SCHEMA_VERSION ||
    typeof value.assetId !== "string" ||
    !UUID_PATTERN.test(value.assetId) ||
    (value.assetType !== "avatar" &&
      value.assetType !== "workout_post_image") ||
    typeof value.state !== "string" ||
    !stateSet.has(value.state) ||
    !isPositiveInteger(value.stateVersion, Number.MAX_SAFE_INTEGER) ||
    (value.stateReasonCode !== null &&
      (typeof value.stateReasonCode !== "string" ||
        !reasonSet.has(value.stateReasonCode))) ||
    !isNullableIsoDate(value.uploadExpiresAt) ||
    (value.declaredMediaType !== null &&
      (typeof value.declaredMediaType !== "string" ||
        !uploadTypeSet.has(value.declaredMediaType))) ||
    (value.declaredByteSize !== null &&
      !isPositiveInteger(value.declaredByteSize, 15 * 1024 * 1024)) ||
    !isIsoDate(value.createdAt) ||
    !isIsoDate(value.updatedAt) ||
    !isNullableIsoDate(value.quarantinedAt) ||
    !isNullableIsoDate(value.failedAt) ||
    !isNullableIsoDate(value.deletedAt)
  ) {
    throw new Error("Invalid managed media asset response");
  }
  return {
    schemaVersion: SOCIAL_MEDIA_SCHEMA_VERSION,
    assetId: value.assetId,
    assetType: value.assetType,
    state: value.state as SocialMediaOwnerAssetDto["state"],
    stateVersion: value.stateVersion,
    stateReasonCode:
      value.stateReasonCode as SocialMediaOwnerAssetDto["stateReasonCode"],
    uploadExpiresAt: value.uploadExpiresAt,
    declaredMediaType:
      value.declaredMediaType as SocialMediaOwnerAssetDto["declaredMediaType"],
    declaredByteSize: value.declaredByteSize,
    source: value.source === null ? null : parseSource(value.source),
    moderation:
      value.moderation === null ? null : parseModeration(value.moderation),
    publicDescriptor:
      value.publicDescriptor === null
        ? null
        : parseSocialMediaPublicDescriptorDto(value.publicDescriptor),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    quarantinedAt: value.quarantinedAt,
    failedAt: value.failedAt,
    deletedAt: value.deletedAt,
  };
};

const parseSignedUpload = (value: unknown): SignedSocialMediaUploadDto => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schemaVersion",
      "method",
      "url",
      "headers",
      "expiresAt",
    ])
  ) {
    throw new Error("Invalid managed media upload response");
  }
  if (
    value.schemaVersion !== SOCIAL_MEDIA_UPLOAD_SCHEMA_VERSION ||
    value.method !== "PUT" ||
    typeof value.url !== "string" ||
    value.url.length < 1 ||
    value.url.length > 4096 ||
    !isRecord(value.headers) ||
    Object.keys(value.headers).length > 32 ||
    !Object.values(value.headers).every(
      (header) => typeof header === "string" && header.length <= 4096,
    ) ||
    !isIsoDate(value.expiresAt)
  ) {
    throw new Error("Invalid managed media upload response");
  }
  return value as SignedSocialMediaUploadDto;
};

export const parseCreateSocialMediaUploadResponse = (
  value: unknown,
): CreateSocialMediaUploadResult => {
  if (!isRecord(value) || !hasExactKeys(value, ["asset", "upload"])) {
    throw new Error("Invalid managed media upload response");
  }
  return {
    asset: parseSocialMediaOwnerAssetDto(value.asset),
    upload: parseSignedUpload(value.upload),
  };
};

export const parseSocialMediaAssetResponse = (
  value: unknown,
): SocialMediaOwnerAssetDto => {
  if (!isRecord(value) || !hasExactKeys(value, ["asset"])) {
    throw new Error("Invalid managed media asset response");
  }
  return parseSocialMediaOwnerAssetDto(value.asset);
};

export const parseOwnManagedAvatarResponse = (
  value: unknown,
): SocialMediaOwnerAssetDto | null => {
  if (!isRecord(value) || !hasExactKeys(value, ["asset"])) {
    throw new Error("Invalid managed avatar response");
  }
  return value.asset === null
    ? null
    : parseSocialMediaOwnerAssetDto(value.asset);
};

export const parseBindManagedAvatarResponse = (
  value: unknown,
): BindSocialManagedAvatarResult => {
  if (!isRecord(value) || !hasExactKeys(value, ["profile", "asset"])) {
    throw new Error("Invalid managed avatar binding response");
  }
  return {
    profile: parseSocialProfileDto(value.profile),
    asset: parseSocialMediaOwnerAssetDto(value.asset),
  };
};
