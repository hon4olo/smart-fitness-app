import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client/errors';

import { createProductionCloudProvider } from './createProductionCloudProvider';

describe('production cloud provider authentication refresh', () => {
  it('refreshes an expired access token during pull and retries the same cursor request', async () => {
    const request = vi
      .fn()
      .mockImplementationOnce(async (input: Record<string, unknown>) => {
        expect(input).toMatchObject({
          method: 'POST',
          path: '/v1/sync/pull',
          body: { deviceId: 'device-a', clientRevision: 12 },
          headers: { authorization: 'Bearer token-a' },
          retry: false,
        });
        throw new ApiError({ code: 'unauthorized', message: 'expired', status: 401 });
      })
      .mockImplementationOnce(async (input: Record<string, unknown>) => {
        expect(input).toMatchObject({
          method: 'POST',
          path: '/v1/sync/pull',
          body: { deviceId: 'device-a', clientRevision: 12 },
          headers: { authorization: 'Bearer token-b' },
          retry: false,
        });
        return {
          status: 'idle',
          serverRevision: 12,
          serverTimestamp: '2026-07-24T05:30:00.000Z',
          changedEntities: [],
          deletedEntities: [],
        };
      });
    const authService = {
      getAccessToken: vi.fn().mockResolvedValue('token-a'),
      refresh: vi.fn().mockResolvedValue({ tokens: { accessToken: 'token-b' } }),
      getCurrentSession: vi.fn().mockResolvedValue({
        user: { id: 'user-a' },
        device: { id: 'device-a' },
      }),
    };
    const cursorStore = {
      get: vi.fn().mockResolvedValue({ serverRevision: 12 }),
    };
    const provider = createProductionCloudProvider({
      apiClient: { request } as never,
      authService: authService as never,
      cursorStore: cursorStore as never,
      now: () => '2026-07-24T05:30:01.000Z',
    });

    const result = await provider.pullChanges();

    expect(result.operations).toEqual([]);
    expect(result.serverRevision).toBe(12);
    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(authService.getCurrentSession).toHaveBeenCalledTimes(1);
    expect(cursorStore.get).toHaveBeenCalledWith('user-a');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('fails closed when refresh cannot produce a replacement token', async () => {
    const request = vi.fn().mockRejectedValue(
      new ApiError({ code: 'unauthorized', message: 'expired', status: 401 }),
    );
    const authService = {
      getAccessToken: vi
        .fn()
        .mockResolvedValueOnce('token-a')
        .mockResolvedValueOnce(null),
      refresh: vi.fn().mockResolvedValue(null),
      getCurrentSession: vi.fn().mockResolvedValue({
        user: { id: 'user-a' },
        device: { id: 'device-a' },
      }),
    };
    const provider = createProductionCloudProvider({
      apiClient: { request } as never,
      authService: authService as never,
      cursorStore: { get: vi.fn().mockResolvedValue({ serverRevision: 4 }) } as never,
    });

    await expect(provider.pullChanges()).rejects.toThrow('authentication required');

    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(authService.getAccessToken).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
