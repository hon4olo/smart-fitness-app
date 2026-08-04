import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import {
  createSyncConflictResolutionIntentStore,
  type StorageAdapter,
} from '@/storage';

import type { SyncConflictResolutionCandidate } from './SyncConflictResolutionCandidate';
import { SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION } from './SyncConflictResolutionApi';
import { createSyncConflictResolutionSubmission } from './SyncConflictResolutionSubmission';
import type { SyncConflictResolutionClient } from './createSyncConflictResolutionClient';

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
  choice: 'keep_local' | 'keep_remote' = 'keep_local',
) => {
  const intentStore = createSyncConflictResolutionIntentStore(
    createMemoryStorage(),
    { now: createClock() },
  );
  const intent = await intentStore.create('user-a', candidate, choice);
  const client: SyncConflictResolutionClient = { resolve };
  return {
    client,
    intent,
    intentStore,
    submission: createSyncConflictResolutionSubmission({ client, intentStore }),
  };
};

const serverError = (status: number, code: string) =>
  new ApiError({
    code: status === 401 ? 'unauthorized' : status === 409 ? 'conflict' : 'unknown',
    message: code,
    status,
    body: { error: { code } },
  });

describe('SyncConflictResolutionSubmission', () => {
  it('submits only immutable persisted fields and marks success accepted', async () => {
    const resolve = vi.fn().mockResolvedValue(result);
    const harness = await createHarness(resolve);

    const outcome = await harness.submission.submit('user-a', conflictId);

    expect(outcome).toMatchObject({
      status: 'accepted',
      result,
      intent: { state: 'accepted' },
    });
    expect(resolve).toHaveBeenCalledWith({
      conflictId,
      expectedConflictRevision: 11,
      expectedRemoteRevision: 8,
      choice: 'keep_local',
      idempotencyKey: harness.intent.idempotencyKey,
    });
    await expect(harness.intentStore.get('user-a', conflictId)).resolves.toMatchObject({
      state: 'accepted',
      idempotencyKey: harness.intent.idempotencyKey,
    });
  });

  it('preserves the key across an uncertain failure and duplicate replay', async () => {
    const duplicateResult = { ...result, duplicate: true };
    const resolve = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          code: 'network_error',
          message: 'connection reset',
          retryable: true,
        }),
      )
      .mockResolvedValueOnce(duplicateResult);
    const harness = await createHarness(resolve);

    await expect(
      harness.submission.submit('user-a', conflictId),
    ).resolves.toMatchObject({
      status: 'retryable',
      retryCategory: 'offline',
      intent: {
        state: 'retryable',
        idempotencyKey: harness.intent.idempotencyKey,
      },
    });
    await expect(
      harness.submission.submit('user-a', conflictId),
    ).resolves.toMatchObject({
      status: 'accepted',
      result: duplicateResult,
      intent: {
        state: 'accepted',
        idempotencyKey: harness.intent.idempotencyKey,
      },
    });
    expect(resolve).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ idempotencyKey: harness.intent.idempotencyKey }),
    );
    expect(resolve).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ idempotencyKey: harness.intent.idempotencyKey }),
    );
  });

  it('classifies authentication failure without discarding the intent', async () => {
    const harness = await createHarness(
      vi.fn().mockRejectedValue(new Error('authentication required')),
    );

    await expect(
      harness.submission.submit('user-a', conflictId),
    ).resolves.toMatchObject({
      status: 'authentication_required',
      intent: {
        state: 'retryable',
        idempotencyKey: harness.intent.idempotencyKey,
      },
    });
  });

  it.each([
    ['SYNC_CONFLICT_STALE', 'stale'],
    ['SYNC_CONFLICT_NOT_FOUND', 'stale'],
    ['SYNC_CONFLICT_NOT_USER_RESOLVABLE', 'stale'],
    ['SYNC_CONFLICT_ALREADY_RESOLVED', 'already_resolved'],
  ] as const)('classifies %s as %s', async (code, expectedStatus) => {
    const harness = await createHarness(
      vi.fn().mockRejectedValue(serverError(code.endsWith('NOT_FOUND') ? 404 : 409, code)),
    );

    await expect(
      harness.submission.submit('user-a', conflictId),
    ).resolves.toMatchObject({
      status: expectedStatus,
      serverCode: code,
      intent: { state: 'stale' },
    });
  });

  it('marks deterministic key reuse rejected instead of retrying', async () => {
    const harness = await createHarness(
      vi
        .fn()
        .mockRejectedValue(
          serverError(409, 'SYNC_CONFLICT_IDEMPOTENCY_KEY_REUSE'),
        ),
    );

    const first = await harness.submission.submit('user-a', conflictId);
    const second = await harness.submission.submit('user-a', conflictId);

    expect(first).toMatchObject({
      status: 'rejected',
      serverCode: 'SYNC_CONFLICT_IDEMPOTENCY_KEY_REUSE',
      intent: { state: 'stale' },
    });
    expect(second).toMatchObject({
      status: 'not_submittable',
      intent: { state: 'stale' },
    });
  });

  it('reports missing and in-progress intents without a network request', async () => {
    const resolve = vi.fn().mockResolvedValue(result);
    const harness = await createHarness(resolve);

    await expect(
      harness.submission.submit('user-a', '33333333-3333-4333-8333-333333333333'),
    ).resolves.toEqual({ status: 'missing', intent: null });
    await harness.intentStore.transition(
      'user-a',
      conflictId,
      harness.intent.idempotencyKey,
      'submitting',
    );
    await expect(
      harness.submission.submit('user-a', conflictId),
    ).resolves.toMatchObject({ status: 'in_progress' });
    expect(resolve).not.toHaveBeenCalled();
  });
});
