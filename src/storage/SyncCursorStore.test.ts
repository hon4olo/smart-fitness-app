import { describe, expect, it } from 'vitest';

import type { StorageAdapter } from './StorageAdapter';
import { createSyncCursorStore, SYNC_CURSOR_STORAGE_KEY } from './SyncCursorStore';

const createMemoryStorage = (): StorageAdapter & { values: Map<string, string> } => {
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

describe('SyncCursorStore', () => {
  it('stores independent server revisions for each user', async () => {
    const storage = createMemoryStorage();
    const store = createSyncCursorStore(storage);

    await store.set({
      userId: 'user-a',
      deviceId: 'device-a',
      serverRevision: 7,
      lastSyncedAt: '2026-07-22T10:00:00.000Z',
    });
    await store.set({
      userId: 'user-b',
      deviceId: 'device-b',
      serverRevision: 3,
      lastSyncedAt: '2026-07-22T11:00:00.000Z',
    });

    await expect(store.get('user-a')).resolves.toMatchObject({ serverRevision: 7 });
    await expect(store.get('user-b')).resolves.toMatchObject({ serverRevision: 3 });
  });

  it('normalizes revisions and removes the storage envelope when empty', async () => {
    const storage = createMemoryStorage();
    const store = createSyncCursorStore(storage);

    await store.set({
      userId: 'user-a',
      deviceId: 'device-a',
      serverRevision: 4.8,
      lastSyncedAt: '2026-07-22T10:00:00.000Z',
    });

    await expect(store.get('user-a')).resolves.toMatchObject({ serverRevision: 4 });

    await store.remove('user-a');

    await expect(store.get('user-a')).resolves.toBeNull();
    expect(storage.values.has(SYNC_CURSOR_STORAGE_KEY)).toBe(false);
  });
});
