import type { CoachRunEnvelope } from '@/api/coach';

export type SafetyRecoveryStatus = 'ready' | 'needs_input' | 'modify' | 'blocked';
export type SafetyRecoveryIssueSeverity =
  | 'input_required'
  | 'warning'
  | 'modify'
  | 'hard_block';
export type SafetyRecoveryRestrictionAction =
  | 'monitor'
  | 'reduce_load'
  | 'avoid_movement'
  | 'pause_training';

export type SafetyRecoveryIssueView = {
  code: string;
  severity: SafetyRecoveryIssueSeverity;
  message: string;
  actual?: number | string | null;
  limit?: number | string;
};

export type SafetyRecoveryRestrictionView = {
  limitationId: string;
  bodyRegion: string;
  side: 'left' | 'right' | 'bilateral' | 'midline' | 'not_applicable';
  severity: 'mild' | 'moderate' | 'severe';
  action: SafetyRecoveryRestrictionAction;
  movementPatterns: string[];
  maximumLoadMultiplier: number;
};

export type SafetyRecoveryReadinessView = {
  status: SafetyRecoveryStatus;
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
      kind: 'result';
      title: string;
      message: string;
      rejectionReason: 'safety_recovery_hard_block' | 'safety_recovery_input_required' | null;
      readiness: SafetyRecoveryReadinessView;
    };

