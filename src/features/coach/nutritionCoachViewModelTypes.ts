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

export type NutritionProposalIssue = {
  code: string;
  severity: 'warning' | 'block';
  field: string;
  message: string;
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
    }
  | {
      kind: 'proposal';
      title: string;
      message: string;
      metrics: NutritionCoachMetricSummary;
      currentTargets: NutritionMetricTotals;
      proposedTargets: NutritionMetricTotals;
      changes: NutritionMetricTotals;
      changed: boolean;
      reason: 'already_consistent' | 'macro_calorie_mismatch';
      currentMacroCalories: number;
      proposedMacroCalories: number;
      calorieMathMismatchBefore: number;
      calorieMathMismatchAfter: number;
      guardrailStatus: 'valid' | 'modify' | 'blocked';
      issues: NutritionProposalIssue[];
      requiresConfirmation: true;
      applied: false;
    };
