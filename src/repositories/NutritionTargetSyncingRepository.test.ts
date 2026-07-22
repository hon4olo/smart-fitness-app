import { describe, expect, it, vi } from 'vitest';

import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import { defaultState } from '@/data/defaults';
import { createNutritionTargetSyncingRepository } from './NutritionTargetSyncingRepository';
import type { AppRepository } from './AppRepository';

const makeBaseRepository = (): AppRepository => ({
  loadState: vi.fn(async () => defaultState),
  saveState: vi.fn(async () => undefined),
  clearState: vi.fn(async () => undefined),
});

const makeQueueStore = (): OfflineSyncQueueStore => ({
  loadOperations: vi.fn(async () => []),
  enqueue: vi.fn(async (operation: OfflineSyncQueueOperation) => [operation]),
  enqueueBatch: vi.fn(async (operations: OfflineSyncQueueOperation[]) => operations),
  updateOperation: vi.fn(async () => []),
  acknowledge: vi.fn(async () => []),
  removeAcknowledged: vi.fn(async () => []),
  clear: vi.fn(async () => undefined),
  getPending: vi.fn(async () => []),
  getFailed: vi.fn(async () => []),
});

const session = {
  user: { id: '11111111-1111-4111-8111-111111111111' },
  device: { id: '22222222-2222-4222-8222-222222222222' },
} as never;

describe('nutrition target syncing repository', () => {
  it('bootstraps targets for an authenticated user when metadata is absent', async () => {
    const queueStore = makeQueueStore();
    const repository = createNutritionTargetSyncingRepository(makeBaseRepository(), {
      authService: { getCurrentSession: vi.fn(async () => session) },
      queueStore,
      metadataStore: {
        load: vi.fn(async () => new Map()),
        get: vi.fn(async () => null),
        set: vi.fn(async () => new Map()),
        clear: vi.fn(async () => undefined),
      },
    });

    await repository.loadState();
    await repository.saveState(defaultState);

    expect(queueStore.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'nutritionTargets',
        action: 'create',
        actorId: '11111111-1111-4111-8111-111111111111',
      }),
    );
  });

  it('does not queue targets while signed out', async () => {
    const queueStore = makeQueueStore();
    const repository = createNutritionTargetSyncingRepository(makeBaseRepository(), {
      authService: { getCurrentSession: vi.fn(async () => null) },
      queueStore,
      metadataStore: {
        load: vi.fn(async () => new Map()),
        get: vi.fn(async () => null),
        set: vi.fn(async () => new Map()),
        clear: vi.fn(async () => undefined),
      },
    });

    await repository.loadState();
    await repository.saveState({
      ...defaultState,
      nutritionTargets: { calories: 2300, protein: 175, carbs: 260, fats: 68 },
    });

    expect(queueStore.enqueue).not.toHaveBeenCalled();
  });

  it('queues an update when synced targets change', async () => {
    const queueStore = makeQueueStore();
    const repository = createNutritionTargetSyncingRepository(makeBaseRepository(), {
      authService: { getCurrentSession: vi.fn(async () => session) },
      queueStore,
      metadataStore: {
        load: vi.fn(async () => new Map()),
        get: vi.fn(async () => ({
          id: '33333333-3333-4333-8333-333333333333',
          revision: 4,
          deviceId: 'device-b',
          effectiveFrom: '2026-07-20T00:00:00.000Z',
          syncedAt: '2026-07-21T00:00:00.000Z',
          deletedAt: null,
        })),
        set: vi.fn(async () => new Map()),
        clear: vi.fn(async () => undefined),
      },
    });

    await repository.loadState();
    await repository.saveState({
      ...defaultState,
      nutritionTargets: { calories: 2300, protein: 175, carbs: 260, fats: 68 },
    });

    expect(queueStore.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'nutritionTargets',
        action: 'update',
        baseRevision: expect.objectContaining({ number: 4 }),
      }),
    );
  });
});