import { describe, expect, it } from 'vitest';

import { ApiError, type ApiClient, type ApiRequestOptions } from '@/api/client';
import type { StorageAdapter } from '@/storage';

import {
  PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
} from './accountDataCleanup';
import { AUTH_SESSION_STORAGE_KEY, createAuthService } from './createAuthService';
import { AUTH_TOKENS_STORAGE_KEY, createTokenManager } from './token-manager';
import type { AuthEnvelope } from './types';

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

const createApi = ({
  requestError,
}: {
  requestError?: Error;
} = {}) => {
  const requests: ApiRequestOptions[] = [];
  const api = {
    async post() {
      return envelope;
    },
    async request(options: ApiRequestOptions) {
      requests.push(options);
      if (requestError) throw requestError;
      return { success: true };
    },
  } as unknown as ApiClient;
  return { api, requests };
};

const createSignedInService = async ({
  requestError,
  onAccountDeleted,
}: {
  requestError?: Error;
  onAccountDeleted?: (userId: string) => Promise<void>;
} = {}) => {
  const sessionStorage = createMemoryStorage();
  const tokenStorage = createMemoryStorage();
  const { api, requests } = createApi({ requestError });
  const service = createAuthService({
    apiClient: api,
    sessionStorage,
    tokenManager: createTokenManager(tokenStorage),
    onAccountDeleted,
  });
  await service.login({ email: envelope.user.email, password: 'StrongPass123!' });
  return { requests, service, sessionStorage, tokenStorage };
};

describe('account deletion auth service', () => {
  it('sends only the password and clears local auth after server confirmation', async () => {
    const deletedUsers: string[] = [];
    const setup = await createSignedInService({
      onAccountDeleted: async (userId) => {
        deletedUsers.push(userId);
      },
    });

    await expect(setup.service.deleteAccount('StrongPass123!')).resolves.toEqual({
      localCleanupComplete: true,
    });
    expect(setup.requests).toEqual([
      {
        method: 'DELETE',
        path: '/v1/auth/account',
        body: { password: 'StrongPass123!' },
        headers: { authorization: `Bearer ${envelope.accessToken}` },
        retry: false,
      },
    ]);
    expect(deletedUsers).toEqual(['user-1']);
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
  });

  it('preserves local auth when the backend rejects deletion', async () => {
    const deletedUsers: string[] = [];
    const setup = await createSignedInService({
      requestError: new ApiError({
        code: 'unauthorized',
        message: 'Invalid credentials',
        status: 401,
      }),
      onAccountDeleted: async (userId) => {
        deletedUsers.push(userId);
      },
    });

    await expect(setup.service.deleteAccount('WrongPassword123!')).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(deletedUsers).toEqual([]);
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(true);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(true);
  });

  it('signs out after confirmed deletion even when account-data cleanup must resume', async () => {
    const setup = await createSignedInService({
      onAccountDeleted: async () => {
        throw new Error('cleanup interrupted');
      },
    });

    await expect(setup.service.deleteAccount('StrongPass123!')).resolves.toEqual({
      localCleanupComplete: false,
    });
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
  });

  it('never restores a cached session while deletion cleanup is pending', async () => {
    const setup = await createSignedInService();
    setup.sessionStorage.values.set(
      PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
      JSON.stringify({ userId: 'user-1', requestedAt: '2026-07-25T00:00:00.000Z' }),
    );

    await expect(setup.service.loadSession()).resolves.toBeNull();
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
  });
});
