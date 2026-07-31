import type { ApiClient } from '@/api/client';

import { requestSocialApiWithAuth } from './authenticated-request';
import type { SocialCapabilitiesDto } from './capability-contracts';
import { parseSocialCapabilitiesResponse } from './capability-parsers';
import type { SocialApiAuth } from './contracts';

export type SocialCapabilityApi = {
  getSocialCapabilities(): Promise<SocialCapabilitiesDto>;
};

export const createSocialCapabilityApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient,
): SocialCapabilityApi => ({
  async getSocialCapabilities() {
    return parseSocialCapabilitiesResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        'GET',
        '/v1/social/capabilities',
      ),
    );
  },
});
