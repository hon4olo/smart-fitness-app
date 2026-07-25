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
    appVersion: '1.0.1',
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

const createApi = (changeError?: Error) => {
  const calls: Array<{ path: string; body: unknown; headers?: Record<string, string> }> = [];
  const api = {
    async post(path: string, body: unknown, options?: { headers?: Record<string, string> }) {
      if (path === '/v1/auth/login') return envelope;
      if (path === '/v1/auth/change-password') {
        calls.push({ path, body, headers: options?.headers });
        if (changeError) throw changeError;
        return { success: true, requiresReauthentication: true };
      }
      throw new Error(`Unexpected path: ${path}`);
    },
  } as unknown as ApiClient;
  return { api, calls };
};

describe('auth service password change', () => {
  it('sends only password fields and clears tokens/session after success', async () => {
    const sessionStorage = createMemoryStorage();
    const tokenStorage = createMemoryStorage();
    const { api, calls } = createApi();
    const service = createAuthService({
      apiClient: api,
      sessionStorage,
      tokenManager: createTokenManager(tokenStorage),
    });

    await service.login({ email: 'user@example.com', password: 'StrongPass123!' });
    await service.changePassword({
      currentPassword: 'StrongPass123!',
      newPassword: 'NewStrongPass456!',
    });

    expect(calls).toEqual([
      {
        path: '/v1/auth/change-password',
        body: {
          currentPassword: 'StrongPass123!',
          newPassword: 'NewStrongPass456!',
        },
        headers: { authorization: `Bearer ${envelope.accessToken}` },
      },
    ]);
    expect(sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
  });

  it('preserves local session when the backend rejects the change', async () => {
    const sessionStorage = createMemoryStorage();
    const tokenStorage = createMemoryStorage();
    const { api } = createApi(
      new ApiError({ code: 'unauthorized', status: 401, message: 'invalid credentials' }),
    );
    const service = createAuthService({
      apiClient: api,
      sessionStorage,
      tokenManager: createTokenManager(tokenStorage),
    });

    await service.login({ email: 'user@example.com', password: 'StrongPass123!' });
    await expect(
      service.changePassword({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewStrongPass456!',
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(true);
    expect(tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(true);
  });
});
