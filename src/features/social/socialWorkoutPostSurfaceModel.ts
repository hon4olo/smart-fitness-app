import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialWorkoutPostDto,
} from '@/api/social';
import type { SupportedLocale } from '@/localization';

export type SocialWorkoutPostLoadError =
  | 'invalid_cursor'
  | 'not_found'
  | 'private'
  | 'blocked'
  | 'offline'
  | 'session_expired'
  | 'generic';

export const mergeSocialWorkoutPosts = (
  existing: SocialWorkoutPostDto[],
  incoming: SocialWorkoutPostDto[],
): SocialWorkoutPostDto[] => {
  const ids = new Set(existing.map((post) => post.id));
  const merged = [...existing];
  for (const post of incoming) {
    if (ids.has(post.id)) continue;
    ids.add(post.id);
    merged.push(post);
  }
  return merged;
};

export const removeSocialWorkoutPost = (
  posts: SocialWorkoutPostDto[],
  postId: string,
): SocialWorkoutPostDto[] => posts.filter((post) => post.id !== postId);

export const getSocialWorkoutPostLoadError = (
  error: unknown,
): SocialWorkoutPostLoadError => {
  const code = getSocialApiErrorCode(error);
  if (code === 'SOCIAL_WORKOUT_POST_INVALID_CURSOR') return 'invalid_cursor';
  if (
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

export const formatSocialWorkoutPostDate = (
  value: string,
  locale: SupportedLocale,
): string =>
  new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const countSocialWorkoutPostSets = (post: SocialWorkoutPostDto): number =>
  post.workout.exercises?.reduce(
    (total, exercise) => total + (exercise.sets?.length ?? 0),
    0,
  ) ?? 0;
