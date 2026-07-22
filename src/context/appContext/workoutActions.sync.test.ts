import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkoutSession } from '@/types';

const { enqueueWorkoutSessionSyncOperationMock } = vi.hoisted(() => ({
  enqueueWorkoutSessionSyncOperationMock: vi.fn(
    async (
      _action: 'create' | 'update' | 'delete',
      session: WorkoutSession,
    ) => session,
  ),
}));

vi.mock('@/features/workouts/queueWorkoutSessionSyncOperation', () => ({
  enqueueWorkoutSessionSyncOperation: enqueueWorkoutSessionSyncOperationMock,
}));

import { defaultState } from '@/data/defaults';
import {
  deleteWorkoutSessionFromState,
  updateWorkoutSessionPreservingImmutableFields,
} from './workoutActions';

const session: WorkoutSession = {
  id: '33333333-3333-4333-8333-333333333333',
  workoutId: 'empty-workout',
  workoutTitle: 'Evening session',
  startedAt: '2026-07-22T10:00:00.000Z',
  finishedAt: '2026-07-22T11:00:00.000Z',
  sets: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
    },
  ],
};

describe('workout session application actions', () => {
  beforeEach(() => {
    enqueueWorkoutSessionSyncOperationMock.mockClear();
  });

  it('queues an update while preserving immutable session fields', () => {
    const state = { ...defaultState, workoutSessions: [session] };
    const nextState = updateWorkoutSessionPreservingImmutableFields(
      state,
      session.id,
      {
        ...session,
        workoutId: 'changed-workout',
        workoutTitle: 'Changed title',
        startedAt: '2026-07-22T09:00:00.000Z',
        finishedAt: '2026-07-22T12:00:00.000Z',
        notes: 'Updated notes',
      },
    );

    expect(nextState.workoutSessions[0]).toEqual({
      ...session,
      notes: 'Updated notes',
    });
    expect(enqueueWorkoutSessionSyncOperationMock).toHaveBeenCalledWith(
      'update',
      nextState.workoutSessions[0],
    );
  });

  it('queues a delete before removing the local session', () => {
    const state = { ...defaultState, workoutSessions: [session] };
    const nextState = deleteWorkoutSessionFromState(state, session.id);

    expect(nextState.workoutSessions).toEqual([]);
    expect(enqueueWorkoutSessionSyncOperationMock).toHaveBeenCalledWith(
      'delete',
      session,
    );
  });

  it('does not enqueue a mutation for a missing session', () => {
    const state = { ...defaultState, workoutSessions: [] };

    expect(deleteWorkoutSessionFromState(state, session.id)).toBe(state);
    expect(
      updateWorkoutSessionPreservingImmutableFields(state, session.id, session),
    ).toBe(state);
    expect(enqueueWorkoutSessionSyncOperationMock).not.toHaveBeenCalled();
  });
});
