import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import type { WorkoutSession } from '@/types';
import {
  applyRemoteWorkoutSessionChanges,
  createWorkoutSessionQueueOperation,
  normalizeWorkoutSessionForSync,
} from './WorkoutSessionSync';

const session: WorkoutSession = {
  id: '11111111-1111-4111-8111-111111111111',
  workoutId: 'empty-workout',
  workoutTitle: 'Safety metadata workout',
  startedAt: '2026-07-23T10:00:00.000Z',
  finishedAt: '2026-07-23T11:00:00.000Z',
  sets: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
    },
  ],
  safetyRecovery: {
    schemaVersion: 1,
    gateKind: 'confirmation_required',
    acknowledgedAt: '2026-07-23T09:59:00.000Z',
    acknowledgementRequired: true,
    explicitlyAcknowledged: true,
    reviewRunId: '33333333-3333-4333-8333-333333333333',
    reviewStatus: 'modify',
    sourceFingerprint: 'safety-recovery-source-v1:abcdef12',
    recommendedLoadMultiplier: 0.75,
    restrictions: [
      {
        limitationId: '44444444-4444-4444-8444-444444444444',
        bodyRegion: 'shoulder',
        side: 'right',
        severity: 'moderate',
        action: 'reduce_load',
        movementPatterns: ['vertical_push'],
        maximumLoadMultiplier: 0.75,
      },
    ],
    issues: [
      {
        code: 'RECOVERY_LOAD_REDUCTION_REQUIRED',
        severity: 'modify',
        message: 'Reduce reviewed training load.',
      },
    ],
  },
};

describe('workout session safety metadata sync', () => {
  it('includes the exact captured safety metadata in the revisioned queue payload', () => {
    const operation = createWorkoutSessionQueueOperation({
      action: 'create',
      session,
      deviceId: '55555555-5555-4555-8555-555555555555',
      actorId: '66666666-6666-4666-8666-666666666666',
      baseRevision: 0,
      now: '2026-07-23T11:00:01.000Z',
    });

    expect(operation.payload).toEqual(
      expect.objectContaining({
        safetyRecovery: expect.objectContaining({
          reviewRunId: '33333333-3333-4333-8333-333333333333',
          reviewStatus: 'modify',
          explicitlyAcknowledged: true,
          recommendedLoadMultiplier: 0.75,
        }),
      }),
    );
  });

  it('round-trips strict safety metadata from a remote workout session payload', () => {
    const normalized = normalizeWorkoutSessionForSync(session);
    const result = applyRemoteWorkoutSessionChanges(
      { ...defaultState, workoutSessions: [] },
      [
        {
          entityType: 'workout_sessions',
          entityId: normalized.id,
          revision: 8,
          payload: {
            schemaVersion: 1,
            ...normalized,
            deviceId: '55555555-5555-4555-8555-555555555555',
          },
        },
      ],
    );

    expect(result.nextState.workoutSessions).toEqual([normalized]);
    expect(result.nextState.workoutSessions[0]?.safetyRecovery).toMatchObject({
      gateKind: 'confirmation_required',
      explicitlyAcknowledged: true,
      reviewStatus: 'modify',
      restrictions: [
        expect.objectContaining({
          action: 'reduce_load',
          movementPatterns: ['vertical_push'],
        }),
      ],
    });
  });

  it('fails closed on malformed remote safety metadata', () => {
    const normalized = normalizeWorkoutSessionForSync(session);
    const result = applyRemoteWorkoutSessionChanges(
      { ...defaultState, workoutSessions: [] },
      [
        {
          entityType: 'workoutSessions',
          entityId: normalized.id,
          revision: 9,
          payload: {
            schemaVersion: 1,
            ...normalized,
            safetyRecovery: {
              ...normalized.safetyRecovery,
              explicitlyAcknowledged: false,
            },
          },
        },
      ],
    );

    expect(result.nextState.workoutSessions).toEqual([]);
    expect(result.appliedRecordIds).toEqual([]);
  });
});
