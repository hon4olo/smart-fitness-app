import { isApiError } from '@/api/client';
import type {
  SocialApi,
  SocialWorkoutReactionDto,
} from '@/api/social';

export type SocialWorkoutReactionLoadError =
  | 'offline'
  | 'session_expired'
  | 'generic';

type SocialWorkoutReactionApi = Pick<
  SocialApi,
  'reactToWorkoutPost' | 'unreactToWorkoutPost'
>;

export const getSocialWorkoutReactionLoadError = (
  error: unknown,
): SocialWorkoutReactionLoadError => {
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

export const toggleSocialWorkoutReaction = (
  api: SocialWorkoutReactionApi,
  postId: string,
  reaction: SocialWorkoutReactionDto,
): Promise<SocialWorkoutReactionDto> =>
  reaction.reacted
    ? api.unreactToWorkoutPost(postId)
    : api.reactToWorkoutPost(postId);
