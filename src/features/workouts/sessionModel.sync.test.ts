import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WorkoutSession } from '@/types';
import type { WorkoutSessionDraft } from './types';

const { enqueueWorkoutSessionSyncOperationMock } = vi.hoisted(() => ({
  enqueueWorkoutSessionSyncOperationMock: vi.fn(
    async (
      _action: 'create' | 'update' | 'delete',
      session: WorkoutSession,
    ) => session,
  ),
}));

vi.mock('./queueWorkoutSessionSyncOperation', () => ({
  enqueueWorkoutSessionSyncOperation: enqueueWorkoutSessionSyncOperationMock,
}));

import { isUuid } from '@/lib/ids';
import { buildCompletedWorkoutSessionSnapshot } from './sessionModel';
import {
  markActiveWorkoutSessionCompleted,
  resetWorkoutSessionStorage,
} from './storage';

const draft = {
  id: '1721640000000',
  workoutId: 'empty-workout',
  workoutTitle: 'Evening session',
  startedAt: '2026-07-22T10:00:00.000Z',
  sets: [
    {
      id: '1721640000000-set-1',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
      actualRpe: 8.5 as const,
    },
  ],
} satisfies WorkoutSessionDraft;

describe('completed workout session sync lifecycle', () => {
  beforeEach(() => {
    enqueueWorkoutSessionSyncOperationMock.mockClear();
    resetWorkoutSessionStorage();
  });

  it('queues the exact normalized snapshot only after completion is marked', async () => {
    const session = buildCompletedWorkoutSessionSnapshot(draft, {
      finishedAt: '2026-07-22T11:00:00.000Z',
      notes: 'Good session',
    });

    expect(isUuid(session.id)).toBe(true);
    expect(isUuid(session.sets[0]?.id)).toBe(true);
    expect(enqueueWorkoutSessionSyncOperationMock).not.toHaveBeenCalled();

    markActiveWorkoutSessionCompleted();
    await Promise.resolve();

    expect(enqueueWorkoutSessionSyncOperationMock).toHaveBeenCalledWith(
      'create',
      session,
    );
  });
});
