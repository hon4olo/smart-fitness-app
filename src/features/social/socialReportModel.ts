import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialApi,
  type SocialReportReasonCode,
  type SocialReportReceiptDto,
} from '@/api/social';

export type SocialReportTarget =
  | { type: 'profile'; username: string }
  | { type: 'workout_post'; postId: string }
  | { type: 'workout_comment'; postId: string; commentId: string };

export type SocialReportSubmitError =
  | 'rate_limited'
  | 'offline'
  | 'session_expired'
  | 'unavailable'
  | 'generic';

export const submitSocialReport = (
  socialApi: SocialApi,
  target: SocialReportTarget,
  reason: SocialReportReasonCode,
): Promise<SocialReportReceiptDto> => {
  if (target.type === 'profile') {
    return socialApi.reportProfile(target.username, { reason });
  }
  if (target.type === 'workout_post') {
    return socialApi.reportWorkoutPost(target.postId, { reason });
  }
  return socialApi.reportWorkoutComment(target.postId, target.commentId, {
    reason,
  });
};

export const getSocialReportSubmitError = (
  error: unknown,
): SocialReportSubmitError => {
  const socialCode = getSocialApiErrorCode(error);
  if (socialCode === 'SOCIAL_RATE_LIMITED') return 'rate_limited';
  if (
    socialCode === 'SOCIAL_REPORT_SELF_NOT_ALLOWED' ||
    socialCode === 'SOCIAL_REPORT_TARGET_NOT_FOUND'
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
