import { describe, expect, it } from 'vitest';

import { createConflictResolver } from './CloudConflictResolver';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

const baseMealTemplate = {
  id: 'meal-template-a',
  name: 'High protein breakfast',
  items: [
    {
      id: 'greek-yogurt-bowl',
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
      servingSize: 250,
      servingUnit: 'g',
      quantity: 2,
      createdAt: '2026-07-24T09:00:00.000Z',
    },
  ],
  createdAt: '2026-07-24T10:00:00.000Z',
};

describe('meal template two-device conflict matrix', () => {
  it('merges independent template metadata and item-list edits', () => {
    const resolver = createConflictResolver();
    const addedItem = {
      id: 'banana-a',
      name: 'Banana',
      date: '2026-07-24',
      mealType: 'breakfast',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fats: 0.4,
      baseCalories: 105,
      baseProtein: 1.3,
      baseCarbs: 27,
      baseFats: 0.4,
      source: 'custom',
      servingSize: 1,
      servingUnit: 'piece',
      quantity: 1,
      createdAt: '2026-07-24T09:30:00.000Z',
    };
    const record = resolver.detectConflict({
      entityType: 'mealTemplates',
      entityId: baseMealTemplate.id,
      baseVersion: baseMealTemplate,
      localVersion: {
        ...baseMealTemplate,
        name: 'High protein breakfast A',
      },
      remoteVersion: {
        ...baseMealTemplate,
        items: [...baseMealTemplate.items, addedItem],
      },
      localRevision: revision('device-a-rev-2', 2, '2026-07-24T10:00:00.000Z'),
      remoteRevision: revision('device-b-rev-2', 2, '2026-07-24T10:01:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.requiresManualReview).toBe(false);
    expect(result.resolvedValue).toEqual({
      ...baseMealTemplate,
      name: 'High protein breakfast A',
      items: [...baseMealTemplate.items, addedItem],
    });
  });

  it('merges independent edits to the same meal item', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'mealTemplates',
      entityId: baseMealTemplate.id,
      baseVersion: baseMealTemplate,
      localVersion: {
        ...baseMealTemplate,
        items: [
          {
            ...baseMealTemplate.items[0],
            quantity: 2.5,
          },
        ],
      },
      remoteVersion: {
        ...baseMealTemplate,
        items: [
          {
            ...baseMealTemplate.items[0],
            brandName: 'Updated dairy',
          },
        ],
      },
      localRevision: revision('device-a-rev-3', 3, '2026-07-24T10:02:00.000Z'),
      remoteRevision: revision('device-b-rev-3', 3, '2026-07-24T10:03:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({
      ...baseMealTemplate,
      items: [
        {
          ...baseMealTemplate.items[0],
          brandName: 'Updated dairy',
          quantity: 2.5,
        },
      ],
    });
  });

  it('requires review when both devices edit the same template field', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'mealTemplates',
      entityId: baseMealTemplate.id,
      baseVersion: baseMealTemplate,
      localVersion: {
        ...baseMealTemplate,
        name: 'Device A breakfast',
      },
      remoteVersion: {
        ...baseMealTemplate,
        name: 'Device B breakfast',
      },
      localRevision: revision('device-a-rev-4', 4, '2026-07-24T10:04:00.000Z'),
      remoteRevision: revision('device-b-rev-4', 4, '2026-07-24T10:05:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('name');
  });

  it('requires review when both devices edit the same meal-item field', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'mealTemplates',
      entityId: baseMealTemplate.id,
      baseVersion: baseMealTemplate,
      localVersion: {
        ...baseMealTemplate,
        items: [
          {
            ...baseMealTemplate.items[0],
            calories: 450,
          },
        ],
      },
      remoteVersion: {
        ...baseMealTemplate,
        items: [
          {
            ...baseMealTemplate.items[0],
            calories: 390,
          },
        ],
      },
      localRevision: revision('device-a-rev-5', 5, '2026-07-24T10:06:00.000Z'),
      remoteRevision: revision('device-b-rev-5', 5, '2026-07-24T10:07:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields.some((field) => field.endsWith('.calories'))).toBe(true);
  });

  it('keeps a device-A delete versus device-B update visible', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'mealTemplates',
      entityId: baseMealTemplate.id,
      baseVersion: baseMealTemplate,
      localVersion: null,
      remoteVersion: {
        ...baseMealTemplate,
        name: 'Remote update',
      },
      localRevision: revision('device-a-delete-6', 6, '2026-07-24T10:08:00.000Z'),
      remoteRevision: revision('device-b-update-6', 6, '2026-07-24T10:09:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.conflictingFields).toEqual(['root']);
    expect(result.reason).toBe('local delete versus remote update');
  });

  it('keeps a device-A update versus device-B delete visible', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'mealTemplates',
      entityId: baseMealTemplate.id,
      baseVersion: baseMealTemplate,
      localVersion: {
        ...baseMealTemplate,
        name: 'Local update',
      },
      remoteVersion: null,
      localRevision: revision('device-a-update-7', 7, '2026-07-24T10:10:00.000Z'),
      remoteRevision: revision('device-b-delete-7', 7, '2026-07-24T10:11:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.conflictingFields).toEqual(['root']);
    expect(result.reason).toBe('local update versus remote delete');
  });
});
