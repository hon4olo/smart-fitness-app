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
  finishedAt,
  id,
  safetyRecovery,
}: {
  day?: number;
  finishedAt?: string;
  id: string;
  safetyRecovery?: WorkoutSafetyMetadata;
}): WorkoutSession => {
  const resolvedFinishedAt =
    finishedAt ?? `2026-07-${String(day ?? 1).padStart(2, '0')}T11:00:00.000Z`;
  const finishedTimestamp = Date.parse(resolvedFinishedAt);
  const startedAt = Number.isFinite(finishedTimestamp)
    ? new Date(finishedTimestamp - 60 * 60 * 1000).toISOString()
    : resolvedFinishedAt;

  return {
    id,
    workoutId: `workout-${id}`,
    workoutTitle: `Workout ${id}`,
    startedAt,
    finishedAt: resolvedFinishedAt,
    sets: [],
    safetyRecovery,
  };
};

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
      period: 'all',
      periodLabel: 'All time',
      totalWorkouts: 6,
      contextWorkouts: 5,
      reviewedWorkouts: 4,
      reviewCoverageLabel: '67%',
      missingOrStaleWorkouts: 1,
      noContextWorkouts: 1,
      restrictedWorkouts: 2,
      restrictedWorkoutShareLabel: '50%',
      comparison: null,
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
      expect.objectContaining({
        status: 'ready',
        count: 1,
        shareLabel: '25%',
        deltaLabel: null,
      }),
      expect.objectContaining({
        status: 'modify',
        count: 1,
        shareLabel: '25%',
        deltaLabel: null,
      }),
      expect.objectContaining({
        status: 'blocked',
        count: 1,
        shareLabel: '25%',
        deltaLabel: null,
      }),
      expect.objectContaining({
        status: 'needs_input',
        count: 1,
        shareLabel: '25%',
        deltaLabel: null,
      }),
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

  it('limits finite periods and compares the selected window with the immediately previous window', () => {
    const now = Date.parse('2026-07-31T12:00:00.000Z');
    const sessions: WorkoutSession[] = [
      makeSession({
        id: 'current-ready',
        finishedAt: '2026-07-30T11:00:00.000Z',
        safetyRecovery: makeSafetyMetadata({ status: 'ready', multiplier: 0.9 }),
      }),
      makeSession({
        id: 'current-modify',
        finishedAt: '2026-07-15T11:00:00.000Z',
        safetyRecovery: makeSafetyMetadata({
          status: 'modify',
          multiplier: 0.7,
          movementPatterns: ['horizontal_push'],
        }),
      }),
      makeSession({
        id: 'current-no-context',
        finishedAt: '2026-07-10T11:00:00.000Z',
      }),
      makeSession({
        id: 'previous-ready',
        finishedAt: '2026-06-25T11:00:00.000Z',
        safetyRecovery: makeSafetyMetadata({
          status: 'ready',
          multiplier: 0.85,
          movementPatterns: ['vertical_push'],
        }),
      }),
      makeSession({
        id: 'previous-blocked',
        finishedAt: '2026-06-10T11:00:00.000Z',
        safetyRecovery: makeSafetyMetadata({
          status: 'blocked',
          multiplier: 0.5,
          movementPatterns: ['squat'],
        }),
      }),
      makeSession({ id: 'old', finishedAt: '2026-05-20T11:00:00.000Z' }),
      makeSession({ id: 'future', finishedAt: '2026-08-02T11:00:00.000Z' }),
    ];

    const analytics = buildSafetyRecoveryProgressAnalytics(sessions, '30d', now);

    expect(analytics).toMatchObject({
      period: '30d',
      periodLabel: 'Last 30 days',
      totalWorkouts: 3,
      reviewedWorkouts: 2,
      reviewCoverageLabel: '67%',
      restrictedWorkouts: 1,
      restrictedWorkoutShareLabel: '50%',
      loadTrend: {
        latestMultiplier: 0.9,
        previousMultiplier: 0.7,
        deltaPercentagePoints: 20,
        direction: 'up',
      },
      comparison: {
        previousPeriodLabel: 'Previous 30 days',
        previousTotalWorkouts: 2,
        previousReviewedWorkouts: 2,
        workoutCountDelta: 1,
        reviewedWorkoutsDelta: 0,
        reviewCoverageDeltaPercentagePoints: -33,
        restrictedWorkoutShareDeltaPercentagePoints: -50,
      },
    });

    expect(analytics.statusMetrics).toEqual([
      expect.objectContaining({
        status: 'ready',
        count: 1,
        shareLabel: '50%',
        previousShare: 0.5,
        deltaPercentagePoints: 0,
      }),
      expect.objectContaining({
        status: 'modify',
        count: 1,
        shareLabel: '50%',
        previousShare: 0,
        deltaPercentagePoints: 50,
      }),
      expect.objectContaining({
        status: 'blocked',
        count: 0,
        shareLabel: '0%',
        previousShare: 0.5,
        deltaPercentagePoints: -50,
      }),
      expect.objectContaining({
        status: 'needs_input',
        count: 0,
        shareLabel: '0%',
        previousShare: 0,
        deltaPercentagePoints: 0,
      }),
    ]);
  });

  it('returns explicit empty analytics instead of inferring readiness', () => {
    const analytics = buildSafetyRecoveryProgressAnalytics([]);

    expect(analytics).toMatchObject({
      period: 'all',
      periodLabel: 'All time',
      totalWorkouts: 0,
      contextWorkouts: 0,
      reviewedWorkouts: 0,
      reviewCoverageShare: 0,
      reviewCoverageLabel: '0%',
      missingOrStaleWorkouts: 0,
      noContextWorkouts: 0,
      restrictedWorkouts: 0,
      restrictedWorkoutShare: 0,
      restrictedWorkoutShareLabel: '0%',
      topMovementPatterns: [],
      comparison: null,
      loadTrend: {
        latestMultiplier: null,
        previousMultiplier: null,
        latestLabel: 'No load ceiling',
        deltaPercentagePoints: null,
        deltaLabel: 'No reviewed load ceilings yet',
        direction: 'unknown',
      },
    });

    expect(analytics.statusMetrics).toEqual([
      expect.objectContaining({ status: 'ready', count: 0, shareLabel: '0%' }),
      expect.objectContaining({ status: 'modify', count: 0, shareLabel: '0%' }),
      expect.objectContaining({ status: 'blocked', count: 0, shareLabel: '0%' }),
      expect.objectContaining({ status: 'needs_input', count: 0, shareLabel: '0%' }),
    ]);
  });

  it('keeps all-time analytics comparison-free', () => {
    const analytics = buildSafetyRecoveryProgressAnalytics([
      makeSession({
        id: 'historic',
        finishedAt: '2025-01-10T11:00:00.000Z',
        safetyRecovery: makeSafetyMetadata({ status: 'ready', multiplier: 1 }),
      }),
    ]);

    expect(analytics.period).toBe('all');
    expect(analytics.totalWorkouts).toBe(1);
    expect(analytics.comparison).toBeNull();
    expect(analytics.statusMetrics.every((metric) => metric.deltaLabel === null)).toBe(true);
  });
});
