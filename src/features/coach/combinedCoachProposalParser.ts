import type {
  CombinedNutritionProposal,
  CombinedProposalAction,
  CombinedProposalIssue,
  CombinedProposalSet,
  CombinedProposalStatus,
  CombinedProposalTargets,
  CombinedSafetyProposal,
  CombinedStrengthProposal,
  ParsedCombinedProposalReview,
} from './combinedCoachProposalContracts';
import { parseCombinedProposalV2Fields } from './combinedCoachProposalV2Parser';

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
const V1_ACTIONS = new Set<CombinedProposalAction>([
  'review_strength_proposal',
  'apply_safety_load_ceiling',
  'confirm_nutrition_target',
]);
const V2_ACTIONS = new Set<CombinedProposalAction>([
  ...V1_ACTIONS,
  'resolve_movement_restrictions',
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

const readNullableNumber = (value: unknown): number | null | undefined =>
  value === null ? null : readNumber(value) ?? undefined;

const readNullableInteger = (value: unknown): number | null | undefined => {
  const parsed = readNullableNumber(value);
  return parsed === null || (parsed !== undefined && Number.isSafeInteger(parsed))
    ? parsed
    : undefined;
};

const readNullableString = (value: unknown): string | null | undefined =>
  value === null
    ? null
    : typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined;

const readGuardrail = (
  value: unknown,
): 'valid' | 'modify' | 'blocked' | null | undefined =>
  value === null || value === 'valid' || value === 'modify' || value === 'blocked'
    ? value
    : undefined;

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

const readStrength = (value: unknown): CombinedStrengthProposal | null => {
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

const readTargets = (value: unknown): CombinedProposalTargets | null | undefined => {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const calories = readNumber(value.calories);
  const protein = readNumber(value.protein);
  const carbs = readNumber(value.carbs);
  const fats = readNumber(value.fats);
  return calories === null || protein === null || carbs === null || fats === null
    ? undefined
    : { calories, protein, carbs, fats };
};

const readNutrition = (value: unknown): CombinedNutritionProposal | null => {
  if (!isRecord(value)) return null;
  const runId = readString(value, 'runId');
  const status = readStatus(value.status);
  const targetId = readNullableString(value.targetId);
  const targetRevision = readNullableInteger(value.targetRevision);
  const currentTargets = readTargets(value.currentTargets);
  const proposedTargets = readTargets(value.proposedTargets);
  const changed =
    value.changed === null || typeof value.changed === 'boolean'
      ? value.changed
      : undefined;
  const guardrailStatus = readGuardrail(value.guardrailStatus);
  const applied =
    value.applied === null || typeof value.applied === 'boolean'
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
    typeof value.requiresConfirmation !== 'boolean' ||
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
    requiresConfirmation: value.requiresConfirmation,
    applied,
  };
};

const readSafetyBase = (value: unknown): CombinedSafetyProposal | null => {
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
  return {
    runId,
    status,
    recommendedLoadMultiplier,
    restrictions: [],
    restrictionCount,
    issueCount,
  };
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

const readActions = (
  value: unknown,
  policyVersion: ParsedCombinedProposalReview['policyVersion'],
): CombinedProposalAction[] | null => {
  if (!Array.isArray(value)) return null;
  const allowed = policyVersion === 'combined-coach-proposal-v2' ? V2_ACTIONS : V1_ACTIONS;
  const actions = value.filter(
    (action): action is CombinedProposalAction =>
      typeof action === 'string' && allowed.has(action as CombinedProposalAction),
  );
  return actions.length === value.length && new Set(actions).size === actions.length
    ? actions
    : null;
};

const finalStatus = (input: {
  strength: CombinedStrengthProposal;
  effectiveStrength: ParsedCombinedProposalReview['effectiveStrength'];
  nutrition: CombinedNutritionProposal;
  safety: CombinedSafetyProposal;
}): CombinedProposalStatus => {
  const statuses = [
    input.strength.status,
    input.effectiveStrength?.status,
    input.nutrition.status,
    input.safety.status,
  ].filter((value): value is CombinedProposalStatus => Boolean(value));
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.includes('needs_input')) return 'needs_input';
  if (statuses.includes('modify')) return 'modify';
  return 'ready';
};

export const parseCombinedProposalReview = (
  value: unknown,
): ParsedCombinedProposalReview | null => {
  if (!isRecord(value)) return null;
  const policyVersion = value.policyVersion;
  if (
    policyVersion !== 'combined-coach-proposal-v1' &&
    policyVersion !== 'combined-coach-proposal-v2'
  ) {
    return null;
  }
  const status = readStatus(value.status);
  const strength = readStrength(value.strength);
  const nutrition = readNutrition(value.nutrition);
  const safetyBase = readSafetyBase(value.safety);
  if (!status || !strength || !nutrition || !safetyBase) return null;

  const v2 =
    policyVersion === 'combined-coach-proposal-v2'
      ? parseCombinedProposalV2Fields({ review: value, strength, safetyBase })
      : null;
  if (policyVersion === 'combined-coach-proposal-v2' && !v2) return null;
  const safety = v2?.safety ?? safetyBase;
  const effectiveStrength = v2?.effectiveStrength ?? null;
  const maximumStrengthLoadMultiplier = readNumber(
    value.maximumStrengthLoadMultiplier,
    0,
    1,
  );
  const pendingActions = readActions(value.pendingActions, policyVersion);
  const issues = readIssues(value.issues);
  const expectedSafetyAdjustment =
    (strength.status === 'ready' || strength.status === 'modify') &&
    safety.recommendedLoadMultiplier < 1;
  if (
    maximumStrengthLoadMultiplier === null ||
    maximumStrengthLoadMultiplier !== safety.recommendedLoadMultiplier ||
    value.strengthRequiresSafetyAdjustment !== expectedSafetyAdjustment ||
    !pendingActions ||
    !issues ||
    value.requiresExplicitConfirmation !== true ||
    value.automaticApplication !== false ||
    status !== finalStatus({ strength, effectiveStrength, nutrition, safety })
  ) {
    return null;
  }

  if (effectiveStrength) {
    const hasUnresolved = effectiveStrength.unresolvedMovementPatterns.length > 0;
    const hasUnresolvedIssue = issues.some(
      (issue) => issue.code === 'COMBINED_MOVEMENT_RESTRICTION_UNRESOLVED',
    );
    if (
      hasUnresolved !== pendingActions.includes('resolve_movement_restrictions') ||
      hasUnresolved !== hasUnresolvedIssue
    ) {
      return null;
    }
    const canApplyCeiling =
      expectedSafetyAdjustment &&
      effectiveStrength.status !== 'blocked' &&
      effectiveStrength.status !== 'needs_input';
    if (canApplyCeiling !== pendingActions.includes('apply_safety_load_ceiling')) {
      return null;
    }
  }

  return {
    policyVersion,
    status,
    strength,
    effectiveStrength,
    nutrition,
    safety,
    maximumStrengthLoadMultiplier,
    strengthRequiresSafetyAdjustment: expectedSafetyAdjustment,
    pendingActions,
    issues,
    requiresExplicitConfirmation: true,
    automaticApplication: false,
  };
};
