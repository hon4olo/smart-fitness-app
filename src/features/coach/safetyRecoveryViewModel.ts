import type { CoachRunEnvelope } from '@/api/coach';

export type SafetyRecoveryStatus = 'ready' | 'modify' | 'needs_input' | 'blocked';
export type SafetyRecoveryIssueSeverity =
  | 'input_required'
  | 'warning'
  | 'modify'
  | 'hard_block';

export type SafetyRecoveryIssueView = {
  code: string;
  severity: SafetyRecoveryIssueSeverity;
  path: string;
  message: string;
  actual?: number | string | null;
  limit?: number | string;
};

export type SafetyRecoveryRestrictionView = {
  limitationId: string;
  bodyRegion: string;
  side: 'left' | 'right' | 'bilateral' | 'midline' | 'not_applicable';
  severity: 'mild' | 'moderate' | 'severe';
  action: 'monitor' | 'reduce_load' | 'avoid_movement' | 'pause_training';
  movementPatterns: string[];
  maximumLoadMultiplier: number;
};

export type SafetyRecoveryViewModel =
  | {
      kind: 'pending';
      title: string;
      message: string;
    }
  | {
      kind: 'failed';
      title: string;
      message: string;
    }
  | {
      kind: 'review';
      title: string;
      message: string;
      status: SafetyRecoveryStatus;
      rejected: boolean;
      reason: string | null;
      policyVersion: string;
      latestCheckInAt: string | null;
      latestCheckInAgeHours: number | null;
      signalCount: number;
      recommendedLoadMultiplier: number;
      restrictions: SafetyRecoveryRestrictionView[];
      issues: SafetyRecoveryIssueView[];
      requiresExplicitConfirmation: boolean;
      approvedForAutomaticApply: false;
    };

