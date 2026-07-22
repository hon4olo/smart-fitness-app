import type { CoachRunEnvelope } from '@/api/coach';

export type NutritionMetricTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type NutritionDailyMetric = {
  date: string;
  entryCount: number;
  tracked: boolean;
  totals: NutritionMetricTotals;
  caloriesWithinTenPercent: boolean | null;
};

export type NutritionCoachMetricSummary = {
  period: {
    lookbackDays: number;
    startDate: string;
    endDate: string;
  };
  completeness: {
    entryCount: number;
    trackedDays: number;
    missingDays: number;
    coveragePercent: number;
    status: 'insufficient' | 'partial' | 'complete';
  };
  averages: {
    perCalendarDay: NutritionMetricTotals;
    perTrackedDay: NutritionMetricTotals | null;
  };
  targetComparison: {
    target: NutritionMetricTotals;
    averageCalendarDayDelta: NutritionMetricTotals;
    averageTrackedDayDelta: NutritionMetricTotals | null;
    daysWithinCaloriesTenPercent: number;
    trackedDayAdherencePercent: number | null;
  } | null;
  proteinPerKg: {
    weightKg: number;
    averageCalendarDay: number;
    averageTrackedDay: number | null;
  } | null;
  days: NutritionDailyMetric[];
};

export type NutritionCoachViewModel =
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
      kind: 'rejected';
      title: string;
      message: string;
      reason: string;
      metrics: NutritionCoachMetricSummary | null;
    }
  | {
      kind: 'review';
      title: string;
      message: string;
      targetAvailable: boolean;
      latestWeightAvailable: boolean;
      metrics: NutritionCoachMetricSummary;
    };

const COMPLETENESS_STATUSES = new Set(['insufficient', 'partial', 'complete']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readNonnegativeNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = readFiniteNumber(record, key);
  return value !== null && value >= 0 ? value : null;
};

const readBoolean = (
  record: Record<string, unknown>,
  key: string,
): boolean | null => {
  const value = record[key];
  return typeof value === 'boolean' ? value : null;
};

const readNullableFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null | undefined => {
  const value = record[key];
  if (value === null) {
    return null;
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const readTotals = (value: unknown): NutritionMetricTotals | null => {
  if (!isRecord(value)) {
    return null;
  }
  const calories = readFiniteNumber(value, 'calories');
  const protein = readFiniteNumber(value, 'protein');
  const carbs = readFiniteNumber(value, 'carbs');
  const fats = readFiniteNumber(value, 'fats');
  if (calories === null || protein === null || carbs === null || fats === null) {
    return null;
  }
  return { calories, protein, carbs, fats };
};

const readPeriod = (value: unknown): NutritionCoachMetricSummary['period'] | null => {
  if (!isRecord(value)) {
    return null;
  }
  const lookbackDays = readNonnegativeNumber(value, 'lookbackDays');
  if (
    lookbackDays === null ||
    !Number.isInteger(lookbackDays) ||
    lookbackDays < 1 ||
    typeof value.startDate !== 'string' ||
    !value.startDate ||
    typeof value.endDate !== 'string' ||
    !value.endDate
  ) {
    return null;
  }
  return {
    lookbackDays,
    startDate: value.startDate,
    endDate: value.endDate,
  };
};

const readCompleteness = (
  value: unknown,
): NutritionCoachMetricSummary['completeness'] | null => {
  if (!isRecord(value)) {
    return null;
  }
  const entryCount = readNonnegativeNumber(value, 'entryCount');
  const trackedDays = readNonnegativeNumber(value, 'trackedDays');
  const missingDays = readNonnegativeNumber(value, 'missingDays');
  const coveragePercent = readNonnegativeNumber(value, 'coveragePercent');
  const status = value.status;
  if (
    entryCount === null ||
    trackedDays === null ||
    missingDays === null ||
    coveragePercent === null ||
    !Number.isInteger(entryCount) ||
    !Number.isInteger(trackedDays) ||
    !Number.isInteger(missingDays) ||
    coveragePercent > 100 ||
    typeof status !== 'string' ||
    !COMPLETENESS_STATUSES.has(status)
  ) {
    return null;
  }
  return {
    entryCount,
    trackedDays,
    missingDays,
    coveragePercent,
    status: status as NutritionCoachMetricSummary['completeness']['status'],
  };
};

const readDailyMetrics = (value: unknown): NutritionDailyMetric[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const days: NutritionDailyMetric[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }
    const entryCount = readNonnegativeNumber(item, 'entryCount');
    const totals = readTotals(item.totals);
    const tracked = readBoolean(item, 'tracked');
    const adherence = item.caloriesWithinTenPercent;
    if (
      typeof item.date !== 'string' ||
      !item.date ||
      entryCount === null ||
      !Number.isInteger(entryCount) ||
      tracked === null ||
      !totals ||
      (adherence !== null && typeof adherence !== 'boolean')
    ) {
      return null;
    }
    days.push({
      date: item.date,
      entryCount,
      tracked,
      totals,
      caloriesWithinTenPercent: adherence,
    });
  }
  return days;
};

const readTargetComparison = (
  value: unknown,
): NutritionCoachMetricSummary['targetComparison'] | undefined => {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  const target = readTotals(value.target);
  const averageCalendarDayDelta = readTotals(value.averageCalendarDayDelta);
  const averageTrackedDayDelta =
    value.averageTrackedDayDelta === null
      ? null
      : readTotals(value.averageTrackedDayDelta);
  const daysWithinCaloriesTenPercent = readNonnegativeNumber(
    value,
    'daysWithinCaloriesTenPercent',
  );
  const trackedDayAdherencePercent = readNullableFiniteNumber(
    value,
    'trackedDayAdherencePercent',
  );
  if (
    !target ||
    !averageCalendarDayDelta ||
    averageTrackedDayDelta === null && value.averageTrackedDayDelta !== null ||
    daysWithinCaloriesTenPercent === null ||
    !Number.isInteger(daysWithinCaloriesTenPercent) ||
    trackedDayAdherencePercent === undefined ||
    (trackedDayAdherencePercent !== null &&
      (trackedDayAdherencePercent < 0 || trackedDayAdherencePercent > 100))
  ) {
    return undefined;
  }
  return {
    target,
    averageCalendarDayDelta,
    averageTrackedDayDelta,
    daysWithinCaloriesTenPercent,
    trackedDayAdherencePercent,
  };
};

const readProteinPerKg = (
  value: unknown,
): NutritionCoachMetricSummary['proteinPerKg'] | undefined => {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }
  const weightKg = readNonnegativeNumber(value, 'weightKg');
  const averageCalendarDay = readNonnegativeNumber(value, 'averageCalendarDay');
  const averageTrackedDay = readNullableFiniteNumber(value, 'averageTrackedDay');
  if (
    weightKg === null ||
    weightKg <= 0 ||
    averageCalendarDay === null ||
    averageTrackedDay === undefined ||
    (averageTrackedDay !== null && averageTrackedDay < 0)
  ) {
    return undefined;
  }
  return { weightKg, averageCalendarDay, averageTrackedDay };
};

