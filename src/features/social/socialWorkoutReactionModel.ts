import { isApiError } from '@/api/client';
import { getSocialApiErrorCode } from '@/api/social';

export type SocialWorkoutReactionError =
  | 'offline'
  | 'session_expired'
  | 'profile_required'
  | 'unavailable'
  | 'generic';

export const getSocialWorkoutReactionError = (
  error: unknown,
): SocialWorkoutReactionError => {
  const code = getSocialApiErrorCode(error);
  if (code === 'SOCIAL_PROFILE_REQUIRED') return 'profile_required';
  if (
    code === 'SOCIAL_WORKOUT_POST_NOT_FOUND' ||
    code === 'SOCIAL_PROFILE_PRIVATE' ||
    code === 'SOCIAL_RELATION_BLOCKED' ||
    code === 'SOCIAL_PROFILE_BLOCKED_BY_VIEWER'
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
