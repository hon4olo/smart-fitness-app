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
  deletedAt: null,
  ...overrides,
});

beforeEach(() => storage.clear());

describe('Nutrition library synchronization', () => {
  it('creates stable idempotent queue operations for string library IDs', () => {
    const operation = createNutritionLibraryQueueOperation({
      item: item(),
      userId: 'user-1',
      deviceId: 'device-1',
    });

    expect(operation).toMatchObject({
      entityType: 'nutritionLibraryItems',
      entityId: 'fatsecret:provider-1',
      action: 'create',
      actorId: 'user-1',
      baseRevision: { number: 0 },
    });
    expect(operation.payload).toMatchObject({
      schemaVersion: 1,
      libraryId: 'fatsecret:provider-1',
      kind: 'provider-favorite',
    });
  });

  it('plans only records without an existing pending operation', () => {
    const first = item();
    const second = item({ libraryId: 'custom:oats:', kind: 'custom' });
    const pending = createNutritionLibraryQueueOperation({
      item: first,
      userId: 'user-1',
      deviceId: 'device-1',
    });

    expect(
      planNutritionLibrarySyncOperations({
        records: [first, second],
        pendingOperations: [pending],
        userId: 'user-1',
        deviceId: 'device-1',
      }).map((operation) => operation.entityId),
    ).toEqual(['custom:oats:']);
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
      deletedAt: '2026-07-25T12:00:00.000Z',
    });
    expect(storage.has(getNutritionFoodLibraryStorageKey(null))).toBe(false);
  });
});
