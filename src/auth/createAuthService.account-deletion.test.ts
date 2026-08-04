import { describe, expect, it } from 'vitest';

import { ApiError, type ApiClient, type ApiRequestOptions } from '@/api/client';
import type { StorageAdapter } from '@/storage';

import { PENDING_ACCOUNT_CLEANUP_STORAGE_KEY } from './accountDataCleanup';
import {
  PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY,
  type AccountDeletionReceiptIdentity,
  type AccountDeletionReceiptStatusEnvelope,
} from './accountDeletionReceipt';
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
  return `${encode({ alg: 'none' })}.${encode({ exp: expiresAtSeconds })}.signature`;
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

const identity: AccountDeletionReceiptIdentity = {
  schemaVersion: 1,
  userId: 'user-1',
  requestId: '11111111-1111-4111-8111-111111111111',
  statusSecret: 'a'.repeat(64),
  requestedAt: '2026-08-04T18:00:00.000Z',
};

const statusEnvelope = (
  status: 'pending' | 'blocked' | 'completed',
): AccountDeletionReceiptStatusEnvelope => ({
  deletion: {
    schemaVersion: 1,
    requestId: identity.requestId,
    status,
    blockerCode:
      status === 'blocked' ? 'private_media_cleanup_incomplete' : null,
    expiresAt: '2026-09-03T18:00:00.000Z',
    completedAt:
      status === 'completed' ? '2026-08-04T18:00:01.000Z' : null,
  },
});

type ApiOptions = {
  deleteError?: Error;
  deletionStatus?: 'pending' | 'blocked' | 'completed';
  statusError?: Error;
};

const createApi = (options: ApiOptions = {}) => {
  const requests: ApiRequestOptions[] = [];
  const posts: string[] = [];
  const api = {
    async post(path: string) {
      posts.push(path);
      if (path === '/v1/auth/account-deletion/status') {
        if (options.statusError) throw options.statusError;
        return statusEnvelope(options.deletionStatus ?? 'pending');
      }
      return envelope;
    },
    async request(request: ApiRequestOptions) {
      requests.push(request);
      if (options.deleteError) throw options.deleteError;
      return {
        success: true,
        ...statusEnvelope(options.deletionStatus ?? 'completed'),
      };
    },
  } as unknown as ApiClient;
  return { api, posts, requests };
};

const createSignedInService = async (
  options: {
    api?: ApiOptions;
    markerStorage?: ReturnType<typeof createMemoryStorage>;
    onAccountDeleted?: (userId: string) => Promise<void>;
  } = {},
) => {
  const sessionStorage = createMemoryStorage();
  const tokenStorage = createMemoryStorage();
  const markerStorage = options.markerStorage ?? createMemoryStorage();
  const api = createApi(options.api);
  const service = createAuthService({
    apiClient: api.api,
    sessionStorage,
    accountCleanupMarkerStorage: markerStorage,
    accountDeletionReceiptStorage: markerStorage,
    accountDeletionReceiptIdentityFactory: () => identity,
    tokenManager: createTokenManager(tokenStorage),
    onAccountDeleted: async (userId) => {
      await markerStorage.write(
        PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
        JSON.stringify({ userId, requestedAt: identity.requestedAt }),
      );
      await options.onAccountDeleted?.(userId);
    },
  });
  await service.login({
    email: envelope.user.email,
    password: 'StrongPass123!',
  });
  return { ...api, markerStorage, service, sessionStorage, tokenStorage };
};

describe('account deletion auth service receipts', () => {
  it('sends a persisted receipt identity and cleans local auth after confirmation', async () => {
    const deletedUsers: string[] = [];
    const setup = await createSignedInService({
      onAccountDeleted: async (userId) => {
        deletedUsers.push(userId);
      },
    });

    await expect(setup.service.deleteAccount('StrongPass123!')).resolves.toEqual({
      localCleanupComplete: true,
    });
    expect(setup.requests[0]).toMatchObject({
      method: 'DELETE',
      path: '/v1/auth/account',
      body: {
        password: 'StrongPass123!',
        requestId: identity.requestId,
        statusSecret: identity.statusSecret,
      },
      retry: false,
    });
    expect(deletedUsers).toEqual(['user-1']);
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
    expect(
      setup.markerStorage.values.has(
        PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY,
      ),
    ).toBe(false);
  });

  it('recovers a committed deletion when the response is lost', async () => {
    const setup = await createSignedInService({
      api: {
        deleteError: new ApiError({
          code: 'network_error',
          message: 'response lost',
        }),
        deletionStatus: 'completed',
      },
    });

    await expect(setup.service.deleteAccount('StrongPass123!')).resolves.toEqual({
      localCleanupComplete: true,
    });
    expect(setup.posts).toContain('/v1/auth/account-deletion/status');
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
  });

  it('retains the same receipt and local account while status is unresolved', async () => {
    const networkError = new ApiError({
      code: 'network_error',
      message: 'offline',
    });
    const setup = await createSignedInService({
      api: { deleteError: networkError, statusError: networkError },
    });

    await expect(setup.service.deleteAccount('StrongPass123!')).rejects.toBe(
      networkError,
    );
    await expect(setup.service.deleteAccount('StrongPass123!')).rejects.toBe(
      networkError,
    );
    expect(setup.requests[0]?.body).toEqual(setup.requests[1]?.body);
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(true);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(true);
    expect(
      setup.markerStorage.values.has(
        PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY,
      ),
    ).toBe(true);
    expect(
      setup.markerStorage.values.has(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY),
    ).toBe(false);
  });

  it('discards an unregistered receipt after definitive credential rejection', async () => {
    const setup = await createSignedInService({
      api: {
        deleteError: new ApiError({
          code: 'unauthorized',
          message: 'invalid password',
          status: 401,
        }),
        statusError: new ApiError({
          code: 'not_found',
          message: 'receipt missing',
          status: 404,
        }),
      },
    });

    await expect(
      setup.service.deleteAccount('WrongPassword123!'),
    ).rejects.toBeInstanceOf(ApiError);
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(true);
    expect(
      setup.markerStorage.values.has(
        PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY,
      ),
    ).toBe(false);
  });

  it('reconciles completion after restart before restoring a session', async () => {
    const markerStorage = createMemoryStorage({
      [PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY]: JSON.stringify(identity),
    });
    const setup = await createSignedInService({
      api: { deletionStatus: 'completed' },
      markerStorage,
    });

    await expect(setup.service.loadSession()).resolves.toBeNull();
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(false);
    expect(setup.tokenStorage.values.has(AUTH_TOKENS_STORAGE_KEY)).toBe(false);
  });

  it('does not treat pending status as deletion confirmation', async () => {
    const markerStorage = createMemoryStorage({
      [PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY]: JSON.stringify(identity),
    });
    const setup = await createSignedInService({
      api: { deletionStatus: 'pending' },
      markerStorage,
    });

    await expect(setup.service.loadSession()).resolves.toMatchObject({
      user: { id: 'user-1' },
    });
    expect(setup.sessionStorage.values.has(AUTH_SESSION_STORAGE_KEY)).toBe(true);
    expect(
      setup.markerStorage.values.has(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY),
    ).toBe(false);
  });
});
