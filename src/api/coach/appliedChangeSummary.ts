export type NutritionAppliedTargetValues = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type NutritionAppliedRationaleCode =
  | 'already_consistent'
  | 'macro_calorie_mismatch'
  | 'goal_alignment'
  | 'energy_balance_trend'
  | 'macro_distribution'
  | 'adherence_pattern'
  | 'training_support'
  | 'recovery_support';

export type StrengthSetRationaleCode =
  | 'high_recorded_rpe'
  | 'low_recorded_rpe'
  | 'stable_performance'
  | 'volume_policy'
  | 'limited_rpe_data';

export type StrengthRationaleCode =
  | 'primary_session_continuity'
  | 'rpe_guided_progression'
  | 'volume_guardrail_applied'
  | 'limited_history';

export type StrengthCaveatCode =
  | 'requires_confirmation'
  | 'limitations_not_available'
  | 'equipment_not_verified'
  | 'rpe_data_incomplete';

export type NutritionAppliedChangeSummary = {
  schemaVersion: 1;
  kind: 'nutrition_targets';
  before: NutritionAppliedTargetValues;
  after: NutritionAppliedTargetValues;
  rationaleCodes: NutritionAppliedRationaleCode[];
  policyReferences: string[];
};

export type StrengthAppliedSet = {
  exerciseName: string;
  before: { weight: number; reps: number; actualRpe: number | null };
  after: { weight: number; reps: number; targetRpe: number };
  adjustment: 'decrease' | 'maintain' | 'increase';
  rationaleCode: StrengthSetRationaleCode;
};

export type StrengthAppliedChangeSummary = {
  schemaVersion: 1;
  kind: 'strength_template';
  strategy: 'deload' | 'maintain' | 'progress';
  sourceSessionRevision: number | null;
  sets: StrengthAppliedSet[];
  rationaleCodes: StrengthRationaleCode[];
  caveatCodes: StrengthCaveatCode[];
  policyReferences: string[];
};

export type CombinedStrengthAppliedSet = {
  exerciseName: string;
  before: { weight: number; reps: number; actualRpe: number | null };
  after: {
    proposedWeight: number;
    maximumAllowedWeight: number;
    effectiveWeight: number;
    reps: number;
    targetRpe: number;
  };
  safetyAdjusted: boolean;
  rationaleCode:
    | 'strength_proposal_preserved'
    | 'safety_load_ceiling_applied';
};

export type CombinedStrengthAppliedChangeSummary = {
  schemaVersion: 1;
  kind: 'combined_strength_template';
  sourceSessionRevision: number | null;
  status: 'ready' | 'modify';
  loadMultiplier: number;
  sets: CombinedStrengthAppliedSet[];
  policyReferences: string[];
};

export type CoachAppliedChangeSummary =
  | NutritionAppliedChangeSummary
  | StrengthAppliedChangeSummary
  | CombinedStrengthAppliedChangeSummary;

export type CoachAppliedChange = {
  applicationKey: string;
  summary: CoachAppliedChangeSummary;
};

const NUTRITION_RATIONALE = new Set<NutritionAppliedRationaleCode>([
  'already_consistent',
  'macro_calorie_mismatch',
  'goal_alignment',
  'energy_balance_trend',
  'macro_distribution',
  'adherence_pattern',
  'training_support',
  'recovery_support',
]);
const STRENGTH_SET_RATIONALE = new Set<StrengthSetRationaleCode>([
  'high_recorded_rpe',
  'low_recorded_rpe',
  'stable_performance',
  'volume_policy',
  'limited_rpe_data',
]);
const STRENGTH_RATIONALE = new Set<StrengthRationaleCode>([
  'primary_session_continuity',
  'rpe_guided_progression',
  'volume_guardrail_applied',
  'limited_history',
]);
const STRENGTH_CAVEATS = new Set<StrengthCaveatCode>([
  'requires_confirmation',
  'limitations_not_available',
  'equipment_not_verified',
  'rpe_data_incomplete',
]);
const STRATEGIES = new Set(['deload', 'maintain', 'progress']);
const ADJUSTMENTS = new Set(['decrease', 'maintain', 'increase']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const fail = (field: string): never => {
  throw new Error(`Invalid Coach applied change summary: ${field}`);
};

const readString = (value: unknown, field: string, max = 200): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    return fail(field);
  }
  return value.trim();
};

