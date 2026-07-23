import { describe, expect, it } from 'vitest';

import type { ApiClient } from '@/api/client';
import type { StorageAdapter } from '@/storage/StorageAdapter';

import { AUTH_SESSION_STORAGE_KEY, createAuthService } from './createAuthService';
import { AUTH_TOKENS_STORAGE_KEY, createTokenManager } from './token-manager';
import type { AuthEnvelope, AuthSession } from './types';

const createMemoryStorage = (
  initial: Record<string, string> = {},
): StorageAdapter & { values: Map<string, string> } => {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
  };
};

const createJwt = (expiresAtSeconds = 4_102_444_800): string => {
  const encode = (value: object) =>
    globalThis
      .btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: expiresAtSeconds })}.signature`;
};

const accessToken = createJwt();
const refreshToken = createJwt(4_133_980_800);

const envelope: AuthEnvelope = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'User',
    avatarUrl: null,
    createdAt: '2026-07-23T10:00:00.000Z',
    updatedAt: '2026-07-23T10:00:00.000Z',
  },
  device: {
    id: 'device-1',
    userId: 'user-1',
    deviceName: 'Test device',
    platform: 'ios',
    appVersion: '1.0.0',
    lastSeenAt: '2026-07-23T10:00:00.000Z',
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    deviceId: 'device-1',
    expiresAt: '2100-01-01T00:00:00.000Z',
    revokedAt: null,
  },
  accessToken,
  refreshToken,
  tokenType: 'Bearer',
};

const runtimeSession: AuthSession = {
  user: envelope.user,
  device: envelope.device,
  session: envelope.session,
  tokens: { accessToken, refreshToken, tokenType: 'Bearer' },
};

const createStubApiClient = (): ApiClient =>
  ({
    async post() {
      return envelope;
    },
  }) as unknown as ApiClient;

describe('auth session cache hardening', () => {
  it('persists runtime tokens only through the token manager', async () => {
    const sessionStorage = createMemoryStorage();
    const tokenStorage = createMemoryStorage();
    const service = createAuthService({
      apiClient: createStubApiClient(),
      sessionStorage,
      tokenManager: createTokenManager(tokenStorage),
    });

    const session = await service.login({ email: 'user@example.com', password: 'password123' });
    const cachedValue = await sessionStorage.read(AUTH_SESSION_STORAGE_KEY);
    const tokenValue = await tokenStorage.read(AUTH_TOKENS_STORAGE_KEY);

    expect(session.tokens).toEqual(runtimeSession.tokens);
    expect(cachedValue).not.toBeNull();
    expect(JSON.parse(cachedValue ?? '{}')).toMatchObject({
      schemaVersion: 2,
      user: { id: 'user-1' },
      device: { id: 'device-1' },
      session: { id: 'session-1' },
    });
    expect(cachedValue).not.toContain(accessToken);
    expect(cachedValue).not.toContain(refreshToken);
    expect(tokenValue).toContain(accessToken);
    expect(tokenValue).toContain(refreshToken);
  });

  it('migrates a legacy cached session by removing duplicated tokens', async () => {
    const sessionStorage = createMemoryStorage({
      [AUTH_SESSION_STORAGE_KEY]: JSON.stringify({
        ...runtimeSession,
        updatedAt: '2026-07-23T10:00:00.000Z',
      }),
    });
    const tokenStorage = createMemoryStorage();
    const tokenManager = createTokenManager(tokenStorage);
    await tokenManager.saveTokens(runtimeSession.tokens);
    const service = createAuthService({
      apiClient: createStubApiClient(),
      sessionStorage,
      tokenManager,
    });

    const restored = await service.loadSession();
    const migratedValue = await sessionStorage.read(AUTH_SESSION_STORAGE_KEY);

    expect(restored).toEqual(runtimeSession);
    expect(JSON.parse(migratedValue ?? '{}')).toMatchObject({ schemaVersion: 2 });
    expect(migratedValue).not.toContain(accessToken);
    expect(migratedValue).not.toContain(refreshToken);
    expect(JSON.parse(migratedValue ?? '{}')).not.toHaveProperty('tokens');
  });

  it('removes stale session metadata when the token manager has no tokens', async () => {
    const sessionStorage = createMemoryStorage({
      [AUTH_SESSION_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 2,
        user: runtimeSession.user,
        device: runtimeSession.device,
        session: runtimeSession.session,
        updatedAt: '2026-07-23T10:00:00.000Z',
      }),
    });
    const service = createAuthService({
      apiClient: createStubApiClient(),
      sessionStorage,
      tokenManager: createTokenManager(createMemoryStorage()),
    });

    expect(await service.loadSession()).toBeNull();
    expect(await sessionStorage.read(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });
});
