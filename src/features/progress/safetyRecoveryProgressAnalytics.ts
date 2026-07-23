import type {
  WorkoutSafetyMetadata,
  WorkoutSafetyReviewStatus,
  WorkoutSession,
} from '@/types';

import { getWorkoutTimestamp } from '@/features/workouts/historyModel';

export type SafetyRecoveryProgressPeriod = '30d' | '90d' | 'all';

export type SafetyRecoveryStatusMetric = {
  status: WorkoutSafetyReviewStatus;
  label: string;
  count: number;
  share: number;
  shareLabel: string;
  previousShare: number | null;
  deltaPercentagePoints: number | null;
  deltaLabel: string | null;
};

export type SafetyRecoveryMovementMetric = {
  movementPattern: string;
  label: string;
  count: number;
  share: number;
  shareLabel: string;
};

export type SafetyRecoveryLoadTrend = {
  latestMultiplier: number | null;
  previousMultiplier: number | null;
  latestLabel: string;
  deltaPercentagePoints: number | null;
  deltaLabel: string;
  direction: 'up' | 'down' | 'flat' | 'unknown';
};

export type SafetyRecoveryPeriodComparison = {
  previousPeriodLabel: string;
  previousTotalWorkouts: number;
  previousReviewedWorkouts: number;
  workoutCountDelta: number;
  workoutCountDeltaLabel: string;
  reviewedWorkoutsDelta: number;
  reviewedWorkoutsDeltaLabel: string;
  reviewCoverageDeltaPercentagePoints: number | null;
  reviewCoverageDeltaLabel: string;
  restrictedWorkoutShareDeltaPercentagePoints: number | null;
  restrictedWorkoutShareDeltaLabel: string;
};

export type SafetyRecoveryProgressAnalytics = {
  period: SafetyRecoveryProgressPeriod;
  periodLabel: string;
  totalWorkouts: number;
  contextWorkouts: number;
  reviewedWorkouts: number;
  reviewCoverageShare: number;
  reviewCoverageLabel: string;
  missingOrStaleWorkouts: number;
  noContextWorkouts: number;
  statusMetrics: SafetyRecoveryStatusMetric[];
  loadTrend: SafetyRecoveryLoadTrend;
  restrictedWorkouts: number;
  restrictedWorkoutShare: number;
  restrictedWorkoutShareLabel: string;
  topMovementPatterns: SafetyRecoveryMovementMetric[];
  comparison: SafetyRecoveryPeriodComparison | null;
};

type SafetyRecoveryWindowAnalytics = Omit<
  SafetyRecoveryProgressAnalytics,
  'period' | 'periodLabel' | 'comparison'
>;

const DAY_MS = 24 * 60 * 60 * 1000;

const PERIOD_DAYS: Record<Exclude<SafetyRecoveryProgressPeriod, 'all'>, number> = {
  '30d': 30,
  '90d': 90,
};

const PERIOD_LABELS: Record<SafetyRecoveryProgressPeriod, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

const STATUS_ORDER: WorkoutSafetyReviewStatus[] = [
  'ready',
  'modify',
  'blocked',
  'needs_input',
];

const STATUS_LABELS: Record<WorkoutSafetyReviewStatus, string> = {
  ready: 'Ready',
  modify: 'Modify',
  blocked: 'Blocked',
  needs_input: 'Needs input',
};

const percentageLabel = (share: number): string => `${Math.round(share * 100)}%`;

const formatMovementPattern = (value: string): string =>
  value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const isFreshReviewedContext = (
  metadata: WorkoutSafetyMetadata | undefined,
): metadata is WorkoutSafetyMetadata =>
  Boolean(
    metadata &&
      metadata.reviewRunId &&
      metadata.reviewStatus &&
      metadata.gateKind !== 'review_missing' &&
      metadata.gateKind !== 'review_stale',
  );

const isValidMultiplier = (value: number | null): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

