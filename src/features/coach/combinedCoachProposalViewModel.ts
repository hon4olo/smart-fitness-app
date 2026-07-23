import type { CoachRunEnvelope } from '@/api/coach';

export type CombinedProposalStatus = 'ready' | 'modify' | 'needs_input' | 'blocked';
export type CombinedProposalIssue = {
  code: string;
  severity: 'input_required' | 'warning' | 'modify' | 'hard_block';
  domain: 'strength' | 'nutrition' | 'safety_recovery';
  message: string;
};
export type CombinedProposalAction =
  | 'review_strength_proposal'
  | 'apply_safety_load_ceiling'
  | 'confirm_nutrition_target';

export type CombinedProposalSet = {
  sourceSetId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: number;
  adjustment: 'decrease' | 'maintain' | 'increase';
};

export type CombinedProposalTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type CombinedCoachProposalViewModel =
  | { kind: 'pending'; title: string; message: string }
  | { kind: 'failed'; title: string; message: string }
  | {
      kind: 'review';
      title: string;
      message: string;
      status: CombinedProposalStatus;
      rejected: boolean;
      reason: string | null;
      policyVersion: string;
      strength: {
        runId: string;
        status: CombinedProposalStatus;
        sourceSessionId: string | null;
        sets: CombinedProposalSet[];
        proposedTonnage: number | null;
        guardrailStatus: 'valid' | 'modify' | 'blocked' | null;
      };
      nutrition: {
        runId: string;
        status: CombinedProposalStatus;
        targetId: string | null;
        targetRevision: number | null;
        currentTargets: CombinedProposalTargets | null;
        proposedTargets: CombinedProposalTargets | null;
        changed: boolean | null;
        guardrailStatus: 'valid' | 'modify' | 'blocked' | null;
        requiresConfirmation: boolean;
        applied: boolean | null;
      };
      safety: {
        runId: string;
        status: CombinedProposalStatus;
        recommendedLoadMultiplier: number;
        restrictionCount: number;
        issueCount: number;
      };
      maximumStrengthLoadMultiplier: number;
      strengthRequiresSafetyAdjustment: boolean;
      pendingActions: CombinedProposalAction[];
      issues: CombinedProposalIssue[];
      requiresExplicitConfirmation: true;
      automaticApplication: false;
    };

