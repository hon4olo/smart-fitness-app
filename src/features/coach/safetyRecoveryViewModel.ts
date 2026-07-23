import type { CoachRunEnvelope } from '@/api/coach';

export type SafetyRecoveryIssueView = {
  code: string;
  severity: 'input_required' | 'warning' | 'modify' | 'hard_block';
  message: string;
};

export type SafetyRecoveryRestrictionView = {
  limitationId: string;
  bodyRegion: string;
  side: string;
  severity: string;
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
      kind: 'readiness';
      title: string;
      message: string;
      status: 'ready' | 'needs_input' | 'modify' | 'blocked';
      latestCheckInAt: string | null;
      latestCheckInAgeHours: number | null;
      signalCount: number;
      recommendedLoadMultiplier: number;
      restrictions: SafetyRecoveryRestrictionView[];
      issues: SafetyRecoveryIssueView[];
      requiresExplicitConfirmation: boolean;
      approvedForAutomaticApply: false;
      rejectedReason: string | null;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const readNullableString = (
  record: Record<string, unknown>,
  key: string,
): string | null | undefined => {
  const value = record[key];
  if (value === null) return null;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const readFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readNullableNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null | undefined => {
  const value = record[key];
  if (value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const readIssues = (value: unknown): SafetyRecoveryIssueView[] | null => {
  if (!Array.isArray(value)) return null;
  const result: SafetyRecoveryIssueView[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const code = readString(item, 'code');
    const message = readString(item, 'message');
    const severity = item.severity;
    if (
      !code ||
      !message ||
      (severity !== 'input_required' &&
        severity !== 'warning' &&
        severity !== 'modify' &&
        severity !== 'hard_block')
    ) {
      return null;
    }
    result.push({ code, message, severity });
  }
  return result;
};

const readRestrictions = (
  value: unknown,
): SafetyRecoveryRestrictionView[] | null => {
  if (!Array.isArray(value)) return null;
  const result: SafetyRecoveryRestrictionView[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || !Array.isArray(item.movementPatterns)) return null;
    const limitationId = readString(item, 'limitationId');
    const bodyRegion = readString(item, 'bodyRegion');
    const side = readString(item, 'side');
    const severity = readString(item, 'severity');
    const action = item.action;
    const maximumLoadMultiplier = readFiniteNumber(item, 'maximumLoadMultiplier');
    const movementPatterns = item.movementPatterns.filter(
      (movement): movement is string =>
        typeof movement === 'string' && Boolean(movement.trim()),
    );
    if (
      !limitationId ||
      ids.has(limitationId) ||
      !bodyRegion ||
      !side ||
      !severity ||
      (action !== 'monitor' &&
        action !== 'reduce_load' &&
        action !== 'avoid_movement' &&
        action !== 'pause_training') ||
      maximumLoadMultiplier === null ||
      maximumLoadMultiplier < 0 ||
      maximumLoadMultiplier > 1 ||
      movementPatterns.length !== item.movementPatterns.length
    ) {
      return null;
    }
    ids.add(limitationId);
    result.push({
      limitationId,
      bodyRegion,
      side,
      severity,
      action,
      maximumLoadMultiplier,
      movementPatterns,
    });
  }
  return result;
};

const invalidResult = (): SafetyRecoveryViewModel => ({
  kind: 'failed',
  title: 'Invalid recovery result',
  message: 'The Safety & Recovery result could not be read safely.',
});

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
      message: 'Synchronized limitations and recovery signals are being evaluated.',
    };
  }
  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Review failed',
      message: run.error?.message ?? 'Safety & Recovery review could not be completed.',
    };
  }
  if (!isRecord(run.result) || !isRecord(run.result.readiness)) {
    return invalidResult();
  }

  const resultKind = run.result.kind;
  const rejectedReason =
    resultKind === 'safety-recovery-run-rejected'
      ? readString(run.result, 'reason')
      : null;
  if (
    (run.status === 'completed' && resultKind !== 'safety-recovery-review') ||
    (run.status === 'rejected' &&
      (resultKind !== 'safety-recovery-run-rejected' || !rejectedReason))
  ) {
    return invalidResult();
  }

  const readiness = run.result.readiness;
  const status = readiness.status;
  const latestCheckInAt = readNullableString(readiness, 'latestCheckInAt');
  const latestCheckInAgeHours = readNullableNumber(
    readiness,
    'latestCheckInAgeHours',
  );
  const signalCount = readFiniteNumber(readiness, 'signalCount');
  const recommendedLoadMultiplier = readFiniteNumber(
    readiness,
    'recommendedLoadMultiplier',
  );
  const restrictions = readRestrictions(readiness.restrictions);
  const issues = readIssues(readiness.issues);

  if (
    (status !== 'ready' &&
      status !== 'needs_input' &&
      status !== 'modify' &&
      status !== 'blocked') ||
    latestCheckInAt === undefined ||
    latestCheckInAgeHours === undefined ||
    signalCount === null ||
    !Number.isSafeInteger(signalCount) ||
    signalCount < 0 ||
    recommendedLoadMultiplier === null ||
    recommendedLoadMultiplier < 0 ||
    recommendedLoadMultiplier > 1 ||
    !restrictions ||
    !issues ||
    typeof readiness.requiresExplicitConfirmation !== 'boolean' ||
    readiness.approvedForAutomaticApply !== false
  ) {
    return invalidResult();
  }

  const copy =
    status === 'ready'
      ? {
          title: 'Ready as reported',
          message: 'No deterministic load reduction is required by the current inputs.',
        }
      : status === 'modify'
        ? {
            title: 'Training should be modified',
            message: 'Use the validated load reduction and movement restrictions below.',
          }
        : status === 'needs_input'
          ? {
              title: 'Recovery input required',
              message: 'Add a recent check-in with at least two recovery signals.',
            }
          : {
              title: 'Training is paused',
              message: 'An active limitation was explicitly marked as pause training.',
            };

  return {
    kind: 'readiness',
    ...copy,
    status,
    latestCheckInAt,
    latestCheckInAgeHours,
    signalCount,
    recommendedLoadMultiplier,
    restrictions,
    issues,
    requiresExplicitConfirmation: readiness.requiresExplicitConfirmation,
    approvedForAutomaticApply: false,
    rejectedReason,
  };
};