const buildLoadTrend = (sessions: WorkoutSession[]): SafetyRecoveryLoadTrend => {
  const entries = sessions
    .flatMap((session) => {
      const timestamp = getWorkoutTimestamp(session);
      const metadata = session.safetyRecovery;
      const multiplier = metadata?.recommendedLoadMultiplier ?? null;

      if (
        timestamp <= 0 ||
        !isFreshReviewedContext(metadata) ||
        !isValidMultiplier(multiplier)
      ) {
        return [];
      }

      return [{ timestamp, multiplier }];
    })
    .sort((left, right) => left.timestamp - right.timestamp);

  const latestMultiplier = entries.at(-1)?.multiplier ?? null;
  const previousMultiplier = entries.at(-2)?.multiplier ?? null;

  if (!isValidMultiplier(latestMultiplier)) {
    return {
      latestMultiplier: null,
      previousMultiplier: null,
      latestLabel: 'No load ceiling',
      deltaPercentagePoints: null,
      deltaLabel: 'No reviewed load ceilings yet',
      direction: 'unknown',
    };
  }

  if (!isValidMultiplier(previousMultiplier)) {
    return {
      latestMultiplier,
      previousMultiplier: null,
      latestLabel: `${Math.round(latestMultiplier * 100)}%`,
      deltaPercentagePoints: null,
      deltaLabel: 'First recorded reviewed ceiling',
      direction: 'unknown',
    };
  }

  const deltaPercentagePoints = Math.round((latestMultiplier - previousMultiplier) * 100);
  const direction =
    deltaPercentagePoints > 0 ? 'up' : deltaPercentagePoints < 0 ? 'down' : 'flat';
  const deltaLabel =
    direction === 'up'
      ? `Up ${deltaPercentagePoints} pp vs previous`
      : direction === 'down'
        ? `Down ${Math.abs(deltaPercentagePoints)} pp vs previous`
        : 'No change vs previous';

  return {
    latestMultiplier,
    previousMultiplier,
    latestLabel: `${Math.round(latestMultiplier * 100)}%`,
    deltaPercentagePoints,
    deltaLabel,
    direction,
  };
};

const buildWindowAnalytics = (sessions: WorkoutSession[]): SafetyRecoveryWindowAnalytics => {
  const totalWorkouts = sessions.length;
  const contextWorkouts = sessions.filter((session) => Boolean(session.safetyRecovery)).length;
  const noContextWorkouts = totalWorkouts - contextWorkouts;
  const missingOrStaleWorkouts = sessions.filter(
    (session) =>
      session.safetyRecovery?.gateKind === 'review_missing' ||
      session.safetyRecovery?.gateKind === 'review_stale',
  ).length;
  const reviewedSessions = sessions.filter((session) =>
    isFreshReviewedContext(session.safetyRecovery),
  );
  const reviewedWorkouts = reviewedSessions.length;
  const reviewCoverageShare = totalWorkouts > 0 ? reviewedWorkouts / totalWorkouts : 0;

  const statusMetrics = STATUS_ORDER.map((status): SafetyRecoveryStatusMetric => {
    const count = reviewedSessions.filter(
      (session) => session.safetyRecovery?.reviewStatus === status,
    ).length;
    const share = reviewedWorkouts > 0 ? count / reviewedWorkouts : 0;

    return {
      status,
      label: STATUS_LABELS[status],
      count,
      share,
      shareLabel: percentageLabel(share),
      previousShare: null,
      deltaPercentagePoints: null,
      deltaLabel: null,
    };
  });

  const movementCounts = new Map<string, number>();
  let restrictedWorkouts = 0;

  reviewedSessions.forEach((session) => {
    const movementPatterns = new Set(
      (session.safetyRecovery?.restrictions ?? [])
        .flatMap((restriction) => restriction.movementPatterns)
        .map((movementPattern) => movementPattern.trim())
        .filter(Boolean),
    );

    if (movementPatterns.size === 0) {
      return;
    }

    restrictedWorkouts += 1;
    movementPatterns.forEach((movementPattern) => {
      movementCounts.set(movementPattern, (movementCounts.get(movementPattern) ?? 0) + 1);
    });
  });

  const restrictedWorkoutShare =
    reviewedWorkouts > 0 ? restrictedWorkouts / reviewedWorkouts : 0;

  const topMovementPatterns = [...movementCounts.entries()]
    .map(([movementPattern, count]) => {
      const share = restrictedWorkouts > 0 ? count / restrictedWorkouts : 0;
      return {
        movementPattern,
        label: formatMovementPattern(movementPattern),
        count,
        share,
        shareLabel: percentageLabel(share),
      };
    })
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 3);

  return {
    totalWorkouts,
    contextWorkouts,
    reviewedWorkouts,
    reviewCoverageShare,
    reviewCoverageLabel: percentageLabel(reviewCoverageShare),
    missingOrStaleWorkouts,
    noContextWorkouts,
    statusMetrics,
    loadTrend: buildLoadTrend(sessions),
    restrictedWorkouts,
    restrictedWorkoutShare,
    restrictedWorkoutShareLabel: percentageLabel(restrictedWorkoutShare),
    topMovementPatterns,
  };
};

const formatSignedCount = (value: number, subject: string): string => {
  if (value > 0) return `+${value} ${subject} vs previous period`;
  if (value < 0) return `${value} ${subject} vs previous period`;
  return `No change in ${subject}`;
};

const formatPercentagePointDelta = (
  value: number | null,
  emptyLabel: string,
): string => {
  if (value === null) return emptyLabel;
  if (value > 0) return `Up ${value} pp vs previous period`;
  if (value < 0) return `Down ${Math.abs(value)} pp vs previous period`;
  return 'No change vs previous period';
};

