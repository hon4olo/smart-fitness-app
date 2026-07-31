import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialWorkoutCommentDto,
} from '@/api/social';
import { createUuid } from '@/lib/ids';
import {
  formatLocalizedDateTime,
  type SupportedLocale,
} from '@/localization';

export type SocialWorkoutCommentLoadError =
  | 'invalid_cursor'
  | 'not_found'
  | 'private'
  | 'blocked'
  | 'offline'
  | 'session_expired'
  | 'generic';

export type PendingSocialWorkoutComment = {
  body: string;
  idempotencyKey: string;
};

export const mergeSocialWorkoutComments = (
  existing: SocialWorkoutCommentDto[],
  incoming: SocialWorkoutCommentDto[],
): SocialWorkoutCommentDto[] => {
  const ids = new Set(existing.map((comment) => comment.id));
  const merged = [...existing];
  for (const comment of incoming) {
    if (ids.has(comment.id)) continue;
    ids.add(comment.id);
    merged.push(comment);
  }
  return merged;
};

export const removeSocialWorkoutComment = (
  comments: SocialWorkoutCommentDto[],
  commentId: string,
): SocialWorkoutCommentDto[] =>
  comments.filter((comment) => comment.id !== commentId);

export const buildPendingSocialWorkoutComment = (
  previous: PendingSocialWorkoutComment | null,
  body: string,
  createKey: () => string = createUuid,
): PendingSocialWorkoutComment => {
  const trimmedBody = body.trim();
  if (previous?.body === trimmedBody) return previous;
  return { body: trimmedBody, idempotencyKey: createKey() };
};

export const getSocialWorkoutCommentLoadError = (
  error: unknown,
): SocialWorkoutCommentLoadError => {
  const code = getSocialApiErrorCode(error);
  if (code === 'SOCIAL_WORKOUT_COMMENT_INVALID_CURSOR') return 'invalid_cursor';
  if (
    code === 'SOCIAL_WORKOUT_COMMENT_NOT_FOUND' ||
    code === 'SOCIAL_WORKOUT_POST_NOT_FOUND' ||
    code === 'SOCIAL_PROFILE_NOT_FOUND'
  ) {
    return 'not_found';
  }
  if (code === 'SOCIAL_PROFILE_PRIVATE') return 'private';
  if (
    code === 'SOCIAL_RELATION_BLOCKED' ||
    code === 'SOCIAL_PROFILE_BLOCKED_BY_VIEWER'
  ) {
    return 'blocked';
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

export const isMissingSocialWorkoutCommentError = (error: unknown): boolean =>
  getSocialApiErrorCode(error) === 'SOCIAL_WORKOUT_COMMENT_NOT_FOUND';

export const formatSocialWorkoutCommentDate = (
  value: string,
  locale: SupportedLocale,
): string => formatLocalizedDateTime(value, locale);
