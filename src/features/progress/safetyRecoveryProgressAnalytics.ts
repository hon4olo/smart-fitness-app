import type {
  WorkoutSafetyMetadata,
  WorkoutSafetyReviewStatus,
  WorkoutSession,
} from '@/types';

import { getWorkoutTimestamp } from '@/features/workouts/historyModel';

export type SafetyRecoveryStatusMetric = {
  status: WorkoutSafetyReviewStatus;
  label: string;
  count: number;
  share: number;
  shareLabel: string;
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

export type SafetyRecoveryProgressAnalytics = {
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
  topMovementPatterns: SafetyRecoveryMovementMetric[];
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

export const buildSafetyRecoveryProgressAnalytics = (
  sessions: WorkoutSession[],
): SafetyRecoveryProgressAnalytics => {
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

  const statusMetrics = STATUS_ORDER.map((status) => {
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
    topMovementPatterns,
  };
};
