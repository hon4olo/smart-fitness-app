import { describe, expect, it, vi } from 'vitest';

import {
  buildSyncBatch,
  collectPendingOperations,
  createOfflineSyncQueueIdempotencyKey,
  createSyncCoordinator,
  prepareSync,
  resolveConflicts,
  simulatePull,
  simulatePush,
  validateBatch,
} from '@/cloud';
import type { CloudProvider, OfflineSyncQueueOperation, OfflineSyncQueueStore, SyncBatch, SyncOperation, SyncState } from '@/cloud';

const NOW = '2026-01-02T03:04:05.000Z';
const LATER = '2026-01-02T03:05:05.000Z';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const makeOperation = (overrides: Partial<OfflineSyncQueueOperation> = {}): OfflineSyncQueueOperation => {
  const entityType = overrides.entityType ?? 'workoutSessions';
  const entityId = overrides.entityId ?? 'session-1';
  const action = overrides.action ?? 'update';
  const clientTimestamp = overrides.clientTimestamp ?? NOW;
  const payload = overrides.payload ?? { id: entityId, value: entityType };
  const baseRevision = overrides.baseRevision ?? { id: 'rev-1', number: 1, createdAt: '2026-01-01T00:00:00.000Z' };

  return {
    opId: overrides.opId ?? `op-${entityId}`,
    entityType,
    entityId,
    action,
    payload,
    baseRevision,
    clientTimestamp,
    actorId: overrides.actorId ?? 'actor-1',
    idempotencyKey:
      overrides.idempotencyKey ??
      createOfflineSyncQueueIdempotencyKey({
        entityType,
        entityId,
        action,
        clientTimestamp,
        actorId: overrides.actorId ?? 'actor-1',
        baseRevision,
        payload,
      }),
    retryCount: overrides.retryCount ?? 0,
    status: overrides.status ?? 'pending',
    lastError: overrides.lastError,
    nextRetryAt: overrides.nextRetryAt,
    metadata: overrides.metadata,
    syncOperation: overrides.syncOperation,
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
  };
};

const makeQueueStore = (operations: OfflineSyncQueueOperation[]): OfflineSyncQueueStore => {
  const loaded = clone(operations);

  return {
    loadOperations: vi.fn(async () => clone(loaded)),
    enqueue: vi.fn(async () => {
      throw new Error('queue mutation not expected');
    }),
    enqueueBatch: vi.fn(async () => {
      throw new Error('queue mutation not expected');
    }),
    updateOperation: vi.fn(async () => {
      throw new Error('queue mutation not expected');
    }),
    acknowledge: vi.fn(async () => {
      throw new Error('queue mutation not expected');
    }),
    removeAcknowledged: vi.fn(async () => {
      throw new Error('queue mutation not expected');
    }),
    clear: vi.fn(async () => {
      throw new Error('queue mutation not expected');
    }),
    getPending: vi.fn(async () => clone(loaded.filter((operation) => operation.status === 'pending' || operation.status === 'processing'))),
    getFailed: vi.fn(async () => clone(loaded.filter((operation) => operation.status === 'failed'))),
  };
};

const emptyBatch = (): SyncBatch => ({
  id: 'batch-empty',
  operations: [],
  createdAt: NOW,
});

const makeProvider = (overrides: Partial<CloudProvider> = {}): CloudProvider => ({
  healthCheck: vi.fn(async () => ({
    status: 'idle',
    pendingOperations: 0,
    conflictCount: 0,
  } satisfies SyncState)),
  pullChanges: vi.fn(async () => emptyBatch()),
  pushOperations: vi.fn(async () => ({
    status: 'idle',
    pendingOperations: 0,
    conflictCount: 0,
  } satisfies SyncState)),
  getSnapshot: vi.fn(async () => ({
    id: 'snapshot-1',
    revision: { id: 'rev-1', number: 1, createdAt: NOW },
    state: {},
    createdAt: NOW,
  })),
  uploadSnapshot: vi.fn(async () => ({
    status: 'idle',
    pendingOperations: 0,
    conflictCount: 0,
  } satisfies SyncState)),
  resolveConflict: vi.fn(async () => ({
    status: 'idle',
    pendingOperations: 0,
    conflictCount: 0,
  } satisfies SyncState)),
  ...overrides,
});

