import { describe, expect, it, vi } from 'vitest';

import {
  createSyncConflictResolutionIntentStore,
  createSyncConflictStore,
  createSyncCursorStore,
  type StorageAdapter,
  type SyncConflictSnapshot,
} from '@/storage';

import { SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION } from './SyncConflictResolutionApi';
import type { SyncConflictResolutionCandidate } from './SyncConflictResolutionCandidate';
import { createSyncConflictResolutionSubmission } from './SyncConflictResolutionSubmission';
import { createSyncConflictResolutionWorkflow } from './SyncConflictResolutionWorkflow';

const conflictId = '11111111-1111-4111-8111-111111111111';
const entityId = '22222222-2222-4222-8222-222222222222';
const userId = 'user-a';

const candidate: SyncConflictResolutionCandidate = {
  conflictId,
  entityType: 'weightHistory',
  entityId,
  expectedConflictRevision: 11,
  expectedRemoteRevision: 8,
  localKind: 'delete',
  remoteKind: 'upsert',
  detectedAt: '2026-08-04T10:30:00.000Z',
};

const conflict: SyncConflictSnapshot = {
  conflictId,
  source: 'pull',
  status: 'pending',
  entityType: 'weightHistory',
  entityId,
  detectedAt: candidate.detectedAt,
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

describe('SyncConflictResolutionWorkflow restart resume', () => {
  it('reconciles a durable accepted intent after its conflict snapshot is gone', async () => {
    const storage = createMemoryStorage();
    const conflictStore = createSyncConflictStore(storage);
    const cursorStore = createSyncCursorStore(storage);
    const intentStore = createSyncConflictResolutionIntentStore(storage);
    await conflictStore.merge(userId, [conflict]);
    const resolve = vi.fn().mockResolvedValue({
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
    const submission = createSyncConflictResolutionSubmission({
      client: { resolve },
      intentStore,
    });
    const workflow = createSyncConflictResolutionWorkflow({
      conflictStore,
      cursorStore,
      intentStore,
      submission,
      async synchronize() {
        await conflictStore.remove(userId, conflictId);
        await cursorStore.set({
          userId,
          deviceId: '33333333-3333-4333-8333-333333333333',
          serverRevision: 11,
          lastSyncedAt: '2026-08-04T11:01:00.000Z',
        });
      },
    });

    await expect(
      workflow.resolve(userId, candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'waiting_for_authoritative_state',
      intent: { state: 'accepted', resolutionRevision: 12 },
    });
    await expect(conflictStore.list(userId)).resolves.toEqual([]);
    expect(resolve).toHaveBeenCalledTimes(1);

    const restoredIntentStore = createSyncConflictResolutionIntentStore(storage);
    const restoredSubmission = createSyncConflictResolutionSubmission({
      client: { resolve },
      intentStore: restoredIntentStore,
    });
    const restoredWorkflow = createSyncConflictResolutionWorkflow({
      conflictStore,
      cursorStore,
      intentStore: restoredIntentStore,
      submission: restoredSubmission,
      async synchronize() {
        await cursorStore.set({
          userId,
          deviceId: '33333333-3333-4333-8333-333333333333',
          serverRevision: 12,
          lastSyncedAt: '2026-08-04T11:02:00.000Z',
        });
      },
    });

    await expect(restoredWorkflow.resume(userId, conflictId)).resolves.toMatchObject({
      status: 'reconciled',
      intent: null,
      submission: { status: 'not_submittable' },
    });
    expect(resolve).toHaveBeenCalledTimes(1);
    await expect(restoredIntentStore.get(userId, conflictId)).resolves.toBeNull();
  });
});