const readNumber = (
  value: unknown,
  field: string,
  options: { integer?: boolean; positive?: boolean; max?: number } = {},
): number => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (options.integer && !Number.isSafeInteger(value)) ||
    (options.positive ? value <= 0 : value < 0) ||
    value > (options.max ?? Number.MAX_SAFE_INTEGER)
  ) {
    return fail(field);
  }
  return value;
};

const readRevision = (value: unknown): number | null =>
  value === null
    ? null
    : readNumber(value, 'source revision', { integer: true });

const readRpe = (value: unknown, field: string): number => {
  const rpe = readNumber(value, field, { positive: true, max: 10 });
  if (rpe < 6 || !Number.isInteger(rpe * 2)) return fail(field);
  return rpe;
};

const readNullableRpe = (value: unknown, field: string): number | null =>
  value === null ? null : readRpe(value, field);

const readStringArray = (
  value: unknown,
  field: string,
  allowed?: ReadonlySet<string>,
  exactLength?: number,
): string[] => {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 8 ||
    (exactLength !== undefined && value.length !== exactLength)
  ) {
    return fail(field);
  }
  const items = value.map((item) => readString(item, field, 80));
  if (new Set(items).size !== items.length) return fail(`duplicate ${field}`);
  if (allowed && !items.every((item) => allowed.has(item))) return fail(field);
  return items;
};

const readNutritionTarget = (
  value: unknown,
  field: string,
): NutritionAppliedTargetValues => {
  if (!isRecord(value)) return fail(field);
  return {
    calories: readNumber(value.calories, `${field}.calories`, {
      integer: true,
      positive: true,
    }),
    protein: readNumber(value.protein, `${field}.protein`, { integer: true }),
    carbs: readNumber(value.carbs, `${field}.carbs`, { integer: true }),
    fats: readNumber(value.fats, `${field}.fats`, { integer: true }),
  };
};

const readBaseSet = (value: unknown, field: string) => {
  if (!isRecord(value)) return fail(field);
  return {
    exerciseName: readString(value.exerciseName, `${field}.exerciseName`),
    before: isRecord(value.before)
      ? {
          weight: readNumber(value.before.weight, `${field}.before.weight`, {
            max: 2_000,
          }),
          reps: readNumber(value.before.reps, `${field}.before.reps`, {
            integer: true,
            positive: true,
            max: 100,
          }),
          actualRpe: readNullableRpe(
            value.before.actualRpe,
            `${field}.before.actualRpe`,
          ),
        }
      : fail(`${field}.before`),
  };
};

const parseNutrition = (value: Record<string, unknown>): NutritionAppliedChangeSummary => ({
  schemaVersion: 1,
  kind: 'nutrition_targets',
  before: readNutritionTarget(value.before, 'before'),
  after: readNutritionTarget(value.after, 'after'),
  rationaleCodes: readStringArray(
    value.rationaleCodes,
    'nutrition rationale codes',
    NUTRITION_RATIONALE,
  ) as NutritionAppliedRationaleCode[],
  policyReferences: readStringArray(value.policyReferences, 'policy references'),
});

const parseStrength = (value: Record<string, unknown>): StrengthAppliedChangeSummary => {
  const strategy = readString(value.strategy, 'strategy', 20);
  if (!STRATEGIES.has(strategy)) return fail('strategy');
  if (!Array.isArray(value.sets) || value.sets.length < 1 || value.sets.length > 100) {
    return fail('sets');
  }
  const sets = value.sets.map((item, index): StrengthAppliedSet => {
    const base = readBaseSet(item, `sets[${index}]`);
    if (!isRecord(item) || !isRecord(item.after)) return fail(`sets[${index}].after`);
    const adjustment = readString(item.adjustment, `sets[${index}].adjustment`, 20);
    const rationaleCode = readString(
      item.rationaleCode,
      `sets[${index}].rationaleCode`,
      40,
    );
    if (
      !ADJUSTMENTS.has(adjustment) ||
      !STRENGTH_SET_RATIONALE.has(rationaleCode as StrengthSetRationaleCode)
    ) {
      return fail(`sets[${index}] contract`);
    }
    return {
      ...base,
      after: {
        weight: readNumber(item.after.weight, `sets[${index}].after.weight`, {
          max: 2_000,
        }),
        reps: readNumber(item.after.reps, `sets[${index}].after.reps`, {
          integer: true,
          positive: true,
          max: 100,
        }),
        targetRpe: readRpe(item.after.targetRpe, `sets[${index}].after.targetRpe`),
      },
      adjustment: adjustment as StrengthAppliedSet['adjustment'],
      rationaleCode: rationaleCode as StrengthSetRationaleCode,
    };
  });
  return {
    schemaVersion: 1,
    kind: 'strength_template',
    strategy: strategy as StrengthAppliedChangeSummary['strategy'],
    sourceSessionRevision: readRevision(value.sourceSessionRevision),
    sets,
    rationaleCodes: readStringArray(
      value.rationaleCodes,
      'strength rationale codes',
      STRENGTH_RATIONALE,
    ) as StrengthRationaleCode[],
    caveatCodes: readStringArray(
      value.caveatCodes,
      'strength caveat codes',
      STRENGTH_CAVEATS,
    ) as StrengthCaveatCode[],
    policyReferences: readStringArray(value.policyReferences, 'policy references'),
  };
};

