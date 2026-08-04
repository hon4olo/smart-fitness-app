import { describe, expect, it, vi } from 'vitest';

import {
  SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION,
  type SyncConflictResolutionClient,
} from '@/cloud';
import {
  createSyncConflictResolutionIntentStore,
  createSyncConflictStore,
  createSyncCursorStore,
  type StorageAdapter,
  type SyncConflictSnapshot,
} from '@/storage';

import { createSyncConflictResolutionController } from './SyncConflictResolutionController';

const conflictId = '11111111-1111-4111-8111-111111111111';
const entityId = '22222222-2222-4222-8222-222222222222';
const userId = 'user-a';

const createMemoryStorage = (): StorageAdapter => {
  const values = new Map<string, string>();
  return {
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

const resolvableConflict: SyncConflictSnapshot = {
  conflictId,
  source: 'pull',
  status: 'pending',
  entityType: 'weightHistory',
  entityId,
  detectedAt: '2026-08-04T10:30:00.000Z',
  details: {
    id: conflictId,
    status: 'pending',
    conflictType: 'revision_mismatch',
    entityType: 'weightHistory',
    entityId,
    revision: 11,
    remoteRevision: 8,
    localPayload: null,
    remotePayload: { id: entityId, weight: 70 },
  },
};

const clientOnlyConflict: SyncConflictSnapshot = {
  ...resolvableConflict,
  conflictId: '33333333-3333-4333-8333-333333333333',
  source: 'client',
  details: {
    ...(resolvableConflict.details as Record<string, unknown>),
    id: '33333333-3333-4333-8333-333333333333',
  },
};

describe('SyncConflictResolutionController', () => {
  it('lists only bounded backend resolution candidates', async () => {
    const storage = createMemoryStorage();
    const conflictStore = createSyncConflictStore(storage);
    await conflictStore.merge(userId, [resolvableConflict, clientOnlyConflict]);
    const controller = createSyncConflictResolutionController({
      client: { resolve: vi.fn() },
      conflictStore,
      cursorStore: createSyncCursorStore(storage),
      intentStore: createSyncConflictResolutionIntentStore(storage),
      synchronize: vi.fn(),
    });

    const candidates = await controller.listCandidates(userId);
    expect(candidates).toEqual([
      {
        conflictId,
        entityType: 'weightHistory',
        entityId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        localKind: 'delete',
        remoteKind: 'upsert',
        detectedAt: '2026-08-04T10:30:00.000Z',
      },
    ]);
    const serialized = JSON.stringify(candidates);
    expect(serialized).not.toContain('remotePayload');
    expect(serialized).not.toContain('"weight":70');
  });

  it('routes an explicit choice through submit, sync, and reconciliation', async () => {
    const storage = createMemoryStorage();
    const conflictStore = createSyncConflictStore(storage);
    const cursorStore = createSyncCursorStore(storage);
    const intentStore = createSyncConflictResolutionIntentStore(storage);
    await conflictStore.merge(userId, [resolvableConflict]);
    const resolve = vi.fn<SyncConflictResolutionClient['resolve']>().mockResolvedValue({
      schemaVersion: SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION,
      conflictId,
      entityType: 'weightHistory',
      entityId,
      status: 'resolved',
      choice: 'keep_local',
      revision: 12,
      resolvedPayload: null,
      resolvedAt: '2026-08-04T11:00:00.000Z',
      duplicate: false,
    });
    const synchronize = vi.fn(async () => {
      await cursorStore.set({
        userId,
        deviceId: '44444444-4444-4444-8444-444444444444',
        serverRevision: 12,
        lastSyncedAt: '2026-08-04T11:01:00.000Z',
      });
      await conflictStore.remove(userId, conflictId);
    });
    const controller = createSyncConflictResolutionController({
      client: { resolve },
      conflictStore,
      cursorStore,
      intentStore,
      synchronize,
    });
    const [candidate] = await controller.listCandidates(userId);

    await expect(
      controller.resolve(userId, candidate!, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'reconciled',
      intent: null,
      submission: { status: 'accepted' },
    });
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        conflictId,
        choice: 'keep_local',
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
      }),
    );
    expect(synchronize).toHaveBeenCalledTimes(1);
    await expect(intentStore.get(userId, conflictId)).resolves.toBeNull();
  });
});
