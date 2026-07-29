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

export type NutritionAppliedChangeSummary = {
  schemaVersion: 1;
  kind: 'nutrition_targets';
  before: NutritionAppliedTargetValues;
  after: NutritionAppliedTargetValues;
  rationaleCodes: NutritionAppliedRationaleCode[];
  policyReferences: string[];
};

export type CoachNutritionAppliedChange = {
  applicationKey: string;
  summary: NutritionAppliedChangeSummary;
};

const RATIONALE_CODES = new Set<NutritionAppliedRationaleCode>([
  'already_consistent',
  'macro_calorie_mismatch',
  'goal_alignment',
  'energy_balance_trend',
  'macro_distribution',
  'adherence_pattern',
  'training_support',
  'recovery_support',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readTarget = (
  value: unknown,
  field: string,
): NutritionAppliedTargetValues => {
  if (!isRecord(value)) {
    throw new Error(`Invalid Nutrition applied change summary: ${field}`);
  }
  const readInteger = (key: keyof NutritionAppliedTargetValues, positive: boolean) => {
    const candidate = value[key];
    if (
      typeof candidate !== 'number' ||
      !Number.isSafeInteger(candidate) ||
      (positive ? candidate <= 0 : candidate < 0)
    ) {
      throw new Error(`Invalid Nutrition applied change summary: ${field}.${key}`);
    }
    return candidate;
  };
  return {
    calories: readInteger('calories', true),
    protein: readInteger('protein', false),
    carbs: readInteger('carbs', false),
    fats: readInteger('fats', false),
  };
};

const readBoundedStrings = (
  value: unknown,
  field: string,
  maximumLength: number,
): string[] => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw new Error(`Invalid Nutrition applied change summary: ${field}`);
  }
  const result = value.map((item) => {
    if (
      typeof item !== 'string' ||
      !item.trim() ||
      item.trim().length > maximumLength
    ) {
      throw new Error(`Invalid Nutrition applied change summary: ${field}`);
    }
    return item.trim();
  });
  if (new Set(result).size !== result.length) {
    throw new Error(`Invalid Nutrition applied change summary: duplicate ${field}`);
  }
  return result;
};

const parseSummary = (value: unknown): NutritionAppliedChangeSummary => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.kind !== 'nutrition_targets'
  ) {
    throw new Error('Invalid Nutrition applied change summary: contract');
  }

  const rationaleCodes = readBoundedStrings(
    value.rationaleCodes,
    'rationale codes',
    40,
  );
  if (
    !rationaleCodes.every((code) =>
      RATIONALE_CODES.has(code as NutritionAppliedRationaleCode),
    )
  ) {
    throw new Error('Invalid Nutrition applied change summary: rationale code');
  }

  return {
    schemaVersion: 1,
    kind: 'nutrition_targets',
    before: readTarget(value.before, 'before'),
    after: readTarget(value.after, 'after'),
    rationaleCodes: rationaleCodes as NutritionAppliedRationaleCode[],
    policyReferences: readBoundedStrings(
      value.policyReferences,
      'policy references',
      80,
    ),
  };
};

const readApplicationKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) {
    throw new Error('Invalid Nutrition applied change summary: application key');
  }
  return trimmed;
};

export const parseCoachNutritionAppliedChanges = (
  result: unknown,
): CoachNutritionAppliedChange[] => {
  if (result === null || result === undefined) return [];
  if (!isRecord(result)) {
    throw new Error('Invalid Nutrition applied change summary result');
  }

  const parsed: CoachNutritionAppliedChange[] = [];
  if (result.changeSummary !== undefined) {
    parsed.push({
      applicationKey: 'proposal',
      summary: parseSummary(result.changeSummary),
    });
  }

  if (result.applications !== undefined) {
    if (!isRecord(result.applications)) {
      throw new Error('Invalid Nutrition applied change summary applications');
    }
    for (const [applicationKey, application] of Object.entries(
      result.applications,
    ).sort(([left], [right]) => left.localeCompare(right))) {
      if (!isRecord(application) || application.changeSummary === undefined) {
        continue;
      }
      parsed.push({
        applicationKey: readApplicationKey(applicationKey),
        summary: parseSummary(application.changeSummary),
      });
    }
  }

  return parsed;
};
