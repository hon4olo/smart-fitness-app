import { describe, expect, it } from 'vitest';

import type { WorkoutSession } from '@/types';
import {
  buildWorkoutHistory,
  buildWorkoutHistoryItemView,
  formatWorkoutSafetyGate,
  groupWorkoutSessionSets,
} from './workoutHistoryViewModel';

const baseSession: WorkoutSession = {
  id: '11111111-1111-4111-8111-111111111111',
  workoutId: 'upper-a',
  workoutTitle: 'Upper A',
  startedAt: '2026-07-23T10:00:00.000Z',
  finishedAt: '2026-07-23T11:05:00.000Z',
  sets: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      completed: true,
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 82.5,
      reps: 6,
      completed: true,
      actualRpe: 9,
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      exerciseId: 'lat-pulldown',
      exerciseName: 'Lat Pulldown',
      weight: 70,
      reps: 10,
      completed: true,
    },
  ],
  safetyRecovery: {
    schemaVersion: 1,
    gateKind: 'confirmation_required',
    acknowledgedAt: '2026-07-23T09:59:00.000Z',
    acknowledgementRequired: true,
    explicitlyAcknowledged: true,
    reviewRunId: '55555555-5555-4555-8555-555555555555',
    reviewStatus: 'modify',
    sourceFingerprint: 'safety-recovery-source-v1:abcdef12',
    recommendedLoadMultiplier: 0.75,
    restrictions: [
      {
        limitationId: '66666666-6666-4666-8666-666666666666',
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

describe('workout history view model', () => {
  it('summarizes session metrics and recorded Safety Recovery context', () => {
    expect(buildWorkoutHistoryItemView(baseSession)).toMatchObject({
      durationLabel: '1 h 5 min',
      exerciseCount: 2,
      setCount: 3,
      volume: 1835,
      volumeLabel: '1,835 kg',
      safetyLabel: 'Modifications acknowledged',
      safetyTone: 'warning',
      hasSafetyContext: true,
    });
  });

  it('sorts history newest first without mutating the source array', () => {
    const older = {
      ...baseSession,
      id: '77777777-7777-4777-8777-777777777777',
      startedAt: '2026-07-20T10:00:00.000Z',
      finishedAt: '2026-07-20T11:00:00.000Z',
    };
    const source = [older, baseSession];

    expect(buildWorkoutHistory(source).map((item) => item.session.id)).toEqual([
      baseSession.id,
      older.id,
    ]);
    expect(source[0]?.id).toBe(older.id);
  });

  it('groups completed sets by exercise and preserves RPE values', () => {
    const groups = groupWorkoutSessionSets(baseSession);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      exerciseId: 'bench-press',
      completedSetCount: 2,
      volume: 1135,
      sets: [
        expect.objectContaining({ weight: 80, reps: 8 }),
        expect.objectContaining({ weight: 82.5, reps: 6, actualRpe: 9 }),
      ],
    });
  });

  it('describes the historical gate without treating it as a current recommendation', () => {
    expect(formatWorkoutSafetyGate(baseSession.safetyRecovery!)).toBe(
      'Explicit confirmation required',
    );
    expect(
      buildWorkoutHistoryItemView({ ...baseSession, safetyRecovery: undefined }),
    ).toMatchObject({
      safetyLabel: 'No recorded review',
      safetyTone: 'neutral',
      hasSafetyContext: false,
    });
  });
});
