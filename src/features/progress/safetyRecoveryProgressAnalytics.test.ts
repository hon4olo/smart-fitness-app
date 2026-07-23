import { describe, expect, it } from 'vitest';

import type {
  WorkoutSafetyGateKind,
  WorkoutSafetyMetadata,
  WorkoutSafetyReviewStatus,
  WorkoutSession,
} from '@/types';

import { buildSafetyRecoveryProgressAnalytics } from './safetyRecoveryProgressAnalytics';

const makeSafetyMetadata = ({
  gateKind = 'confirmation_required',
  multiplier = null,
  movementPatterns = [],
  status,
}: {
  gateKind?: WorkoutSafetyGateKind;
  multiplier?: number | null;
  movementPatterns?: string[];
  status: WorkoutSafetyReviewStatus | null;
}): WorkoutSafetyMetadata => ({
  schemaVersion: 1,
  gateKind,
  acknowledgedAt: '2026-07-01T09:55:00.000Z',
  acknowledgementRequired: gateKind !== 'ready',
  explicitlyAcknowledged: gateKind !== 'ready',
  reviewRunId:
    gateKind === 'review_missing'
      ? null
      : '11111111-1111-4111-8111-111111111111',
  reviewStatus: status,
  sourceFingerprint:
    gateKind === 'review_missing' ? null : 'safety-recovery-source-v1:abcdef12',
  recommendedLoadMultiplier: multiplier,
  restrictions:
    movementPatterns.length > 0
      ? [
          {
            limitationId: '22222222-2222-4222-8222-222222222222',
            bodyRegion: 'shoulder',
            side: 'right',
            severity: 'moderate',
            action: 'reduce_load',
            movementPatterns,
            maximumLoadMultiplier: multiplier ?? 0.75,
          },
        ]
      : [],
  issues: [],
});

const makeSession = ({
  day,
  id,
  safetyRecovery,
}: {
  day: number;
  id: string;
  safetyRecovery?: WorkoutSafetyMetadata;
}): WorkoutSession => ({
  id,
  workoutId: `workout-${id}`,
  workoutTitle: `Workout ${id}`,
  startedAt: `2026-07-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  finishedAt: `2026-07-${String(day).padStart(2, '0')}T11:00:00.000Z`,
  sets: [],
  safetyRecovery,
});

describe('Safety Recovery progress analytics', () => {
  it('aggregates fresh reviewed statuses, load ceilings and movement restriction frequency', () => {
    const sessions: WorkoutSession[] = [
      makeSession({
        day: 1,
        id: 'ready',
        safetyRecovery: makeSafetyMetadata({ status: 'ready', multiplier: 0.9 }),
      }),
      makeSession({
        day: 2,
        id: 'modify',
        safetyRecovery: makeSafetyMetadata({
          status: 'modify',
          multiplier: 0.75,
          movementPatterns: ['horizontal_push', 'horizontal_push', 'vertical_push'],
        }),
      }),
      makeSession({
        day: 3,
        id: 'blocked',
        safetyRecovery: makeSafetyMetadata({
          status: 'blocked',
          multiplier: 0.5,
          movementPatterns: ['vertical_push'],
        }),
      }),
      makeSession({
        day: 4,
        id: 'needs-input',
        safetyRecovery: makeSafetyMetadata({ status: 'needs_input' }),
      }),
      makeSession({
        day: 5,
        id: 'stale',
        safetyRecovery: makeSafetyMetadata({
          gateKind: 'review_stale',
          status: 'modify',
          multiplier: 0.4,
          movementPatterns: ['squat'],
        }),
      }),
      makeSession({ day: 6, id: 'no-context' }),
    ];

    const analytics = buildSafetyRecoveryProgressAnalytics(sessions);

    expect(analytics).toMatchObject({
      totalWorkouts: 6,
      contextWorkouts: 5,
      reviewedWorkouts: 4,
      reviewCoverageLabel: '67%',
      missingOrStaleWorkouts: 1,
      noContextWorkouts: 1,
      restrictedWorkouts: 2,
      loadTrend: {
        latestMultiplier: 0.5,
        previousMultiplier: 0.75,
        latestLabel: '50%',
        deltaPercentagePoints: -25,
        deltaLabel: 'Down 25 pp vs previous',
        direction: 'down',
      },
    });

    expect(analytics.statusMetrics).toEqual([
      expect.objectContaining({ status: 'ready', count: 1, shareLabel: '25%' }),
      expect.objectContaining({ status: 'modify', count: 1, shareLabel: '25%' }),
      expect.objectContaining({ status: 'blocked', count: 1, shareLabel: '25%' }),
      expect.objectContaining({ status: 'needs_input', count: 1, shareLabel: '25%' }),
    ]);
    expect(analytics.topMovementPatterns).toEqual([
      expect.objectContaining({
        movementPattern: 'vertical_push',
        label: 'Vertical Push',
        count: 2,
        shareLabel: '100%',
      }),
      expect.objectContaining({
        movementPattern: 'horizontal_push',
        label: 'Horizontal Push',
        count: 1,
        shareLabel: '50%',
      }),
    ]);
  });

  it('returns explicit empty analytics instead of inferring readiness', () => {
    expect(buildSafetyRecoveryProgressAnalytics([])).toEqual({
      totalWorkouts: 0,
      contextWorkouts: 0,
      reviewedWorkouts: 0,
      reviewCoverageShare: 0,
      reviewCoverageLabel: '0%',
      missingOrStaleWorkouts: 0,
      noContextWorkouts: 0,
      statusMetrics: [
        { status: 'ready', label: 'Ready', count: 0, share: 0, shareLabel: '0%' },
        { status: 'modify', label: 'Modify', count: 0, share: 0, shareLabel: '0%' },
        { status: 'blocked', label: 'Blocked', count: 0, share: 0, shareLabel: '0%' },
        {
          status: 'needs_input',
          label: 'Needs input',
          count: 0,
          share: 0,
          shareLabel: '0%',
        },
      ],
      loadTrend: {
        latestMultiplier: null,
        previousMultiplier: null,
        latestLabel: 'No load ceiling',
        deltaPercentagePoints: null,
        deltaLabel: 'No reviewed load ceilings yet',
        direction: 'unknown',
      },
      restrictedWorkouts: 0,
      topMovementPatterns: [],
    });
  });
});
