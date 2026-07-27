import { describe, expect, it } from 'vitest';

import { PENDING_ACCOUNT_CLEANUP_STORAGE_KEY } from './accountDataCleanup';
import { SECURE_AUTH_TOKENS_STORAGE_KEY } from './migrating-token-manager';

const SECURE_STORE_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

describe('native SecureStore key contract', () => {
  it.each([
    ['auth tokens', SECURE_AUTH_TOKENS_STORAGE_KEY],
    ['pending account cleanup', PENDING_ACCOUNT_CLEANUP_STORAGE_KEY],
  ])('keeps the %s key compatible with Expo SecureStore', (_label, key) => {
    expect(key).not.toHaveLength(0);
    expect(key).toMatch(SECURE_STORE_KEY_PATTERN);
  });
});
