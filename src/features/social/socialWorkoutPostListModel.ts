import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialWorkoutPostDto,
} from '@/api/social';

export type SocialWorkoutPostListError =
  | 'offline'
  | 'session_expired'
  | 'unavailable'
  | 'generic';

export type SocialWorkoutPostStats = {
  durationMinutes: number | null;
  exerciseCount: number | null;
  setCount: number | null;
  totalVolume: number | null;
};

export const mergeSocialWorkoutPostPages = (
  current: SocialWorkoutPostDto[],
  incoming: SocialWorkoutPostDto[],
): SocialWorkoutPostDto[] => {
  const byId = new Map(current.map((post) => [post.id, post]));
  for (const post of incoming) byId.set(post.id, post);
  return [...byId.values()].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
};

export const getSocialWorkoutPostStats = (
  post: SocialWorkoutPostDto,
): SocialWorkoutPostStats => ({
  durationMinutes: post.workout.durationMinutes ?? null,
  exerciseCount: post.workout.exercises?.length ?? null,
  setCount:
    post.workout.exercises?.reduce(
      (count, exercise) => count + (exercise.sets?.length ?? 0),
      0,
    ) ?? null,
  totalVolume: post.workout.totalVolume ?? null,
});

export const getSocialWorkoutPostListError = (
  error: unknown,
): SocialWorkoutPostListError => {
  const socialCode = getSocialApiErrorCode(error);
  if (
    socialCode === 'SOCIAL_PROFILE_PRIVATE' ||
    socialCode === 'SOCIAL_RELATION_BLOCKED' ||
    socialCode === 'SOCIAL_WORKOUT_POST_INVALID_CURSOR' ||
    socialCode === 'SOCIAL_WORKOUT_POST_NOT_FOUND'
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
