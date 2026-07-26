import { describe, expect, it } from 'vitest';

import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';
import { createNutritionLibraryQueueOperation } from '@/cloud/NutritionLibrarySync';
import {
  getNutritionLibraryId,
  getNutritionLibrarySyncEntityId,
  parseNutritionFoodLibrary,
  type NutritionLibraryFood,
} from '@/features/nutrition/nutritionFoodLibrary';
import { isUuid } from '@/lib/ids';

const now = '2026-07-26T20:00:00.000Z';
const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const legacyLibraryId = 'custom:chicken breast:store';

const legacyItem: NutritionLibraryFood = {
  libraryId: legacyLibraryId,
  kind: 'custom',
  name: 'Chicken Breast',
  brandName: 'Store',
  calories: 165,
  protein: 31,
  carbs: 0,
  fats: 3.6,
  servingSize: 100,
  servingUnit: 'g',
  quantity: '100 g',
  source: 'manual',
  savedAt: now,
  updatedAt: now,
  revision: 1,
  syncedRevision: 0,
  deletedAt: null,
};

describe('nutrition library sync identity', () => {
  it('creates stable UUID IDs for new saved foods', () => {
    const id = getNutritionLibraryId(legacyItem);
    expect(isUuid(id)).toBe(true);
    expect(id).toBe(getNutritionLibrarySyncEntityId(legacyLibraryId));
  });

  it('migrates persisted semantic IDs while parsing local storage', () => {
    const [item] = parseNutritionFoodLibrary(JSON.stringify([legacyItem]));
    expect(item).toBeDefined();
    expect(item?.libraryId).toBe(getNutritionLibrarySyncEntityId(legacyLibraryId));
  });

  it('uses the migrated UUID in the operation envelope and payload', () => {
    const [item] = parseNutritionFoodLibrary(JSON.stringify([legacyItem]));
    const operation = createNutritionLibraryQueueOperation({
      item: item!,
      userId,
      deviceId,
    });
    expect(isUuid(operation.entityId)).toBe(true);
    expect(operation.payload?.libraryId).toBe(operation.entityId);
  });

  it('repairs already persisted queue operations and regenerates request identity', () => {
    const legacyKey = `queue:nutritionLibraryItems:${legacyLibraryId}:create:${now}`;
    const normalized = normalizeOfflineSyncQueueOperation({
      opId: `nutritionLibraryItems:${legacyLibraryId}`,
      entityType: 'nutritionLibraryItems',
      entityId: legacyLibraryId,
      action: 'create',
      payload: {
        schemaVersion: 1,
        libraryId: legacyLibraryId,
        kind: 'custom',
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        servingSize: 100,
        servingUnit: 'g',
        quantity: '100 g',
        source: 'manual',
        savedAt: now,
        updatedAt: now,
        revision: 1,
      },
      clientTimestamp: now,
      actorId: userId,
      baseRevision: { id: 'rev-0', number: 0, createdAt: now },
      idempotencyKey: legacyKey,
      retryCount: 0,
      status: 'pending',
      metadata: { requestId: legacyKey, userId, deviceId, source: 'local' },
    });

    expect(normalized).not.toBeNull();
    expect(isUuid(normalized?.entityId)).toBe(true);
    expect(normalized?.payload?.libraryId).toBe(normalized?.entityId);
    expect(normalized?.idempotencyKey).not.toBe(legacyKey);
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
  });
});
