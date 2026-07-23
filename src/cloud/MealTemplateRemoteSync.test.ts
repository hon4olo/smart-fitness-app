import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import type { MealTemplateSyncMetadata } from '@/storage';
import { applyRemoteMealTemplateChanges } from './MealTemplateRemoteSync';
import { toMealTemplateSyncSnapshot } from './MealTemplateSync';

const userId = '11111111-1111-4111-8111-111111111111';
const entityId = '33333333-3333-4333-8333-333333333333';
const itemId = '44444444-4444-4444-8444-444444444444';
const syncedAt = '2026-07-24T12:00:00.000Z';
const payload = {
  schemaVersion: 1,
  id: entityId,
  name: 'High protein breakfast',
  items: [
    {
      id: itemId,
      name: 'Greek yogurt bowl',
      date: '2026-07-24',
      mealType: 'breakfast',
      brandName: 'Local dairy',
      calories: 420,
      protein: 38,
      carbs: 45,
      fats: 10,
      baseCalories: 210,
      baseProtein: 19,
      baseCarbs: 22.5,
      baseFats: 5,
      source: 'custom',
      externalId: 'greek-yogurt-bowl',
      attribution: {
        provider: 'user',
        text: 'Saved from nutrition diary',
      },
      servingSize: 250,
      servingUnit: 'g',
      quantity: 2,
      createdAt: '2026-07-24T09:00:00.000Z',
    },
  ],
  createdAt: '2026-07-24T10:00:00.000Z',
  updatedAt: '2026-07-24T11:00:00.000Z',
};

describe('remote meal template sync', () => {
  it('materializes a valid remote template and revision metadata', () => {
    const result = applyRemoteMealTemplateChanges(
      defaultState,
      [
        {
          entityType: 'mealTemplates',
          entityId,
          revision: 7,
          operationType: 'upsert',
          payload,
        },
      ],
      [],
      userId,
      new Map(),
      syncedAt,
    );

    expect(result.appliedRecordIds).toEqual([entityId]);
    expect(result.nextState.mealTemplates).toContainEqual(
      expect.objectContaining({
        id: entityId,
        name: 'High protein breakfast',
        items: [
          expect.objectContaining({
            id: itemId,
            name: 'Greek yogurt bowl',
            calories: 420,
            source: 'custom',
          }),
        ],
      }),
    );
    expect(result.metadata).toContainEqual(
      expect.objectContaining({
        id: entityId,
        userId,
        revision: 7,
        deletedAt: null,
      }),
    );
  });

  it('rejects malformed or duplicate nested snapshots without changing state', () => {
    const unknownField = applyRemoteMealTemplateChanges(
      defaultState,
      [
        {
          entityType: 'mealTemplates',
          entityId,
          revision: 7,
          payload: { ...payload, unexpected: true },
        },
      ],
      [],
      userId,
      new Map(),
      syncedAt,
    );
    expect(unknownField.appliedRecordIds).toEqual([]);
    expect(unknownField.nextState).toStrictEqual(defaultState);

    const duplicateItems = applyRemoteMealTemplateChanges(
      defaultState,
      [
        {
          entityType: 'mealTemplates',
          entityId,
          revision: 7,
          payload: { ...payload, items: [payload.items[0], payload.items[0]] },
        },
      ],
      [],
      userId,
      new Map(),
      syncedAt,
    );
    expect(duplicateItems.appliedRecordIds).toEqual([]);
    expect(duplicateItems.nextState).toStrictEqual(defaultState);
  });

  it('applies a tombstone and preserves deletion metadata', () => {
    const template = {
      id: entityId,
      name: payload.name,
      items: [
        {
          ...payload.items[0],
          mealType: 'breakfast' as const,
          source: 'custom' as const,
        },
      ],
      createdAt: payload.createdAt,
    };
    const existingMetadata: MealTemplateSyncMetadata = {
      id: entityId,
      userId,
      revision: 7,
      deviceId: '22222222-2222-4222-8222-222222222222',
      createdAt: payload.createdAt,
      syncedAt,
      snapshot: toMealTemplateSyncSnapshot(template),
      deletedAt: null,
    };
    const state = {
      ...defaultState,
      mealTemplates: [template],
    };
    const result = applyRemoteMealTemplateChanges(
      state,
      [],
      [
        {
          entityType: 'meal_templates',
          entityId,
          revision: 8,
          appliedAt: '2026-07-24T13:00:00.000Z',
        },
      ],
      userId,
      new Map([[`${userId}:${entityId}`, existingMetadata]]),
      syncedAt,
    );

    expect(result.deletedRecordIds).toEqual([entityId]);
    expect(result.nextState.mealTemplates).toEqual([]);
    expect(result.metadata[0]).toMatchObject({
      revision: 8,
      deletedAt: '2026-07-24T13:00:00.000Z',
    });
  });
});
