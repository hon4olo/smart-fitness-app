import type { CoachRunEnvelope } from '@/api/coach';

export type NutritionReadinessIssue = {
  code: string;
  field: string;
  message: string;
};

export type NutritionAgentReadinessView =
  | {
      status: 'ready';
      ageYears: number;
      profileRevision: number;
      trackedDays: number;
    }
  | {
      status: 'needs_input';
      missingFields: string[];
      messageCode: 'nutrition_agent_profile_incomplete';
    }
  | {
      status: 'blocked';
      issues: NutritionReadinessIssue[];
      messageCode: 'nutrition_agent_context_unsupported';
    };

export type NutritionEnergyMetricsView = {
  formulaVersion: 'mifflin-st-jeor-v1';
  ageYears: number;
  weightKg: number;
  heightCm: number;
  calculationSex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high' | 'very_high';
  goal: 'maintain' | 'fat_loss' | 'muscle_gain' | 'recomposition';
  requestedWeeklyWeightChangeKg: number;
  bmrCalories: number;
  activityFactor: number;
  tdeeCalories: number;
  requestedDailyEnergyDeltaKcal: number;
  appliedDailyEnergyDeltaKcal: number;
  deltaWasClamped: boolean;
  goalAdjustedCalories: number;
  permissibleCalories: { min: number; max: number };
  proteinGrams: { min: number; max: number };
  fatGrams: { min: number; max: number };
};

export type NutritionDeterministicSummary = {
  readiness: NutritionAgentReadinessView;
  energy: NutritionEnergyMetricsView | null;
};

export type NutritionRejectionCopy = {
  title: string;
  message: string;
};

const READINESS_POLICY_VERSION = 'nutrition-agent-readiness-v1';
const ENERGY_POLICY_VERSION = 'nutrition-energy-v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readNonnegativeInteger = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = readFiniteNumber(record, key);
  return value !== null && Number.isSafeInteger(value) && value >= 0 ? value : null;
};

const readNonemptyStrings = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const strings = value.filter(
    (item): item is string => typeof item === 'string' && Boolean(item.trim()),
  );
  return strings.length === value.length ? strings : null;
};

const readIssues = (value: unknown): NutritionReadinessIssue[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: NutritionReadinessIssue[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.code !== 'string' ||
      !item.code.trim() ||
      typeof item.field !== 'string' ||
      !item.field.trim() ||
      typeof item.message !== 'string' ||
      !item.message.trim()
    ) {
      return null;
    }
    issues.push({
      code: item.code,
      field: item.field,
      message: item.message,
    });
  }
  return issues;
};

const readReadiness = (value: unknown): NutritionAgentReadinessView | null => {
  if (!isRecord(value) || value.policyVersion !== READINESS_POLICY_VERSION) return null;

  if (value.status === 'ready') {
    const ageYears = readNonnegativeInteger(value, 'ageYears');
    const profileRevision = readNonnegativeInteger(value, 'profileRevision');
    const trackedDays = readNonnegativeInteger(value, 'trackedDays');
    if (
      ageYears === null ||
      ageYears < 18 ||
      ageYears > 100 ||
      profileRevision === null ||
      trackedDays === null
    ) {
      return null;
    }
    return { status: 'ready', ageYears, profileRevision, trackedDays };
  }

  if (
    value.status === 'needs_input' &&
    value.messageCode === 'nutrition_agent_profile_incomplete'
  ) {
    const missingFields = readNonemptyStrings(value.missingFields);
    return missingFields
      ? { status: 'needs_input', missingFields, messageCode: value.messageCode }
      : null;
  }

  if (
    value.status === 'blocked' &&
    value.messageCode === 'nutrition_agent_context_unsupported'
  ) {
    const issues = readIssues(value.issues);
    return issues ? { status: 'blocked', issues, messageCode: value.messageCode } : null;
  }

  return null;
};

const readRange = (value: unknown): { min: number; max: number } | null => {
  if (!isRecord(value)) return null;
  const min = readFiniteNumber(value, 'min');
  const max = readFiniteNumber(value, 'max');
  return min !== null && max !== null && min >= 0 && max >= min ? { min, max } : null;
};

