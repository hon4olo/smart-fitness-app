export type NutritionInputCoverage = {
  domain: 'nutrition';
  available: boolean;
  lookbackDays: number | null;
  foodEntryCount: number;
  loggedDayCount: number;
  weightEntryCount: number;
  hasLatestWeight: boolean;
  hasActiveTarget: boolean;
  hasFitnessProfile: boolean;
};

export type StrengthInputCoverage = {
  domain: 'strength';
  available: boolean;
  requestedSpecificSession: boolean;
  requestedHistoryLimit: number | null;
  sessionCount: number;
  completedSetCount: number;
  distinctExerciseCount: number;
  setsWithActualRpeCount: number;
  hasLatestWeight: boolean;
};

export type SafetyRecoveryInputCoverage = {
  domain: 'safety_recovery';
  available: boolean;
  lookbackDays: number | null;
  activeLimitationCount: number;
  pauseTrainingCount: number;
  avoidMovementCount: number;
  reduceLoadCount: number;
  recoveryCheckInCount: number;
  limitationNotesPresentCount: number;
  checkInNotesPresentCount: number;
};

export type CoachInputCoverage =
  | NutritionInputCoverage
  | StrengthInputCoverage
  | SafetyRecoveryInputCoverage;

export type CoachRunInputSummary = {
  schemaVersion: 1;
  sources: CoachInputCoverage[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readBoolean = (
  record: Record<string, unknown>,
  key: string,
): boolean => {
  const value = record[key];
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid Coach input summary: ${key}`);
  }
  return value;
};

const readCount = (
  record: Record<string, unknown>,
  key: string,
  maximum = 100_000,
): number => {
  const value = record[key];
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  ) {
    throw new Error(`Invalid Coach input summary: ${key}`);
  }
  return value;
};

const readNullablePositiveInteger = (
  record: Record<string, unknown>,
  key: string,
  maximum: number,
): number | null => {
  const value = record[key];
  if (value === null) return null;
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > maximum
  ) {
    throw new Error(`Invalid Coach input summary: ${key}`);
  }
  return value;
};

const parseNutrition = (
  value: Record<string, unknown>,
): NutritionInputCoverage => ({
  domain: 'nutrition',
  available: readBoolean(value, 'available'),
  lookbackDays: readNullablePositiveInteger(value, 'lookbackDays', 31),
  foodEntryCount: readCount(value, 'foodEntryCount'),
  loggedDayCount: readCount(value, 'loggedDayCount', 31),
  weightEntryCount: readCount(value, 'weightEntryCount'),
  hasLatestWeight: readBoolean(value, 'hasLatestWeight'),
  hasActiveTarget: readBoolean(value, 'hasActiveTarget'),
  hasFitnessProfile: readBoolean(value, 'hasFitnessProfile'),
});

const parseStrength = (
  value: Record<string, unknown>,
): StrengthInputCoverage => ({
  domain: 'strength',
  available: readBoolean(value, 'available'),
  requestedSpecificSession: readBoolean(value, 'requestedSpecificSession'),
  requestedHistoryLimit: readNullablePositiveInteger(
    value,
    'requestedHistoryLimit',
    20,
  ),
  sessionCount: readCount(value, 'sessionCount'),
  completedSetCount: readCount(value, 'completedSetCount'),
  distinctExerciseCount: readCount(value, 'distinctExerciseCount'),
  setsWithActualRpeCount: readCount(value, 'setsWithActualRpeCount'),
  hasLatestWeight: readBoolean(value, 'hasLatestWeight'),
});

const parseSafetyRecovery = (
  value: Record<string, unknown>,
): SafetyRecoveryInputCoverage => ({
  domain: 'safety_recovery',
  available: readBoolean(value, 'available'),
  lookbackDays: readNullablePositiveInteger(value, 'lookbackDays', 31),
  activeLimitationCount: readCount(value, 'activeLimitationCount'),
  pauseTrainingCount: readCount(value, 'pauseTrainingCount'),
  avoidMovementCount: readCount(value, 'avoidMovementCount'),
  reduceLoadCount: readCount(value, 'reduceLoadCount'),
  recoveryCheckInCount: readCount(value, 'recoveryCheckInCount'),
  limitationNotesPresentCount: readCount(
    value,
    'limitationNotesPresentCount',
  ),
  checkInNotesPresentCount: readCount(value, 'checkInNotesPresentCount'),
});

const parseSource = (value: unknown): CoachInputCoverage => {
  if (!isRecord(value)) throw new Error('Invalid Coach input summary source');
  if (value.domain === 'nutrition') return parseNutrition(value);
  if (value.domain === 'strength') return parseStrength(value);
  if (value.domain === 'safety_recovery') return parseSafetyRecovery(value);
  throw new Error('Invalid Coach input summary domain');
};

export const parseCoachRunInputSummary = (
  value: unknown,
): CoachRunInputSummary => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.sources) ||
    value.sources.length > 3
  ) {
    throw new Error('Invalid Coach input summary');
  }
  const sources = value.sources.map(parseSource);
  const domains = sources.map((source) => source.domain);
  if (new Set(domains).size !== domains.length) {
    throw new Error('Invalid duplicate Coach input summary domain');
  }
  return { schemaVersion: 1, sources };
};
