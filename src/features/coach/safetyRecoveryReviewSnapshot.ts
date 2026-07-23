import type { CoachRunEnvelope } from '@/api/coach';
import type { RecoveryCheckIn, UserLimitation } from '@/types';
import type {
  SafetyRecoveryIssueSeverity,
  SafetyRecoveryIssueView,
  SafetyRecoveryRestrictionAction,
  SafetyRecoveryRestrictionView,
  SafetyRecoveryStatus,
  SafetyRecoveryViewModel,
} from './safetyRecoveryViewModel';

export const SAFETY_RECOVERY_REVIEW_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const SAFETY_RECOVERY_REVIEW_MAX_CHECK_IN_AGE_HOURS = 72;

export type SafetyRecoveryReviewSnapshot = {
  schemaVersion: typeof SAFETY_RECOVERY_REVIEW_SNAPSHOT_SCHEMA_VERSION;
  userId: string;
  runId: string;
  completedAt: string;
  savedAt: string;
  sourceFingerprint: string;
  status: SafetyRecoveryStatus;
  latestCheckInAt: string | null;
  signalCount: number;
  recommendedLoadMultiplier: number;
  requiresExplicitConfirmation: boolean;
  restrictions: SafetyRecoveryRestrictionView[];
  issues: SafetyRecoveryIssueView[];
};

const STATUSES = new Set<SafetyRecoveryStatus>([
  'ready',
  'needs_input',
  'modify',
  'blocked',
]);
const ISSUE_SEVERITIES = new Set<SafetyRecoveryIssueSeverity>([
  'input_required',
  'warning',
  'modify',
  'hard_block',
]);
const RESTRICTION_ACTIONS = new Set<SafetyRecoveryRestrictionAction>([
  'monitor',
  'reduce_load',
  'avoid_movement',
  'pause_training',
]);
const SIDES = new Set<SafetyRecoveryRestrictionView['side']>([
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable',
]);
const LIMITATION_SEVERITIES = new Set<SafetyRecoveryRestrictionView['severity']>([
  'mild',
  'moderate',
  'severe',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));

const hashFingerprintSource = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

const recoveryFingerprintRecord = (checkIn: RecoveryCheckIn) => ({
  id: checkIn.id,
  recordedAt: checkIn.recordedAt,
  sleepDurationHours: checkIn.sleepDurationHours,
  sleepQuality: checkIn.sleepQuality,
  fatigue: checkIn.fatigue,
  soreness: checkIn.soreness,
  stress: checkIn.stress,
  painInterference: checkIn.painInterference,
  readiness: checkIn.readiness,
  updatedAt: checkIn.updatedAt,
});

const limitationFingerprintRecord = (limitation: UserLimitation) => ({
  id: limitation.id,
  kind: limitation.kind,
  bodyRegion: limitation.bodyRegion,
  side: limitation.side,
  severity: limitation.severity,
  status: limitation.status,
  trainingImpact: limitation.trainingImpact,
  movementPatterns: [...limitation.movementPatterns].sort(),
  onsetDate: limitation.onsetDate,
  resolvedDate: limitation.resolvedDate,
  updatedAt: limitation.updatedAt,
});

export const createSafetyRecoverySourceFingerprint = (input: {
  recoveryCheckIns: RecoveryCheckIn[];
  userLimitations: UserLimitation[];
}): string => {
  const recovery = [...input.recoveryCheckIns]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(recoveryFingerprintRecord);
  const limitations = [...input.userLimitations]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(limitationFingerprintRecord);
  return `safety-recovery-source-v1:${hashFingerprintSource(
    JSON.stringify({ recovery, limitations }),
  )}`;
};

const parseRestriction = (value: unknown): SafetyRecoveryRestrictionView | null => {
  if (!isRecord(value) || !Array.isArray(value.movementPatterns)) return null;
  if (
    typeof value.limitationId !== 'string' ||
    !value.limitationId.trim() ||
    typeof value.bodyRegion !== 'string' ||
    !value.bodyRegion.trim() ||
    typeof value.side !== 'string' ||
    !SIDES.has(value.side as SafetyRecoveryRestrictionView['side']) ||
    typeof value.severity !== 'string' ||
    !LIMITATION_SEVERITIES.has(value.severity as SafetyRecoveryRestrictionView['severity']) ||
    typeof value.action !== 'string' ||
    !RESTRICTION_ACTIONS.has(value.action as SafetyRecoveryRestrictionAction) ||
    typeof value.maximumLoadMultiplier !== 'number' ||
    !Number.isFinite(value.maximumLoadMultiplier) ||
    value.maximumLoadMultiplier < 0 ||
    value.maximumLoadMultiplier > 1 ||
    value.movementPatterns.some((item) => typeof item !== 'string' || !item.trim())
  ) {
    return null;
  }

  return {
    limitationId: value.limitationId,
    bodyRegion: value.bodyRegion,
    side: value.side as SafetyRecoveryRestrictionView['side'],
    severity: value.severity as SafetyRecoveryRestrictionView['severity'],
    action: value.action as SafetyRecoveryRestrictionAction,
    movementPatterns: [...new Set(value.movementPatterns as string[])].sort(),
    maximumLoadMultiplier: value.maximumLoadMultiplier,
  };
};

