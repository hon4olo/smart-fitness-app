import type {
  CombinedEffectiveStrengthPlan,
  CombinedNutritionProposal,
  CombinedNutritionReconciliation,
  CombinedNutritionReconciliationReason,
  CombinedSafetyProposal,
} from './combinedCoachProposalContracts';

const REASONS = new Set<CombinedNutritionReconciliationReason>([
  'macro_only_energy_preserved',
  'nutrition_proposal_unchanged',
  'reduced_training_load_observed',
  'normal_training_load_observed',
  'energy_change_policy_unavailable',
  'nutrition_proposal_unavailable',
  'combined_safety_blocked',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNullableInteger = (
  value: unknown,
  minimum = Number.MIN_SAFE_INTEGER,
): number | null | undefined =>
  value === null
    ? null
    : typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= minimum
      ? value
      : undefined;

const readNullableRatio = (value: unknown): number | null | undefined =>
  value === null
    ? null
    : typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 1
      ? value
      : undefined;

const readReasons = (value: unknown): CombinedNutritionReconciliationReason[] | null => {
  if (!Array.isArray(value)) return null;
  const reasons = value.filter(
    (reason): reason is CombinedNutritionReconciliationReason =>
      typeof reason === 'string' &&
      REASONS.has(reason as CombinedNutritionReconciliationReason),
  );
  return reasons.length === value.length && new Set(reasons).size === reasons.length
    ? reasons
    : null;
};

const roundRatio = (value: number): number =>
  Math.round((value + Number.EPSILON) * 10_000) / 10_000;

const expectedTrainingLoadRatio = (
  effective: CombinedEffectiveStrengthPlan,
): number | null => {
  if (effective.effectiveTonnage === null) return null;
  if (
    effective.proposedTonnage === null ||
    effective.proposedTonnage <= 0 ||
    effective.effectiveTonnage < 0 ||
    effective.effectiveTonnage > effective.proposedTonnage
  ) {
    return Number.NaN;
  }
  return roundRatio(effective.effectiveTonnage / effective.proposedTonnage);
};

const hasTrainingReason = (
  reasons: CombinedNutritionReconciliationReason[],
  reduced: boolean,
): boolean =>
  reasons.includes(
    reduced
      ? 'reduced_training_load_observed'
      : 'normal_training_load_observed',
  );

export const parseCombinedNutritionReconciliation = (input: {
  value: unknown;
  nutrition: CombinedNutritionProposal;
  effectiveStrength: CombinedEffectiveStrengthPlan;
  safety: CombinedSafetyProposal;
}): CombinedNutritionReconciliation | null => {
  if (!isRecord(input.value)) return null;
  const value = input.value;
  const status = value.status;
  const decision = value.decision;
  const currentCalories = readNullableInteger(value.currentCalories, 1);
  const proposedCalories = readNullableInteger(value.proposedCalories, 1);
  const energyDeltaCalories = readNullableInteger(value.energyDeltaCalories);
  const safetyLoadMultiplier = readNullableRatio(value.safetyLoadMultiplier);
  const effectiveTrainingLoadRatio = readNullableRatio(
    value.effectiveTrainingLoadRatio,
  );
  const reasonCodes = readReasons(value.reasonCodes);
  if (
    value.policyVersion !== 'combined-nutrition-reconciliation-v1' ||
    (status !== 'aligned' &&
      status !== 'needs_review' &&
      status !== 'not_applicable' &&
      status !== 'blocked') ||
    (decision !== 'preserve_proposal' &&
      decision !== 'hold_for_review' &&
      decision !== 'not_applicable' &&
      decision !== 'blocked') ||
    currentCalories === undefined ||
    proposedCalories === undefined ||
    energyDeltaCalories === undefined ||
    safetyLoadMultiplier === undefined ||
    effectiveTrainingLoadRatio === undefined ||
    !reasonCodes ||
    typeof value.approvedForConfirmation !== 'boolean' ||
    value.requiresExplicitConfirmation !== true ||
    value.automaticApplication !== false ||
    safetyLoadMultiplier !== input.safety.recommendedLoadMultiplier ||
    safetyLoadMultiplier !== input.effectiveStrength.loadMultiplier ||
    effectiveTrainingLoadRatio !== expectedTrainingLoadRatio(input.effectiveStrength)
  ) {
    return null;
  }

  const nutritionCurrent = input.nutrition.currentTargets?.calories ?? null;
  const nutritionProposed = input.nutrition.proposedTargets?.calories ?? null;
  if (
    currentCalories !== nutritionCurrent ||
    proposedCalories !== nutritionProposed
  ) {
    return null;
  }

  const reducedTrainingLoad =
    safetyLoadMultiplier < 1 ||
    (effectiveTrainingLoadRatio !== null && effectiveTrainingLoadRatio < 1);
  if (status === 'aligned') {
    const macroReason = input.nutrition.changed
      ? 'macro_only_energy_preserved'
      : 'nutrition_proposal_unchanged';
    if (
      decision !== 'preserve_proposal' ||
      value.approvedForConfirmation !== true ||
      currentCalories === null ||
      proposedCalories === null ||
      energyDeltaCalories !== 0 ||
      proposedCalories !== currentCalories ||
      !reasonCodes.includes(macroReason) ||
      !hasTrainingReason(reasonCodes, reducedTrainingLoad) ||
      reasonCodes.includes('energy_change_policy_unavailable')
    ) {
      return null;
    }
  } else if (status === 'needs_review') {
    if (
      decision !== 'hold_for_review' ||
      value.approvedForConfirmation !== false ||
      currentCalories === null ||
      proposedCalories === null ||
      energyDeltaCalories === 0 ||
      energyDeltaCalories !== proposedCalories - currentCalories ||
      !reasonCodes.includes('energy_change_policy_unavailable') ||
      !hasTrainingReason(reasonCodes, reducedTrainingLoad)
    ) {
      return null;
    }
  } else if (status === 'not_applicable') {
    if (
      decision !== 'not_applicable' ||
      value.approvedForConfirmation !== false ||
      energyDeltaCalories !== null ||
      !reasonCodes.includes('nutrition_proposal_unavailable')
    ) {
      return null;
    }
  } else if (
    decision !== 'blocked' ||
    value.approvedForConfirmation !== false ||
    energyDeltaCalories !== null ||
    !reasonCodes.includes('combined_safety_blocked')
  ) {
    return null;
  }

  return {
    policyVersion: 'combined-nutrition-reconciliation-v1',
    status,
    decision,
    currentCalories,
    proposedCalories,
    energyDeltaCalories,
    safetyLoadMultiplier,
    effectiveTrainingLoadRatio,
    reasonCodes,
    approvedForConfirmation: value.approvedForConfirmation,
    requiresExplicitConfirmation: true,
    automaticApplication: false,
  };
};
