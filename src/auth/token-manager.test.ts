import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StorageAdapter } from '@/storage/StorageAdapter';

import {
  AUTH_TOKENS_STORAGE_KEY,
  createTokenManager,
  type TokenEnvelope,
} from './token-manager';

const HEADER = 'eyJhbGciOiJub25lIn0';
const FUTURE_PAYLOAD =
  'eyJleHAiOjQxMDI0NDQ4MDAsIm5hbWUiOiLIpNC08J-YgtOgyp_FsyJ9';
const PADDED_FUTURE_PAYLOAD = 'eyJleHAiOjQxMDI0NDQ4MDAsIngiOiIifQ==';
const FUTURE_TOKEN = `${HEADER}.${FUTURE_PAYLOAD}.signature`;
const PADDED_FUTURE_TOKEN = `${HEADER}.${PADDED_FUTURE_PAYLOAD}.signature`;

const createMemoryStorage = (): StorageAdapter & {
  values: Map<string, string>;
} => {
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('auth token manager JWT decoding', () => {
  it('decodes unpadded UTF-8 base64url payloads without global atob', async () => {
    vi.stubGlobal('atob', undefined);
    const storage = createMemoryStorage();
    const manager = createTokenManager(storage);

    expect(
      manager.isAccessTokenExpired(
        FUTURE_TOKEN,
        '2026-08-05T00:00:00.000Z',
        0,
      ),
    ).toBe(false);

    await manager.saveTokens(
      {
        accessToken: FUTURE_TOKEN,
        refreshToken: PADDED_FUTURE_TOKEN,
        tokenType: 'Bearer',
      },
      '2026-08-05T00:00:00.000Z',
    );

    const stored = storage.values.get(AUTH_TOKENS_STORAGE_KEY);
    expect(stored).toBeDefined();
    const envelope = JSON.parse(stored!) as TokenEnvelope;
    expect(envelope.accessTokenExpiresAt).toBe('2100-01-01T00:00:00.000Z');
    expect(envelope.refreshTokenExpiresAt).toBe('2100-01-01T00:00:00.000Z');
  });

  it('honors expiry skew after decoding a valid payload', () => {
    const manager = createTokenManager(createMemoryStorage());

    expect(
      manager.isAccessTokenExpired(
        FUTURE_TOKEN,
        '2099-12-31T23:59:30.000Z',
        0,
      ),
    ).toBe(false);
    expect(
      manager.isAccessTokenExpired(
        FUTURE_TOKEN,
        '2099-12-31T23:59:30.000Z',
        60,
      ),
    ).toBe(true);
  });

  it.each([
    `${HEADER}.a.signature`,
    `${HEADER}.eyJleHAiOjQxMDI0NDQ4MDB9*.signature`,
    `${HEADER}.eyJleHAiOjQxMDI0NDQ4MDAsIngiOiJhIn0==.signature`,
    `${HEADER}.eyJzdWIiOiIxIn0.signature`,
    `${HEADER}.eyJleHAiOiJub3QtYS1udW1iZXIifQ.signature`,
  ])('fails closed for malformed or unusable payload %s', (token) => {
    const manager = createTokenManager(createMemoryStorage());

    expect(
      manager.isAccessTokenExpired(token, '2026-08-05T00:00:00.000Z', 0),
    ).toBe(true);
  });
});
