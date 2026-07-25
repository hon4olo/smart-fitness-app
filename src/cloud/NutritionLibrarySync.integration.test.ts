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
  getActiveNutritionLibraryFoods,
  getNutritionFoodLibraryStorageKey,
  parseNutritionFoodLibrary,
  serializeNutritionFoodLibrary,
  tombstoneNutritionLibraryFood,
  upsertNutritionLibraryFood,
  type NutritionLibraryFood,
} from '@/features/nutrition/nutritionFoodLibrary';

const USER_A = 'user-a';
const USER_B = 'user-b';
const DEVICE_A = 'device-a';
const DEVICE_B = 'device-b';
const T1 = '2026-07-25T10:00:00.000Z';
const T2 = '2026-07-25T11:00:00.000Z';
const T3 = '2026-07-25T12:00:00.000Z';

const providerFood = (overrides: Partial<NutritionLibraryFood> = {}): NutritionLibraryFood => ({
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
  attribution: { provider: 'fatsecret', text: 'Food data provided by FatSecret' },
  savedAt: T1,
  updatedAt: T1,
  revision: 1,
  deletedAt: null,
  ...overrides,
});

const remoteEntity = (food: NutritionLibraryFood, revision = food.revision) => ({
  entityType: 'nutritionLibraryItems',
  entityId: food.libraryId,
  revision,
  appliedAt: food.updatedAt,
  payload: {
    schemaVersion: 1,
    libraryId: food.libraryId,
    kind: food.kind,
    name: food.name,
    ...(food.brandName ? { brandName: food.brandName } : {}),
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    quantity: food.quantity,
    source: food.source,
    ...(food.externalId ? { externalId: food.externalId } : {}),
    ...(food.attribution ? { attribution: food.attribution } : {}),
    savedAt: food.savedAt,
    updatedAt: food.updatedAt,
    revision: food.revision,
  },
});

beforeEach(() => storage.clear());