const readEnergy = (value: unknown): NutritionEnergyMetricsView | null => {
  if (
    !isRecord(value) ||
    value.policyVersion !== ENERGY_POLICY_VERSION ||
    value.formulaVersion !== 'mifflin-st-jeor-v1' ||
    !isRecord(value.inputs)
  ) {
    return null;
  }

  const ageYears = readNonnegativeInteger(value.inputs, 'ageYears');
  const weightKg = readFiniteNumber(value.inputs, 'weightKg');
  const heightCm = readFiniteNumber(value.inputs, 'heightCm');
  const requestedWeeklyWeightChangeKg = readFiniteNumber(
    value.inputs,
    'requestedWeeklyWeightChangeKg',
  );
  const bmrCalories = readFiniteNumber(value, 'bmrCalories');
  const activityFactor = readFiniteNumber(value, 'activityFactor');
  const tdeeCalories = readFiniteNumber(value, 'tdeeCalories');
  const requestedDailyEnergyDeltaKcal = readFiniteNumber(
    value,
    'requestedDailyEnergyDeltaKcal',
  );
  const appliedDailyEnergyDeltaKcal = readFiniteNumber(
    value,
    'appliedDailyEnergyDeltaKcal',
  );
  const goalAdjustedCalories = readFiniteNumber(value, 'goalAdjustedCalories');
  const permissibleCalories = readRange(value.permissibleCalories);
  const proteinGrams = readRange(value.proteinGrams);
  const fatGrams = readRange(value.fatGrams);
  const calculationSex = value.inputs.calculationSex;
  const activityLevel = value.inputs.activityLevel;
  const goal = value.inputs.goal;

  if (
    ageYears === null ||
    ageYears < 18 ||
    ageYears > 100 ||
    weightKg === null ||
    weightKg <= 0 ||
    heightCm === null ||
    heightCm < 50 ||
    heightCm > 300 ||
    requestedWeeklyWeightChangeKg === null ||
    bmrCalories === null ||
    bmrCalories <= 0 ||
    activityFactor === null ||
    activityFactor <= 0 ||
    tdeeCalories === null ||
    tdeeCalories <= 0 ||
    requestedDailyEnergyDeltaKcal === null ||
    appliedDailyEnergyDeltaKcal === null ||
    typeof value.deltaWasClamped !== 'boolean' ||
    goalAdjustedCalories === null ||
    goalAdjustedCalories <= 0 ||
    !permissibleCalories ||
    !proteinGrams ||
    !fatGrams ||
    (calculationSex !== 'male' && calculationSex !== 'female') ||
    (activityLevel !== 'sedentary' &&
      activityLevel !== 'light' &&
      activityLevel !== 'moderate' &&
      activityLevel !== 'high' &&
      activityLevel !== 'very_high') ||
    (goal !== 'maintain' &&
      goal !== 'fat_loss' &&
      goal !== 'muscle_gain' &&
      goal !== 'recomposition')
  ) {
    return null;
  }

  return {
    formulaVersion: 'mifflin-st-jeor-v1',
    ageYears,
    weightKg,
    heightCm,
    calculationSex,
    activityLevel,
    goal,
    requestedWeeklyWeightChangeKg,
    bmrCalories,
    activityFactor,
    tdeeCalories,
    requestedDailyEnergyDeltaKcal,
    appliedDailyEnergyDeltaKcal,
    deltaWasClamped: value.deltaWasClamped,
    goalAdjustedCalories,
    permissibleCalories,
    proteinGrams,
    fatGrams,
  };
};

export const readNutritionDeterministicSummary = (
  envelope: CoachRunEnvelope,
): NutritionDeterministicSummary | null => {
  const { run } = envelope;
  if (run.domain !== 'nutrition' || !isRecord(run.result)) return null;

  const readiness = readReadiness(run.result.agentReadiness);
  if (!readiness) return null;

  if (readiness.status === 'ready') {
    const energy = readEnergy(run.result.energyMetrics);
    if (!energy || energy.ageYears !== readiness.ageYears) return null;
    return { readiness, energy };
  }

  return run.result.energyMetrics === null ? { readiness, energy: null } : null;
};

export const getNutritionRejectionCopy = (reason: string): NutritionRejectionCopy => {
  if (reason === 'nutrition_target_unavailable') {
    return {
      title: 'Active nutrition target required',
      message: 'Create and synchronize an active nutrition target before requesting a proposal.',
    };
  }
  if (reason === 'nutrition_target_unreconcilable') {
    return {
      title: 'Current target is mathematically inconsistent',
      message:
        'The current calorie and macro values cannot be reconciled safely without making a macro negative. Edit the target manually, synchronize it, and generate a new proposal.',
    };
  }
  if (reason === 'nutrition_model_provider_unavailable') {
    return {
      title: 'AI strategy is unavailable',
      message: 'AI strategy is not enabled on this backend.',
    };
  }
  if (reason === 'nutrition_agent_needs_input') {
    return {
      title: 'Coach profile needs input',
      message:
        'Complete the Coach profile and synchronize the missing data before requesting an AI strategy.',
    };
  }
  if (reason === 'nutrition_agent_context_blocked') {
    return {
      title: 'AI strategy is blocked for this context',
      message:
        'The deterministic readiness policy does not support the current profile or nutrition context.',
    };
  }
  if (reason === 'nutrition_strategy_invalid_after_retries') {
    return {
      title: 'Strategy failed deterministic validation',
      message: 'The model did not produce a valid bounded proposal after three attempts.',
    };
  }
  if (reason === 'insufficient_logged_days') {
    return {
      title: 'More logged days are required',
      message: 'At least three tracked days are required for a stable deterministic review.',
    };
  }
  return {
    title: 'Nutrition run rejected',
    message: 'The deterministic pipeline rejected this run with a typed policy reason.',
  };
};
