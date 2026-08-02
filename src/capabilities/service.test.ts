import { describe, expect, it } from 'vitest';

import type { ApiClient } from '@/api/client';

import { createCapabilityService } from './service';

const disabledCapability = {
  schemaVersion: 1,
  sourceSupported: true,
  configured: false,
  ready: false,
  enabled: false,
  state: 'disabled',
} as const;

const responseBody = {
  capabilities: {
    schemaVersion: 1,
    managedAvatars: disabledCapability,
    workoutPostImages: disabledCapability,
    mediaModeration: disabledCapability,
    immutableMediaDelivery: disabledCapability,
    passwordReset: disabledCapability,
  },
};

describe('capability service', () => {
  it('loads the public versioned response and forwards cancellation', async () => {
    let requestPath: string | null = null;
    let requestOptions:
      | { signal?: AbortSignal; retry?: { attempts?: number } }
      | undefined;
    const controller = new AbortController();
    const apiClient = {
      get: async (
        path: string,
        options?: {
          signal?: AbortSignal;
          retry?: { attempts?: number };
        },
      ) => {
        requestPath = path;
        requestOptions = options;
        return responseBody;
      },
    } as unknown as ApiClient;

    await expect(
      createCapabilityService(apiClient).load(controller.signal),
    ).resolves.toEqual(responseBody.capabilities);

    expect(requestPath).toBe('/v1/capabilities');
    expect(requestOptions?.signal).toBe(controller.signal);
    expect(requestOptions?.retry?.attempts).toBe(1);
  });

  it('fails closed when the response contains an unknown critical field', async () => {
    const apiClient = {
      get: async () => ({
        ...responseBody,
        capabilities: {
          ...responseBody.capabilities,
          provider: 'hidden',
        },
      }),
    } as unknown as ApiClient;

    await expect(createCapabilityService(apiClient).load()).rejects.toThrow(
      'Invalid application capabilities response',
    );
  });
});
