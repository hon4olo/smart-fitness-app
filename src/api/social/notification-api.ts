import type { ApiClient } from '@/api/client';

import {
  buildSocialListQuery,
  requestSocialApiWithAuth,
  requireSocialPathSegment,
} from './authenticated-request';
import type { SocialApiAuth } from './contracts';
import type {
  ListSocialNotificationsInput,
  SocialNotificationDto,
  SocialNotificationPageDto,
} from './notification-contracts';
import {
  parseSocialNotificationPageResponse,
  parseSocialNotificationResponse,
} from './notification-parsers';

export type SocialNotificationApi = {
  listNotifications(
    input?: ListSocialNotificationsInput,
  ): Promise<SocialNotificationPageDto>;
  markNotificationRead(notificationId: string): Promise<SocialNotificationDto>;
};

export const createSocialNotificationApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient,
): SocialNotificationApi => ({
  async listNotifications(input = {}) {
    return parseSocialNotificationPageResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        'GET',
        `/v1/social/notifications${buildSocialListQuery(
          input,
          'Social notification',
        )}`,
      ),
    );
  },

  async markNotificationRead(notificationId) {
    return parseSocialNotificationResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        'PUT',
        `/v1/social/notifications/${requireSocialPathSegment(
          notificationId,
          'Social notification ID',
        )}/read`,
      ),
    );
  },
});
