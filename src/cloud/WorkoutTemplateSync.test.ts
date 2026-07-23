import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import {
  applyRemoteWorkoutTemplateChanges,
  createWorkoutTemplateQueueOperation,
  getWorkoutTemplateEntityId,
  normalizeWorkoutTemplateForSync,
} from './WorkoutTemplateSync';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const legacyId = 'custom-workout-123';
const entityId = getWorkoutTemplateEntityId(legacyId);
const workout = {
  id: legacyId,
  title: ' Push day ',
  description: ' Chest and shoulders ',
  duration: '45 min',
  isCustom: true,
  createdAt: '2026-07-23T10:00:00.000Z',
  exercises: [
    {
      id: 'bench-press',
      name: ' Bench Press ',
      muscleGroup: ' Chest ',
      isCustom: false,
      createdAt: '2026-07-23T10:00:00.000Z',
    },
  ],
};

describe('workout template sync', () => {
  it('normalizes legacy IDs and full mobile snapshots', () => {
    expect(normalizeWorkoutTemplateForSync(workout)).toEqual({
      id: entityId,
      title: 'Push day',
      description: 'Chest and shoulders',
      duration: '45 min',
      isCustom: true,
      createdAt: '2026-07-23T10:00:00.000Z',
      exercises: [
        {
          id: 'bench-press',
          name: 'Bench Press',
          muscleGroup: 'Chest',
          isCustom: false,
          createdAt: '2026-07-23T10:00:00.000Z',
        },
      ],
    });
  });

  it('queues an authenticated revisioned upsert without ownership in payload', () => {
    const operation = createWorkoutTemplateQueueOperation({
      action: 'create',
      workout,
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-23T11:00:00.000Z',
    });

    expect(operation).toMatchObject({
      opId: `workouts:${entityId}`,
      entityType: 'workouts',
      entityId,
      action: 'create',
      actorId: userId,
      baseRevision: { number: 0 },
      payload: {
        schemaVersion: 1,
        id: entityId,
        title: 'Push day',
        duration: '45 min',
        isCustom: true,
        createdAt: '2026-07-23T10:00:00.000Z',
        updatedAt: '2026-07-23T11:00:00.000Z',
      },
    });
    expect(operation.payload).not.toHaveProperty('userId');
  });

  it('replaces a matching legacy local template during remote apply', () => {
    const result = applyRemoteWorkoutTemplateChanges(
      { ...defaultState, workouts: [workout] },
      [
        {
          entityType: 'workout_templates',
          entityId,
          revision: 5,
          payload: {
            schemaVersion: 1,
            id: entityId,
            title: 'Remote push day',
            duration: '50 min',
            exercises: [
              {
                id: 'bench-press',
                name: 'Bench Press',
                isCustom: false,
                createdAt: '2026-07-23T10:00:00.000Z',
              },
            ],
            isCustom: true,
            createdAt: '2026-07-23T10:00:00.000Z',
            deviceId,
          },
        },
      ],
      [],
      new Map(),
      '2026-07-23T12:00:00.000Z',
    );

    expect(result.nextState.workouts).toHaveLength(1);
    expect(result.nextState.workouts[0]).toMatchObject({
      id: entityId,
      title: 'Remote push day',
      duration: '50 min',
    });
    expect(result.metadata[0]).toMatchObject({ id: entityId, revision: 5, deviceId });
  });

  it('ignores malformed payloads and applies tombstones', () => {
    const malformed = applyRemoteWorkoutTemplateChanges(
      { ...defaultState, workouts: [workout] },
      [
        {
          entityType: 'workouts',
          entityId,
          revision: 6,
          payload: {
            schemaVersion: 1,
            id: entityId,
            title: 'Bad',
            duration: '30 min',
            exercises: [],
            isCustom: true,
            createdAt: 'bad-date',
          },
        },
      ],
      [],
    );
    expect(malformed.appliedRecordIds).toEqual([]);
    expect(malformed.nextState.workouts).toEqual([workout]);

    const deleted = applyRemoteWorkoutTemplateChanges(
      { ...defaultState, workouts: [workout] },
      [],
      [
        {
          entityType: 'workouts',
          entityId,
          revision: 7,
          appliedAt: '2026-07-23T13:00:00.000Z',
        },
      ],
    );
    expect(deleted.nextState.workouts).toEqual([]);
    expect(deleted.deletedRecordIds).toEqual([entityId]);
  });
});
