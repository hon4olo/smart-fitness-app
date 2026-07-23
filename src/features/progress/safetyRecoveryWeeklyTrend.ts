import type {
  WorkoutSafetyMetadata,
  WorkoutSafetyReviewStatus,
  WorkoutSession,
} from '@/types';

import { getWorkoutTimestamp } from '@/features/workouts/historyModel';
import type { SafetyRecoveryProgressPeriod } from './safetyRecoveryProgressAnalytics';

export type SafetyRecoveryWeeklyStatusCounts = Record<WorkoutSafetyReviewStatus, number>;

export type SafetyRecoveryWeeklyTrendPoint = {
  key: string;
  label: string;
  startAt: string;
  endAt: string;
  totalWorkouts: number;
  reviewedWorkouts: number;
  statusCounts: SafetyRecoveryWeeklyStatusCounts;
  latestLoadMultiplier: number | null;
  latestLoadLabel: string;
};

export type SafetyRecoveryWeeklyTrend = {
  period: SafetyRecoveryProgressPeriod;
  windowLabel: string;
  points: SafetyRecoveryWeeklyTrendPoint[];
  reviewedWorkoutCount: number;
  loadCeilingPointCount: number;
  hasStatusData: boolean;
  hasLoadData: boolean;
};

type MutableWeeklyTrendPoint = SafetyRecoveryWeeklyTrendPoint & {
  latestLoadTimestamp: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const TREND_WINDOW_DAYS: Record<SafetyRecoveryProgressPeriod, number> = {
  '30d': 30,
  '90d': 90,
  all: 84,
};

const TREND_WINDOW_LABELS: Record<SafetyRecoveryProgressPeriod, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'Latest 12 weeks',
};

const emptyStatusCounts = (): SafetyRecoveryWeeklyStatusCounts => ({
  ready: 0,
  modify: 0,
  blocked: 0,
  needs_input: 0,
});

const isFreshReviewedContext = (
  metadata: WorkoutSafetyMetadata | undefined,
): metadata is WorkoutSafetyMetadata & { reviewStatus: WorkoutSafetyReviewStatus } =>
  Boolean(
    metadata &&
      metadata.reviewRunId &&
      metadata.reviewStatus &&
      metadata.gateKind !== 'review_missing' &&
      metadata.gateKind !== 'review_stale',
  );

const isValidMultiplier = (value: number | null): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

const formatWeekLabel = (timestamp: number): string =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(timestamp));

const createPoint = (start: number, end: number): MutableWeeklyTrendPoint => ({
  key: new Date(start).toISOString(),
  label: formatWeekLabel(start),
  startAt: new Date(start).toISOString(),
  endAt: new Date(end).toISOString(),
  totalWorkouts: 0,
  reviewedWorkouts: 0,
  statusCounts: emptyStatusCounts(),
  latestLoadMultiplier: null,
  latestLoadLabel: '—',
  latestLoadTimestamp: null,
});

export const buildSafetyRecoveryWeeklyTrend = (
  sessions: WorkoutSession[],
  period: SafetyRecoveryProgressPeriod = '90d',
  now = Date.now(),
): SafetyRecoveryWeeklyTrend => {
  const effectiveNow = Number.isFinite(now) ? now : Date.now();
  const windowMs = TREND_WINDOW_DAYS[period] * DAY_MS;
  const windowStart = effectiveNow - windowMs;
  const bucketCount = Math.ceil(windowMs / WEEK_MS);
  const points = Array.from({ length: bucketCount }, (_, index) => {
    const start = windowStart + index * WEEK_MS;
    const end = Math.min(start + WEEK_MS, effectiveNow);
    return createPoint(start, end);
  });

  const timestampedSessions = sessions
    .flatMap((session) => {
      const timestamp = getWorkoutTimestamp(session);
      return timestamp >= windowStart && timestamp <= effectiveNow
        ? [{ session, timestamp }]
        : [];
    })
    .sort(
      (left, right) =>
        left.timestamp - right.timestamp || left.session.id.localeCompare(right.session.id),
    );

  timestampedSessions.forEach(({ session, timestamp }) => {
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((timestamp - windowStart) / WEEK_MS)),
    );
    const point = points[bucketIndex];
    point.totalWorkouts += 1;

    const metadata = session.safetyRecovery;
    if (!isFreshReviewedContext(metadata)) {
      return;
    }

    point.reviewedWorkouts += 1;
    point.statusCounts[metadata.reviewStatus] += 1;

    const multiplier = metadata.recommendedLoadMultiplier ?? null;
    if (
      isValidMultiplier(multiplier) &&
      (point.latestLoadTimestamp === null || timestamp >= point.latestLoadTimestamp)
    ) {
      point.latestLoadTimestamp = timestamp;
      point.latestLoadMultiplier = multiplier;
      point.latestLoadLabel = `${Math.round(multiplier * 100)}%`;
    }
  });

  const publicPoints: SafetyRecoveryWeeklyTrendPoint[] = points.map(
    ({ latestLoadTimestamp: _latestLoadTimestamp, ...point }) => point,
  );
  const reviewedWorkoutCount = publicPoints.reduce(
    (total, point) => total + point.reviewedWorkouts,
    0,
  );
  const loadCeilingPointCount = publicPoints.filter(
    (point) => point.latestLoadMultiplier !== null,
  ).length;

  return {
    period,
    windowLabel: TREND_WINDOW_LABELS[period],
    points: publicPoints,
    reviewedWorkoutCount,
    loadCeilingPointCount,
    hasStatusData: reviewedWorkoutCount > 0,
    hasLoadData: loadCeilingPointCount > 0,
  };
};
