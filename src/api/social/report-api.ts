import type { ApiClient } from '@/api/client';

import {
  requestSocialApiWithAuth,
  requireSocialPathSegment,
} from './authenticated-request';
import type { SocialApiAuth } from './contracts';
import {
  SOCIAL_REPORT_REASON_CODES,
  type CreateSocialReportInput,
  type SocialReportReasonCode,
  type SocialReportReceiptDto,
} from './report-contracts';
import { parseSocialReportResponse } from './report-parsers';

const REPORT_REASONS = new Set<string>(SOCIAL_REPORT_REASON_CODES);

const requireReportInput = (
  input: CreateSocialReportInput,
): { reason: SocialReportReasonCode } => {
  if (
    !input ||
    typeof input.reason !== 'string' ||
    !REPORT_REASONS.has(input.reason)
  ) {
    throw new Error('Social report reason is invalid');
  }
  return { reason: input.reason as SocialReportReasonCode };
};

export type SocialReportApi = {
  reportProfile(
    username: string,
    input: CreateSocialReportInput,
  ): Promise<SocialReportReceiptDto>;
  reportWorkoutPost(
    postId: string,
    input: CreateSocialReportInput,
  ): Promise<SocialReportReceiptDto>;
  reportWorkoutComment(
    postId: string,
    commentId: string,
    input: CreateSocialReportInput,
  ): Promise<SocialReportReceiptDto>;
};

export const createSocialReportApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient,
): SocialReportApi => ({
  async reportProfile(username, input) {
    return parseSocialReportResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        'POST',
        `/v1/social/reports/profiles/${requireSocialPathSegment(
          username,
          'Social profile username',
        )}`,
        requireReportInput(input),
      ),
    );
  },

  async reportWorkoutPost(postId, input) {
    return parseSocialReportResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        'POST',
        `/v1/social/reports/workout-posts/${requireSocialPathSegment(
          postId,
          'Social workout post ID',
        )}`,
        requireReportInput(input),
      ),
    );
  },

  async reportWorkoutComment(postId, commentId, input) {
    return parseSocialReportResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        'POST',
        `/v1/social/reports/workout-posts/${requireSocialPathSegment(
          postId,
          'Social workout post ID',
        )}/comments/${requireSocialPathSegment(
          commentId,
          'Social workout comment ID',
        )}`,
        requireReportInput(input),
      ),
    );
  },
});