const STATUS_VALUES = new Set<SafetyRecoveryStatus>([
  'ready',
  'modify',
  'needs_input',
  'blocked',
]);
const ISSUE_SEVERITIES = new Set<SafetyRecoveryIssueSeverity>([
  'input_required',
  'warning',
  'modify',
  'hard_block',
]);
const SIDES = new Set<SafetyRecoveryRestrictionView['side']>([
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable',
]);
const SEVERITIES = new Set<SafetyRecoveryRestrictionView['severity']>([
  'mild',
  'moderate',
  'severe',
]);
const ACTIONS = new Set<SafetyRecoveryRestrictionView['action']>([
  'monitor',
  'reduce_load',
  'avoid_movement',
  'pause_training',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const readNullableTimestamp = (
  record: Record<string, unknown>,
  key: string,
): string | null | undefined => {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
};

const readNullableNonnegativeNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null | undefined => {
  const value = record[key];
  if (value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
};

const readIssues = (value: unknown): SafetyRecoveryIssueView[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: SafetyRecoveryIssueView[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const code = readString(item, 'code');
    const path = readString(item, 'path');
    const message = readString(item, 'message');
    const severity = item.severity;
    if (
      !code ||
      !path ||
      !message ||
      typeof severity !== 'string' ||
      !ISSUE_SEVERITIES.has(severity as SafetyRecoveryIssueSeverity)
    ) {
      return null;
    }
    const actual = item.actual;
    const limit = item.limit;
    if (
      actual !== undefined &&
      actual !== null &&
      typeof actual !== 'number' &&
      typeof actual !== 'string'
    ) {
      return null;
    }
    if (limit !== undefined && typeof limit !== 'number' && typeof limit !== 'string') {
      return null;
    }
    issues.push({
      code,
      severity: severity as SafetyRecoveryIssueSeverity,
      path,
      message,
      ...(actual === undefined ? {} : { actual: actual as number | string | null }),
      ...(limit === undefined ? {} : { limit: limit as number | string }),
    });
  }
  return issues;
};

const readRestrictions = (value: unknown): SafetyRecoveryRestrictionView[] | null => {
  if (!Array.isArray(value)) return null;
  const restrictions: SafetyRecoveryRestrictionView[] = [];
  const limitationIds = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) return null;
    const limitationId = readString(item, 'limitationId');
    const bodyRegion = readString(item, 'bodyRegion');
    const side = item.side;
    const severity = item.severity;
    const action = item.action;
    const maximumLoadMultiplier = item.maximumLoadMultiplier;
    if (
      !limitationId ||
      limitationIds.has(limitationId) ||
      !bodyRegion ||
      typeof side !== 'string' ||
      !SIDES.has(side as SafetyRecoveryRestrictionView['side']) ||
      typeof severity !== 'string' ||
      !SEVERITIES.has(severity as SafetyRecoveryRestrictionView['severity']) ||
      typeof action !== 'string' ||
      !ACTIONS.has(action as SafetyRecoveryRestrictionView['action']) ||
      !Array.isArray(item.movementPatterns) ||
      item.movementPatterns.some(
        (pattern) => typeof pattern !== 'string' || !pattern.trim(),
      ) ||
      typeof maximumLoadMultiplier !== 'number' ||
      !Number.isFinite(maximumLoadMultiplier) ||
      maximumLoadMultiplier < 0 ||
      maximumLoadMultiplier > 1
    ) {
      return null;
    }
    limitationIds.add(limitationId);
    restrictions.push({
      limitationId,
      bodyRegion,
      side: side as SafetyRecoveryRestrictionView['side'],
      severity: severity as SafetyRecoveryRestrictionView['severity'],
      action: action as SafetyRecoveryRestrictionView['action'],
      movementPatterns: (item.movementPatterns as string[]).map((pattern) => pattern.trim()),
      maximumLoadMultiplier,
    });
  }
  return restrictions;
};

const copyForStatus = (
  status: SafetyRecoveryStatus,
): { title: string; message: string } => {
  if (status === 'blocked') {
    return {
      title: 'Training paused',
      message: 'An active self-reported limitation explicitly pauses training.',
    };
  }
  if (status === 'needs_input') {
    return {
      title: 'Recovery check-in required',
      message: 'Add at least two current recovery signals before running a review.',
    };
  }
  if (status === 'modify') {
    return {
      title: 'Modify today’s training',
      message: 'The deterministic policy recommends reducing load or excluding movements.',
    };
  }
  return {
    title: 'Ready to train',
    message: 'No deterministic load reduction is required from the current inputs.',
  };
};

export const buildSafetyRecoveryViewModel = (
  envelope: CoachRunEnvelope,
): SafetyRecoveryViewModel => {
  const { run } = envelope;
  if (
    run.domain !== 'safety_recovery' ||
    run.requestType !== 'safety_recovery_review'
  ) {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result is not a Safety & Recovery review.',
    };
  }
  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Review in progress',
      message: 'Current recovery signals and active limitations are being validated.',
    };
  }
  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Review failed',
      message: run.error?.message ?? 'Safety & Recovery could not complete this review.',
    };
  }
  if (!isRecord(run.result) || !isRecord(run.result.readiness)) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'The Safety & Recovery result could not be read safely.',
    };
  }

  const rejected = run.result.kind === 'safety-recovery-run-rejected';
  const completed = run.result.kind === 'safety-recovery-review';
  if (
    (!rejected && !completed) ||
    (run.status === 'rejected' && !rejected) ||
    (run.status === 'completed' && !completed)
  ) {
    return {
      kind: 'failed',
      title: 'Unsupported result',
      message: 'The Safety & Recovery result type does not match its lifecycle state.',
    };
  }

  const readiness = run.result.readiness;
  const policyVersion = readString(readiness, 'policyVersion');
  const status = readiness.status;
  const latestCheckInAt = readNullableTimestamp(readiness, 'latestCheckInAt');
  const latestCheckInAgeHours = readNullableNonnegativeNumber(
    readiness,
    'latestCheckInAgeHours',
  );
  const signalCount = readiness.signalCount;
  const recommendedLoadMultiplier = readiness.recommendedLoadMultiplier;
  const restrictions = readRestrictions(readiness.restrictions);
  const issues = readIssues(readiness.issues);
  const reason = rejected ? readString(run.result, 'reason') : null;

  if (
    !policyVersion ||
    typeof status !== 'string' ||
    !STATUS_VALUES.has(status as SafetyRecoveryStatus) ||
    latestCheckInAt === undefined ||
    latestCheckInAgeHours === undefined ||
    typeof signalCount !== 'number' ||
    !Number.isSafeInteger(signalCount) ||
    signalCount < 0 ||
    signalCount > 7 ||
    typeof recommendedLoadMultiplier !== 'number' ||
    !Number.isFinite(recommendedLoadMultiplier) ||
    recommendedLoadMultiplier < 0 ||
    recommendedLoadMultiplier > 1 ||
    !restrictions ||
    !issues ||
    typeof readiness.requiresExplicitConfirmation !== 'boolean' ||
    readiness.approvedForAutomaticApply !== false ||
    (rejected && !reason)
  ) {
    return {
      kind: 'failed',
      title: 'Invalid review',
      message: 'The deterministic readiness contract failed validation.',
    };
  }

  const copy = copyForStatus(status as SafetyRecoveryStatus);
  return {
    kind: 'review',
    ...copy,
    status: status as SafetyRecoveryStatus,
    rejected,
    reason,
    policyVersion,
    latestCheckInAt,
    latestCheckInAgeHours,
    signalCount,
    recommendedLoadMultiplier,
    restrictions,
    issues,
    requiresExplicitConfirmation: readiness.requiresExplicitConfirmation,
    approvedForAutomaticApply: false,
  };
};
