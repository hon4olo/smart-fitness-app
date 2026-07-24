import {
  isNutritionCoachRecord,
  readNutritionBoolean,
  readNutritionCoachMetrics,
  readNutritionFiniteNumber,
  readNutritionMetricTotals,
} from './nutritionCoachMetricParser';
import type {
  NutritionCoachViewModel,
  NutritionProposalIssue,
} from './nutritionCoachViewModelTypes';

const GUARDRAIL_STATUSES = new Set(['valid', 'modify', 'blocked']);

const readProposalIssues = (value: unknown): NutritionProposalIssue[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: NutritionProposalIssue[] = [];
  for (const item of value) {
    if (
      !isNutritionCoachRecord(item) ||
      typeof item.code !== 'string' ||
      !item.code ||
      (item.severity !== 'warning' && item.severity !== 'block') ||
      typeof item.field !== 'string' ||
      !item.field ||
      typeof item.message !== 'string' ||
      !item.message
    ) {
      return null;
    }
    issues.push({
      code: item.code,
      severity: item.severity,
      field: item.field,
      message: item.message,
    });
  }
  return issues;
};

export const readNutritionProposalViewModel = (
  result: Record<string, unknown>,
): Extract<NutritionCoachViewModel, { kind: 'proposal' }> | null => {
  if (
    !isNutritionCoachRecord(result.proposal) ||
    !isNutritionCoachRecord(result.guardrail)
  ) {
    return null;
  }
  const metrics = readNutritionCoachMetrics(result.metrics);
  const currentTargets = readNutritionMetricTotals(
    result.proposal.currentTargets,
  );
  const proposedTargets = readNutritionMetricTotals(
    result.proposal.proposedTargets,
  );
  const changes = readNutritionMetricTotals(result.proposal.changes);
  const currentMacroCalories = readNutritionFiniteNumber(
    result.proposal,
    'currentMacroCalories',
  );
  const proposedMacroCalories = readNutritionFiniteNumber(
    result.proposal,
    'proposedMacroCalories',
  );
  const calorieMathMismatchBefore = readNutritionFiniteNumber(
    result.proposal,
    'calorieMathMismatchBefore',
  );
  const calorieMathMismatchAfter = readNutritionFiniteNumber(
    result.proposal,
    'calorieMathMismatchAfter',
  );
  const guardrailStatus = result.guardrail.status;
  const issues = readProposalIssues(result.guardrail.issues);
  const changed = readNutritionBoolean(result.proposal, 'changed');
  const requiresConfirmation = readNutritionBoolean(
    result,
    'requiresConfirmation',
  );
  const applied = readNutritionBoolean(result, 'applied');
  const reason = result.proposal.reason;

  if (
    !metrics ||
    !currentTargets ||
    !proposedTargets ||
    !changes ||
    currentMacroCalories === null ||
    proposedMacroCalories === null ||
    calorieMathMismatchBefore === null ||
    calorieMathMismatchAfter === null ||
    typeof guardrailStatus !== 'string' ||
    !GUARDRAIL_STATUSES.has(guardrailStatus) ||
    !issues ||
    changed === null ||
    requiresConfirmation !== true ||
    applied !== false ||
    (reason !== 'already_consistent' && reason !== 'macro_calorie_mismatch')
  ) {
    return null;
  }

  const status = guardrailStatus as 'valid' | 'modify' | 'blocked';
  return {
    kind: 'proposal',
    title: changed
      ? 'Target consistency proposal'
      : 'Targets already consistent',
    message:
      status === 'valid'
        ? changed
          ? 'A calorie-neutral macro correction passed deterministic validation. It has not been applied.'
          : 'The current calorie and macro targets already reconcile within tolerance.'
        : 'The proposal did not pass all deterministic guardrails and cannot be applied.',
    metrics,
    currentTargets,
    proposedTargets,
    changes,
    changed,
    reason,
    currentMacroCalories,
    proposedMacroCalories,
    calorieMathMismatchBefore,
    calorieMathMismatchAfter,
    guardrailStatus: status,
    issues,
    requiresConfirmation: true,
    applied: false,
  };
};
