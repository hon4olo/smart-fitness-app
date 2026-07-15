import { describe, expect, it } from 'vitest';

import { AUTH_TOKENS_STORAGE_KEY, createTokenManager } from '@/auth';

import { createJwt, createMemoryStorage } from './helpers';

describe('token manager', () => {
  it('stores and loads access/refresh tokens', async () => {
    const storage = createMemoryStorage();
    const manager = createTokenManager(storage);
    const tokens = {
      accessToken: createJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      refreshToken: createJwt({ exp: Math.floor(Date.now() / 1000) + 7200 }),
      tokenType: 'Bearer' as const,
    };

    await manager.saveTokens(tokens, '2026-01-02T03:04:05.000Z');
    const loaded = await manager.loadTokens();

    expect(storage.write).toHaveBeenCalledWith(AUTH_TOKENS_STORAGE_KEY, expect.any(String));
    expect(loaded).toEqual(tokens);
    expect(await manager.getAccessToken()).toBe(tokens.accessToken);
    expect(await manager.getRefreshToken()).toBe(tokens.refreshToken);
  });

  it('clears stored tokens', async () => {
    const storage = createMemoryStorage({ [AUTH_TOKENS_STORAGE_KEY]: '{}' });
    const manager = createTokenManager(storage);

    await manager.clearTokens();

    expect(storage.remove).toHaveBeenCalledWith(AUTH_TOKENS_STORAGE_KEY);
    expect(await manager.loadTokens()).toBeNull();
  });

  it('detects expired access tokens from the JWT exp claim', () => {
    const storage = createMemoryStorage();
    const manager = createTokenManager(storage);
    const expiredToken = createJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    const futureToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(manager.isAccessTokenExpired(expiredToken)).toBe(true);
    expect(manager.isRefreshTokenExpired(expiredToken)).toBe(true);
    expect(manager.isAccessTokenExpired(futureToken)).toBe(false);
    expect(manager.isRefreshTokenExpired(futureToken)).toBe(false);
  });

  it('treats malformed tokens as expired for refresh decisions', () => {
    const storage = createMemoryStorage();
    const manager = createTokenManager(storage);

    expect(manager.isAccessTokenExpired('bad-token')).toBe(true);
    expect(manager.isRefreshTokenExpired('bad-token')).toBe(true);
  });
});
