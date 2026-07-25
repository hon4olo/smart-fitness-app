import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

import {
  acknowledgeNutritionLibraryOperations,
  applyRemoteNutritionLibraryChanges,
  createNutritionLibraryQueueOperation,
  planNutritionLibrarySyncOperations,
} from './NutritionLibrarySync';
import {
  getNutritionFoodLibraryStorageKey,
  parseNutritionFoodLibrary,
  serializeNutritionFoodLibrary,
  type NutritionLibraryFood,
} from '@/features/nutrition/nutritionFoodLibrary';

const item = (overrides: Partial<NutritionLibraryFood> = {}): NutritionLibraryFood => ({
  libraryId: 'fatsecret:provider-1',
  kind: 'provider-favorite',
  name: 'Greek yogurt',
  brandName: 'Example',
  calories: 120,
  protein: 18,
  carbs: 8,
  fats: 2,
  servingSize: 100,
  servingUnit: 'g',
  quantity: '1',
  source: 'fatsecret',
  externalId: 'provider-1',
  savedAt: '2026-07-25T10:00:00.000Z',
  updatedAt: '2026-07-25T10:00:00.000Z',
  revision: 1,
  syncedRevision: 0,
  deletedAt: null,
  ...overrides,
});

beforeEach(() => storage.clear());

