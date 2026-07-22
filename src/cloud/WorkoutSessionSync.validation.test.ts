import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { applyRemoteWorkoutSessionChanges } from './WorkoutSessionSync';

const sessionId = '33333333-3333-4333-8333-333333333333';
const setId = '44444444-4444-4444-8444-444444444444';

const validPayload = {
  schemaVersion: 1,
  id: sessionId,
  workoutId: 'empty-workout',
  workoutTitle: 'Evening session',
  startedAt: '2026-07-22T10:00:00.000Z',
  finishedAt: '2026-07-22T11:00:00.000Z',
  sets: [
    {
      id: setId,
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
      actualRpe: 8.5,
    },
  ],
};

describe('remote workout session validation', () => {
  it('rejects the entire session when one set has invalid RPE', () => {
    const result = applyRemoteWorkoutSessionChanges(
      { ...defaultState, workoutSessions: [] },
      [
        {
          entityType: 'workoutSessions',
          entityId: sessionId,
          revision: 7,
          payload: {
            ...validPayload,
            sets: [{ ...validPayload.sets[0], actualRpe: 5 }],
          },
        },
      ],
    );

    expect(result.nextState.workoutSessions).toEqual([]);
    expect(result.appliedRecordIds).toEqual([]);
    expect(result.metadata).toEqual([]);
  });

  it('rejects unknown schema versions instead of partially applying them', () => {
    const result = applyRemoteWorkoutSessionChanges(
      { ...defaultState, workoutSessions: [] },
      [
        {
          entityType: 'workoutSessions',
          entityId: sessionId,
          revision: 8,
          payload: { ...validPayload, schemaVersion: 2 },
        },
      ],
    );

    expect(result.nextState.workoutSessions).toEqual([]);
    expect(result.appliedRecordIds).toEqual([]);
  });
});
