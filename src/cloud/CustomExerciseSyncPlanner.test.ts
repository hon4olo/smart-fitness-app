import { describe, expect, it } from 'vitest';

import type { CustomExerciseSyncMetadata } from '@/storage';
import {
  getCustomExerciseEntityId,
  normalizeCustomExerciseForSync,
  toCustomExerciseSyncSnapshot,
} from './CustomExerciseSync';
import { planCustomExerciseSyncOperations } from './CustomExerciseSyncPlanner';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const now = '2026-07-24T12:00:00.000Z';
const exercise = {
  id: 'cable-y-raise',
  name: 'Cable Y Raise',
  primaryMuscles: ['lateral deltoid'],
  equipment: ['cable'],
  difficulty: 'intermediate' as const,
  exerciseType: 'isolation' as const,
  isCustom: true,
  createdAt: '2026-07-24T10:00:00.000Z',
  source: 'user' as const,
};
const normalized = normalizeCustomExerciseForSync(exercise, now);
const entityId = getCustomExerciseEntityId(exercise.id);

const metadata = (
  overrides: Partial<CustomExerciseSyncMetadata> = {},
): CustomExerciseSyncMetadata => ({
  id: entityId,
  userId,
  revision: 4,
  deviceId,
  createdAt: normalized.createdAt,
  syncedAt: '2026-07-24T11:00:00.000Z',
  snapshot: toCustomExerciseSyncSnapshot(normalized),
  deletedAt: null,
  ...overrides,
});

describe('custom exercise sync planner', () => {
  it('creates a strict operation for a new custom exercise', () => {
    const operations = planCustomExerciseSyncOperations({
      exercises: [exercise],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      entityType: 'customExercises',
      entityId,
      action: 'create',
      baseRevision: { number: 0 },
      payload: {
        schemaVersion: 1,
        id: entityId,
        name: 'Cable Y Raise',
        isCustom: true,
        source: 'user',
      },
    });
    expect(operations[0]?.payload).not.toHaveProperty('deviceId');
  });

  it('skips unchanged, catalog and already pending exercises', () => {
    const unchanged = planCustomExerciseSyncOperations({
      exercises: [exercise],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(unchanged).toEqual([]);

    const catalog = planCustomExerciseSyncOperations({
      exercises: [{ ...exercise, isCustom: false }],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(catalog).toEqual([]);

    const pending = planCustomExerciseSyncOperations({
      exercises: [{ ...exercise, name: 'Changed' }],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [
        {
          opId: `customExercises:${entityId}`,
          entityType: 'customExercises',
          entityId,
          action: 'update',
          payload: {},
          baseRevision: { id: 'rev-4', number: 4, createdAt: now },
          clientTimestamp: now,
          idempotencyKey: 'pending-custom-exercise',
          retryCount: 0,
          status: 'pending',
          metadata: { userId },
        },
      ],
      userId,
      deviceId,
      now,
    });
    expect(pending).toEqual([]);
  });

  it('creates update and deletion operations from revision metadata', () => {
    const updated = planCustomExerciseSyncOperations({
      exercises: [{ ...exercise, name: 'Cable Y Raise v2' }],
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

    const deleted = planCustomExerciseSyncOperations({
      exercises: [],
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