describe('Nutrition library synchronization', () => {
  it('creates stable idempotent queue operations from the last server revision', () => {
    const operation = createNutritionLibraryQueueOperation({
      item: item({ revision: 4, syncedRevision: 3 }),
      userId: 'user-1',
      deviceId: 'device-1',
    });

    expect(operation).toMatchObject({
      entityType: 'nutritionLibraryItems',
      entityId: 'fatsecret:provider-1',
      action: 'update',
      actorId: 'user-1',
      baseRevision: { number: 3 },
    });
    expect(operation.payload).toMatchObject({
      schemaVersion: 1,
      libraryId: 'fatsecret:provider-1',
      kind: 'provider-favorite',
    });
  });

  it('plans only dirty records without an existing pending operation', () => {
    const first = item();
    const second = item({ libraryId: 'custom:oats:', kind: 'custom' });
    const clean = item({ libraryId: 'custom:clean:', revision: 5, syncedRevision: 5 });
    const pending = createNutritionLibraryQueueOperation({
      item: first,
      userId: 'user-1',
      deviceId: 'device-1',
    });

    expect(
      planNutritionLibrarySyncOperations({
        records: [first, second, clean],
        pendingOperations: [pending],
        userId: 'user-1',
        deviceId: 'device-1',
      }).map((operation) => operation.entityId),
    ).toEqual(['custom:oats:']);
  });

  it('records a server acknowledgement so the same local revision is not planned again', async () => {
    const key = getNutritionFoodLibraryStorageKey('user-1');
    storage.set(key, serializeNutritionFoodLibrary([item({ revision: 2, syncedRevision: 1 })]));

    await acknowledgeNutritionLibraryOperations({
      userId: 'user-1',
      appliedOperations: [
        {
          entityType: 'nutritionLibraryItems',
          entityId: 'fatsecret:provider-1',
          revision: 2,
        },
      ],
    });

    const records = parseNutritionFoodLibrary(storage.get(key) ?? null);
    expect(records[0]).toMatchObject({ revision: 2, syncedRevision: 2 });
    expect(
      planNutritionLibrarySyncOperations({
        records,
        pendingOperations: [],
        userId: 'user-1',
        deviceId: 'device-1',
      }),
    ).toEqual([]);
  });

  it('does not acknowledge a newer local revision beyond the applied server revision', async () => {
    const key = getNutritionFoodLibraryStorageKey('user-1');
    storage.set(key, serializeNutritionFoodLibrary([item({ revision: 4, syncedRevision: 1 })]));

    await acknowledgeNutritionLibraryOperations({
      userId: 'user-1',
      appliedOperations: [
        {
          entityType: 'nutritionLibraryItems',
          entityId: 'fatsecret:provider-1',
          revision: 2,
        },
      ],
    });

    const records = parseNutritionFoodLibrary(storage.get(key) ?? null);
    expect(records[0]).toMatchObject({ revision: 4, syncedRevision: 2 });
    expect(
      planNutritionLibrarySyncOperations({
        records,
        pendingOperations: [],
        userId: 'user-1',
        deviceId: 'device-1',
      }),
    ).toHaveLength(1);
  });

  it('applies remote upserts and tombstones to the signed-in account scope', async () => {
    const key = getNutritionFoodLibraryStorageKey('user-1');
    storage.set(key, serializeNutritionFoodLibrary([item()]));

    const upsert = await applyRemoteNutritionLibraryChanges({
      userId: 'user-1',
      changedEntities: [
        {
          entityType: 'nutritionLibraryItems',
          entityId: 'fatsecret:provider-1',
          revision: 4,
          appliedAt: '2026-07-25T11:00:00.000Z',
          payload: {
            schemaVersion: 1,
            libraryId: 'fatsecret:provider-1',
            kind: 'provider-favorite',
            name: 'Greek yogurt',
            brandName: 'Example',
            calories: 130,
            protein: 19,
            carbs: 8,
            fats: 2,
            servingSize: 100,
            servingUnit: 'g',
            quantity: '1',
            source: 'fatsecret',
            externalId: 'provider-1',
            savedAt: '2026-07-25T10:00:00.000Z',
            updatedAt: '2026-07-25T11:00:00.000Z',
            revision: 2,
          },
        },
      ],
      deletedEntities: [],
    });

    expect(upsert.appliedRecordIds).toEqual(['fatsecret:provider-1']);
    expect(parseNutritionFoodLibrary(storage.get(key) ?? null)[0]).toMatchObject({
      calories: 130,
      revision: 4,
      syncedRevision: 4,
      deletedAt: null,
    });

    const deletion = await applyRemoteNutritionLibraryChanges({
      userId: 'user-1',
      changedEntities: [],
      deletedEntities: [
        {
          entityType: 'nutrition_library_items',
          entityId: 'fatsecret:provider-1',
          revision: 5,
          appliedAt: '2026-07-25T12:00:00.000Z',
        },
      ],
    });

    expect(deletion.deletedRecordIds).toEqual(['fatsecret:provider-1']);
    expect(parseNutritionFoodLibrary(storage.get(key) ?? null)[0]).toMatchObject({
      revision: 5,
      syncedRevision: 5,
      deletedAt: '2026-07-25T12:00:00.000Z',
    });
    expect(storage.has(getNutritionFoodLibraryStorageKey(null))).toBe(false);
  });

  it('ignores stale remote updates and tombstones when a newer local revision exists', async () => {
    const key = getNutritionFoodLibraryStorageKey('user-1');
    storage.set(
      key,
      serializeNutritionFoodLibrary([
        item({ calories: 180, revision: 6, syncedRevision: 4, updatedAt: '2026-07-25T13:00:00.000Z' }),
      ]),
    );

    const result = await applyRemoteNutritionLibraryChanges({
      userId: 'user-1',
      changedEntities: [
        {
          entityType: 'nutritionLibraryItems',
          entityId: 'fatsecret:provider-1',
          revision: 5,
          payload: {
            schemaVersion: 1,
            libraryId: 'fatsecret:provider-1',
            kind: 'provider-favorite',
            name: 'Greek yogurt',
            calories: 100,
            protein: 10,
            carbs: 5,
            fats: 1,
            servingSize: 100,
            servingUnit: 'g',
            quantity: '1',
            source: 'fatsecret',
            savedAt: '2026-07-25T10:00:00.000Z',
            updatedAt: '2026-07-25T12:00:00.000Z',
            revision: 5,
          },
        },
      ],
      deletedEntities: [
        {
          entityType: 'nutritionLibraryItems',
          entityId: 'fatsecret:provider-1',
          revision: 5,
          appliedAt: '2026-07-25T12:00:00.000Z',
        },
      ],
    });

    expect(result).toEqual({ appliedRecordIds: [], deletedRecordIds: [] });
    expect(parseNutritionFoodLibrary(storage.get(key) ?? null)[0]).toMatchObject({
      calories: 180,
      revision: 6,
      syncedRevision: 4,
      deletedAt: null,
    });
  });
});