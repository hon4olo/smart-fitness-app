import { createApiClient, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import {
  parseAppCapabilitiesResponse,
  type AppCapabilities,
} from './contracts';

export type CapabilityService = {
  load(signal?: AbortSignal): Promise<AppCapabilities>;
};

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 10_000,
  defaultRetry: { attempts: 1, delayMs: 300, factor: 2 },
});

export const createCapabilityService = (
  apiClient: ApiClient = defaultApiClient,
): CapabilityService => ({
  async load(signal) {
    return parseAppCapabilitiesResponse(
      await apiClient.get<unknown>('/v1/capabilities', {
        retry: { attempts: 1, delayMs: 300, factor: 2 },
        signal,
      }),
    );
  },
});
