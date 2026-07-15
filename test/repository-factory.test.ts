import { describe, expect, it, vi, afterEach } from 'vitest';

import * as apiConfig from '@/api';
import * as apiClientModule from '@/api/client';
import { createRepositoryFactory } from '@/repositories';
import type { ApiClient } from '@/api/client';

import { createJwt, createMemoryStorage } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

const makeClient = () => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
} as unknown as ApiClient & { get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> });

describe('repository factory', () => {
  it('builds the live auth and profile clients from the centralized api config', async () => {
    const storage = createMemoryStorage();
    const apiClient = makeClient();
    const baseUrlSpy = vi.spyOn(apiConfig, 'getMobileApiBaseUrl').mockReturnValue(apiConfig.PRODUCTION_API_BASE_URL);
    const createApiClientSpy = vi.spyOn(apiClientModule, 'createApiClient').mockReturnValue(apiClient);

    const envelope = {
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        displayName: 'Alice',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      device: {
        id: 'device-1',
        userId: 'user-1',
        deviceName: 'iPhone 15',
        platform: 'ios',
        appVersion: '1.0.0',
        lastSeenAt: '2026-01-01T00:00:00.000Z',
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        deviceId: 'device-1',
        expiresAt: '2026-01-01T01:00:00.000Z',
        revokedAt: null,
      },
      accessToken: createJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      refreshToken: createJwt({ exp: Math.floor(Date.now() / 1000) + 7200 }),
      tokenType: 'Bearer' as const,
    };

    apiClient.post.mockResolvedValueOnce(envelope);
    apiClient.get.mockResolvedValueOnce({ user: envelope.user });

    const provider = createRepositoryFactory(storage);
    const service = provider.getAuthService();

    expect(baseUrlSpy).toHaveBeenCalledTimes(1);
    expect(createApiClientSpy).toHaveBeenCalledWith({ baseUrl: apiConfig.PRODUCTION_API_BASE_URL });

    const session = await service.register({ email: 'alice@example.com', password: 'StrongPass123!' });
    const profile = await service.fetchProfile();

    expect(session.user.email).toBe('alice@example.com');
    expect(profile?.email).toBe('alice@example.com');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/auth/register',
      expect.objectContaining({ email: 'alice@example.com', password: 'StrongPass123!' }),
      { retry: false },
    );
    expect(apiClient.get).toHaveBeenCalledWith('/v1/user', expect.objectContaining({ retry: false }));

    baseUrlSpy.mockRestore();
    createApiClientSpy.mockRestore();
  });
});
