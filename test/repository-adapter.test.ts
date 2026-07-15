import { describe, expect, it, vi } from 'vitest';

import { defaultState } from '@/data/defaults';
import { createRemoteProfileRepository, createRepositoryFactory } from '@/repositories';
import { createTokenManager } from '@/auth';
import type { ApiClient } from '@/api/client';

import { createJwt, createMemoryStorage } from './helpers';

const makeClient = () => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
} as unknown as ApiClient & { get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> });

describe('repository adapter', () => {
  it('keeps the local app repository working independently of the backend client', async () => {
    const storage = createMemoryStorage();
    const provider = createRepositoryFactory(storage);
    const repository = provider.getRepository();

    await repository.saveState(defaultState);
    const loadedState = await repository.loadState();

    expect(loadedState).not.toBeNull();
    await repository.saveState(loadedState!);
    expect(storage.write).toHaveBeenCalled();
  });

  it('builds a live auth service when a backend client is provided', async () => {
    const storage = createMemoryStorage();
    const apiClient = makeClient();
    apiClient.post.mockResolvedValueOnce({
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
      tokenType: 'Bearer',
    });
    const provider = createRepositoryFactory(storage, { apiClient, apiBaseUrl: 'https://api.example.com' });

    const session = await provider.getAuthService().register({ email: 'alice@example.com', password: 'StrongPass123!' });
    expect(session.user.email).toBe('alice@example.com');
  });

  it('fetches and updates the remote profile through the API client', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const accessToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    await tokenManager.saveTokens({ accessToken, refreshToken: accessToken, tokenType: 'Bearer' });
    apiClient.get.mockResolvedValueOnce({ user: { id: 'user-1', email: 'alice@example.com', displayName: 'Alice', avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } });
    apiClient.patch.mockResolvedValueOnce({ user: { id: 'user-1', email: 'alice@example.com', displayName: 'Alice Updated', avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } });

    const repository = createRemoteProfileRepository(apiClient, tokenManager);
    const profile = await repository.fetchProfile();
    const updated = await repository.updateProfile({ displayName: 'Alice Updated' });

    expect(apiClient.get).toHaveBeenCalledWith('/v1/user', expect.objectContaining({ headers: { authorization: `Bearer ${accessToken}` }, retry: false }));
    expect(apiClient.patch).toHaveBeenCalledWith('/v1/user', { displayName: 'Alice Updated' }, expect.objectContaining({ headers: { authorization: `Bearer ${accessToken}` }, retry: false }));
    expect(profile?.email).toBe('alice@example.com');
    expect(updated?.displayName).toBe('Alice Updated');
  });

  it('returns null from the remote profile adapter when there is no access token', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();

    const repository = createRemoteProfileRepository(apiClient, tokenManager);
    await expect(repository.fetchProfile()).resolves.toBeNull();
    await expect(repository.updateProfile({ displayName: 'Alice' })).resolves.toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(apiClient.patch).not.toHaveBeenCalled();
  });
});
