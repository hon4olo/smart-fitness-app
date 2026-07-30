import { describe, expect, it } from 'vitest';

import { ApiError, type ApiClient } from '@/api/client';
import type { StorageAdapter } from '@/storage';

import { AUTH_SESSION_STORAGE_KEY, createAuthService } from './createAuthService';
import { AUTH_TOKENS_STORAGE_KEY, createTokenManager } from './token-manager';
import type { AuthEnvelope } from './types';

const createMemoryStorage = (): StorageAdapter & { values: Map<string, string> } => {
  const values = new Map<string, string>();
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

const envelope: AuthEnvelope = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'User',
    avatarUrl: null,
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
  },
  device: {
    id: 'device-1',
    userId: 'user-1',
    deviceName: 'Test device',
    platform: 'ios',
    appVersion: '1.0.3',
    lastSeenAt: '2026-07-25T00:00:00.000Z',
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    deviceId: 'device-1',
    expiresAt: '2100-01-01T00:00:00.000Z',
    revokedAt: null,
  },
  accessToken: createJwt(),
  refreshToken: createJwt(4_133_980_800),
  tokenType: 'Bearer',
};

type Call = { path: string; body: unknown };

const createApi = (resetError?: Error) => {
  const calls: Call[] = [];
  const api = {
    async post(path: string, body: unknown) {
      if (path === '/v1/auth/login') return envelope;
      calls.push({ path, body });
      if (path === '/v1/auth/forgot-password') return { accepted: true };
      if (path === '/v1/auth/reset-password') {
        if (resetError) throw resetError;
        return { success: true, requiresReauthentication: true };
      }
      throw new Error(`Unexpected path: ${path}`);
    },
  } as unknown as ApiClient;
  return { api, calls };
};

describe('auth service password reset', () => {
  it('requests a reset with only the normalized email payload contract', async () => {
    const { api, calls } = createApi();
    const service = createAuthService({
      apiClient: api,
      sessionStorage: createMemoryStorage(),
      tokenManager: createTokenManager(createMemoryStorage()),
    });

    await service.requestPasswordReset({ email: 'user@example.com' });

    expect(calls).toEqual([
      { path: '/v1/auth/forgot-password', body: { email: 'user@example.com' } },
    ]);
  });

  it('clears any local session after a successful password reset', async () => {
    const sessionStorage = createMemoryStorage();
    const tokenStorage = createMemoryStorage();
    const { api, calls } = createApi();
    const service = createAuthService({
      apiClient: api,
      sessionStorage,
      tokenManager: createTokenManager(tokenStorage),
    });

    await service.login({ email: 'user@example.com', password: 'StrongPass123!' });
    await service.resetPassword({ token: 'a'.repeat(64), newPassword: 'NewStrongPass456!' });

    expect(calls.at(-1)).toEqual({
      path: '/v1/auth/reset-password',
      body: { token: 'a'.repeat(64), newPassword: 'NewStrongPass456!' },
    });
    expect(sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
  });

  it('preserves the local session when reset is rejected', async () => {
    const sessionStorage = createMemoryStorage();
    const tokenStorage = createMemoryStorage();
    const { api } = createApi(
      new ApiError({ code: 'validation_error', status: 400, message: 'invalid token' }),
    );
    const service = createAuthService({
      apiClient: api,
      sessionStorage,
      tokenManager: createTokenManager(tokenStorage),
    });

    await service.login({ email: 'user@example.com', password: 'StrongPass123!' });
    await expect(
      service.resetPassword({ token: 'a'.repeat(64), newPassword: 'NewStrongPass456!' }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(true);
    expect(tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(true);
  });
});