const applyStatusComparison = (
  current: SafetyRecoveryStatusMetric[],
  previous: SafetyRecoveryStatusMetric[],
  previousReviewedWorkouts: number,
): SafetyRecoveryStatusMetric[] =>
  current.map((metric) => {
    if (previousReviewedWorkouts === 0) {
      return {
        ...metric,
        deltaLabel: 'No reviewed workouts in previous period',
      };
    }

    const previousMetric = previous.find((candidate) => candidate.status === metric.status);
    const previousShare = previousMetric?.share ?? 0;
    const deltaPercentagePoints = Math.round((metric.share - previousShare) * 100);

    return {
      ...metric,
      previousShare,
      deltaPercentagePoints,
      deltaLabel: formatPercentagePointDelta(deltaPercentagePoints, ''),
    };
  });

const selectFinitePeriodSessions = (
  sessions: WorkoutSession[],
  period: Exclude<SafetyRecoveryProgressPeriod, 'all'>,
  now: number,
): { current: WorkoutSession[]; previous: WorkoutSession[] } => {
  const windowMs = PERIOD_DAYS[period] * DAY_MS;
  const currentStart = now - windowMs;
  const previousStart = currentStart - windowMs;

  const timestamped = sessions.flatMap((session) => {
    const timestamp = getWorkoutTimestamp(session);
    return timestamp > 0 && timestamp <= now ? [{ session, timestamp }] : [];
  });

  return {
    current: timestamped
      .filter((entry) => entry.timestamp >= currentStart)
      .map((entry) => entry.session),
    previous: timestamped
      .filter((entry) => entry.timestamp >= previousStart && entry.timestamp < currentStart)
      .map((entry) => entry.session),
  };
};

const buildComparison = (
  current: SafetyRecoveryWindowAnalytics,
  previous: SafetyRecoveryWindowAnalytics,
  period: Exclude<SafetyRecoveryProgressPeriod, 'all'>,
): SafetyRecoveryPeriodComparison => {
  const reviewCoverageDeltaPercentagePoints =
    previous.totalWorkouts > 0
      ? Math.round((current.reviewCoverageShare - previous.reviewCoverageShare) * 100)
      : null;
  const restrictedWorkoutShareDeltaPercentagePoints =
    previous.reviewedWorkouts > 0
      ? Math.round((current.restrictedWorkoutShare - previous.restrictedWorkoutShare) * 100)
      : null;
  const days = PERIOD_DAYS[period];

  return {
    previousPeriodLabel: `Previous ${days} days`,
    previousTotalWorkouts: previous.totalWorkouts,
    previousReviewedWorkouts: previous.reviewedWorkouts,
    workoutCountDelta: current.totalWorkouts - previous.totalWorkouts,
    workoutCountDeltaLabel: formatSignedCount(
      current.totalWorkouts - previous.totalWorkouts,
      'workouts',
    ),
    reviewedWorkoutsDelta: current.reviewedWorkouts - previous.reviewedWorkouts,
    reviewedWorkoutsDeltaLabel: formatSignedCount(
      current.reviewedWorkouts - previous.reviewedWorkouts,
      'fresh reviews',
    ),
    reviewCoverageDeltaPercentagePoints,
    reviewCoverageDeltaLabel: formatPercentagePointDelta(
      reviewCoverageDeltaPercentagePoints,
      'No workouts in previous period',
    ),
    restrictedWorkoutShareDeltaPercentagePoints,
    restrictedWorkoutShareDeltaLabel: formatPercentagePointDelta(
      restrictedWorkoutShareDeltaPercentagePoints,
      'No fresh reviewed workouts in previous period',
    ),
  };
};

export const buildSafetyRecoveryProgressAnalytics = (
  sessions: WorkoutSession[],
  period: SafetyRecoveryProgressPeriod = 'all',
  now = Date.now(),
): SafetyRecoveryProgressAnalytics => {
  if (period === 'all') {
    return {
      period,
      periodLabel: PERIOD_LABELS[period],
      ...buildWindowAnalytics(sessions),
      comparison: null,
    };
  }

  const effectiveNow = Number.isFinite(now) ? now : Date.now();
  const periodSessions = selectFinitePeriodSessions(sessions, period, effectiveNow);
  const current = buildWindowAnalytics(periodSessions.current);
  const previous = buildWindowAnalytics(periodSessions.previous);

  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    ...current,
    statusMetrics: applyStatusComparison(
      current.statusMetrics,
      previous.statusMetrics,
      previous.reviewedWorkouts,
    ),
    comparison: buildComparison(current, previous, period),
  };
};
