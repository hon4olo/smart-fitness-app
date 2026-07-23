import { describe, expect, it } from 'vitest';

import type { MealTemplateSyncMetadata } from '@/storage';
import type { MealTemplate } from '@/types';
import {
  getMealTemplateEntityId,
  normalizeMealTemplateForSync,
  toMealTemplateSyncSnapshot,
} from './MealTemplateSync';
import { planMealTemplateSyncOperations } from './MealTemplateSyncPlanner';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const now = '2026-07-24T12:00:00.000Z';
const template: MealTemplate = {
  id: 'high-protein-breakfast',
  name: 'High protein breakfast',
  items: [
    {
      id: 'yogurt-item',
      name: 'Greek yogurt bowl',
      date: '2026-07-24',
      mealType: 'breakfast',
      calories: 420,
      protein: 38,
      carbs: 45,
      fats: 10,
      source: 'custom',
      servingSize: 250,
      servingUnit: 'g',
      quantity: 2,
      createdAt: '2026-07-24T09:00:00.000Z',
    },
  ],
  createdAt: '2026-07-24T10:00:00.000Z',
};
const normalized = normalizeMealTemplateForSync(template, now);
const entityId = getMealTemplateEntityId(template.id);

const metadata = (overrides: Partial<MealTemplateSyncMetadata> = {}) => ({
  id: entityId,
  userId,
  revision: 4,
  deviceId,
  createdAt: normalized.createdAt,
  syncedAt: '2026-07-24T11:00:00.000Z',
  snapshot: toMealTemplateSyncSnapshot(normalized),
  deletedAt: null,
  ...overrides,
});

describe('meal template sync planner', () => {
  it('creates a strict operation with stable UUID identities', () => {
    const operations = planMealTemplateSyncOperations({
      templates: [template],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      entityType: 'mealTemplates',
      entityId,
      action: 'create',
      baseRevision: { number: 0 },
      payload: {
        schemaVersion: 1,
        id: entityId,
        name: 'High protein breakfast',
      },
    });
    expect(operations[0]?.payload?.items).toEqual([
      expect.objectContaining({
        id: normalized.items[0]?.id,
        name: 'Greek yogurt bowl',
        source: 'custom',
      }),
    ]);
  });

  it('skips unchanged, empty and already pending templates', () => {
    expect(
      planMealTemplateSyncOperations({
        templates: [template],
        metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
        pendingOperations: [],
        userId,
        deviceId,
        now,
      }),
    ).toEqual([]);

    expect(
      planMealTemplateSyncOperations({
        templates: [{ ...template, items: [] }],
        metadata: new Map(),
        pendingOperations: [],
        userId,
        deviceId,
        now,
      }),
    ).toEqual([]);

    expect(
      planMealTemplateSyncOperations({
        templates: [{ ...template, name: 'Changed' }],
        metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
        pendingOperations: [
          {
            opId: `mealTemplates:${entityId}`,
            entityType: 'mealTemplates',
            entityId,
            action: 'update',
            payload: {},
            baseRevision: { id: 'rev-4', number: 4, createdAt: now },
            clientTimestamp: now,
            idempotencyKey: 'pending-meal-template',
            retryCount: 0,
            status: 'pending',
            metadata: { userId },
          },
        ],
        userId,
        deviceId,
        now,
      }),
    ).toEqual([]);
  });

  it('creates update and deletion operations from revision metadata', () => {
    const updated = planMealTemplateSyncOperations({
      templates: [{ ...template, name: 'Breakfast v2' }],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(updated[0]).toMatchObject({
      entityId,
      action: 'update',
      baseRevision: { number: 4 },
    });

    const deleted = planMealTemplateSyncOperations({
      templates: [],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(deleted[0]).toMatchObject({
      entityId,
      action: 'delete',
      baseRevision: { number: 4 },
    });
  });
});
