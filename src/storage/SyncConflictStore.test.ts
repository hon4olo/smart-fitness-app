import { describe, expect, it } from 'vitest';

import type { StorageAdapter } from './StorageAdapter';
import {
  createSyncConflictSnapshot,
  createSyncConflictStore,
  SYNC_CONFLICT_STORAGE_KEY,
  type SyncConflictSnapshot,
} from './SyncConflictStore';

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

const pendingConflict: SyncConflictSnapshot = {
  conflictId: 'conflict-a',
  source: 'client',
  status: 'needsReview',
  entityType: 'workouts',
  entityId: 'workout-a',
  detectedAt: '2026-07-24T10:00:00.000Z',
  reason: 'overlapping changes require review',
  details: {
    localVersion: { title: 'Device A' },
    remoteVersion: { title: 'Device B' },
  },
};

describe('SyncConflictStore', () => {
  it('deduplicates conflicts and restores them from a new store instance', async () => {
    const storage = createMemoryStorage();
    const firstStore = createSyncConflictStore(storage);

    await firstStore.merge('user-a', [pendingConflict, pendingConflict]);

    await expect(firstStore.list('user-a')).resolves.toEqual([pendingConflict]);
    const restoredStore = createSyncConflictStore(storage);
    await expect(restoredStore.list('user-a')).resolves.toEqual([pendingConflict]);
  });

  it('keeps conflict state isolated by user', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictStore(storage);
    const secondConflict = {
      ...pendingConflict,
      conflictId: 'conflict-b',
      entityId: 'workout-b',
    };

    await store.merge('user-a', [pendingConflict]);
    await store.merge('user-b', [secondConflict]);

    await expect(store.list('user-a')).resolves.toEqual([pendingConflict]);
    await expect(store.list('user-b')).resolves.toEqual([secondConflict]);
  });

  it('removes a persisted conflict when a terminal update arrives', async () => {
    const storage = createMemoryStorage();
    const store = createSyncConflictStore(storage);

    await store.merge('user-a', [pendingConflict]);
    await store.merge('user-a', [
      {
        ...pendingConflict,
        status: 'resolved',
        details: {
          ...pendingConflict.details as Record<string, unknown>,
          resolvedVersion: { title: 'Resolved' },
        },
      },
    ]);

    await expect(store.list('user-a')).resolves.toEqual([]);
    expect(storage.values.has(SYNC_CONFLICT_STORAGE_KEY)).toBe(false);
  });

  it('normalizes client and server conflict records into stable snapshots', () => {
    const client = createSyncConflictSnapshot(
      {
        conflictId: 'client-conflict',
        entityType: 'nutritionTargets',
        entityId: 'targets-a',
        status: 'needsReview',
        detectedAt: '2026-07-24T10:00:00.000Z',
        reason: 'manual review required',
      },
      'client',
      '2026-07-24T12:00:00.000Z',
    );
    const server = createSyncConflictSnapshot(
      {
        id: 'server-conflict',
        entityType: 'weightHistory',
        entityId: 'weight-a',
        status: 'pending',
        detectedAt: '2026-07-24T11:00:00.000Z',
      },
      'pull',
      '2026-07-24T12:00:00.000Z',
    );

    expect(client).toMatchObject({
      conflictId: 'client-conflict',
      source: 'client',
      status: 'needsReview',
    });
    expect(server).toMatchObject({
      conflictId: 'server-conflict',
      source: 'pull',
      status: 'pending',
    });
  });

  it('fails closed on malformed stored envelopes', async () => {
    const storage = createMemoryStorage();
    storage.values.set(SYNC_CONFLICT_STORAGE_KEY, '{broken');

    await expect(createSyncConflictStore(storage).list('user-a')).resolves.toEqual([]);
  });
});