describe('Nutrition library cross-device hardening', () => {
  it('creates deterministic idempotency identities for replayed create, update, and delete', () => {
    const createOne = createNutritionLibraryQueueOperation({
      item: providerFood(),
      userId: USER_A,
      deviceId: DEVICE_A,
    });
    const createReplay = createNutritionLibraryQueueOperation({
      item: providerFood(),
      userId: USER_A,
      deviceId: DEVICE_A,
    });
    const update = createNutritionLibraryQueueOperation({
      item: providerFood({ calories: 130, revision: 2, updatedAt: T2 }),
      userId: USER_A,
      deviceId: DEVICE_A,
    });
    const deletion = createNutritionLibraryQueueOperation({
      item: providerFood({ revision: 3, updatedAt: T3, deletedAt: T3 }),
      userId: USER_A,
      deviceId: DEVICE_A,
    });

    expect(createReplay.idempotencyKey).toBe(createOne.idempotencyKey);
    expect(createOne).toMatchObject({ action: 'create', baseRevision: { number: 0 } });
    expect(update).toMatchObject({ action: 'update', baseRevision: { number: 1 } });
    expect(deletion).toMatchObject({ action: 'delete', baseRevision: { number: 2 } });
    expect(new Set([createOne.idempotencyKey, update.idempotencyKey, deletion.idempotencyKey]).size).toBe(3);
  });

  it('deduplicates a recovered pending operation after app restart', () => {
    const food = providerFood();
    const recoveredPending = createNutritionLibraryQueueOperation({
      item: food,
      userId: USER_A,
      deviceId: DEVICE_A,
    });

    const plannedAfterRestart = planNutritionLibrarySyncOperations({
      records: parseNutritionFoodLibrary(serializeNutritionFoodLibrary([food])),
      pendingOperations: [recoveredPending],
      userId: USER_A,
      deviceId: DEVICE_A,
    });

    expect(plannedAfterRestart).toEqual([]);
  });

  it('keeps anonymous and signed-in libraries isolated in both directions', async () => {
    const anonymousKey = getNutritionFoodLibraryStorageKey(null);
    const userAKey = getNutritionFoodLibraryStorageKey(USER_A);
    const anonymousFood = providerFood({ name: 'Anonymous yogurt' });
    storage.set(anonymousKey, serializeNutritionFoodLibrary([anonymousFood]));

    await applyRemoteNutritionLibraryChanges({
      userId: USER_A,
      changedEntities: [remoteEntity(providerFood({ calories: 135, revision: 2, updatedAt: T2 }), 2)],
      deletedEntities: [],
    });

    expect(parseNutritionFoodLibrary(storage.get(anonymousKey) ?? null)[0].name).toBe('Anonymous yogurt');
    expect(parseNutritionFoodLibrary(storage.get(userAKey) ?? null)[0].calories).toBe(135);
    expect(storage.has(getNutritionFoodLibraryStorageKey(USER_B))).toBe(false);
  });

  it('applies duplicate remote delivery idempotently without duplicate rows', async () => {
    const entity = remoteEntity(providerFood({ calories: 140, revision: 4, updatedAt: T2 }), 4);
    const input = { userId: USER_A, changedEntities: [entity], deletedEntities: [] };

    await applyRemoteNutritionLibraryChanges(input);
    await applyRemoteNutritionLibraryChanges(input);

    const records = parseNutritionFoodLibrary(
      storage.get(getNutritionFoodLibraryStorageKey(USER_A)) ?? null,
    );
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ calories: 140, revision: 4, deletedAt: null });
  });

  it('replays a remote tombstone idempotently and keeps it hidden from the UI', async () => {
    const key = getNutritionFoodLibraryStorageKey(USER_A);
    storage.set(key, serializeNutritionFoodLibrary([providerFood({ revision: 2, updatedAt: T2 })]));
    const deletion = {
      entityType: 'nutrition_library_items',
      entityId: 'fatsecret:provider-1',
      revision: 3,
      appliedAt: T3,
    };

    await applyRemoteNutritionLibraryChanges({ userId: USER_A, changedEntities: [], deletedEntities: [deletion] });
    await applyRemoteNutritionLibraryChanges({ userId: USER_A, changedEntities: [], deletedEntities: [deletion] });

    const records = parseNutritionFoodLibrary(storage.get(key) ?? null);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ revision: 3, deletedAt: T3 });
    expect(getActiveNutritionLibraryFoods(records)).toEqual([]);
  });

  it('preserves the complete provider snapshot for offline reuse', async () => {
    const food = providerFood({ revision: 7, updatedAt: T3 });
    await applyRemoteNutritionLibraryChanges({
      userId: USER_A,
      changedEntities: [remoteEntity(food, 7)],
      deletedEntities: [],
    });

    const restoredOffline = parseNutritionFoodLibrary(
      storage.get(getNutritionFoodLibraryStorageKey(USER_A)) ?? null,
    )[0];
    expect(restoredOffline).toMatchObject({
      name: 'Greek yogurt',
      brandName: 'Example',
      source: 'fatsecret',
      externalId: 'provider-1',
      calories: 120,
      protein: 18,
      servingSize: 100,
      servingUnit: 'g',
      attribution: { provider: 'fatsecret', text: 'Food data provided by FatSecret' },
    });
  });

  it('fails closed on malformed remote snapshots without touching existing data', async () => {
    const key = getNutritionFoodLibraryStorageKey(USER_A);
    storage.set(key, serializeNutritionFoodLibrary([providerFood()]));

    const result = await applyRemoteNutritionLibraryChanges({
      userId: USER_A,
      changedEntities: [
        {
          entityType: 'nutritionLibraryItems',
          entityId: 'fatsecret:provider-1',
          revision: 9,
          payload: {
            ...remoteEntity(providerFood()).payload,
            source: 'untrusted-provider',
          },
        },
      ],
      deletedEntities: [],
    });

    expect(result.appliedRecordIds).toEqual([]);
    expect(parseNutritionFoodLibrary(storage.get(key) ?? null)[0]).toMatchObject({ revision: 1, calories: 120 });
  });

  it('retains tombstones across serialization and subsequent local resurrection', () => {
    const deleted = tombstoneNutritionLibraryFood([providerFood()], 'fatsecret:provider-1', T2);
    const restored = parseNutritionFoodLibrary(serializeNutritionFoodLibrary(deleted));
    const resurrected = upsertNutritionLibraryFood(
      restored,
      providerFood({ calories: 150 }),
      'provider-favorite',
      T3,
    );

    expect(restored[0]).toMatchObject({ revision: 2, deletedAt: T2 });
    expect(resurrected[0]).toMatchObject({ revision: 3, deletedAt: null, calories: 150 });
    expect(resurrected[0].savedAt).toBe(T1);
  });
});