describe('sync coordinator', () => {
  it('collectPendingOperations filters pending and processing operations', async () => {
    const operations = [
      makeOperation({ opId: 'op-3', entityId: 'c', status: 'failed', clientTimestamp: LATER }),
      makeOperation({ opId: 'op-1', entityId: 'a', status: 'pending', clientTimestamp: NOW }),
      makeOperation({ opId: 'op-2', entityId: 'b', status: 'processing', clientTimestamp: LATER }),
      makeOperation({ opId: 'op-4', entityId: 'd', status: 'acknowledged', clientTimestamp: LATER }),
    ];

    const store = makeQueueStore(operations);
    const pending = await collectPendingOperations(store);

    expect(pending.map((operation) => operation.opId)).toEqual(['op-1', 'op-2']);
  });

  it('prepareSync returns deterministic empty-queue preparation', async () => {
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([]), provider: makeProvider(), now: () => NOW });

    const preparation = await prepareSync({ queueStore: makeQueueStore([]), provider: makeProvider(), now: () => NOW }, NOW);

    expect(preparation.operationsToUpload).toEqual([]);
    expect(preparation.batch.operations).toEqual([]);
    expect(preparation.validation.valid).toBe(true);
    expect(preparation.statistics).toMatchObject({ pendingOperations: 0, failedOperations: 0, queueSize: 0, estimatedUploadCount: 0, conflictCount: 0 });
    expect(coordinator.getStatus().phase).toBe('Idle');
  });

  it('previewSync performs a dry run without calling provider mutation methods', async () => {
    const provider = makeProvider();
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([makeOperation({ status: 'pending' })]), provider, now: () => NOW });

    const preview = await coordinator.previewSync();

    expect(preview.operationsToUpload).toHaveLength(1);
    expect(preview.expectedPull.estimatedOperationCount).toBe(0);
    expect((provider.pushOperations as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
    expect((provider.pullChanges as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('buildSyncBatch preserves order and sync ids', () => {
    const operations = [
      makeOperation({ opId: 'op-b', entityId: 'b', clientTimestamp: LATER }),
      makeOperation({ opId: 'op-a', entityId: 'a', clientTimestamp: NOW }),
    ];

    const batch = buildSyncBatch(operations, NOW);

    expect(batch.operations.map((operation) => operation.id)).toEqual(['op-b', 'op-a']);
    expect(batch.operations[0].entityId).toBe('b');
    expect(batch.id).toContain('sync:2026-01-02T03:04:05.000Z');
  });

  it('validateBatch accepts a valid batch', () => {
    const batch = buildSyncBatch([makeOperation({ opId: 'op-1', entityId: 'a' })], NOW);
    expect(validateBatch(batch)).toEqual({ valid: true, errors: [] });
  });

  it('validateBatch rejects duplicate operation ids', () => {
    const duplicate = buildSyncBatch([makeOperation({ opId: 'op-1', entityId: 'a' })], NOW);
    const invalid: SyncBatch = {
      ...duplicate,
      operations: [duplicate.operations[0], duplicate.operations[0]],
    };

    const validation = validateBatch(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((error) => error.includes('duplicate operation'))).toBe(true);
  });

  it('simulatePush calls the provider for non-empty batches', async () => {
    const provider = makeProvider();
    const batch = buildSyncBatch([makeOperation({ opId: 'op-1', entityId: 'a' })], NOW);

    const push = await simulatePush({ provider }, batch);

    expect(push.attempted).toBe(true);
    expect((provider.pushOperations as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    expect((provider.pushOperations as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({ id: batch.id });
  });

  it('simulatePush skips the provider for empty batches', async () => {
    const provider = makeProvider();

    const push = await simulatePush({ provider }, emptyBatch());

    expect(push.attempted).toBe(false);
    expect((provider.pushOperations as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('simulatePull returns the provider batch deterministically', async () => {
    const batch: SyncBatch = {
      id: 'remote-batch-1',
      operations: [
        {
          id: 'remote-1',
          entity: 'workoutSessions' as SyncOperation['entity'],
          entityId: 'session-remote-1',
          action: 'upsert' as SyncOperation['action'],
          payload: { id: 'session-remote-1', value: 'remote' },
          createdAt: NOW,
        },
      ],
      createdAt: NOW,
    };
    const provider = makeProvider({ pullChanges: vi.fn(async () => batch) });

    const pull = await simulatePull({ provider }, NOW);

    expect(pull.operationCount).toBe(1);
    expect(pull.batch.id).toBe('remote-batch-1');
    expect((provider.pullChanges as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('syncNow completes with an empty queue', async () => {
    const provider = makeProvider({ pullChanges: vi.fn(async () => emptyBatch()) });
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([]), provider, now: () => NOW });

    const result = await coordinator.syncNow();

    expect(result.phase).toBe('Completed');
    expect(result.transitions).toEqual(['Idle', 'Preparing', 'Uploading', 'Downloading', 'Resolving', 'Completed']);
    expect(result.conflicts.records).toHaveLength(0);
    expect(coordinator.getStatus().phase).toBe('Completed');
  });

  it('syncNow uploads pending operations and downloads remote changes', async () => {
    const provider = makeProvider({
      pullChanges: vi.fn(async () => ({
        id: 'remote-batch-1',
        operations: [],
        createdAt: NOW,
      })),
    });
    const coordinator = createSyncCoordinator({
      queueStore: makeQueueStore([
        makeOperation({ opId: 'op-1', entityId: 'a', status: 'pending' }),
        makeOperation({ opId: 'op-2', entityId: 'b', status: 'processing' }),
      ]),
      provider,
      now: () => NOW,
    });

    const result = await coordinator.syncNow();

    expect(result.phase).toBe('Completed');
    expect((provider.pushOperations as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    expect((provider.pullChanges as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    expect(result.statistics.pendingOperations).toBe(2);
    expect(result.statistics.queueSize).toBe(2);
  });

  it('syncNow records deterministic status transitions', async () => {
    const provider = makeProvider();
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([makeOperation({ status: 'pending' })]), provider, now: () => NOW });

    const result = await coordinator.syncNow();

    expect(result.transitions).toEqual(['Idle', 'Preparing', 'Uploading', 'Downloading', 'Resolving', 'Completed']);
  });

  it('syncNow statistics include pending, failed, queue size and timestamps', async () => {
    const coordinator = createSyncCoordinator({
      queueStore: makeQueueStore([
        makeOperation({ opId: 'op-1', entityId: 'a', status: 'pending' }),
        makeOperation({ opId: 'op-2', entityId: 'b', status: 'failed' }),
        makeOperation({ opId: 'op-3', entityId: 'c', status: 'processing' }),
      ]),
      provider: makeProvider(),
      now: () => NOW,
    });

    await coordinator.syncNow();
    const stats = coordinator.getStatistics();

    expect(stats).toMatchObject({
      pendingOperations: 2,
      failedOperations: 1,
      queueSize: 3,
      estimatedUploadCount: 2,
      estimatedDownloadCount: 0,
      conflictCount: 0,
      lastSyncTimestamp: NOW,
    });
  });

  it('syncNow enters Conflict when structured remote changes overlap', async () => {
    const provider = makeProvider({
      pullChanges: vi.fn(async () => ({
        id: 'remote-batch-1',
        operations: [
          {
            id: 'remote-1',
            entity: 'mealTemplates' as SyncOperation['entity'],
            entityId: 'meal-1',
            action: 'upsert' as SyncOperation['action'],
            payload: { id: 'meal-1', title: 'Breakfast B', macros: { protein: 30, carbs: 55 } },
            createdAt: NOW,
          },
        ],
        createdAt: NOW,
      })),
    });
    const coordinator = createSyncCoordinator({
      queueStore: makeQueueStore([
        makeOperation({
          opId: 'op-1',
          entityType: 'mealTemplates',
          entityId: 'meal-1',
          payload: { id: 'meal-1', title: 'Breakfast A', macros: { protein: 30, carbs: 45 } },
          status: 'pending',
        }),
      ]),
      provider,
      now: () => NOW,
    });

    const result = await coordinator.syncNow();

    expect(result.phase).toBe('Conflict');
    expect(result.conflicts.records).toHaveLength(1);
    expect(result.conflicts.results[0].requiresManualReview).toBe(true);
    expect(result.transitions).toContain('Conflict');
  });

  it('cancel short-circuits syncNow without provider calls', async () => {
    const provider = makeProvider();
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([makeOperation()]), provider, now: () => NOW });

    coordinator.cancel();
    const result = await coordinator.syncNow();

    expect(result.status.phase).toBe('Idle');
    expect(result.transitions).toEqual(['Idle']);
    expect((provider.pushOperations as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
    expect((provider.pullChanges as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('resume clears the cancelled flag and allows syncing again', async () => {
    const provider = makeProvider();
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([makeOperation({ status: 'pending' })]), provider, now: () => NOW });

    coordinator.cancel();
    coordinator.resume();
    const result = await coordinator.syncNow();

    expect(result.phase).toBe('Completed');
    expect(coordinator.getStatus().phase).toBe('Completed');
  });

  it('reset clears coordinator state and statistics', async () => {
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([makeOperation({ status: 'pending' })]), provider: makeProvider(), now: () => NOW });

    await coordinator.syncNow();
    coordinator.reset();

    expect(coordinator.getStatus()).toEqual({ phase: 'Idle', cancelled: false, lastSyncAt: undefined });
    expect(coordinator.getStatistics()).toEqual({
      pendingOperations: 0,
      failedOperations: 0,
      queueSize: 0,
      estimatedUploadCount: 0,
      estimatedDownloadCount: 0,
      conflictCount: 0,
      lastSyncTimestamp: undefined,
    });
  });

  it('getStatus reflects the most recent completion timestamp', async () => {
    const coordinator = createSyncCoordinator({ queueStore: makeQueueStore([]), provider: makeProvider(), now: () => NOW });

    await coordinator.syncNow();
    expect(coordinator.getStatus()).toEqual({ phase: 'Completed', cancelled: false, reason: 'sync completed', lastSyncAt: NOW, lastError: undefined });
  });
});