const parseIssue = (value: unknown): SafetyRecoveryIssueView | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.code !== 'string' ||
    !value.code.trim() ||
    typeof value.message !== 'string' ||
    !value.message.trim() ||
    typeof value.severity !== 'string' ||
    !ISSUE_SEVERITIES.has(value.severity as SafetyRecoveryIssueSeverity)
  ) {
    return null;
  }

  const actual = value.actual;
  const limit = value.limit;
  if (
    actual !== undefined &&
    actual !== null &&
    typeof actual !== 'string' &&
    (typeof actual !== 'number' || !Number.isFinite(actual))
  ) {
    return null;
  }
  if (
    limit !== undefined &&
    typeof limit !== 'string' &&
    (typeof limit !== 'number' || !Number.isFinite(limit))
  ) {
    return null;
  }

  return {
    code: value.code,
    severity: value.severity as SafetyRecoveryIssueSeverity,
    message: value.message,
    ...(actual === undefined ? {} : { actual: actual as number | string | null }),
    ...(limit === undefined ? {} : { limit: limit as number | string }),
  };
};

export const parseSafetyRecoveryReviewSnapshot = (
  value: unknown,
): SafetyRecoveryReviewSnapshot | null => {
  if (!isRecord(value) || value.schemaVersion !== SAFETY_RECOVERY_REVIEW_SNAPSHOT_SCHEMA_VERSION) {
    return null;
  }
  if (
    typeof value.userId !== 'string' ||
    !value.userId.trim() ||
    typeof value.runId !== 'string' ||
    !value.runId.trim() ||
    !isIsoTimestamp(value.completedAt) ||
    !isIsoTimestamp(value.savedAt) ||
    typeof value.sourceFingerprint !== 'string' ||
    !value.sourceFingerprint.startsWith('safety-recovery-source-v1:') ||
    typeof value.status !== 'string' ||
    !STATUSES.has(value.status as SafetyRecoveryStatus) ||
    (value.latestCheckInAt !== null && !isIsoTimestamp(value.latestCheckInAt)) ||
    typeof value.signalCount !== 'number' ||
    !Number.isInteger(value.signalCount) ||
    value.signalCount < 0 ||
    typeof value.recommendedLoadMultiplier !== 'number' ||
    !Number.isFinite(value.recommendedLoadMultiplier) ||
    value.recommendedLoadMultiplier < 0 ||
    value.recommendedLoadMultiplier > 1 ||
    typeof value.requiresExplicitConfirmation !== 'boolean' ||
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

  return {
    schemaVersion: SAFETY_RECOVERY_REVIEW_SNAPSHOT_SCHEMA_VERSION,
    userId: value.userId,
    runId: value.runId,
    completedAt: new Date(value.completedAt).toISOString(),
    savedAt: new Date(value.savedAt).toISOString(),
    sourceFingerprint: value.sourceFingerprint,
    status: value.status as SafetyRecoveryStatus,
    latestCheckInAt:
      value.latestCheckInAt === null ? null : new Date(value.latestCheckInAt).toISOString(),
    signalCount: value.signalCount,
    recommendedLoadMultiplier: value.recommendedLoadMultiplier,
    requiresExplicitConfirmation: value.requiresExplicitConfirmation,
    restrictions: restrictions as SafetyRecoveryRestrictionView[],
    issues: issues as SafetyRecoveryIssueView[],
  };
};

export const buildSafetyRecoveryReviewSnapshot = (input: {
  run: CoachRunEnvelope;
  viewModel: SafetyRecoveryViewModel;
  recoveryCheckIns: RecoveryCheckIn[];
  userLimitations: UserLimitation[];
  savedAt?: string;
}): SafetyRecoveryReviewSnapshot | null => {
  if (
    input.viewModel.kind !== 'result' ||
    input.run.run.domain !== 'safety_recovery' ||
    input.run.run.requestType !== 'safety_recovery_review' ||
    !input.run.run.completedAt ||
    !isIsoTimestamp(input.run.run.completedAt)
  ) {
    return null;
  }
  const savedAt = input.savedAt ?? new Date().toISOString();
  if (!isIsoTimestamp(savedAt)) return null;

  return {
    schemaVersion: SAFETY_RECOVERY_REVIEW_SNAPSHOT_SCHEMA_VERSION,
    userId: input.run.run.userId,
    runId: input.run.run.id,
    completedAt: new Date(input.run.run.completedAt).toISOString(),
    savedAt: new Date(savedAt).toISOString(),
    sourceFingerprint: createSafetyRecoverySourceFingerprint({
      recoveryCheckIns: input.recoveryCheckIns,
      userLimitations: input.userLimitations,
    }),
    status: input.viewModel.readiness.status,
    latestCheckInAt: input.viewModel.readiness.latestCheckInAt,
    signalCount: input.viewModel.readiness.signalCount,
    recommendedLoadMultiplier: input.viewModel.readiness.recommendedLoadMultiplier,
    requiresExplicitConfirmation: input.viewModel.readiness.requiresExplicitConfirmation,
    restrictions: input.viewModel.readiness.restrictions.map((restriction) => ({
      ...restriction,
      movementPatterns: [...restriction.movementPatterns],
    })),
    issues: input.viewModel.readiness.issues.map((issue) => ({ ...issue })),
  };
};
