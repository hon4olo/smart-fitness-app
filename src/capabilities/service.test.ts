import { describe, expect, it } from 'vitest';

import { createApiClient } from '@/api/client';

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
    let requestCount = 0;
    let requestUrl: RequestInfo | URL | null = null;
    let requestInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      requestCount += 1;
      requestUrl = input;
      requestInit = init;
      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const apiClient = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl,
    });
    const controller = new AbortController();

    await expect(
      createCapabilityService(apiClient).load(controller.signal),
    ).resolves.toEqual(responseBody.capabilities);

    expect(requestCount).toBe(1);
    expect(String(requestUrl)).toBe(
      'https://api.example.test/v1/capabilities',
    );
    expect(requestInit?.method).toBe('GET');
    expect(requestInit?.signal).toBe(controller.signal);
    expect(new Headers(requestInit?.headers).has('authorization')).toBe(false);
  });

  it('fails closed when the response contains an unknown critical field', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          ...responseBody,
          capabilities: {
            ...responseBody.capabilities,
            provider: 'hidden',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );

    await expect(
      createCapabilityService(
        createApiClient({
          baseUrl: 'https://api.example.test',
          fetchImpl,
        }),
      ).load(),
    ).rejects.toThrow('Invalid application capabilities response');
  });
});
