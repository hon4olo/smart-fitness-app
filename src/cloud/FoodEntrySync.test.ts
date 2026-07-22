import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { isUuid } from '@/lib/ids';
import {
  applyRemoteFoodEntryChanges,
  createFoodEntryQueueOperation,
  normalizeFoodEntryForSync,
  runWithoutFoodEntryOutbox,
  isFoodEntryOutboxSuppressed,
} from './FoodEntrySync';
import type { FoodEntry } from '@/types';

const foodEntry: FoodEntry = {
  id: 'legacy-food-1',
  name: 'Greek yogurt',
  date: '2026-07-22',
  mealType: 'breakfast',
  brandName: 'Example',
  calories: 120,
  protein: 20,
  carbs: 8,
  fats: 1.5,
  source: 'manual',
  servingSize: 200,
  servingUnit: 'g',
  quantity: 1,
  createdAt: '2026-07-22T08:00:00.000Z',
};

describe('food entry sync', () => {
  it('normalizes legacy ids deterministically and creates a versioned queue payload', () => {
    const first = normalizeFoodEntryForSync(foodEntry);
    const second = normalizeFoodEntryForSync(foodEntry);
    const operation = createFoodEntryQueueOperation({
      action: 'create',
      entry: foodEntry,
      deviceId: '22222222-2222-4222-8222-222222222222',
      actorId: '11111111-1111-4111-8111-111111111111',
      baseRevision: 0,
      now: '2026-07-22T09:00:00.000Z',
    });

    expect(first.id).toBe(second.id);
    expect(isUuid(first.id)).toBe(true);
    expect(operation.entityType).toBe('foodEntries');
    expect(operation.entityId).toBe(first.id);
    expect(operation.payload).toMatchObject({
      schemaVersion: 1,
      id: first.id,
      name: 'Greek yogurt',
      date: '2026-07-22',
      consumedAt: '2026-07-22T12:00:00.000Z',
      mealType: 'breakfast',
      calories: 120,
      protein: 20,
      carbs: 8,
      fats: 1.5,
      source: 'manual',
      createdAt: '2026-07-22T08:00:00.000Z',
      updatedAt: '2026-07-22T09:00:00.000Z',
    });
  });

  it('applies valid remote records and recalculates nutrition totals from canonical entries', () => {
    const id = '33333333-3333-4333-8333-333333333333';
    const result = applyRemoteFoodEntryChanges(
      {
        ...defaultState,
        foodEntries: [],
        nutrition: { calories: 999, protein: 999, carbs: 999, fats: 999 },
      },
      [
        {
          entityType: 'foodEntries',
          entityId: id,
          revision: 5,
          payload: {
            schemaVersion: 1,
            id,
            name: 'Rice',
            date: '2026-07-22',
            consumedAt: '2026-07-22T12:00:00.000Z',
            mealType: 'lunch',
            calories: 300,
            protein: 6,
            carbs: 66,
            fats: 1,
            source: 'local',
            servingSize: 250,
            servingUnit: 'g',
            quantity: 1,
            createdAt: '2026-07-22T12:01:00.000Z',
            deviceId: 'device-b',
          },
        },
      ],
      [],
      new Map(),
      '2026-07-22T12:05:00.000Z',
    );

    expect(result.appliedRecordIds).toEqual([id]);
    expect(result.nextState.foodEntries).toHaveLength(1);
    expect(result.nextState.nutrition).toEqual({
      calories: 300,
      protein: 6,
      carbs: 66,
      fats: 1,
    });
    expect(result.metadata[0]).toMatchObject({ id, revision: 5, deviceId: 'device-b' });
  });

  it('rejects an invalid remote record atomically', () => {
    const id = '33333333-3333-4333-8333-333333333333';
    const result = applyRemoteFoodEntryChanges(
      { ...defaultState, foodEntries: [], nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0 } },
      [
        {
          entityType: 'foodEntries',
          entityId: id,
          revision: 5,
          payload: {
            schemaVersion: 1,
            id,
            name: 'Broken entry',
            date: '2026-07-22',
            consumedAt: '2026-07-23T12:00:00.000Z',
            mealType: 'lunch',
            calories: 300,
            protein: 6,
            carbs: 66,
            fats: 1,
            source: 'local',
            createdAt: '2026-07-22T12:01:00.000Z',
          },
        },
      ],
    );

    expect(result.nextState.foodEntries).toEqual([]);
    expect(result.appliedRecordIds).toEqual([]);
    expect(result.metadata).toEqual([]);
  });

  it('removes remote tombstones and recalculates totals', () => {
    const normalized = normalizeFoodEntryForSync(foodEntry);
    const result = applyRemoteFoodEntryChanges(
      {
        ...defaultState,
        foodEntries: [normalized],
        nutrition: {
          calories: normalized.calories,
          protein: normalized.protein,
          carbs: normalized.carbs,
          fats: normalized.fats,
        },
      },
      [],
      [
        {
          entityType: 'foodEntries',
          entityId: normalized.id,
          revision: 6,
          appliedAt: '2026-07-22T13:00:00.000Z',
        },
      ],
    );

    expect(result.deletedRecordIds).toEqual([normalized.id]);
    expect(result.nextState.foodEntries).toEqual([]);
    expect(result.nextState.nutrition).toEqual({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  });

  it('scopes remote apply suppression synchronously', () => {
    expect(isFoodEntryOutboxSuppressed()).toBe(false);
    runWithoutFoodEntryOutbox(() => {
      expect(isFoodEntryOutboxSuppressed()).toBe(true);
    });
    expect(isFoodEntryOutboxSuppressed()).toBe(false);
  });
});