const readMetrics = (value: unknown): NutritionCoachMetricSummary | null => {
  if (!isRecord(value) || !isRecord(value.averages)) {
    return null;
  }
  const period = readPeriod(value.period);
  const completeness = readCompleteness(value.dataCompleteness);
  const perCalendarDay = readTotals(value.averages.perCalendarDay);
  const perTrackedDay =
    value.averages.perTrackedDay === null
      ? null
      : readTotals(value.averages.perTrackedDay);
  const targetComparison = readTargetComparison(value.targetComparison);
  const proteinPerKg = readProteinPerKg(value.proteinPerKg);
  const days = readDailyMetrics(value.days);
  if (
    !period ||
    !completeness ||
    !perCalendarDay ||
    (perTrackedDay === null && value.averages.perTrackedDay !== null) ||
    targetComparison === undefined ||
    proteinPerKg === undefined ||
    !days ||
    days.length !== period.lookbackDays
  ) {
    return null;
  }
  return {
    period,
    completeness,
    averages: { perCalendarDay, perTrackedDay },
    targetComparison,
    proteinPerKg,
    days,
  };
};

export const buildNutritionCoachViewModel = (
  envelope: CoachRunEnvelope,
): NutritionCoachViewModel => {
  const { run } = envelope;

  if (run.domain !== 'nutrition' || run.requestType !== 'nutrition_review') {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result does not belong to Nutrition Coach.',
    };
  }

  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Nutrition analysis in progress',
      message: 'Synchronized food entries and targets are being validated and calculated.',
    };
  }

  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Nutrition analysis failed',
      message: run.error?.message ?? 'Nutrition Coach could not complete this review.',
    };
  }

  const result = run.result;
  if (!isRecord(result)) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'Nutrition Coach returned an unsupported result format.',
    };
  }

  if (run.status === 'rejected') {
    const metrics = readMetrics(result.metrics);
    return {
      kind: 'rejected',
      title: 'More logged days are required',
      message: 'The deterministic review did not have enough tracked days to form a stable summary.',
      reason:
        typeof result.reason === 'string' && result.reason
          ? result.reason
          : 'insufficient_logged_days',
      metrics,
    };
  }

  if (result.kind !== 'nutrition-review') {
    return {
      kind: 'failed',
      title: 'Unsupported result',
      message: 'This Nutrition Coach result type is not supported by the current app version.',
    };
  }

  const metrics = readMetrics(result.metrics);
  if (!metrics || typeof result.targetAvailable !== 'boolean' || typeof result.latestWeightAvailable !== 'boolean') {
    return {
      kind: 'failed',
      title: 'Invalid metrics',
      message: 'Nutrition Coach metrics could not be read safely.',
    };
  }

  return {
    kind: 'review',
    title: 'Nutrition review',
    message: 'All values were calculated deterministically from synchronized nutrition records.',
    targetAvailable: result.targetAvailable,
    latestWeightAvailable: result.latestWeightAvailable,
    metrics,
  };
};