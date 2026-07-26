import { describe, expect, it } from 'vitest';

import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';
import { getNutritionLibrarySyncEntityId } from '@/features/nutrition/nutritionFoodLibrary';

const now = '2026-07-26T20:00:00.000Z';
const legacyLibraryId = 'fatsecret:provider-item-42';

const createPayload = (libraryId: string) => ({
  schemaVersion: 1,
  libraryId,
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
});

describe('nutrition library sync aliases', () => {
  it('repairs snake_case persisted operations to the same stable UUID', () => {
    const legacyKey = `queue:nutrition_library_items:${legacyLibraryId}:create:${now}`;
    const normalized = normalizeOfflineSyncQueueOperation({
      opId: `nutrition_library_items:${legacyLibraryId}`,
      entityType: 'nutrition_library_items',
      entityId: legacyLibraryId,
      action: 'create',
      payload: createPayload(legacyLibraryId),
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

  it('keeps an already canonical UUID operation stable across reloads', () => {
    const entityId = getNutritionLibrarySyncEntityId(legacyLibraryId);
    const canonical = normalizeOfflineSyncQueueOperation({
      opId: `nutritionLibraryItems:${entityId}`,
      entityType: 'nutritionLibraryItems',
      entityId,
      action: 'create',
      payload: createPayload(entityId),
      clientTimestamp: now,
      actorId: 'user-a',
      baseRevision: { id: 'rev-0', number: 0, createdAt: now },
      retryCount: 0,
      status: 'pending',
      metadata: { clientId: legacyLibraryId, source: 'local' },
    });
    const reloaded = normalizeOfflineSyncQueueOperation(canonical);

    expect(reloaded?.entityId).toBe(entityId);
    expect(reloaded?.payload?.libraryId).toBe(entityId);
    expect(reloaded?.metadata?.clientId).toBe(legacyLibraryId);
    expect(reloaded?.idempotencyKey).toBe(canonical?.idempotencyKey);
  });
});
