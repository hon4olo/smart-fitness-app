import { describe, expect, it, vi } from 'vitest';

import { AUTH_SESSION_STORAGE_KEY, createAuthService, createTokenManager } from '@/auth';
import type { ApiClient } from '@/api/client';
import { ApiError } from '@/api/client';
import type { AuthEnvelope, AuthSession } from '@/auth';

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

const toStoredSession = (envelope: AuthEnvelope): AuthSession => ({
  user: envelope.user,
  device: envelope.device,
  session: envelope.session,
  tokens: {
    accessToken: envelope.accessToken,
    refreshToken: envelope.refreshToken,
    tokenType: envelope.tokenType,
  },
});

const makeClient = () => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
} as unknown as ApiClient & { get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> });

describe('auth session restore', () => {
  it('restores a cached session without refreshing when the access token is still valid', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const envelope = makeAuthEnvelope();

    await storage.write(AUTH_SESSION_STORAGE_KEY, JSON.stringify(toStoredSession(envelope)));
    await tokenManager.saveTokens(envelope);

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    const session = await service.loadSession();

    expect(session?.user.email).toBe('alice@example.com');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('refreshes an expired access token during restore', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const expired = makeAuthEnvelope({ accessToken: createJwt({ exp: now() - 10 }) });
    const refreshed = makeAuthEnvelope({ accessToken: createJwt({ exp: now() + 3600 }), refreshToken: expired.refreshToken, session: { ...expired.session, id: 'session-2' } });

    await storage.write(AUTH_SESSION_STORAGE_KEY, JSON.stringify(toStoredSession(expired)));
    await tokenManager.saveTokens(expired);
    apiClient.post.mockResolvedValueOnce(refreshed);

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    const session = await service.loadSession();

    expect(apiClient.post).toHaveBeenLastCalledWith('/v1/auth/refresh', { refreshToken: expired.refreshToken }, { retry: false });
    expect(session?.session.id).toBe('session-2');
  });

  it('keeps the cached session when refresh is offline', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const expired = makeAuthEnvelope({ accessToken: createJwt({ exp: now() - 10 }) });

    await storage.write(AUTH_SESSION_STORAGE_KEY, JSON.stringify(toStoredSession(expired)));
    await tokenManager.saveTokens(expired);
    apiClient.post.mockRejectedValueOnce(new Error('offline'));

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    const session = await service.loadSession();

    expect(session?.user.email).toBe('alice@example.com');
    expect(await tokenManager.loadTokens()).toEqual({
      accessToken: expired.accessToken,
      refreshToken: expired.refreshToken,
      tokenType: 'Bearer',
    });
  });

  it('clears the restore cache when refresh is unauthorized', async () => {
    const storage = createMemoryStorage();
    const tokenManager = createTokenManager(storage);
    const apiClient = makeClient();
    const expired = makeAuthEnvelope({ accessToken: createJwt({ exp: now() - 10 }) });

    await storage.write(AUTH_SESSION_STORAGE_KEY, JSON.stringify(toStoredSession(expired)));
    await tokenManager.saveTokens(expired);
    apiClient.post.mockRejectedValueOnce(new ApiError({ code: 'unauthorized', status: 401, message: 'unauthorized' }));

    const service = createAuthService({ apiClient, tokenManager, sessionStorage: storage });
    const session = await service.loadSession();

    expect(session).toBeNull();
    expect(await tokenManager.loadTokens()).toBeNull();
    expect(await storage.read(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });
});
