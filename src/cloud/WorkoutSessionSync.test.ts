import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { isUuid } from '@/lib/ids';
import type { WorkoutSession } from '@/types';

import {
  applyRemoteWorkoutSessionChanges,
  createWorkoutSessionQueueOperation,
  normalizeWorkoutSessionForSync,
} from './WorkoutSessionSync';

const legacySession: WorkoutSession = {
  id: '1721640000000',
  workoutId: 'empty-workout',
  workoutTitle: 'Evening session',
  startedAt: '2026-07-22T10:00:00.000Z',
  finishedAt: '2026-07-22T11:00:00.000Z',
  notes: 'Solid workout',
  sets: [
    {
      id: '1721640000000-set-1',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
      actualRpe: 8.5,
    },
  ],
};

describe('workout session sync', () => {
  it('deterministically migrates legacy session and set IDs', () => {
    const first = normalizeWorkoutSessionForSync(legacySession);
    const second = normalizeWorkoutSessionForSync(legacySession);

    expect(isUuid(first.id)).toBe(true);
    expect(isUuid(first.sets[0]?.id)).toBe(true);
    expect(second.id).toBe(first.id);
    expect(second.sets[0]?.id).toBe(first.sets[0]?.id);
  });

  it('creates a versioned queue payload with RPE and the queue idempotency key', () => {
    const operation = createWorkoutSessionQueueOperation({
      action: 'create',
      session: legacySession,
      deviceId: '22222222-2222-4222-8222-222222222222',
      actorId: '11111111-1111-4111-8111-111111111111',
      baseRevision: 0,
      now: '2026-07-22T11:00:01.000Z',
    });

    expect(operation.entityType).toBe('workoutSessions');
    expect(isUuid(operation.entityId)).toBe(true);
    expect(operation.metadata?.requestId).toBe(operation.idempotencyKey);
    expect(operation.payload).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        id: operation.entityId,
        workoutId: 'empty-workout',
        sets: [
          expect.objectContaining({
            exerciseId: 'bench-press',
            actualRpe: 8.5,
          }),
        ],
      }),
    );
  });

  it('applies workout session changes and ignores unrelated entities', () => {
    const session = normalizeWorkoutSessionForSync(legacySession);
    const result = applyRemoteWorkoutSessionChanges(
      { ...defaultState, workoutSessions: [] },
      [
        {
          entityType: 'foodEntries',
          entityId: 'ignored',
          revision: 3,
          payload: { id: 'ignored' },
        },
        {
          entityType: 'workout_sessions',
          entityId: session.id,
          revision: 4,
          payload: {
            schemaVersion: 1,
            ...session,
            deviceId: '22222222-2222-4222-8222-222222222222',
          },
        },
      ],
      [],
      new Map(),
      '2026-07-22T11:00:02.000Z',
    );

    expect(result.nextState.workoutSessions).toEqual([session]);
    expect(result.appliedRecordIds).toEqual([session.id]);
    expect(result.metadata).toEqual([
      expect.objectContaining({ id: session.id, revision: 4 }),
    ]);
  });

  it('removes only workout session deletions', () => {
    const session = normalizeWorkoutSessionForSync(legacySession);
    const result = applyRemoteWorkoutSessionChanges(
      { ...defaultState, workoutSessions: [session] },
      [],
      [
        {
          entityType: 'weightHistory',
          entityId: session.id,
          revision: 5,
        },
        {
          entityType: 'workoutSessions',
          entityId: session.id,
          revision: 6,
          appliedAt: '2026-07-22T11:01:00.000Z',
        },
      ],
    );

    expect(result.nextState.workoutSessions).toEqual([]);
    expect(result.deletedRecordIds).toEqual([session.id]);
  });
});
