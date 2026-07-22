import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { isUuid } from '@/lib/ids';
import {
  applyRemoteNutritionTargetChanges,
  createNutritionTargetQueueOperation,
  getNutritionTargetEntityId,
} from './NutritionTargetSync';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';

describe('nutrition target sync', () => {
  it('derives a stable user-scoped entity id and versioned payload', () => {
    const id = getNutritionTargetEntityId(userId);
    const operation = createNutritionTargetQueueOperation({
      action: 'create',
      targets: { calories: 2400, protein: 180, carbs: 280, fats: 70 },
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-22T12:00:00.000Z',
    });

    expect(isUuid(id)).toBe(true);
    expect(getNutritionTargetEntityId(userId)).toBe(id);
    expect(getNutritionTargetEntityId('99999999-9999-4999-8999-999999999999')).not.toBe(id);
    expect(operation).toMatchObject({
      entityType: 'nutritionTargets',
      entityId: id,
      actorId: userId,
      payload: {
        schemaVersion: 1,
        id,
        calories: 2400,
        protein: 180,
        carbs: 280,
        fats: 70,
        effectiveFrom: '2026-07-22T12:00:00.000Z',
      },
    });
  });

  it('applies only the authenticated user singleton record', () => {
    const id = getNutritionTargetEntityId(userId);
    const result = applyRemoteNutritionTargetChanges(
      defaultState,
      [
        {
          entityType: 'nutritionTargets',
          entityId: id,
          revision: 4,
          payload: {
            schemaVersion: 1,
            id,
            calories: 2200,
            protein: 170,
            carbs: 240,
            fats: 65,
            effectiveFrom: '2026-07-22T00:00:00.000Z',
            deviceId,
          },
        },
        {
          entityType: 'nutritionTargets',
          entityId: getNutritionTargetEntityId('99999999-9999-4999-8999-999999999999'),
          revision: 5,
          payload: {
            schemaVersion: 1,
            id: getNutritionTargetEntityId('99999999-9999-4999-8999-999999999999'),
            calories: 9999,
            protein: 999,
            carbs: 999,
            fats: 999,
            effectiveFrom: '2026-07-22T00:00:00.000Z',
          },
        },
      ],
      [],
      userId,
      new Map(),
      '2026-07-22T12:05:00.000Z',
    );

    expect(result.nextState.nutritionTargets).toEqual({
      calories: 2200,
      protein: 170,
      carbs: 240,
      fats: 65,
    });
    expect(result.appliedRecordIds).toEqual([id]);
    expect(result.metadata[0]).toMatchObject({ id, revision: 4, deviceId });
  });

  it('rejects malformed targets atomically and resets on a valid tombstone', () => {
    const id = getNutritionTargetEntityId(userId);
    const invalid = applyRemoteNutritionTargetChanges(
      defaultState,
      [
        {
          entityType: 'nutritionTargets',
          entityId: id,
          revision: 1,
          payload: {
            schemaVersion: 1,
            id,
            calories: 0,
            protein: 170,
            carbs: 240,
            fats: 65,
            effectiveFrom: 'bad-date',
          },
        },
      ],
      [],
      userId,
    );
    expect(invalid.appliedRecordIds).toEqual([]);
    expect(invalid.nextState.nutritionTargets).toEqual(defaultState.nutritionTargets);

    const deleted = applyRemoteNutritionTargetChanges(
      { ...defaultState, nutritionTargets: { calories: 3000, protein: 200, carbs: 350, fats: 80 } },
      [],
      [{ entityType: 'nutritionTargets', entityId: id, revision: 2 }],
      userId,
    );
    expect(deleted.deletedRecordIds).toEqual([id]);
    expect(deleted.nextState.nutritionTargets).toEqual(defaultState.nutritionTargets);
  });
});