import { parseSocialProfileDto } from './parsers';
import {
  SOCIAL_WORKOUT_COMMENT_DTO_SCHEMA_VERSION,
  SOCIAL_WORKOUT_COMMENT_PAGE_DTO_SCHEMA_VERSION,
  type SocialWorkoutCommentDto,
  type SocialWorkoutCommentPageDto,
} from './workout-comment-contracts';

const COMMENT_KEYS = ['schemaVersion', 'id', 'author', 'body', 'createdAt'] as const;
const COMMENT_PAGE_KEYS = ['schemaVersion', 'items', 'nextCursor'] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVALID_COMMENT_RESPONSE = 'Invalid social workout comment response';

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

export const parseSocialWorkoutCommentDto = (
  value: unknown,
): SocialWorkoutCommentDto => {
  if (!isRecord(value) || !hasExactKeys(value, COMMENT_KEYS)) {
    throw new Error(INVALID_COMMENT_RESPONSE);
  }
  if (
    value.schemaVersion !== SOCIAL_WORKOUT_COMMENT_DTO_SCHEMA_VERSION ||
    typeof value.id !== 'string' ||
    !UUID_PATTERN.test(value.id) ||
    typeof value.body !== 'string' ||
    value.body.length < 1 ||
    value.body.length > 500 ||
    value.body !== value.body.trim() ||
    !isIsoDate(value.createdAt)
  ) {
    throw new Error(INVALID_COMMENT_RESPONSE);
  }

  try {
    return {
      schemaVersion: SOCIAL_WORKOUT_COMMENT_DTO_SCHEMA_VERSION,
      id: value.id,
      author: parseSocialProfileDto(value.author),
      body: value.body,
      createdAt: value.createdAt,
    };
  } catch {
    throw new Error(INVALID_COMMENT_RESPONSE);
  }
};

export const parseSocialWorkoutCommentResponse = (
  value: unknown,
): SocialWorkoutCommentDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['comment'])) {
    throw new Error(INVALID_COMMENT_RESPONSE);
  }
  return parseSocialWorkoutCommentDto(value.comment);
};

export const parseSocialWorkoutCommentPageResponse = (
  value: unknown,
): SocialWorkoutCommentPageDto => {
  if (!isRecord(value) || !hasExactKeys(value, COMMENT_PAGE_KEYS)) {
    throw new Error('Invalid social workout comment page response');
  }
  if (
    value.schemaVersion !== SOCIAL_WORKOUT_COMMENT_PAGE_DTO_SCHEMA_VERSION ||
    !Array.isArray(value.items) ||
    value.items.length > 50 ||
    (value.nextCursor !== null &&
      (typeof value.nextCursor !== 'string' || value.nextCursor.length === 0))
  ) {
    throw new Error('Invalid social workout comment page response');
  }
  const items = value.items.map(parseSocialWorkoutCommentDto);
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error('Invalid social workout comment page response');
  }
  return {
    schemaVersion: SOCIAL_WORKOUT_COMMENT_PAGE_DTO_SCHEMA_VERSION,
    items,
    nextCursor: value.nextCursor,
  };
};

export const parseDeleteSocialWorkoutCommentResponse = (value: unknown): void => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['success']) ||
    value.success !== true
  ) {
    throw new Error('Invalid social workout comment delete response');
  }
};