const STATUSES = new Set<CombinedProposalStatus>([
  'ready',
  'modify',
  'needs_input',
  'blocked',
]);
const ISSUE_SEVERITIES = new Set<CombinedProposalIssue['severity']>([
  'input_required',
  'warning',
  'modify',
  'hard_block',
]);
const ISSUE_DOMAINS = new Set<CombinedProposalIssue['domain']>([
  'strength',
  'nutrition',
  'safety_recovery',
]);
const ACTIONS = new Set<CombinedProposalAction>([
  'review_strength_proposal',
  'apply_safety_load_ceiling',
  'confirm_nutrition_target',
]);
const RPE_VALUES = new Set([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const readStatus = (value: unknown): CombinedProposalStatus | null =>
  typeof value === 'string' && STATUSES.has(value as CombinedProposalStatus)
    ? (value as CombinedProposalStatus)
    : null;

const readNullableString = (value: unknown): string | null | undefined =>
  value === null
    ? null
    : typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined;

const readNumber = (
  value: unknown,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number | null =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= minimum &&
  value <= maximum
    ? value
    : null;

const readNullableNumber = (
  value: unknown,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number | null | undefined =>
  value === null ? null : readNumber(value, minimum, maximum) ?? undefined;

const readNullableInteger = (value: unknown): number | null | undefined => {
  const parsed = readNullableNumber(value);
  return parsed === null || (parsed !== undefined && Number.isSafeInteger(parsed))
    ? parsed
    : undefined;
};

const readGuardrail = (
  value: unknown,
): 'valid' | 'modify' | 'blocked' | null | undefined =>
  value === null || value === 'valid' || value === 'modify' || value === 'blocked'
    ? value
    : undefined;

const readTargets = (value: unknown): CombinedProposalTargets | null | undefined => {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const calories = readNumber(value.calories);
  const protein = readNumber(value.protein);
  const carbs = readNumber(value.carbs);
  const fats = readNumber(value.fats);
  if (calories === null || protein === null || carbs === null || fats === null) {
    return undefined;
  }
  return { calories, protein, carbs, fats };
};

const readSets = (value: unknown): CombinedProposalSet[] | null => {
  if (!Array.isArray(value)) return null;
  const ids = new Set<string>();
  const sets: CombinedProposalSet[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const sourceSetId = readString(item, 'sourceSetId');
    const exerciseId = readString(item, 'exerciseId');
    const exerciseName = readString(item, 'exerciseName');
    const weight = readNumber(item.weight, 0, 2_000);
    const reps = readNumber(item.reps, 1, 100);
    const targetRpe = readNumber(item.targetRpe, 6, 10);
    const adjustment = item.adjustment;
    if (
      !sourceSetId ||
      ids.has(sourceSetId) ||
      !exerciseId ||
      !exerciseName ||
      weight === null ||
      reps === null ||
      !Number.isSafeInteger(reps) ||
      targetRpe === null ||
      !RPE_VALUES.has(targetRpe) ||
      (adjustment !== 'decrease' &&
        adjustment !== 'maintain' &&
        adjustment !== 'increase')
    ) {
      return null;
    }
    ids.add(sourceSetId);
    sets.push({
      sourceSetId,
      exerciseId,
      exerciseName,
      weight,
      reps,
      targetRpe,
      adjustment,
    });
  }
  return sets;
};

const readStrength = (value: unknown) => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = readStatus(value.status);
  const sourceSessionId = readNullableString(value.sourceSessionId);
  const sets = readSets(value.sets);
  const proposedTonnage = readNullableNumber(value.proposedTonnage);
  const guardrailStatus = readGuardrail(value.guardrailStatus);
  if (
    !runId ||
    !status ||
    sourceSessionId === undefined ||
    !sets ||
    proposedTonnage === undefined ||
    guardrailStatus === undefined
  ) {
    return null;
  }
  return { runId, status, sourceSessionId, sets, proposedTonnage, guardrailStatus };
};

const readNutrition = (value: unknown) => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = readStatus(value.status);
  const targetId = readNullableString(value.targetId);
  const targetRevision = readNullableInteger(value.targetRevision);
  const currentTargets = readTargets(value.currentTargets);
  const proposedTargets = readTargets(value.proposedTargets);
  const changed = value.changed === null || typeof value.changed === 'boolean'
    ? value.changed
    : undefined;
  const guardrailStatus = readGuardrail(value.guardrailStatus);
  const requiresConfirmation = value.requiresConfirmation;
  const applied = value.applied === null || typeof value.applied === 'boolean'
    ? value.applied
    : undefined;
  if (
    !runId ||
    !status ||
    targetId === undefined ||
    targetRevision === undefined ||
    currentTargets === undefined ||
    proposedTargets === undefined ||
    changed === undefined ||
    guardrailStatus === undefined ||
    typeof requiresConfirmation !== 'boolean' ||
    applied === undefined
  ) {
    return null;
  }
  return {
    runId,
    status,
    targetId,
    targetRevision,
    currentTargets,
    proposedTargets,
    changed,
    guardrailStatus,
    requiresConfirmation,
    applied,
  };
};

const readSafety = (value: unknown) => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = readStatus(value.status);
  const recommendedLoadMultiplier = readNumber(value.recommendedLoadMultiplier, 0, 1);
  const restrictionCount = readNumber(value.restrictionCount);
  const issueCount = readNumber(value.issueCount);
  if (
    !runId ||
    !status ||
    recommendedLoadMultiplier === null ||
    restrictionCount === null ||
    !Number.isSafeInteger(restrictionCount) ||
    issueCount === null ||
    !Number.isSafeInteger(issueCount)
  ) {
    return null;
  }
  return { runId, status, recommendedLoadMultiplier, restrictionCount, issueCount };
};

const readIssues = (value: unknown): CombinedProposalIssue[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: CombinedProposalIssue[] = [];
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
      !ISSUE_SEVERITIES.has(severity as CombinedProposalIssue['severity']) ||
      typeof domain !== 'string' ||
      !ISSUE_DOMAINS.has(domain as CombinedProposalIssue['domain'])
    ) {
      return null;
    }
    issues.push({
      code,
      message,
      severity: severity as CombinedProposalIssue['severity'],
      domain: domain as CombinedProposalIssue['domain'],
    });
  }
  return issues;
};

