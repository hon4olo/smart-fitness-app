import type {
  CombinedEffectiveStrengthPlan,
  CombinedEffectiveStrengthSet,
  CombinedProposalSet,
  CombinedSafetyProposal,
  CombinedSafetyRestriction,
  CombinedStrengthProposal,
} from './combinedCoachProposalContracts';

const RPE_VALUES = new Set([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);
const RESTRICTION_ACTIONS = new Set<CombinedSafetyRestriction['action']>([
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

const readNullableString = (value: unknown): string | null | undefined =>
  value === null
    ? null
    : typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined;

const readStatus = (value: unknown) =>
  value === 'ready' || value === 'modify' || value === 'needs_input' || value === 'blocked'
    ? value
    : null;

const readStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value.map((item) =>
    typeof item === 'string' && item.trim() ? item.trim() : null,
  );
  if (parsed.some((item) => item === null)) return null;
  const strings = parsed as string[];
  return new Set(strings).size === strings.length ? strings : null;
};

const round = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const readRestrictions = (value: unknown): CombinedSafetyRestriction[] | null => {
  if (!Array.isArray(value)) return null;
  const ids = new Set<string>();
  const restrictions: CombinedSafetyRestriction[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const limitationId = readString(item, 'limitationId');
    const movementPatterns = readStringArray(item.movementPatterns);
    const maximumLoadMultiplier = readNumber(item.maximumLoadMultiplier, 0, 1);
    const action = item.action;
    if (
      !limitationId ||
      ids.has(limitationId) ||
      typeof action !== 'string' ||
      !RESTRICTION_ACTIONS.has(action as CombinedSafetyRestriction['action']) ||
      !movementPatterns ||
      maximumLoadMultiplier === null
    ) {
      return null;
    }
    ids.add(limitationId);
    restrictions.push({
      limitationId,
      action: action as CombinedSafetyRestriction['action'],
      movementPatterns,
      maximumLoadMultiplier,
    });
  }
  return restrictions;
};

const readEffectiveSet = (
  value: unknown,
  loadMultiplier: number,
  source: CombinedProposalSet | undefined,
): CombinedEffectiveStrengthSet | null => {
  if (!isRecord(value) || !source) return null;
  const sourceSetId = readString(value, 'sourceSetId');
  const exerciseId = readString(value, 'exerciseId');
  const exerciseName = readString(value, 'exerciseName');
  const proposedWeight = readNumber(value.proposedWeight, 0, 2_000);
  const maximumAllowedWeight = readNumber(value.maximumAllowedWeight, 0, 2_000);
  const effectiveWeight = readNumber(value.effectiveWeight, 0, 2_000);
  const reps = readNumber(value.reps, 1, 100);
  const targetRpe = readNumber(value.targetRpe, 6, 10);
  if (
    !sourceSetId ||
    !exerciseId ||
    !exerciseName ||
    proposedWeight === null ||
    maximumAllowedWeight === null ||
    effectiveWeight === null ||
    reps === null ||
    !Number.isSafeInteger(reps) ||
    targetRpe === null ||
    !RPE_VALUES.has(targetRpe) ||
    typeof value.safetyAdjusted !== 'boolean' ||
    sourceSetId !== source.sourceSetId ||
    exerciseId !== source.exerciseId ||
    exerciseName !== source.exerciseName ||
    proposedWeight !== source.weight ||
    reps !== source.reps ||
    targetRpe !== source.targetRpe ||
    maximumAllowedWeight !== round(proposedWeight * loadMultiplier) ||
    effectiveWeight !== Math.min(proposedWeight, maximumAllowedWeight) ||
    value.safetyAdjusted !== (effectiveWeight < proposedWeight)
  ) {
    return null;
  }
  return {
    sourceSetId,
    exerciseId,
    exerciseName,
    proposedWeight,
    maximumAllowedWeight,
    effectiveWeight,
    reps,
    targetRpe,
    safetyAdjusted: value.safetyAdjusted,
  };
};

const readEffectiveStrength = (
  value: unknown,
  strength: CombinedStrengthProposal,
  safety: CombinedSafetyProposal,
): CombinedEffectiveStrengthPlan | null => {
  if (!isRecord(value)) return null;
  const status = readStatus(value.status);
  const sourceSessionId = readNullableString(value.sourceSessionId);
  const loadMultiplier = readNumber(value.loadMultiplier, 0, 1);
  const proposedTonnage = readNullableNumber(value.proposedTonnage);
  const effectiveTonnage = readNullableNumber(value.effectiveTonnage);
  const unresolvedMovementPatterns = readStringArray(value.unresolvedMovementPatterns);
  if (
    value.policyVersion !== 'combined-effective-strength-v1' ||
    !status ||
    sourceSessionId === undefined ||
    loadMultiplier === null ||
    proposedTonnage === undefined ||
    effectiveTonnage === undefined ||
    !unresolvedMovementPatterns ||
    value.requiresExplicitConfirmation !== true ||
    value.automaticApplication !== false ||
    sourceSessionId !== strength.sourceSessionId ||
    loadMultiplier !== safety.recommendedLoadMultiplier ||
    proposedTonnage !== strength.proposedTonnage ||
    !Array.isArray(value.sets)
  ) {
    return null;
  }

  const sourceSets = new Map(strength.sets.map((set) => [set.sourceSetId, set]));
  const ids = new Set<string>();
  const sets: CombinedEffectiveStrengthSet[] = [];
  for (const item of value.sets) {
    if (!isRecord(item)) return null;
    const sourceSetId = readString(item, 'sourceSetId');
    if (!sourceSetId || ids.has(sourceSetId)) return null;
    const parsed = readEffectiveSet(item, loadMultiplier, sourceSets.get(sourceSetId));
    if (!parsed) return null;
    ids.add(sourceSetId);
    sets.push(parsed);
  }

  if (unresolvedMovementPatterns.length > 0) {
    if (status !== 'blocked' || sets.length !== 0 || effectiveTonnage !== null) return null;
  } else if (strength.sets.length > 0 && strength.sourceSessionId !== null) {
    if (sets.length !== strength.sets.length || effectiveTonnage === null) return null;
    const expectedTonnage = round(
      sets.reduce((total, set) => total + set.effectiveWeight * set.reps, 0),
    );
    if (effectiveTonnage !== expectedTonnage) return null;
  } else if (sets.length !== 0 || effectiveTonnage !== null) {
    return null;
  }

  return {
    policyVersion: 'combined-effective-strength-v1',
    status,
    sourceSessionId,
    loadMultiplier,
    sets,
    proposedTonnage,
    effectiveTonnage,
    unresolvedMovementPatterns,
    requiresExplicitConfirmation: true,
    automaticApplication: false,
  };
};

export const parseCombinedProposalV2Fields = (input: {
  review: Record<string, unknown>;
  strength: CombinedStrengthProposal;
  safetyBase: CombinedSafetyProposal;
}): { safety: CombinedSafetyProposal; effectiveStrength: CombinedEffectiveStrengthPlan } | null => {
  if (!isRecord(input.review.safety)) return null;
  const restrictions = readRestrictions(input.review.safety.restrictions);
  if (!restrictions || restrictions.length !== input.safetyBase.restrictionCount) return null;
  const safety = { ...input.safetyBase, restrictions };
  const effectiveStrength = readEffectiveStrength(
    input.review.effectiveStrength,
    input.strength,
    safety,
  );
  return effectiveStrength ? { safety, effectiveStrength } : null;
};
