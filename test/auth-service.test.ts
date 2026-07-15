import { describe, expect, it, vi } from 'vitest';

import { createAuthService, createTokenManager, AUTH_SESSION_STORAGE_KEY } from '@/auth';
import type { ApiClient } from '@/api/client';
import { ApiError } from '@/api/client';
import type { AuthEnvelope } from '@/auth';

import { createJwt, createMemoryStorage } from './helpers';

const now = () => Math.floor(Date.now() / 1000);

const makeAuthEnvelope = (overrides: Partial<AuthEnvelope> = {}): AuthEnvelope => ({
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
  accessToken: createJwt({ exp: now() + 3600 }),
  refreshToken: createJwt({ exp: now() + 7200 }),
  tokenType: 'Bearer' as const,
  ...overrides,
});

const makeClient = () => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
} as unknown as ApiClient & { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> });

describe('auth service', () => {
  it('registers and persists the returned session', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const envelope = makeAuthEnvelope();
    apiClient.post.mockResolvedValueOnce(envelope);

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    const session = await service.register({ email: 'alice@example.com', password: 'StrongPass123!', displayName: 'Alice' });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/auth/register',
      expect.objectContaining({ email: 'alice@example.com', password: 'StrongPass123!', displayName: 'Alice', deviceName: expect.any(String), platform: expect.any(String), appVersion: expect.any(String) }),
      { retry: false },
    );
    expect(session.user.email).toBe('alice@example.com');
    expect(await tokenManager.getAccessToken()).toBe(envelope.accessToken);
    expect(storage.write).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY, expect.any(String));
  });

  it('logs in and stores the new session', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const envelope = makeAuthEnvelope({ user: { id: 'user-2', email: 'bob@example.com', displayName: null, avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } as never });
    apiClient.post.mockResolvedValueOnce(envelope);

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    const session = await service.login({ email: 'bob@example.com', password: 'StrongPass123!' });

    expect(session.user.id).toBe('user-2');
    expect(await service.isAuthenticated()).toBe(true);
  });

  it('refreshes expired tokens using the refresh token endpoint', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const initial = makeAuthEnvelope({
      accessToken: createJwt({ exp: now() - 10 }),
      refreshToken: createJwt({ exp: now() + 7200 }),
    });
    const refreshed = makeAuthEnvelope({
      accessToken: createJwt({ exp: now() + 3600 }),
      refreshToken: createJwt({ exp: now() + 7200 }),
      session: { ...initial.session, id: 'session-2', expiresAt: '2026-01-01T02:00:00.000Z' },
    });
    apiClient.post.mockResolvedValueOnce(initial).mockResolvedValueOnce(refreshed);

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    await service.login({ email: 'alice@example.com', password: 'StrongPass123!' });
    const nextSession = await service.refresh();

    expect(apiClient.post).toHaveBeenLastCalledWith('/v1/auth/refresh', { refreshToken: initial.refreshToken }, { retry: false });
    expect(nextSession?.session.id).toBe('session-2');
    expect(await tokenManager.getAccessToken()).toBe(refreshed.accessToken);
  });

  it('logs out and clears session storage even when the backend is offline', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    apiClient.post.mockResolvedValueOnce(makeAuthEnvelope());

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    await service.login({ email: 'alice@example.com', password: 'StrongPass123!' });
    apiClient.post.mockRejectedValueOnce(new Error('offline'));

    await service.logout();

    expect(storage.remove).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY);
    expect(await tokenManager.loadTokens()).toBeNull();
  });

  it('fetches the profile with an authenticated access token', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const envelope = makeAuthEnvelope();
    apiClient.post.mockResolvedValueOnce(envelope);
    apiClient.get.mockResolvedValueOnce({ user: envelope.user });

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    await service.login({ email: 'alice@example.com', password: 'StrongPass123!' });
    const profile = await service.fetchProfile();

    expect(apiClient.get).toHaveBeenCalledWith('/v1/user', expect.objectContaining({ headers: { authorization: `Bearer ${envelope.accessToken}` }, retry: false }));
    expect(profile?.email).toBe('alice@example.com');
  });

  it('updates the profile with PATCH /v1/user', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const envelope = makeAuthEnvelope();
    apiClient.post.mockResolvedValueOnce(envelope);
    apiClient.patch.mockResolvedValueOnce({ user: { ...envelope.user, displayName: 'Alice Updated' } });

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    await service.login({ email: 'alice@example.com', password: 'StrongPass123!' });
    const profile = await service.updateProfile({ displayName: 'Alice Updated' });

    expect(apiClient.patch).toHaveBeenCalledWith('/v1/user', { displayName: 'Alice Updated' }, expect.objectContaining({ headers: { authorization: `Bearer ${envelope.accessToken}` }, retry: false }));
    expect(profile?.displayName).toBe('Alice Updated');
  });

  it('auto-refreshes an expired access token before fetching the profile', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const expired = makeAuthEnvelope({ accessToken: createJwt({ exp: now() - 10 }) });
    const refreshed = makeAuthEnvelope({ accessToken: createJwt({ exp: now() + 3600 }), refreshToken: expired.refreshToken });
    apiClient.post.mockResolvedValueOnce(expired).mockResolvedValueOnce(refreshed);
    apiClient.get.mockResolvedValueOnce({ user: refreshed.user });

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    await service.login({ email: 'alice@example.com', password: 'StrongPass123!' });
    const profile = await service.fetchProfile();

    expect(apiClient.post).toHaveBeenLastCalledWith('/v1/auth/refresh', { refreshToken: expired.refreshToken }, { retry: false });
    expect(profile?.id).toBe('user-1');
  });

  it('clears the cached session when refresh is unauthorized', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const envelope = makeAuthEnvelope({ accessToken: createJwt({ exp: now() - 10 }) });
    apiClient.post.mockResolvedValueOnce(envelope).mockRejectedValueOnce(new ApiError({ code: 'unauthorized', status: 401, message: 'unauthorized' }));

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    await service.login({ email: 'alice@example.com', password: 'StrongPass123!' });
    const refreshed = await service.refresh();

    expect(refreshed).toBeNull();
    expect(await tokenManager.loadTokens()).toBeNull();
    expect(await service.loadSession()).toBeNull();
  });
});