const parseCombinedStrength = (
  value: Record<string, unknown>,
): CombinedStrengthAppliedChangeSummary => {
  const status = readString(value.status, 'status', 20);
  if (status !== 'ready' && status !== 'modify') return fail('status');
  if (!Array.isArray(value.sets) || value.sets.length < 1 || value.sets.length > 100) {
    return fail('sets');
  }
  const sets = value.sets.map((item, index): CombinedStrengthAppliedSet => {
    const base = readBaseSet(item, `sets[${index}]`);
    if (!isRecord(item) || !isRecord(item.after)) return fail(`sets[${index}].after`);
    const rationaleCode = readString(
      item.rationaleCode,
      `sets[${index}].rationaleCode`,
      40,
    );
    if (
      rationaleCode !== 'strength_proposal_preserved' &&
      rationaleCode !== 'safety_load_ceiling_applied'
    ) {
      return fail(`sets[${index}].rationaleCode`);
    }
    if (typeof item.safetyAdjusted !== 'boolean') return fail(`sets[${index}].safetyAdjusted`);
    return {
      ...base,
      after: {
        proposedWeight: readNumber(
          item.after.proposedWeight,
          `sets[${index}].after.proposedWeight`,
          { max: 2_000 },
        ),
        maximumAllowedWeight: readNumber(
          item.after.maximumAllowedWeight,
          `sets[${index}].after.maximumAllowedWeight`,
          { max: 2_000 },
        ),
        effectiveWeight: readNumber(
          item.after.effectiveWeight,
          `sets[${index}].after.effectiveWeight`,
          { max: 2_000 },
        ),
        reps: readNumber(item.after.reps, `sets[${index}].after.reps`, {
          integer: true,
          positive: true,
          max: 100,
        }),
        targetRpe: readRpe(item.after.targetRpe, `sets[${index}].after.targetRpe`),
      },
      safetyAdjusted: item.safetyAdjusted,
      rationaleCode,
    };
  });
  return {
    schemaVersion: 1,
    kind: 'combined_strength_template',
    sourceSessionRevision: readRevision(value.sourceSessionRevision),
    status,
    loadMultiplier: readNumber(value.loadMultiplier, 'load multiplier', { max: 1 }),
    sets,
    policyReferences: readStringArray(value.policyReferences, 'policy references', undefined, 2),
  };
};

const parseSummary = (value: unknown): CoachAppliedChangeSummary => {
  if (!isRecord(value) || value.schemaVersion !== 1) return fail('contract');
  if (value.kind === 'nutrition_targets') return parseNutrition(value);
  if (value.kind === 'strength_template') return parseStrength(value);
  if (value.kind === 'combined_strength_template') return parseCombinedStrength(value);
  return fail('kind');
};

export const parseCoachAppliedChanges = (result: unknown): CoachAppliedChange[] => {
  if (result === null || result === undefined) return [];
  if (!isRecord(result)) return fail('result');
  const parsed: CoachAppliedChange[] = [];
  if (result.changeSummary !== undefined) {
    parsed.push({ applicationKey: 'proposal', summary: parseSummary(result.changeSummary) });
  }
  if (result.applications !== undefined) {
    if (!isRecord(result.applications)) return fail('applications');
    for (const [applicationKey, application] of Object.entries(result.applications).sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      if (!isRecord(application) || application.changeSummary === undefined) continue;
      parsed.push({
        applicationKey: readString(applicationKey, 'application key', 80),
        summary: parseSummary(application.changeSummary),
      });
    }
  }
  return parsed;
};
