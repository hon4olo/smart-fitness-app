import { parseSocialProfileDto } from './parsers';
import {
  SOCIAL_NOTIFICATION_DTO_SCHEMA_VERSION,
  SOCIAL_NOTIFICATION_PAGE_DTO_SCHEMA_VERSION,
  SOCIAL_NOTIFICATION_TYPES,
  type SocialNotificationDto,
  type SocialNotificationPageDto,
  type SocialNotificationType,
} from './notification-contracts';

const NOTIFICATION_KEYS = [
  'schemaVersion',
  'id',
  'type',
  'actor',
  'postId',
  'commentId',
  'readAt',
  'createdAt',
] as const;
const PAGE_KEYS = ['schemaVersion', 'items', 'nextCursor'] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVALID_NOTIFICATION = 'Invalid social notification response';
const INVALID_PAGE = 'Invalid social notification page response';

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

const isUuidOrNull = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && UUID_PATTERN.test(value));

const isIsoDateOrNull = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === 'string' &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value)));

const isNotificationType = (value: unknown): value is SocialNotificationType =>
  typeof value === 'string' &&
  SOCIAL_NOTIFICATION_TYPES.includes(value as SocialNotificationType);

const hasValidTargetShape = (
  type: SocialNotificationType,
  postId: string | null,
  commentId: string | null,
): boolean => {
  if (type === 'follow_request' || type === 'follow_accepted') {
    return postId === null && commentId === null;
  }
  if (type === 'workout_reaction') {
    return postId !== null && commentId === null;
  }
  return postId !== null && commentId !== null;
};

export const parseSocialNotificationDto = (
  value: unknown,
): SocialNotificationDto => {
  if (!isRecord(value) || !hasExactKeys(value, NOTIFICATION_KEYS)) {
    throw new Error(INVALID_NOTIFICATION);
  }
  if (
    value.schemaVersion !== SOCIAL_NOTIFICATION_DTO_SCHEMA_VERSION ||
    typeof value.id !== 'string' ||
    !UUID_PATTERN.test(value.id) ||
    !isNotificationType(value.type) ||
    !isUuidOrNull(value.postId) ||
    !isUuidOrNull(value.commentId) ||
    !isIsoDateOrNull(value.readAt) ||
    typeof value.createdAt !== 'string' ||
    value.createdAt.length === 0 ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    !hasValidTargetShape(value.type, value.postId, value.commentId)
  ) {
    throw new Error(INVALID_NOTIFICATION);
  }

  try {
    return {
      schemaVersion: SOCIAL_NOTIFICATION_DTO_SCHEMA_VERSION,
      id: value.id,
      type: value.type,
      actor: parseSocialProfileDto(value.actor),
      postId: value.postId,
      commentId: value.commentId,
      readAt: value.readAt,
      createdAt: value.createdAt,
    };
  } catch {
    throw new Error(INVALID_NOTIFICATION);
  }
};

export const parseSocialNotificationResponse = (
  value: unknown,
): SocialNotificationDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['notification'])) {
    throw new Error(INVALID_NOTIFICATION);
  }
  return parseSocialNotificationDto(value.notification);
};

export const parseSocialNotificationPageResponse = (
  value: unknown,
): SocialNotificationPageDto => {
  if (!isRecord(value) || !hasExactKeys(value, PAGE_KEYS)) {
    throw new Error(INVALID_PAGE);
  }
  if (
    value.schemaVersion !== SOCIAL_NOTIFICATION_PAGE_DTO_SCHEMA_VERSION ||
    !Array.isArray(value.items) ||
    value.items.length > 50 ||
    (value.nextCursor !== null &&
      (typeof value.nextCursor !== 'string' || value.nextCursor.length === 0))
  ) {
    throw new Error(INVALID_PAGE);
  }
  const items = value.items.map(parseSocialNotificationDto);
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error(INVALID_PAGE);
  }
  return {
    schemaVersion: SOCIAL_NOTIFICATION_PAGE_DTO_SCHEMA_VERSION,
    items,
    nextCursor: value.nextCursor,
  };
};
