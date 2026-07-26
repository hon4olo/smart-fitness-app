import { describe, expect, it } from 'vitest';

import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';
import { getNutritionLibrarySyncEntityId } from '@/features/nutrition/nutritionFoodLibrary';

const now = '2026-07-26T20:00:00.000Z';
const legacyLibraryId = 'fatsecret:provider-item-42';

describe('nutrition library sync aliases', () => {
  it('repairs snake_case persisted operations to the same stable UUID', () => {
    const legacyKey = `queue:nutrition_library_items:${legacyLibraryId}:create:${now}`;
    const normalized = normalizeOfflineSyncQueueOperation({
      opId: `nutrition_library_items:${legacyLibraryId}`,
      entityType: 'nutrition_library_items',
      entityId: legacyLibraryId,
      action: 'create',
      payload: {
        schemaVersion: 1,
        libraryId: legacyLibraryId,
        kind: 'provider-favorite',
        name: 'Provider food',
        calories: 100,
        protein: 10,
        carbs: 10,
        fats: 2,
        servingSize: 100,
        servingUnit: 'g',
        quantity: '100 g',
        source: 'fatsecret',
        savedAt: now,
        updatedAt: now,
        revision: 1,
      },
      clientTimestamp: now,
      idempotencyKey: legacyKey,
      retryCount: 0,
      status: 'pending',
      metadata: { requestId: legacyKey, source: 'local' },
    });

    const expectedId = getNutritionLibrarySyncEntityId(legacyLibraryId);
    expect(normalized?.entityId).toBe(expectedId);
    expect(normalized?.payload?.libraryId).toBe(expectedId);
    expect(normalized?.idempotencyKey).not.toBe(legacyKey);
    expect(normalized?.metadata?.clientId).toBe(legacyLibraryId);
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
  });
});
