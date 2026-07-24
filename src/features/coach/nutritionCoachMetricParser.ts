import type {
  NutritionCoachMetricSummary,
  NutritionDailyMetric,
  NutritionMetricTotals,
} from './nutritionCoachViewModelTypes';

const COMPLETENESS_STATUSES = new Set(['insufficient', 'partial', 'complete']);

export const isNutritionCoachRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readNutritionFiniteNumber = (
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
  const value = readNutritionFiniteNumber(record, key);
  return value !== null && value >= 0 ? value : null;
};

export const readNutritionBoolean = (
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
  if (value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

export const readNutritionMetricTotals = (
  value: unknown,
): NutritionMetricTotals | null => {
  if (!isNutritionCoachRecord(value)) return null;
  const calories = readNutritionFiniteNumber(value, 'calories');
  const protein = readNutritionFiniteNumber(value, 'protein');
  const carbs = readNutritionFiniteNumber(value, 'carbs');
  const fats = readNutritionFiniteNumber(value, 'fats');
  if (calories === null || protein === null || carbs === null || fats === null) {
    return null;
  }
  return { calories, protein, carbs, fats };
};

const readPeriod = (
  value: unknown,
): NutritionCoachMetricSummary['period'] | null => {
  if (!isNutritionCoachRecord(value)) return null;
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
  if (!isNutritionCoachRecord(value)) return null;
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
  if (!Array.isArray(value)) return null;
  const days: NutritionDailyMetric[] = [];
  for (const item of value) {
    if (!isNutritionCoachRecord(item)) return null;
    const entryCount = readNonnegativeNumber(item, 'entryCount');
    const totals = readNutritionMetricTotals(item.totals);
    const tracked = readNutritionBoolean(item, 'tracked');
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
  if (value === null) return null;
  if (!isNutritionCoachRecord(value)) return undefined;
  const target = readNutritionMetricTotals(value.target);
  const averageCalendarDayDelta = readNutritionMetricTotals(
    value.averageCalendarDayDelta,
  );
  const averageTrackedDayDelta =
    value.averageTrackedDayDelta === null
      ? null
      : readNutritionMetricTotals(value.averageTrackedDayDelta);
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
    (averageTrackedDayDelta === null && value.averageTrackedDayDelta !== null) ||
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
  if (value === null) return null;
  if (!isNutritionCoachRecord(value)) return undefined;
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

export const readNutritionCoachMetrics = (
  value: unknown,
): NutritionCoachMetricSummary | null => {
  if (!isNutritionCoachRecord(value) || !isNutritionCoachRecord(value.averages)) {
    return null;
  }
  const period = readPeriod(value.period);
  const completeness = readCompleteness(value.dataCompleteness);
  const perCalendarDay = readNutritionMetricTotals(value.averages.perCalendarDay);
  const perTrackedDay =
    value.averages.perTrackedDay === null
      ? null
      : readNutritionMetricTotals(value.averages.perTrackedDay);
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
