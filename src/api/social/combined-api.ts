import { createApiClient, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import {
  createSocialApi as createBaseSocialApi,
  type SocialApi as BaseSocialApi,
} from './api';
import {
  createSocialCapabilityApi,
  type SocialCapabilityApi,
} from './capability-api';
import type { SocialApiAuth } from './contracts';
import { createSocialMediaApi, type SocialMediaApi } from './media-api';
import {
  createSocialNotificationApi,
  type SocialNotificationApi,
} from './notification-api';
import {
  createSocialReportApi,
  type SocialReportApi,
} from './report-api';

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 12_000,
  defaultRetry: { attempts: 1, delayMs: 300, factor: 2 },
});

export type SocialApi = BaseSocialApi &
  SocialCapabilityApi &
  SocialMediaApi &
  SocialNotificationApi &
  SocialReportApi;

export const createSocialApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient = defaultApiClient,
): SocialApi => ({
  ...createBaseSocialApi(auth, apiClient),
  ...createSocialCapabilityApi(auth, apiClient),
  ...createSocialMediaApi(auth, apiClient),
  ...createSocialNotificationApi(auth, apiClient),
  ...createSocialReportApi(auth, apiClient),
});
