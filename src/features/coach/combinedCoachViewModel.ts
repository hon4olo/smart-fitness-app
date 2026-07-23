import type { CoachRunEnvelope } from '@/api/coach';

export type CombinedCoachStatus = 'ready' | 'modify' | 'needs_input' | 'blocked';
export type CombinedCoachIssue = {
  code: string;
  severity: 'input_required' | 'warning' | 'modify' | 'hard_block';
  domain: 'strength' | 'nutrition' | 'safety_recovery';
  message: string;
};

export type CombinedStrengthSummary = {
  runId: string;
  status: 'ready' | 'needs_input';
  completedSets: number | null;
  totalReps: number | null;
  totalTonnage: number | null;
  averageActualRpe: number | null;
  primarySessionId: string | null;
};

export type CombinedNutritionSummary = {
  runId: string;
  status: 'ready' | 'needs_input';
  trackedDays: number | null;
  coveragePercent: number | null;
  averageCaloriesPerTrackedDay: number | null;
  averageProteinPerTrackedDay: number | null;
  targetAvailable: boolean | null;
  agentReadiness: 'ready' | 'needs_input' | 'blocked' | null;
};

export type CombinedSafetySummary = {
  runId: string;
  status: CombinedCoachStatus;
  recommendedLoadMultiplier: number;
  restrictionCount: number;
  issueCount: number;
};

export type CombinedCoachViewModel =
  | { kind: 'pending'; title: string; message: string }
  | { kind: 'failed'; title: string; message: string }
  | {
      kind: 'review';
      title: string;
      message: string;
      status: CombinedCoachStatus;
      rejected: boolean;
      reason: string | null;
      policyVersion: string;
      strength: CombinedStrengthSummary;
      nutrition: CombinedNutritionSummary;
      safety: CombinedSafetySummary;
      issues: CombinedCoachIssue[];
      automaticApplication: false;
    };

const COMBINED_STATUSES = new Set<CombinedCoachStatus>([
  'ready',
  'modify',
  'needs_input',
  'blocked',
]);
const ISSUE_SEVERITIES = new Set<CombinedCoachIssue['severity']>([
  'input_required',
  'warning',
  'modify',
  'hard_block',
]);
const ISSUE_DOMAINS = new Set<CombinedCoachIssue['domain']>([
  'strength',
  'nutrition',
  'safety_recovery',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const readNullableNumber = (
  record: Record<string, unknown>,
  key: string,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number | null | undefined => {
  const value = record[key];
  if (value === null) return null;
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
};

const readNullableInteger = (
  record: Record<string, unknown>,
  key: string,
): number | null | undefined => {
  const value = readNullableNumber(record, key);
  return value === null || (value !== undefined && Number.isSafeInteger(value))
    ? value
    : undefined;
};

const readStrength = (value: unknown): CombinedStrengthSummary | null => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = value.status;
  const completedSets = readNullableInteger(value, 'completedSets');
  const totalReps = readNullableInteger(value, 'totalReps');
  const totalTonnage = readNullableNumber(value, 'totalTonnage');
  const averageActualRpe = readNullableNumber(value, 'averageActualRpe', 6, 10);
  const primarySessionIdValue = value.primarySessionId;
  const primarySessionId =
    primarySessionIdValue === null
      ? null
      : typeof primarySessionIdValue === 'string' && primarySessionIdValue.trim()
        ? primarySessionIdValue.trim()
        : undefined;
  if (
    !runId ||
    (status !== 'ready' && status !== 'needs_input') ||
    completedSets === undefined ||
    totalReps === undefined ||
    totalTonnage === undefined ||
    averageActualRpe === undefined ||
    primarySessionId === undefined
  ) {
    return null;
  }
  return {
    runId,
    status,
    completedSets,
    totalReps,
    totalTonnage,
    averageActualRpe,
    primarySessionId,
  };
};

const readNutrition = (value: unknown): CombinedNutritionSummary | null => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = value.status;
  const trackedDays = readNullableInteger(value, 'trackedDays');
  const coveragePercent = readNullableNumber(value, 'coveragePercent', 0, 100);
  const averageCaloriesPerTrackedDay = readNullableNumber(
    value,
    'averageCaloriesPerTrackedDay',
  );
  const averageProteinPerTrackedDay = readNullableNumber(
    value,
    'averageProteinPerTrackedDay',
  );
  const targetAvailableValue = value.targetAvailable;
  const targetAvailable =
    targetAvailableValue === null || typeof targetAvailableValue === 'boolean'
      ? targetAvailableValue
      : undefined;
  const readinessValue = value.agentReadiness;
  const agentReadiness =
    readinessValue === null ||
    readinessValue === 'ready' ||
    readinessValue === 'needs_input' ||
    readinessValue === 'blocked'
      ? readinessValue
      : undefined;
  if (
    !runId ||
    (status !== 'ready' && status !== 'needs_input') ||
    trackedDays === undefined ||
    coveragePercent === undefined ||
    averageCaloriesPerTrackedDay === undefined ||
    averageProteinPerTrackedDay === undefined ||
    targetAvailable === undefined ||
    agentReadiness === undefined
  ) {
    return null;
  }
  return {
    runId,
    status,
    trackedDays,
    coveragePercent,
    averageCaloriesPerTrackedDay,
    averageProteinPerTrackedDay,
    targetAvailable,
    agentReadiness,
  };
};

const readSafety = (value: unknown): CombinedSafetySummary | null => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = value.status;
  const recommendedLoadMultiplier = value.recommendedLoadMultiplier;
  const restrictionCount = value.restrictionCount;
  const issueCount = value.issueCount;
  if (
    !runId ||
    typeof status !== 'string' ||
    !COMBINED_STATUSES.has(status as CombinedCoachStatus) ||
    typeof recommendedLoadMultiplier !== 'number' ||
    !Number.isFinite(recommendedLoadMultiplier) ||
    recommendedLoadMultiplier < 0 ||
    recommendedLoadMultiplier > 1 ||
    typeof restrictionCount !== 'number' ||
    !Number.isSafeInteger(restrictionCount) ||
    restrictionCount < 0 ||
    typeof issueCount !== 'number' ||
    !Number.isSafeInteger(issueCount) ||
    issueCount < 0
  ) {
    return null;
  }
  return {
    runId,
    status: status as CombinedCoachStatus,
    recommendedLoadMultiplier,
    restrictionCount,
    issueCount,
  };
};

