import { describe, expect, it } from 'vitest';

import type { StorageAdapter } from '@/storage/StorageAdapter';

import {
  createMigratingTokenManager,
  SECURE_AUTH_TOKENS_STORAGE_KEY,
} from './migrating-token-manager';
import { AUTH_TOKENS_STORAGE_KEY, createTokenManager } from './token-manager';
import type { AuthTokens } from './types';

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

const createJwt = (expiresAtSeconds: number): string => {
  const encode = (value: object) =>
    globalThis
      .btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'none' })}.${encode({ exp: expiresAtSeconds })}.signature`;
};

const legacyTokens: AuthTokens = {
  accessToken: createJwt(4_102_444_800),
  refreshToken: createJwt(4_133_980_800),
  tokenType: 'Bearer',
};

const replacementTokens: AuthTokens = {
  accessToken: createJwt(4_165_516_800),
  refreshToken: createJwt(4_197_052_800),
  tokenType: 'Bearer',
};

const seedTokens = async (
  storage: StorageAdapter,
  storageKey: string,
  tokens: AuthTokens,
) => {
  await createTokenManager(storage, storageKey).saveTokens(tokens);
};

describe('migrating auth token manager', () => {
  it('moves legacy ordinary-storage tokens into secure storage and removes the source', async () => {
    const legacyStorage = createMemoryStorage();
    const secureStorage = createMemoryStorage();
    await seedTokens(legacyStorage, AUTH_TOKENS_STORAGE_KEY, legacyTokens);
    const manager = createMigratingTokenManager({ legacyStorage, secureStorage });

    expect(await manager.loadTokens()).toEqual(legacyTokens);
    expect(await legacyStorage.read(AUTH_TOKENS_STORAGE_KEY)).toBeNull();
    expect(await secureStorage.read(SECURE_AUTH_TOKENS_STORAGE_KEY)).toContain(
      legacyTokens.refreshToken,
    );
  });

  it('prefers existing secure tokens and deletes any ordinary-storage duplicate', async () => {
    const legacyStorage = createMemoryStorage();
    const secureStorage = createMemoryStorage();
    await seedTokens(legacyStorage, AUTH_TOKENS_STORAGE_KEY, legacyTokens);
    await seedTokens(secureStorage, SECURE_AUTH_TOKENS_STORAGE_KEY, replacementTokens);
    const manager = createMigratingTokenManager({ legacyStorage, secureStorage });

    expect(await manager.loadTokens()).toEqual(replacementTokens);
    expect(await legacyStorage.read(AUTH_TOKENS_STORAGE_KEY)).toBeNull();
  });

  it('keeps the legacy source when a secure write cannot be verified', async () => {
    const legacyStorage = createMemoryStorage();
    await seedTokens(legacyStorage, AUTH_TOKENS_STORAGE_KEY, legacyTokens);
    const secureStorage: StorageAdapter = {
      async read() {
        return null;
      },
      async write() {
        return undefined;
      },
      async remove() {
        return undefined;
      },
    };
    const manager = createMigratingTokenManager({ legacyStorage, secureStorage });

    await expect(manager.loadTokens()).rejects.toThrow('could not be verified');
    expect(await legacyStorage.read(AUTH_TOKENS_STORAGE_KEY)).not.toBeNull();
  });

  it('removes malformed legacy token data and fails closed', async () => {
    const legacyStorage = createMemoryStorage({
      [AUTH_TOKENS_STORAGE_KEY]: JSON.stringify({
        accessToken: legacyTokens.accessToken,
        refreshToken: 123,
      }),
    });
    const manager = createMigratingTokenManager({
      legacyStorage,
      secureStorage: createMemoryStorage(),
    });

    expect(await manager.loadTokens()).toBeNull();
    expect(await legacyStorage.read(AUTH_TOKENS_STORAGE_KEY)).toBeNull();
  });

  it('writes new tokens only to secure storage and clears both locations on logout', async () => {
    const legacyStorage = createMemoryStorage();
    const secureStorage = createMemoryStorage();
    const manager = createMigratingTokenManager({ legacyStorage, secureStorage });

    await manager.saveTokens(replacementTokens);
    expect(await manager.getAccessToken()).toBe(replacementTokens.accessToken);
    expect(await legacyStorage.read(AUTH_TOKENS_STORAGE_KEY)).toBeNull();
    expect(await secureStorage.read(SECURE_AUTH_TOKENS_STORAGE_KEY)).not.toBeNull();

    await manager.clearTokens();
    expect(await secureStorage.read(SECURE_AUTH_TOKENS_STORAGE_KEY)).toBeNull();
    expect(await legacyStorage.read(AUTH_TOKENS_STORAGE_KEY)).toBeNull();
  });
});