const readActions = (value: unknown): CombinedProposalAction[] | null => {
  if (!Array.isArray(value)) return null;
  const actions = value.filter(
    (action): action is CombinedProposalAction =>
      typeof action === 'string' && ACTIONS.has(action as CombinedProposalAction),
  );
  return actions.length === value.length && new Set(actions).size === actions.length
    ? actions
    : null;
};

const copyForStatus = (status: CombinedProposalStatus) => {
  if (status === 'blocked') {
    return { title: 'Combined proposal blocked', message: 'Safety or a child proposal has a hard block.' };
  }
  if (status === 'needs_input') {
    return { title: 'More data required', message: 'At least one child proposal needs additional synchronized input.' };
  }
  if (status === 'modify') {
    return { title: 'Review modifications', message: 'The proposals are available with explicit guardrail adjustments.' };
  }
  return { title: 'Combined proposal ready', message: 'All child proposals passed the deterministic final guardrail.' };
};

export const buildCombinedCoachProposalViewModel = (
  envelope: CoachRunEnvelope,
): CombinedCoachProposalViewModel => {
  const { run } = envelope;
  if (run.domain !== 'combined' || run.requestType !== 'combined_proposal_review') {
    return { kind: 'failed', title: 'Unsupported run', message: 'This result is not a Combined proposal review.' };
  }
  if (run.status === 'queued' || run.status === 'running') {
    return { kind: 'pending', title: 'Building proposals', message: 'Strength, Nutrition, and Safety child runs are being evaluated.' };
  }
  if (run.status === 'failed') {
    return { kind: 'failed', title: 'Combined proposal failed', message: run.error?.message ?? 'The run could not complete.' };
  }
  if (!isRecord(run.result) || !isRecord(run.result.review) || !isRecord(run.result.childRunIds)) {
    return { kind: 'failed', title: 'Invalid result', message: 'The Combined proposal could not be read safely.' };
  }

  const rejected = run.result.kind === 'combined-coach-proposal-run-rejected';
  const completed = run.result.kind === 'combined-coach-proposal-review';
  const review = run.result.review;
  const status = readStatus(review.status);
  const policyVersion = readString(review, 'policyVersion');
  const strength = readStrength(review.strength);
  const nutrition = readNutrition(review.nutrition);
  const safety = readSafety(review.safety);
  const maximumStrengthLoadMultiplier = readNumber(review.maximumStrengthLoadMultiplier, 0, 1);
  const pendingActions = readActions(review.pendingActions);
  const issues = readIssues(review.issues);
  const childStrength = readString(run.result.childRunIds, 'strength');
  const childNutrition = readString(run.result.childRunIds, 'nutrition');
  const childSafety = readString(run.result.childRunIds, 'safety');
  const reason = rejected ? readString(run.result, 'reason') : null;

  if (
    (!rejected && !completed) ||
    (run.status === 'rejected' && !rejected) ||
    (run.status === 'completed' && !completed) ||
    !status ||
    !policyVersion ||
    !strength ||
    !nutrition ||
    !safety ||
    maximumStrengthLoadMultiplier === null ||
    review.strengthRequiresSafetyAdjustment !==
      (safety.recommendedLoadMultiplier < 1 &&
        (strength.status === 'ready' || strength.status === 'modify')) ||
    !pendingActions ||
    !issues ||
    review.requiresExplicitConfirmation !== true ||
    review.automaticApplication !== false ||
    childStrength !== strength.runId ||
    childNutrition !== nutrition.runId ||
    childSafety !== safety.runId ||
    (rejected && !reason) ||
    (rejected && status !== 'blocked' && status !== 'needs_input') ||
    (completed && status !== 'ready' && status !== 'modify')
  ) {
    return { kind: 'failed', title: 'Invalid Combined proposal', message: 'The deterministic proposal contract failed validation.' };
  }

  return {
    kind: 'review',
    ...copyForStatus(status),
    status,
    rejected,
    reason,
    policyVersion,
    strength,
    nutrition,
    safety,
    maximumStrengthLoadMultiplier,
    strengthRequiresSafetyAdjustment: review.strengthRequiresSafetyAdjustment as boolean,
    pendingActions,
    issues,
    requiresExplicitConfirmation: true,
    automaticApplication: false,
  };
};
