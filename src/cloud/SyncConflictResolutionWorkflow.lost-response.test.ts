import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
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
import type { SyncConflictResolutionClient } from './createSyncConflictResolutionClient';

const userId = 'user-a';
const conflictId = '11111111-1111-4111-8111-111111111111';
const entityId = '22222222-2222-4222-8222-222222222222';

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

const duplicateResult = {
  schemaVersion: SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION,
  conflictId,
  entityType: 'weightHistory',
  entityId,
  status: 'resolved',
  choice: 'keep_local',
  revision: 12,
  resolvedPayload: null,
  resolvedAt: '2026-08-04T11:00:00.000Z',
  duplicate: true,
} as const;

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

const createClock = () => {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 7, 4, 11, tick++)).toISOString();
};

describe('SyncConflictResolutionWorkflow lost response replay', () => {
  it('reuses the persisted key and reconciles a duplicate success after restart', async () => {
    const storage = createMemoryStorage();
    const conflictStore = createSyncConflictStore(storage);
    const cursorStore = createSyncCursorStore(storage);
    const firstIntentStore = createSyncConflictResolutionIntentStore(storage, {
      now: createClock(),
    });
    await conflictStore.merge(userId, [conflict]);

    const resolve = vi
      .fn<SyncConflictResolutionClient['resolve']>()
      .mockRejectedValueOnce(
        new ApiError({
          code: 'network_error',
          message: 'response lost after commit',
          retryable: true,
        }),
      )
      .mockResolvedValueOnce(duplicateResult);
    const firstSubmission = createSyncConflictResolutionSubmission({
      client: { resolve },
      intentStore: firstIntentStore,
    });
    const firstSynchronize = vi.fn(async () => undefined);
    const firstWorkflow = createSyncConflictResolutionWorkflow({
      conflictStore,
      cursorStore,
      intentStore: firstIntentStore,
      submission: firstSubmission,
      synchronize: firstSynchronize,
    });

    await expect(
      firstWorkflow.resolve(userId, candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'retryable',
      intent: { state: 'retryable' },
      submission: { status: 'retryable', retryCategory: 'offline' },
    });
    expect(firstSynchronize).not.toHaveBeenCalled();

    const uncertainIntent = await firstIntentStore.get(userId, conflictId);
    expect(uncertainIntent).toMatchObject({
      choice: 'keep_local',
      state: 'retryable',
    });
    expect(resolve).toHaveBeenCalledTimes(1);

    const restoredIntentStore = createSyncConflictResolutionIntentStore(storage, {
      now: createClock(),
    });
    const restoredSubmission = createSyncConflictResolutionSubmission({
      client: { resolve },
      intentStore: restoredIntentStore,
    });
    const restoredSynchronize = vi.fn(async () => {
      await cursorStore.set({
        userId,
        deviceId: '33333333-3333-4333-8333-333333333333',
        serverRevision: 12,
        lastSyncedAt: '2026-08-04T11:02:00.000Z',
      });
      await conflictStore.remove(userId, conflictId);
    });
    const restoredWorkflow = createSyncConflictResolutionWorkflow({
      conflictStore,
      cursorStore,
      intentStore: restoredIntentStore,
      submission: restoredSubmission,
      synchronize: restoredSynchronize,
    });

    await expect(
      restoredWorkflow.resume(userId, conflictId),
    ).resolves.toMatchObject({
      status: 'reconciled',
      intent: null,
      result: duplicateResult,
      submission: { status: 'accepted' },
    });

    expect(resolve).toHaveBeenCalledTimes(2);
    const firstRequest = resolve.mock.calls[0]?.[0];
    const replayRequest = resolve.mock.calls[1]?.[0];
    expect(firstRequest).toEqual(replayRequest);
    expect(replayRequest).toMatchObject({
      conflictId,
      choice: 'keep_local',
      expectedConflictRevision: 11,
      expectedRemoteRevision: 8,
      idempotencyKey: uncertainIntent?.idempotencyKey,
    });
    expect(restoredSynchronize).toHaveBeenCalledTimes(1);
    await expect(restoredIntentStore.get(userId, conflictId)).resolves.toBeNull();
    await expect(conflictStore.list(userId)).resolves.toEqual([]);
  });
});
