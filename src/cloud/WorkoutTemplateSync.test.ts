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
const runId = '33333333-3333-4333-8333-333333333333';
const sessionId = '44444444-4444-4444-8444-444444444444';
const sourceSetId = '55555555-5555-4555-8555-555555555555';
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
    expect(operation.payload).not.toHaveProperty('prescription');
  });

  it('preserves confirmed prescription and coach metadata through remote pull and requeue', () => {
    const result = applyRemoteWorkoutTemplateChanges(
      { ...defaultState, workouts: [] },
      [
        {
          entityType: 'workouts',
          entityId,
          revision: 9,
          payload: {
            schemaVersion: 1,
            id: entityId,
            title: 'Upper body · progress',
            description: 'Guarded progression',
            duration: '60 min',
            exercises: [
              {
                id: 'bench-press',
                name: 'Bench Press',
                isCustom: false,
                createdAt: '2026-07-23T12:00:00.000Z',
              },
            ],
            prescription: [
              {
                sourceSetId,
                exerciseId: 'bench-press',
                exerciseName: 'Bench Press',
                weight: 82.5,
                reps: 8,
                targetRpe: 8,
                adjustment: 'increase',
                rationaleCode: 'low_recorded_rpe',
              },
            ],
            coachMetadata: {
              schemaVersion: 1,
              runId,
              sourceSessionId: sessionId,
              strategy: 'progress',
              confirmedAt: '2026-07-23T12:00:00.000Z',
            },
            isCustom: true,
            createdAt: '2026-07-23T12:00:00.000Z',
            deviceId,
          },
        },
      ],
      [],
      userId,
      new Map(),
      '2026-07-23T12:01:00.000Z',
    );

    expect(result.nextState.workouts[0]).toMatchObject({
      id: entityId,
      prescription: [
        {
          sourceSetId,
          exerciseId: 'bench-press',
          weight: 82.5,
          reps: 8,
          targetRpe: 8,
        },
      ],
      coachMetadata: {
        runId,
        sourceSessionId: sessionId,
        strategy: 'progress',
      },
    });
    expect(result.metadata[0]?.snapshot).toMatchObject({
      prescription: [{ sourceSetId, weight: 82.5, targetRpe: 8 }],
      coachMetadata: { runId, sourceSessionId: sessionId },
    });

    const requeued = createWorkoutTemplateQueueOperation({
      action: 'update',
      workout: result.nextState.workouts[0]!,
      userId,
      deviceId,
      baseRevision: 9,
      previous: result.metadata[0],
      now: '2026-07-23T12:02:00.000Z',
    });
    expect(requeued.payload).toMatchObject({
      prescription: [{ sourceSetId, weight: 82.5, targetRpe: 8 }],
      coachMetadata: { runId, sourceSessionId: sessionId },
    });
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
      userId,
      new Map(),
      '2026-07-23T12:00:00.000Z',
    );

    expect(result.nextState.workouts).toHaveLength(1);
    expect(result.nextState.workouts[0]).toMatchObject({
      id: entityId,
      title: 'Remote push day',
      duration: '50 min',
    });
    expect(result.metadata[0]).toMatchObject({
      id: entityId,
      userId,
      revision: 5,
      deviceId,
      snapshot: {
        title: 'Remote push day',
        prescription: null,
        coachMetadata: null,
      },
    });
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
      userId,
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
      userId,
    );
    expect(deleted.nextState.workouts).toEqual([]);
    expect(deleted.deletedRecordIds).toEqual([entityId]);
  });
});
