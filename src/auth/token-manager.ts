import type { StorageAdapter } from '@/storage/StorageAdapter';

import type { AuthTokens, TokenManager } from './types';

export const AUTH_TOKENS_STORAGE_KEY = '@smart_fitness_mvp_auth_tokens';

export type TokenEnvelope = AuthTokens & {
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  updatedAt: string;
};

const BASE64_URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const decodeBase64Url = (value: string): string => {
  const paddingLength = value.match(/=+$/)?.[0].length ?? 0;
  const unpadded = value.slice(0, value.length - paddingLength);
  const remainder = unpadded.length % 4;

  if (
    paddingLength > 2 ||
    unpadded.includes('=') ||
    remainder === 1 ||
    (paddingLength > 0 && paddingLength !== (4 - remainder) % 4)
  ) {
    throw new Error('Invalid base64url padding');
  }

  const bytes: number[] = [];
  let accumulator = 0;
  let bitCount = 0;

  for (const character of unpadded) {
    const sextet = BASE64_URL_ALPHABET.indexOf(character);
    if (sextet < 0) {
      throw new Error('Invalid base64url character');
    }

    accumulator = (accumulator << 6) | sextet;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((accumulator >> bitCount) & 0xff);
      accumulator &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }

  if (bitCount > 0 && accumulator !== 0) {
    throw new Error('Invalid base64url trailing bits');
  }

  return decodeURIComponent(
    bytes.map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''),
  );
};

const toBase64UrlJson = (value: string): unknown => {
  try {
    return JSON.parse(decodeBase64Url(value)) as unknown;
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

const isExpiredByNow = (
  token: string | undefined,
  now: Date | string,
  skewSeconds: number,
): boolean => {
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
    if (
      !isRecord(parsed) ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string'
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt:
        typeof parsed.accessTokenExpiresAt === 'string'
          ? parsed.accessTokenExpiresAt
          : readJwtExpiry(parsed.accessToken),
      refreshTokenExpiresAt:
        typeof parsed.refreshTokenExpiresAt === 'string'
          ? parsed.refreshTokenExpiresAt
          : readJwtExpiry(parsed.refreshToken),
      updatedAt:
        typeof parsed.updatedAt === 'string'
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const createTokenManager = (
  storage: StorageAdapter,
  storageKey = AUTH_TOKENS_STORAGE_KEY,
): TokenManager => {
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
