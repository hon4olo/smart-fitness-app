import type {
  WorkoutSafetyGateKind,
  WorkoutSafetyIssue,
  WorkoutSafetyMetadata,
  WorkoutSafetyRestriction,
  WorkoutSafetyReviewStatus,
} from '@/types';

const GATE_KINDS = new Set<WorkoutSafetyGateKind>([
  'review_missing',
  'review_stale',
  'ready',
  'confirmation_required',
]);
const REVIEW_STATUSES = new Set<WorkoutSafetyReviewStatus>([
  'ready',
  'needs_input',
  'modify',
  'blocked',
]);
const SIDES = new Set<WorkoutSafetyRestriction['side']>([
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable',
]);
const LIMITATION_SEVERITIES = new Set<WorkoutSafetyRestriction['severity']>([
  'mild',
  'moderate',
  'severe',
]);
const RESTRICTION_ACTIONS = new Set<WorkoutSafetyRestriction['action']>([
  'monitor',
  'reduce_load',
  'avoid_movement',
  'pause_training',
]);
const ISSUE_SEVERITIES = new Set<WorkoutSafetyIssue['severity']>([
  'input_required',
  'warning',
  'modify',
  'hard_block',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));

const parseRestriction = (value: unknown): WorkoutSafetyRestriction | null => {
  if (!isRecord(value) || !Array.isArray(value.movementPatterns)) return null;
  if (
    typeof value.limitationId !== 'string' ||
    !value.limitationId.trim() ||
    typeof value.bodyRegion !== 'string' ||
    !value.bodyRegion.trim() ||
    typeof value.side !== 'string' ||
    !SIDES.has(value.side as WorkoutSafetyRestriction['side']) ||
    typeof value.severity !== 'string' ||
    !LIMITATION_SEVERITIES.has(value.severity as WorkoutSafetyRestriction['severity']) ||
    typeof value.action !== 'string' ||
    !RESTRICTION_ACTIONS.has(value.action as WorkoutSafetyRestriction['action']) ||
    typeof value.maximumLoadMultiplier !== 'number' ||
    !Number.isFinite(value.maximumLoadMultiplier) ||
    value.maximumLoadMultiplier < 0 ||
    value.maximumLoadMultiplier > 1 ||
    value.movementPatterns.some((pattern) => typeof pattern !== 'string' || !pattern.trim())
  ) {
    return null;
  }

  return {
    limitationId: value.limitationId,
    bodyRegion: value.bodyRegion,
    side: value.side as WorkoutSafetyRestriction['side'],
    severity: value.severity as WorkoutSafetyRestriction['severity'],
    action: value.action as WorkoutSafetyRestriction['action'],
    movementPatterns: [...new Set(value.movementPatterns as string[])],
    maximumLoadMultiplier: value.maximumLoadMultiplier,
  };
};

const parseIssue = (value: unknown): WorkoutSafetyIssue | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.code !== 'string' ||
    !value.code.trim() ||
    typeof value.message !== 'string' ||
    !value.message.trim() ||
    typeof value.severity !== 'string' ||
    !ISSUE_SEVERITIES.has(value.severity as WorkoutSafetyIssue['severity'])
  ) {
    return null;
  }

  return {
    code: value.code,
    severity: value.severity as WorkoutSafetyIssue['severity'],
    message: value.message,
  };
};

export const parseWorkoutSafetyMetadata = (value: unknown): WorkoutSafetyMetadata | null => {
  if (!isRecord(value) || value.schemaVersion !== 1) return null;
  if (
    typeof value.gateKind !== 'string' ||
    !GATE_KINDS.has(value.gateKind as WorkoutSafetyGateKind) ||
    !isTimestamp(value.acknowledgedAt) ||
    typeof value.acknowledgementRequired !== 'boolean' ||
    typeof value.explicitlyAcknowledged !== 'boolean' ||
    (value.acknowledgementRequired && !value.explicitlyAcknowledged) ||
    (value.reviewRunId !== null &&
      (typeof value.reviewRunId !== 'string' || !value.reviewRunId.trim())) ||
    (value.reviewStatus !== null &&
      (typeof value.reviewStatus !== 'string' ||
        !REVIEW_STATUSES.has(value.reviewStatus as WorkoutSafetyReviewStatus))) ||
    (value.sourceFingerprint !== null &&
      (typeof value.sourceFingerprint !== 'string' || !value.sourceFingerprint.trim())) ||
    (value.recommendedLoadMultiplier !== null &&
      (typeof value.recommendedLoadMultiplier !== 'number' ||
        !Number.isFinite(value.recommendedLoadMultiplier) ||
        value.recommendedLoadMultiplier < 0 ||
        value.recommendedLoadMultiplier > 1)) ||
    !Array.isArray(value.restrictions) ||
    !Array.isArray(value.issues)
  ) {
    return null;
  }

  const restrictions = value.restrictions.map(parseRestriction);
  const issues = value.issues.map(parseIssue);
  if (restrictions.some((item) => item === null) || issues.some((item) => item === null)) {
    return null;
  }

  if (
    value.reviewRunId === null &&
    (value.reviewStatus !== null ||
      value.sourceFingerprint !== null ||
      value.recommendedLoadMultiplier !== null ||
      restrictions.length > 0 ||
      issues.length > 0)
  ) {
    return null;
  }

  return {
    schemaVersion: 1,
    gateKind: value.gateKind as WorkoutSafetyGateKind,
    acknowledgedAt: new Date(value.acknowledgedAt).toISOString(),
    acknowledgementRequired: value.acknowledgementRequired,
    explicitlyAcknowledged: value.explicitlyAcknowledged,
    reviewRunId: value.reviewRunId as string | null,
    reviewStatus: value.reviewStatus as WorkoutSafetyReviewStatus | null,
    sourceFingerprint: value.sourceFingerprint as string | null,
    recommendedLoadMultiplier: value.recommendedLoadMultiplier as number | null,
    restrictions: restrictions as WorkoutSafetyRestriction[],
    issues: issues as WorkoutSafetyIssue[],
  };
};

export const cloneWorkoutSafetyMetadata = (
  metadata: WorkoutSafetyMetadata,
): WorkoutSafetyMetadata | null =>
  parseWorkoutSafetyMetadata({
    ...metadata,
    restrictions: metadata.restrictions.map((restriction) => ({
      ...restriction,
      movementPatterns: [...restriction.movementPatterns],
    })),
    issues: metadata.issues.map((issue) => ({ ...issue })),
  });
