import type { StorageAdapter } from '@/storage/StorageAdapter';

import type { AuthTokens, TokenManager } from './types';

export const AUTH_TOKENS_STORAGE_KEY = '@smart_fitness_mvp_auth_tokens';

export type TokenEnvelope = AuthTokens & {
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  updatedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const toBase64UrlJson = (value: string): unknown => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = globalThis.atob(normalized + padding);
    return JSON.parse(decoded) as unknown;
  } catch {
    return null;
  }
};

const readJwtExpiry = (token?: string): string | null => {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const payload = toBase64UrlJson(parts[1]);
  if (!isRecord(payload) || typeof payload.exp !== 'number') {
    return null;
  }

  const expiresAt = new Date(payload.exp * 1000);
  return Number.isFinite(expiresAt.getTime()) ? expiresAt.toISOString() : null;
};

const isExpiredByNow = (token: string | undefined, now: Date | string, skewSeconds: number): boolean => {
  if (!token) {
    return false;
  }

  const expiresAt = readJwtExpiry(token);
  if (!expiresAt) {
    return true;
  }

  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(nowMs)) {
    return true;
  }

  return Date.parse(expiresAt) <= nowMs + skewSeconds * 1000;
};

const parseEnvelope = (value: string | null): TokenEnvelope | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed) || typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt: typeof parsed.accessTokenExpiresAt === 'string' ? parsed.accessTokenExpiresAt : readJwtExpiry(parsed.accessToken),
      refreshTokenExpiresAt: typeof parsed.refreshTokenExpiresAt === 'string' ? parsed.refreshTokenExpiresAt : readJwtExpiry(parsed.refreshToken),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const createTokenManager = (storage: StorageAdapter, storageKey = AUTH_TOKENS_STORAGE_KEY): TokenManager => {
  const loadTokens = async (): Promise<AuthTokens | null> => {
    const envelope = parseEnvelope(await storage.read(storageKey));
    if (!envelope) {
      return null;
    }

    return {
      accessToken: envelope.accessToken,
      refreshToken: envelope.refreshToken,
      tokenType: envelope.tokenType,
    };
  };

  return {
    async loadTokens() {
      return loadTokens();
    },
    async saveTokens(tokens, now = new Date().toISOString()) {
      const envelope: TokenEnvelope = {
        ...tokens,
        tokenType: tokens.tokenType ?? 'Bearer',
        accessTokenExpiresAt: readJwtExpiry(tokens.accessToken),
        refreshTokenExpiresAt: readJwtExpiry(tokens.refreshToken),
        updatedAt: now,
      };

      await storage.write(storageKey, JSON.stringify(envelope));
      return {
        accessToken: envelope.accessToken,
        refreshToken: envelope.refreshToken,
        tokenType: envelope.tokenType,
      };
    },
    async clearTokens() {
      await storage.remove(storageKey);
    },
    async getAccessToken() {
      return (await loadTokens())?.accessToken ?? null;
    },
    async getRefreshToken() {
      return (await loadTokens())?.refreshToken ?? null;
    },
    isAccessTokenExpired(token, now = new Date(), skewSeconds = 60) {
      return isExpiredByNow(token, now, skewSeconds);
    },
    isRefreshTokenExpired(token, now = new Date(), skewSeconds = 60) {
      return isExpiredByNow(token, now, skewSeconds);
    },
  };
};