const ISSUE_SEVERITIES = new Set<SafetyRecoveryIssueSeverity>([
  'input_required',
  'warning',
  'modify',
  'hard_block',
]);
const STATUSES = new Set<SafetyRecoveryStatus>([
  'ready',
  'needs_input',
  'modify',
  'blocked',
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

const readFiniteNumber = (
  value: unknown,
  minimum: number,
  maximum: number,
): number | null =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= minimum &&
  value <= maximum
    ? value
    : null;

const readNullableFiniteNumber = (
  value: unknown,
  minimum: number,
  maximum: number,
): number | null | undefined => {
  if (value === null) return null;
  const parsed = readFiniteNumber(value, minimum, maximum);
  return parsed === null ? undefined : parsed;
};

const readNullableIsoDate = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return Number.isFinite(Date.parse(value)) ? value : undefined;
};

const readIssues = (value: unknown): SafetyRecoveryIssueView[] | null => {
  if (!Array.isArray(value)) return null;

  const issues: SafetyRecoveryIssueView[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const { actual, code, limit, message, severity } = item;
    if (
      typeof code !== 'string' ||
      !code.trim() ||
      typeof message !== 'string' ||
      !message.trim() ||
      typeof severity !== 'string' ||
      !ISSUE_SEVERITIES.has(severity as SafetyRecoveryIssueSeverity) ||
      (actual !== undefined &&
        actual !== null &&
        typeof actual !== 'number' &&
        typeof actual !== 'string') ||
      (typeof actual === 'number' && !Number.isFinite(actual)) ||
      (limit !== undefined && typeof limit !== 'number' && typeof limit !== 'string') ||
      (typeof limit === 'number' && !Number.isFinite(limit))
    ) {
      return null;
    }

    issues.push({
      code,
      severity: severity as SafetyRecoveryIssueSeverity,
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
  for (const item of value) {
    if (!isRecord(item) || !Array.isArray(item.movementPatterns)) return null;
    const maximumLoadMultiplier = readFiniteNumber(item.maximumLoadMultiplier, 0, 1);
    if (
      typeof item.limitationId !== 'string' ||
      !item.limitationId.trim() ||
      typeof item.bodyRegion !== 'string' ||
      !item.bodyRegion.trim() ||
      typeof item.side !== 'string' ||
      !SIDES.has(item.side as SafetyRecoveryRestrictionView['side']) ||
      typeof item.severity !== 'string' ||
      !LIMITATION_SEVERITIES.has(item.severity as SafetyRecoveryRestrictionView['severity']) ||
      typeof item.action !== 'string' ||
      !RESTRICTION_ACTIONS.has(item.action as SafetyRecoveryRestrictionAction) ||
      maximumLoadMultiplier === null ||
      item.movementPatterns.some(
        (pattern) => typeof pattern !== 'string' || !pattern.trim(),
      )
    ) {
      return null;
    }

    restrictions.push({
      limitationId: item.limitationId,
      bodyRegion: item.bodyRegion,
      side: item.side as SafetyRecoveryRestrictionView['side'],
      severity: item.severity as SafetyRecoveryRestrictionView['severity'],
      action: item.action as SafetyRecoveryRestrictionAction,
      movementPatterns: item.movementPatterns as string[],
      maximumLoadMultiplier,
    });
  }
  return restrictions;
};

const readReadiness = (value: unknown): SafetyRecoveryReadinessView | null => {
  if (!isRecord(value)) return null;

  const latestCheckInAt = readNullableIsoDate(value.latestCheckInAt);
  const latestCheckInAgeHours = readNullableFiniteNumber(
    value.latestCheckInAgeHours,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const recommendedLoadMultiplier = readFiniteNumber(
    value.recommendedLoadMultiplier,
    0,
    1,
  );
  const restrictions = readRestrictions(value.restrictions);
  const issues = readIssues(value.issues);

  if (
    typeof value.policyVersion !== 'string' ||
    !value.policyVersion.trim() ||
    typeof value.status !== 'string' ||
    !STATUSES.has(value.status as SafetyRecoveryStatus) ||
    latestCheckInAt === undefined ||
    latestCheckInAgeHours === undefined ||
    typeof value.signalCount !== 'number' ||
    !Number.isInteger(value.signalCount) ||
    value.signalCount < 0 ||
    value.signalCount > 7 ||
    recommendedLoadMultiplier === null ||
    !restrictions ||
    !issues ||
    typeof value.requiresExplicitConfirmation !== 'boolean' ||
    value.approvedForAutomaticApply !== false
  ) {
    return null;
  }

  return {
    policyVersion: value.policyVersion,
    status: value.status as SafetyRecoveryStatus,
    latestCheckInAt,
    latestCheckInAgeHours,
    signalCount: value.signalCount,
    recommendedLoadMultiplier,
    restrictions,
    issues,
    requiresExplicitConfirmation: value.requiresExplicitConfirmation,
    approvedForAutomaticApply: false,
  };
};

const getCopy = (
  status: SafetyRecoveryStatus,
): Pick<Extract<SafetyRecoveryViewModel, { kind: 'result' }>, 'title' | 'message'> => {
  if (status === 'blocked') {
    return {
      title: 'Training paused',
      message:
        'An active limitation was explicitly marked to pause training. This review cannot approve a training recommendation.',
    };
  }
  if (status === 'needs_input') {
    return {
      title: 'Recovery input required',
      message:
        'A recent check-in with enough recovery signals is required before the deterministic review can continue.',
    };
  }
  if (status === 'modify') {
    return {
      title: 'Training should be modified',
      message:
        'The deterministic review recommends reducing load or excluding affected movement patterns.',
    };
  }
  return {
    title: 'Ready for normal training',
    message:
      'The available self-reported recovery data did not trigger a deterministic load reduction or hard block.',
  };
};

export const buildSafetyRecoveryViewModel = (
  envelope: CoachRunEnvelope,
): SafetyRecoveryViewModel => {
  const { run } = envelope;

  if (run.domain !== 'safety_recovery' || run.requestType !== 'safety_recovery_review') {
    return {
      kind: 'failed',
      title: 'Unsupported result',
      message: 'This result does not belong to the Safety & Recovery review.',
    };
  }

  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Review in progress',
      message: 'Synchronized limitations and recovery check-ins are being validated.',
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
      message: 'Safety & Recovery returned an unsupported result format.',
    };
  }

  const readiness = readReadiness(run.result.readiness);
  if (!readiness) {
    return {
      kind: 'failed',
      title: 'Invalid readiness result',
      message: 'The readiness result could not be read safely.',
    };
  }

  let rejectionReason: Extract<
    SafetyRecoveryViewModel,
    { kind: 'result' }
  >['rejectionReason'] = null;

  if (run.status === 'completed') {
    if (
      run.result.kind !== 'safety-recovery-review' ||
      (readiness.status !== 'ready' && readiness.status !== 'modify')
    ) {
      return {
        kind: 'failed',
        title: 'Invalid review state',
        message: 'The completed review status is inconsistent with its readiness result.',
      };
    }
  } else {
    const reason = run.result.reason;
    if (
      run.result.kind !== 'safety-recovery-run-rejected' ||
      (reason !== 'safety_recovery_hard_block' &&
        reason !== 'safety_recovery_input_required') ||
      (readiness.status !== 'blocked' && readiness.status !== 'needs_input') ||
      (readiness.status === 'blocked' && reason !== 'safety_recovery_hard_block') ||
      (readiness.status === 'needs_input' && reason !== 'safety_recovery_input_required')
    ) {
      return {
        kind: 'failed',
        title: 'Invalid rejection state',
        message: 'The rejected review status is inconsistent with its readiness result.',
      };
    }
    rejectionReason = reason;
  }

  return {
    kind: 'result',
    ...getCopy(readiness.status),
    rejectionReason,
    readiness,
  };
};
