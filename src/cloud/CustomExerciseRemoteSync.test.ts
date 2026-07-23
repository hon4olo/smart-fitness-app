import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import type { CustomExerciseSyncMetadata } from '@/storage';
import { applyRemoteCustomExerciseChanges } from './CustomExerciseRemoteSync';

const userId = '11111111-1111-4111-8111-111111111111';
const entityId = '33333333-3333-4333-8333-333333333333';
const syncedAt = '2026-07-24T12:00:00.000Z';
const payload = {
  schemaVersion: 1,
  id: entityId,
  name: 'Cable Y Raise',
  aliases: ['Cable Y-Raise'],
  category: 'shoulders',
  primaryMuscles: ['lateral deltoid'],
  secondaryMuscles: ['trapezius'],
  equipment: ['cable'],
  movementPattern: ['shoulder abduction'],
  difficulty: 'intermediate',
  exerciseType: 'isolation',
  unilateral: false,
  tags: ['shoulders'],
  instructions: ['Raise the handles in a Y path.'],
  tips: ['Keep the load controlled.'],
  commonMistakes: ['Shrugging excessively.'],
  estimatedSetupTime: 45,
  muscleGroup: 'Shoulders',
  notes: 'User-created variation',
  isCustom: true,
  source: 'user',
  favorite: true,
  metadata: { origin: 'exercise-library' },
  createdAt: '2026-07-24T10:00:00.000Z',
  updatedAt: '2026-07-24T11:00:00.000Z',
};

describe('remote custom exercise sync', () => {
  it('materializes a valid remote exercise and its revision metadata', () => {
    const result = applyRemoteCustomExerciseChanges(
      defaultState,
      [
        {
          entityType: 'customExercises',
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
    expect(result.nextState.exercises).toContainEqual(
      expect.objectContaining({
        id: entityId,
        name: 'Cable Y Raise',
        isCustom: true,
        favorite: true,
        primaryMuscles: ['lateral deltoid'],
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

  it('rejects malformed remote payloads without changing state', () => {
    const result = applyRemoteCustomExerciseChanges(
      defaultState,
      [
        {
          entityType: 'customExercises',
          entityId,
          revision: 7,
          payload: { ...payload, isCustom: false },
        },
      ],
      [],
      userId,
      new Map(),
      syncedAt,
    );

    expect(result.appliedRecordIds).toEqual([]);
    expect(result.nextState).toBe(defaultState);
  });

  it('applies a tombstone and preserves deletion metadata', () => {
    const existingMetadata: CustomExerciseSyncMetadata = {
      id: entityId,
      userId,
      revision: 7,
      deviceId: '22222222-2222-4222-8222-222222222222',
      createdAt: payload.createdAt,
      syncedAt,
      snapshot: {
        name: payload.name,
        aliases: payload.aliases,
        category: payload.category,
        primaryMuscles: payload.primaryMuscles,
        secondaryMuscles: payload.secondaryMuscles,
        equipment: payload.equipment,
        movementPattern: payload.movementPattern,
        difficulty: 'intermediate',
        exerciseType: 'isolation',
        unilateral: false,
        tags: payload.tags,
        instructions: payload.instructions,
        tips: payload.tips,
        commonMistakes: payload.commonMistakes,
        estimatedSetupTime: payload.estimatedSetupTime,
        muscleGroup: payload.muscleGroup,
        notes: payload.notes,
        source: 'user',
        favorite: true,
        metadata: payload.metadata,
      },
      deletedAt: null,
    };
    const state = {
      ...defaultState,
      exercises: [
        ...defaultState.exercises,
        {
          id: entityId,
          name: payload.name,
          isCustom: true,
          createdAt: payload.createdAt,
        },
      ],
    };
    const result = applyRemoteCustomExerciseChanges(
      state,
      [],
      [
        {
          entityType: 'custom_exercises',
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
    expect(result.nextState.exercises.some((item) => item.id === entityId)).toBe(false);
    expect(result.metadata[0]).toMatchObject({
      revision: 8,
      deletedAt: '2026-07-24T13:00:00.000Z',
    });
  });
});
