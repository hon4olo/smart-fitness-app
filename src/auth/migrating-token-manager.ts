import type { StorageAdapter } from '@/storage/StorageAdapter';

import {
  AUTH_TOKENS_STORAGE_KEY,
  createTokenManager,
} from './token-manager';
import type { AuthTokens, TokenManager } from './types';

export const SECURE_AUTH_TOKENS_STORAGE_KEY = 'smart_fitness_auth_tokens_v1';

const tokensMatch = (left: AuthTokens | null, right: AuthTokens): boolean =>
  Boolean(
    left &&
      left.accessToken === right.accessToken &&
      left.refreshToken === right.refreshToken &&
      left.tokenType === right.tokenType,
  );

export const createMigratingTokenManager = ({
  legacyStorage,
  secureStorage,
  legacyStorageKey = AUTH_TOKENS_STORAGE_KEY,
  secureStorageKey = SECURE_AUTH_TOKENS_STORAGE_KEY,
}: {
  legacyStorage: StorageAdapter;
  secureStorage: StorageAdapter;
  legacyStorageKey?: string;
  secureStorageKey?: string;
}): TokenManager => {
  const secureManager = createTokenManager(secureStorage, secureStorageKey);
  const legacyManager = createTokenManager(legacyStorage, legacyStorageKey);
  let migrationPromise: Promise<void> | null = null;

  const migrateLegacyTokens = async (): Promise<void> => {
    const secureTokens = await secureManager.loadTokens();
    const legacyRawValue = await legacyStorage.read(legacyStorageKey);

    if (secureTokens) {
      if (legacyRawValue !== null) {
        await legacyStorage.remove(legacyStorageKey);
      }
      return;
    }

    if (legacyRawValue === null) {
      return;
    }

    const legacyTokens = await legacyManager.loadTokens();
    if (!legacyTokens) {
      await legacyStorage.remove(legacyStorageKey);
      return;
    }

    await secureManager.saveTokens(legacyTokens);
    const verifiedTokens = await secureManager.loadTokens();
    if (!tokensMatch(verifiedTokens, legacyTokens)) {
      throw new Error('Secure auth token migration could not be verified.');
    }

    await legacyStorage.remove(legacyStorageKey);
  };

  const ensureMigrated = (): Promise<void> => {
    if (!migrationPromise) {
      migrationPromise = migrateLegacyTokens().catch((error) => {
        migrationPromise = null;
        throw error;
      });
    }
    return migrationPromise;
  };

  const loadTokens = async (): Promise<AuthTokens | null> => {
    await ensureMigrated();
    return secureManager.loadTokens();
  };

  return {
    loadTokens,
    async saveTokens(tokens, now) {
      await ensureMigrated();
      const saved = await secureManager.saveTokens(tokens, now);
      const verified = await secureManager.loadTokens();
      if (!tokensMatch(verified, saved)) {
        throw new Error('Secure auth token write could not be verified.');
      }
      await legacyStorage.remove(legacyStorageKey);
      return saved;
    },
    async clearTokens() {
      await secureManager.clearTokens();
      await legacyStorage.remove(legacyStorageKey);
    },
    async getAccessToken() {
      return (await loadTokens())?.accessToken ?? null;
    },
    async getRefreshToken() {
      return (await loadTokens())?.refreshToken ?? null;
    },
    isAccessTokenExpired(token, now, skewSeconds) {
      return secureManager.isAccessTokenExpired(token, now, skewSeconds);
    },
    isRefreshTokenExpired(token, now, skewSeconds) {
      return secureManager.isRefreshTokenExpired(token, now, skewSeconds);
    },
  };
};
