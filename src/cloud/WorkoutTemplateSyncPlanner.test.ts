import { describe, expect, it } from 'vitest';

import type { WorkoutTemplateSyncMetadata } from '@/storage';
import type { Workout } from '@/types';
import { getWorkoutTemplateEntityId, toWorkoutTemplateSyncSnapshot } from './WorkoutTemplateSync';
import { planWorkoutTemplateSyncOperations } from './WorkoutTemplateSyncPlanner';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '99999999-9999-4999-8999-999999999999';
const deviceId = '22222222-2222-4222-8222-222222222222';
const now = '2026-07-23T12:00:00.000Z';

const workout: Workout = {
  id: 'legacy-push',
  title: 'Push day',
  duration: '45 min',
  isCustom: true,
  createdAt: '2026-07-22T10:00:00.000Z',
  exercises: [
    {
      id: 'bench-press',
      name: 'Bench Press',
      isCustom: false,
      createdAt: '2026-07-22T10:00:00.000Z',
    },
  ],
};
const entityId = getWorkoutTemplateEntityId(workout.id);

const metadata = (
  overrides: Partial<WorkoutTemplateSyncMetadata> = {},
): WorkoutTemplateSyncMetadata => ({
  id: entityId,
  userId,
  revision: 4,
  deviceId,
  createdAt: workout.createdAt!,
  syncedAt: '2026-07-23T11:00:00.000Z',
  snapshot: toWorkoutTemplateSyncSnapshot({ ...workout, id: entityId }),
  deletedAt: null,
  ...overrides,
});

describe('workout template sync planner', () => {
  it('creates an operation for a local custom template without metadata', () => {
    const operations = planWorkoutTemplateSyncOperations({
      workouts: [workout],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      entityType: 'workouts',
      entityId,
      action: 'create',
      actorId: userId,
      baseRevision: { number: 0 },
    });
  });

  it('does not requeue an unchanged synchronized snapshot', () => {
    const record = metadata();
    const operations = planWorkoutTemplateSyncOperations({
      workouts: [workout],
      metadata: new Map([[`${userId}:${entityId}`, record]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toEqual([]);
  });

  it('queues an update for an offline local edit', () => {
    const record = metadata();
    const operations = planWorkoutTemplateSyncOperations({
      workouts: [{ ...workout, title: 'Updated push day' }],
      metadata: new Map([[`${userId}:${entityId}`, record]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      action: 'update',
      entityId,
      baseRevision: { number: 4 },
      payload: { title: 'Updated push day' },
    });
  });

  it('queues a delete when a previously synchronized template is absent locally', () => {
    const record = metadata();
    const operations = planWorkoutTemplateSyncOperations({
      workouts: [],
      metadata: new Map([[`${userId}:${entityId}`, record]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      action: 'delete',
      entityId,
      actorId: userId,
      baseRevision: { number: 4 },
    });
  });

  it('ignores other-account metadata and current-account pending operations', () => {
    const otherRecord = metadata({ userId: otherUserId, revision: 9 });
    const pending = planWorkoutTemplateSyncOperations({
      workouts: [workout],
      metadata: new Map([[`${otherUserId}:${entityId}`, otherRecord]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    })[0]!;

    expect(pending.action).toBe('create');
    expect(pending.baseRevision?.number).toBe(0);

    const operations = planWorkoutTemplateSyncOperations({
      workouts: [workout],
      metadata: new Map([[`${otherUserId}:${entityId}`, otherRecord]]),
      pendingOperations: [pending],
      userId,
      deviceId,
      now,
    });
    expect(operations).toEqual([]);
  });

  it('does not upload built-in templates', () => {
    expect(
      planWorkoutTemplateSyncOperations({
        workouts: [{ ...workout, isCustom: false }],
        metadata: new Map(),
        pendingOperations: [],
        userId,
        deviceId,
        now,
      }),
    ).toEqual([]);
  });
});