const readIssues = (value: unknown): CombinedCoachIssue[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: CombinedCoachIssue[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const code = readString(item, 'code');
    const message = readString(item, 'message');
    const severity = item.severity;
    const domain = item.domain;
    if (
      !code ||
      !message ||
      typeof severity !== 'string' ||
      !ISSUE_SEVERITIES.has(severity as CombinedCoachIssue['severity']) ||
      typeof domain !== 'string' ||
      !ISSUE_DOMAINS.has(domain as CombinedCoachIssue['domain'])
    ) {
      return null;
    }
    issues.push({
      code,
      message,
      severity: severity as CombinedCoachIssue['severity'],
      domain: domain as CombinedCoachIssue['domain'],
    });
  }
  return issues;
};

const copyForStatus = (
  status: CombinedCoachStatus,
): { title: string; message: string } => {
  if (status === 'blocked') {
    return {
      title: 'Combined review blocked',
      message: 'An explicit self-reported Safety limitation currently pauses training.',
    };
  }
  if (status === 'needs_input') {
    return {
      title: 'More data required',
      message: 'At least one deterministic domain needs additional synchronized input.',
    };
  }
  if (status === 'modify') {
    return {
      title: 'Modify today’s plan',
      message: 'Strength and Nutrition are usable, but Safety requires a bounded modification.',
    };
  }
  return {
    title: 'Combined review ready',
    message: 'Strength, Nutrition, and Safety inputs passed the deterministic final guardrail.',
  };
};

export const buildCombinedCoachViewModel = (
  envelope: CoachRunEnvelope,
): CombinedCoachViewModel => {
  const { run } = envelope;
  if (run.domain !== 'combined' || run.requestType !== 'combined_review') {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result is not a Combined Coach review.',
    };
  }
  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Combined review in progress',
      message: 'Strength, Nutrition, and Safety child reviews are being evaluated.',
    };
  }
  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Combined review failed',
      message: run.error?.message ?? 'The Combined Coach run could not complete.',
    };
  }
  if (
    !isRecord(run.result) ||
    !isRecord(run.result.review) ||
    !isRecord(run.result.childRunIds)
  ) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'The Combined Coach result could not be read safely.',
    };
  }

  const rejected = run.result.kind === 'combined-coach-run-rejected';
  const completed = run.result.kind === 'combined-coach-review';
  if (
    (!rejected && !completed) ||
    (run.status === 'rejected' && !rejected) ||
    (run.status === 'completed' && !completed)
  ) {
    return {
      kind: 'failed',
      title: 'Unsupported result',
      message: 'The Combined result type does not match its lifecycle state.',
    };
  }

  const review = run.result.review;
  const status = review.status;
  const policyVersion = readString(review, 'policyVersion');
  const strength = readStrength(review.strength);
  const nutrition = readNutrition(review.nutrition);
  const safety = readSafety(review.safety);
  const issues = readIssues(review.issues);
  const childRunIds = run.result.childRunIds;
  const childStrength = readString(childRunIds, 'strength');
  const childNutrition = readString(childRunIds, 'nutrition');
  const childSafety = readString(childRunIds, 'safety');
  const reason = rejected ? readString(run.result, 'reason') : null;

  if (
    typeof status !== 'string' ||
    !COMBINED_STATUSES.has(status as CombinedCoachStatus) ||
    !policyVersion ||
    !strength ||
    !nutrition ||
    !safety ||
    !issues ||
    review.automaticApplication !== false ||
    !childStrength ||
    !childNutrition ||
    !childSafety ||
    childStrength !== strength.runId ||
    childNutrition !== nutrition.runId ||
    childSafety !== safety.runId ||
    (rejected && !reason) ||
    (rejected && status !== 'blocked' && status !== 'needs_input') ||
    (completed && status !== 'ready' && status !== 'modify')
  ) {
    return {
      kind: 'failed',
      title: 'Invalid combined review',
      message: 'The deterministic final guardrail contract failed validation.',
    };
  }

  return {
    kind: 'review',
    ...copyForStatus(status as CombinedCoachStatus),
    status: status as CombinedCoachStatus,
    rejected,
    reason,
    policyVersion,
    strength,
    nutrition,
    safety,
    issues,
    automaticApplication: false,
  };
};
