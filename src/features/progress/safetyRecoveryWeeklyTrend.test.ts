import { describe, expect, it } from 'vitest';

import type {
  WorkoutSafetyGateKind,
  WorkoutSafetyMetadata,
  WorkoutSafetyReviewStatus,
  WorkoutSession,
} from '@/types';

import { buildSafetyRecoveryWeeklyTrend } from './safetyRecoveryWeeklyTrend';

const NOW = Date.parse('2026-07-23T12:00:00.000Z');

const makeSafetyMetadata = ({
  gateKind = 'confirmation_required',
  multiplier = null,
  status,
}: {
  gateKind?: WorkoutSafetyGateKind;
  multiplier?: number | null;
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
  restrictions: [],
  issues: [],
});

const makeSession = ({
  finishedAt,
  id,
  safetyRecovery,
}: {
  finishedAt: string;
  id: string;
  safetyRecovery?: WorkoutSafetyMetadata;
}): WorkoutSession => ({
  id,
  workoutId: `workout-${id}`,
  workoutTitle: `Workout ${id}`,
  startedAt: new Date(Date.parse(finishedAt) - 60 * 60 * 1000).toISOString(),
  finishedAt,
  sets: [],
  safetyRecovery,
});

describe('Safety Recovery weekly trend', () => {
  it('assigns workouts to rolling weekly buckets and keeps the latest valid load ceiling', () => {
    const trend = buildSafetyRecoveryWeeklyTrend(
      [
        makeSession({
          id: 'before-window',
          finishedAt: '2026-06-23T11:59:59.999Z',
          safetyRecovery: makeSafetyMetadata({ status: 'ready', multiplier: 1 }),
        }),
        makeSession({
          id: 'first-bucket-ready',
          finishedAt: '2026-06-23T12:00:00.000Z',
          safetyRecovery: makeSafetyMetadata({ status: 'ready', multiplier: 0.9 }),
        }),
        makeSession({
          id: 'second-bucket-modify',
          finishedAt: '2026-06-30T12:00:00.000Z',
          safetyRecovery: makeSafetyMetadata({ status: 'modify', multiplier: 0.8 }),
        }),
        makeSession({
          id: 'latest-bucket-blocked',
          finishedAt: '2026-07-21T12:00:00.000Z',
          safetyRecovery: makeSafetyMetadata({ status: 'blocked', multiplier: 0.5 }),
        }),
        makeSession({
          id: 'latest-bucket-modify',
          finishedAt: '2026-07-22T12:00:00.000Z',
          safetyRecovery: makeSafetyMetadata({ status: 'modify', multiplier: 0.65 }),
        }),
        makeSession({
          id: 'latest-bucket-ready',
          finishedAt: '2026-07-23T11:00:00.000Z',
          safetyRecovery: makeSafetyMetadata({ status: 'ready', multiplier: 0.7 }),
        }),
        makeSession({
          id: 'latest-bucket-stale',
          finishedAt: '2026-07-23T11:30:00.000Z',
          safetyRecovery: makeSafetyMetadata({
            gateKind: 'review_stale',
            status: 'modify',
            multiplier: 0.2,
          }),
        }),
        makeSession({
          id: 'future',
          finishedAt: '2026-07-23T12:00:00.001Z',
          safetyRecovery: makeSafetyMetadata({ status: 'blocked', multiplier: 0.1 }),
        }),
      ],
      '30d',
      NOW,
    );

    expect(trend).toMatchObject({
      period: '30d',
      windowLabel: 'Last 30 days',
      reviewedWorkoutCount: 5,
      loadCeilingPointCount: 3,
      hasStatusData: true,
      hasLoadData: true,
    });
    expect(trend.points).toHaveLength(5);
    expect(trend.points[0]).toMatchObject({
      totalWorkouts: 1,
      reviewedWorkouts: 1,
      statusCounts: { ready: 1, modify: 0, blocked: 0, needs_input: 0 },
      latestLoadMultiplier: 0.9,
    });
    expect(trend.points[1]).toMatchObject({
      totalWorkouts: 1,
      reviewedWorkouts: 1,
      statusCounts: { ready: 0, modify: 1, blocked: 0, needs_input: 0 },
      latestLoadMultiplier: 0.8,
    });
    expect(trend.points[4]).toMatchObject({
      totalWorkouts: 4,
      reviewedWorkouts: 3,
      statusCounts: { ready: 1, modify: 1, blocked: 1, needs_input: 0 },
      latestLoadMultiplier: 0.7,
      latestLoadLabel: '70%',
    });
  });

  it('uses thirteen buckets for 90 days and twelve recent weeks for all-time analytics', () => {
    const ninetyDays = buildSafetyRecoveryWeeklyTrend([], '90d', NOW);
    const allTime = buildSafetyRecoveryWeeklyTrend([], 'all', NOW);

    expect(ninetyDays.points).toHaveLength(13);
    expect(ninetyDays.windowLabel).toBe('Last 90 days');
    expect(allTime.points).toHaveLength(12);
    expect(allTime.windowLabel).toBe('Latest 12 weeks');
  });

  it('returns explicit empty chart state without inferring readiness', () => {
    const trend = buildSafetyRecoveryWeeklyTrend(
      [
        makeSession({
          id: 'missing-review',
          finishedAt: '2026-07-22T12:00:00.000Z',
          safetyRecovery: makeSafetyMetadata({ gateKind: 'review_missing', status: null }),
        }),
      ],
      '30d',
      NOW,
    );

    expect(trend.reviewedWorkoutCount).toBe(0);
    expect(trend.loadCeilingPointCount).toBe(0);
    expect(trend.hasStatusData).toBe(false);
    expect(trend.hasLoadData).toBe(false);
    expect(trend.points.reduce((total, point) => total + point.totalWorkouts, 0)).toBe(1);
  });
});
