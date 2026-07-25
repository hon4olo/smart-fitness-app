import { describe, expect, it } from 'vitest';

import type { StorageAdapter } from '@/storage';

import {
  PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
  clearLocalAccountData,
  getLocalAccountDataStorageKeys,
  resumePendingLocalAccountCleanup,
} from './accountDataCleanup';

const createMemoryStorage = (
  initial: Record<string, string> = {},
  failRemoveKey?: string,
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
      if (key === failRemoveKey) throw new Error('remove failed');
      values.delete(key);
    },
  };
};

describe('local account data cleanup', () => {
  it('removes every account key while preserving device preferences', async () => {
    const userId = 'user-1';
    const accountKeys = getLocalAccountDataStorageKeys(userId);
    const storage = createMemoryStorage({
      ...Object.fromEntries(accountKeys.map((key) => [key, 'private account data'])),
      '@smart_fitness_theme_mode': 'dark',
    });

    await clearLocalAccountData(storage, userId);

    for (const key of accountKeys) expect(storage.values.has(key), key).toBe(false);
    expect(storage.values.get('@smart_fitness_theme_mode')).toBe('dark');
    expect(storage.values.has(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY)).toBe(false);
  });

  it('uses a separate secure marker store and clears it after success', async () => {
    const userId = 'user-secure';
    const keys = getLocalAccountDataStorageKeys(userId);
    const dataStorage = createMemoryStorage(
      Object.fromEntries(keys.map((key) => [key, 'private'])),
    );
    const markerStorage = createMemoryStorage();

    await clearLocalAccountData(dataStorage, userId, markerStorage);

    for (const key of keys) expect(dataStorage.values.has(key), key).toBe(false);
    expect(markerStorage.values.has(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY)).toBe(false);
  });

  it('continues removing account data when the secure marker cannot be written', async () => {
    const userId = 'user-marker-failure';
    const keys = getLocalAccountDataStorageKeys(userId);
    const dataStorage = createMemoryStorage(
      Object.fromEntries(keys.map((key) => [key, 'private'])),
    );
    const markerStorage: StorageAdapter = {
      async read() {
        return null;
      },
      async write() {
        throw new Error('secure storage unavailable');
      },
      async remove() {
        return undefined;
      },
    };

    await clearLocalAccountData(dataStorage, userId, markerStorage);

    for (const key of keys) expect(dataStorage.values.has(key), key).toBe(false);
  });

  it('retains a durable marker when cleanup is interrupted', async () => {
    const userId = 'user-2';
    const failedKey = getLocalAccountDataStorageKeys(userId)[0] as string;
    const storage = createMemoryStorage({ [failedKey]: 'private' }, failedKey);

    await expect(clearLocalAccountData(storage, userId)).rejects.toMatchObject({
      name: 'AccountDataCleanupError',
      failedKeys: [failedKey],
    });
    expect(storage.values.has(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY)).toBe(true);
  });

  it('resumes pending cleanup before allowing state restoration', async () => {
    const userId = 'user-3';
    const keys = getLocalAccountDataStorageKeys(userId);
    const dataStorage = createMemoryStorage(
      Object.fromEntries(keys.map((key) => [key, 'private'])),
    );
    const markerStorage = createMemoryStorage({
      [PENDING_ACCOUNT_CLEANUP_STORAGE_KEY]: JSON.stringify({
        userId,
        requestedAt: '2026-07-25T00:00:00.000Z',
      }),
    });

    expect(await resumePendingLocalAccountCleanup(dataStorage, markerStorage)).toBe(true);
    for (const key of keys) expect(dataStorage.values.has(key), key).toBe(false);
    expect(markerStorage.values.has(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY)).toBe(false);
  });
});
