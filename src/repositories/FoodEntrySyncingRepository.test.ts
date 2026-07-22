import { describe, expect, it, vi } from 'vitest';

import { defaultState } from '@/data/defaults';
import { normalizeFoodEntryForSync, runWithoutFoodEntryOutbox } from '@/cloud/FoodEntrySync';
import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import type { AppRepository } from './AppRepository';
import { createFoodEntrySyncingRepository, diffFoodEntries } from './FoodEntrySyncingRepository';
import type { AppState, FoodEntry } from '@/types';

const entry: FoodEntry = {
  id: 'legacy-food-1',
  name: 'Greek yogurt',
  date: '2026-07-22',
  mealType: 'breakfast',
  calories: 120,
  protein: 20,
  carbs: 8,
  fats: 1.5,
  source: 'manual',
  createdAt: '2026-07-22T08:00:00.000Z',
};

const makeBaseRepository = (
  state: AppState = { ...defaultState, foodEntries: [] },
): AppRepository => ({
  loadState: vi.fn(async () => state),
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

describe('food entry syncing repository', () => {
  it('classifies create, update and delete changes after UUID normalization', () => {
    const normalized = normalizeFoodEntryForSync(entry);
    expect(diffFoodEntries([], [entry])).toEqual([
      expect.objectContaining({ action: 'create', entry: expect.objectContaining({ id: normalized.id }) }),
    ]);
    expect(diffFoodEntries([entry], [{ ...entry, calories: 130 }])).toEqual([
      expect.objectContaining({ action: 'update', entry: expect.objectContaining({ calories: 130 }) }),
    ]);
    expect(diffFoodEntries([entry], [])).toEqual([
      expect.objectContaining({ action: 'delete', entry: expect.objectContaining({ id: normalized.id }) }),
    ]);
  });

  it('enqueues a user-scoped create operation after a local save', async () => {
    const baseRepository = makeBaseRepository();
    const queueStore = makeQueueStore();
    const repository = createFoodEntrySyncingRepository(baseRepository, {
      authService: {
        getCurrentSession: vi.fn(async () => ({
          user: { id: '11111111-1111-4111-8111-111111111111' },
          device: { id: '22222222-2222-4222-8222-222222222222' },
        } as never)),
      },
      queueStore,
      metadataStore: {
        load: vi.fn(async () => new Map()),
        get: vi.fn(async () => null),
        set: vi.fn(async () => new Map()),
        remove: vi.fn(async () => new Map()),
        clear: vi.fn(async () => undefined),
      },
    });

    await repository.loadState();
    await repository.saveState({ ...defaultState, foodEntries: [entry] });

    expect(queueStore.enqueue).toHaveBeenCalledTimes(1);
    expect(queueStore.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'foodEntries',
        action: 'create',
        actorId: '11111111-1111-4111-8111-111111111111',
        metadata: expect.objectContaining({
          deviceId: '22222222-2222-4222-8222-222222222222',
          userId: '11111111-1111-4111-8111-111111111111',
        }),
      }),
    );
  });

  it('does not echo remote state saves back into the outbox', async () => {
    const baseRepository = makeBaseRepository();
    const queueStore = makeQueueStore();
    const repository = createFoodEntrySyncingRepository(baseRepository, {
      authService: { getCurrentSession: vi.fn(async () => null) },
      queueStore,
      metadataStore: {
        load: vi.fn(async () => new Map()),
        get: vi.fn(async () => null),
        set: vi.fn(async () => new Map()),
        remove: vi.fn(async () => new Map()),
        clear: vi.fn(async () => undefined),
      },
    });

    await repository.loadState();
    await runWithoutFoodEntryOutbox(() =>
      repository.saveState({ ...defaultState, foodEntries: [normalizeFoodEntryForSync(entry)] }),
    );

    expect(queueStore.enqueue).not.toHaveBeenCalled();
  });
});