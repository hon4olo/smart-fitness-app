import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import {
  createSyncConflictResolutionIntentStore,
  createSyncConflictStore,
  createSyncCursorStore,
  type StorageAdapter,
  type SyncConflictSnapshot,
} from '@/storage';

import type { SyncConflictResolutionCandidate } from './SyncConflictResolutionCandidate';
import { SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION } from './SyncConflictResolutionApi';
import { createSyncConflictResolutionSubmission } from './SyncConflictResolutionSubmission';
import { createSyncConflictResolutionWorkflow } from './SyncConflictResolutionWorkflow';
import type { SyncConflictResolutionClient } from './createSyncConflictResolutionClient';

const conflictId = '11111111-1111-4111-8111-111111111111';
const entityId = '22222222-2222-4222-8222-222222222222';
const detectedAt = '2026-08-04T10:30:00.000Z';

const candidate: SyncConflictResolutionCandidate = {
  conflictId,
  entityType: 'weightHistory',
  entityId,
  expectedConflictRevision: 11,
  expectedRemoteRevision: 8,
  localKind: 'delete',
  remoteKind: 'upsert',
  detectedAt,
};

const conflict: SyncConflictSnapshot = {
  conflictId,
  source: 'pull',
  status: 'pending',
  entityType: 'weightHistory',
  entityId,
  detectedAt,
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

const result = {
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

const createHarness = async (
  resolve: SyncConflictResolutionClient['resolve'],
  synchronize?: () => Promise<void>,
) => {
  const storage = createMemoryStorage();
  const conflictStore = createSyncConflictStore(storage);
  const cursorStore = createSyncCursorStore(storage);
  const intentStore = createSyncConflictResolutionIntentStore(storage, {
    now: createClock(),
  });
  await conflictStore.merge('user-a', [conflict]);
  const client: SyncConflictResolutionClient = { resolve };
  const submission = createSyncConflictResolutionSubmission({
    client,
    intentStore,
  });
  const synchronizeMock = vi.fn(
    synchronize ?? (async () => undefined),
  );
  const workflow = createSyncConflictResolutionWorkflow({
    conflictStore,
    cursorStore,
    intentStore,
    submission,
    synchronize: synchronizeMock,
  });
  return {
    client,
    conflictStore,
    cursorStore,
    intentStore,
    storage,
    synchronize: synchronizeMock,
    workflow,
  };
};

const serverError = (code: string) =>
  new ApiError({
    code: 'conflict',
    message: code,
    status: code === 'SYNC_CONFLICT_NOT_FOUND' ? 404 : 409,
    body: { error: { code } },
  });

describe('SyncConflictResolutionWorkflow', () => {
  it('removes intent only after pull state is applied and cursor reaches result', async () => {
    let harness: Awaited<ReturnType<typeof createHarness>>;
    harness = await createHarness(vi.fn().mockResolvedValue(result), async () => {
      await harness.cursorStore.set({
        userId: 'user-a',
        deviceId: '33333333-3333-4333-8333-333333333333',
        serverRevision: 12,
        lastSyncedAt: '2026-08-04T11:01:00.000Z',
      });
      await harness.conflictStore.remove('user-a', conflictId);
    });

    const outcome = await harness.workflow.resolve(
      'user-a',
      candidate,
      'keep_local',
    );

    expect(outcome).toMatchObject({
      status: 'reconciled',
      intent: null,
      submission: { status: 'accepted' },
      result,
    });
    await expect(harness.intentStore.get('user-a', conflictId)).resolves.toBeNull();
    await expect(harness.conflictStore.list('user-a')).resolves.toEqual([]);
  });

  it('keeps accepted intent while the persisted conflict remains', async () => {
    let harness: Awaited<ReturnType<typeof createHarness>>;
    harness = await createHarness(vi.fn().mockResolvedValue(result), async () => {
      await harness.cursorStore.set({
        userId: 'user-a',
        deviceId: '33333333-3333-4333-8333-333333333333',
        serverRevision: 12,
        lastSyncedAt: '2026-08-04T11:01:00.000Z',
      });
    });

    await expect(
      harness.workflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'waiting_for_authoritative_state',
      intent: { state: 'accepted' },
    });
    await expect(harness.conflictStore.list('user-a')).resolves.toHaveLength(1);
  });

  it('keeps accepted intent when cursor has not reached the resolution revision', async () => {
    let harness: Awaited<ReturnType<typeof createHarness>>;
    harness = await createHarness(vi.fn().mockResolvedValue(result), async () => {
      await harness.cursorStore.set({
        userId: 'user-a',
        deviceId: '33333333-3333-4333-8333-333333333333',
        serverRevision: 11,
        lastSyncedAt: '2026-08-04T11:01:00.000Z',
      });
      await harness.conflictStore.remove('user-a', conflictId);
    });

    await expect(
      harness.workflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'waiting_for_authoritative_state',
      intent: { state: 'accepted' },
    });
    await expect(harness.intentStore.get('user-a', conflictId)).resolves.toMatchObject({
      state: 'accepted',
    });
  });

  it('reconciles an accepted intent after restart without resubmitting', async () => {
    const resolve = vi.fn().mockResolvedValue(result);
    let harness: Awaited<ReturnType<typeof createHarness>>;
    harness = await createHarness(resolve, async () => {
      await harness.cursorStore.set({
        userId: 'user-a',
        deviceId: '33333333-3333-4333-8333-333333333333',
        serverRevision: 11,
        lastSyncedAt: '2026-08-04T11:01:00.000Z',
      });
      await harness.conflictStore.remove('user-a', conflictId);
    });

    await expect(
      harness.workflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'waiting_for_authoritative_state',
      intent: { state: 'accepted' },
    });
    expect(resolve).toHaveBeenCalledTimes(1);

    const restoredIntentStore = createSyncConflictResolutionIntentStore(
      harness.storage,
      { now: createClock() },
    );
    const restoredSubmission = createSyncConflictResolutionSubmission({
      client: harness.client,
      intentStore: restoredIntentStore,
    });
    const restoredWorkflow = createSyncConflictResolutionWorkflow({
      conflictStore: harness.conflictStore,
      cursorStore: harness.cursorStore,
      intentStore: restoredIntentStore,
      submission: restoredSubmission,
      async synchronize() {
        await harness.cursorStore.set({
          userId: 'user-a',
          deviceId: '33333333-3333-4333-8333-333333333333',
          serverRevision: 12,
          lastSyncedAt: '2026-08-04T11:02:00.000Z',
        });
      },
    });

    await expect(
      restoredWorkflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'reconciled',
      intent: null,
      submission: { status: 'not_submittable' },
    });
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('pulls after already-resolved response and completes the stale intent', async () => {
    let harness: Awaited<ReturnType<typeof createHarness>>;
    harness = await createHarness(
      vi
        .fn()
        .mockRejectedValue(serverError('SYNC_CONFLICT_ALREADY_RESOLVED')),
      async () => {
        await harness.conflictStore.remove('user-a', conflictId);
      },
    );

    await expect(
      harness.workflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'reconciled',
      intent: null,
      submission: { status: 'already_resolved' },
    });
  });

  it('preserves accepted intent and conflict when synchronization fails', async () => {
    const harness = await createHarness(
      vi.fn().mockResolvedValue(result),
      async () => {
        throw new Error('pull failed');
      },
    );

    await expect(
      harness.workflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'sync_failed',
      intent: { state: 'accepted' },
    });
    await expect(harness.conflictStore.list('user-a')).resolves.toHaveLength(1);
  });

  it('does not synchronize while submission remains retryable', async () => {
    const harness = await createHarness(
      vi.fn().mockRejectedValue(
        new ApiError({
          code: 'network_error',
          message: 'offline',
          retryable: true,
        }),
      ),
    );

    await expect(
      harness.workflow.resolve('user-a', candidate, 'keep_local'),
    ).resolves.toMatchObject({
      status: 'retryable',
      intent: { state: 'retryable' },
    });
    expect(harness.synchronize).not.toHaveBeenCalled();
  });
});
