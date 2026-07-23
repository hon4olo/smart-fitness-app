import { ensureUuid } from '@/lib/ids';
import type {
  RecoveryCheckIn,
  RecoveryScaleValue,
  RecoveryZeroToFiveValue,
  UserLimitation,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationStatus,
  UserLimitationTrainingImpact,
} from '@/types';

export const USER_LIMITATION_KINDS = [
  'injury',
  'pain',
  'mobility',
  'medical_restriction',
  'other',
] as const satisfies readonly UserLimitationKind[];

export const USER_LIMITATION_BODY_REGIONS = [
  'neck',
  'shoulder',
  'elbow',
  'wrist_hand',
  'upper_back',
  'lower_back',
  'hip',
  'knee',
  'ankle_foot',
  'chest',
  'abdomen',
  'systemic',
  'other',
] as const satisfies readonly UserLimitationBodyRegion[];

export const USER_LIMITATION_SIDES = [
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable',
] as const satisfies readonly UserLimitationSide[];

export const USER_LIMITATION_SEVERITIES = [
  'mild',
  'moderate',
  'severe',
] as const satisfies readonly UserLimitationSeverity[];

export const USER_LIMITATION_STATUSES = [
  'active',
  'resolved',
] as const satisfies readonly UserLimitationStatus[];

export const USER_LIMITATION_TRAINING_IMPACTS = [
  'monitor',
  'reduce_load',
  'avoid_movement',
  'pause_training',
] as const satisfies readonly UserLimitationTrainingImpact[];

export const USER_LIMITATION_MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'lunge',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'carry',
  'rotation',
  'locomotion',
  'impact',
  'overhead',
  'spinal_flexion',
  'spinal_extension',
  'other',
] as const satisfies readonly UserLimitationMovementPattern[];

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOneOf = <Value extends string>(
  value: unknown,
  values: readonly Value[],
): value is Value => typeof value === 'string' && values.includes(value as Value);

const normalizeTimestamp = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date(fallback).toISOString();
};

export const normalizeDateOnly = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value
    : null;
};

const normalizeNotes = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const notes = value.trim();
  return notes ? notes.slice(0, 2_000) : undefined;
};

const normalizeIntegerScale = <Value extends number>(
  value: unknown,
  minimum: number,
  maximum: number,
): Value | null =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= minimum &&
  value <= maximum
    ? (value as Value)
    : null;

const normalizeSleepDuration = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 24
    ? Math.round(value * 100) / 100
    : null;

export const normalizeUserLimitation = (
  value: unknown,
  fallbackTimestamp = new Date().toISOString(),
): UserLimitation | null => {
  if (!isRecord(value)) return null;
  if (
    !isOneOf(value.kind, USER_LIMITATION_KINDS) ||
    !isOneOf(value.bodyRegion, USER_LIMITATION_BODY_REGIONS) ||
    !isOneOf(value.side, USER_LIMITATION_SIDES) ||
    !isOneOf(value.severity, USER_LIMITATION_SEVERITIES) ||
    !isOneOf(value.status, USER_LIMITATION_STATUSES) ||
    !isOneOf(value.trainingImpact, USER_LIMITATION_TRAINING_IMPACTS)
  ) {
    return null;
  }

  const movementPatterns = Array.isArray(value.movementPatterns)
    ? [...new Set(
        value.movementPatterns.filter((pattern): pattern is UserLimitationMovementPattern =>
          isOneOf(pattern, USER_LIMITATION_MOVEMENT_PATTERNS),
        ),
      )].sort()
    : [];
  const onsetDate = normalizeDateOnly(value.onsetDate);
  const resolvedDate = normalizeDateOnly(value.resolvedDate);
  if (
    (value.status === 'active' && resolvedDate !== null) ||
    (value.status === 'resolved' && resolvedDate === null) ||
    (onsetDate !== null && resolvedDate !== null && resolvedDate < onsetDate) ||
    (value.trainingImpact === 'avoid_movement' && movementPatterns.length === 0)
  ) {
    return null;
  }

  const createdAt = normalizeTimestamp(value.createdAt, fallbackTimestamp);
  const updatedAt = normalizeTimestamp(value.updatedAt, createdAt);
  const notes = normalizeNotes(value.notes);

  return {
    id: ensureUuid(value.id),
    kind: value.kind,
    bodyRegion: value.bodyRegion,
    side: value.side,
    severity: value.severity,
    status: value.status,
    trainingImpact: value.trainingImpact,
    movementPatterns,
    onsetDate,
    resolvedDate,
    ...(notes ? { notes } : {}),
    createdAt,
    updatedAt,
  };
};

export const normalizeUserLimitations = (values: unknown): UserLimitation[] =>
  Array.isArray(values)
    ? values
        .map((value) => normalizeUserLimitation(value))
        .filter((value): value is UserLimitation => Boolean(value))
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    : [];

export const normalizeRecoveryCheckIn = (
  value: unknown,
  fallbackTimestamp = new Date().toISOString(),
): RecoveryCheckIn | null => {
  if (!isRecord(value)) return null;
  const recordedAt = normalizeTimestamp(value.recordedAt, fallbackTimestamp);
  const sleepDurationHours = normalizeSleepDuration(value.sleepDurationHours);
  const sleepQuality = normalizeIntegerScale<RecoveryScaleValue>(value.sleepQuality, 1, 5);
  const fatigue = normalizeIntegerScale<RecoveryScaleValue>(value.fatigue, 1, 5);
  const soreness = normalizeIntegerScale<RecoveryZeroToFiveValue>(value.soreness, 0, 5);
  const stress = normalizeIntegerScale<RecoveryScaleValue>(value.stress, 1, 5);
  const painInterference = normalizeIntegerScale<RecoveryZeroToFiveValue>(
    value.painInterference,
    0,
    5,
  );
  const readiness = normalizeIntegerScale<RecoveryScaleValue>(value.readiness, 1, 5);

  if (
    sleepDurationHours === null &&
    sleepQuality === null &&
    fatigue === null &&
    soreness === null &&
    stress === null &&
    painInterference === null &&
    readiness === null
  ) {
    return null;
  }

  const createdAt = normalizeTimestamp(value.createdAt, recordedAt);
  const updatedAt = normalizeTimestamp(value.updatedAt, createdAt);
  const notes = normalizeNotes(value.notes);

  return {
    id: ensureUuid(value.id),
    recordedAt,
    sleepDurationHours,
    sleepQuality,
    fatigue,
    soreness,
    stress,
    painInterference,
    readiness,
    ...(notes ? { notes } : {}),
    createdAt,
    updatedAt,
  };
};

export const normalizeRecoveryCheckIns = (values: unknown): RecoveryCheckIn[] =>
  Array.isArray(values)
    ? values
        .map((value) => normalizeRecoveryCheckIn(value))
        .filter((value): value is RecoveryCheckIn => Boolean(value))
        .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt))
    : [];

export const upsertUserLimitation = (
  values: UserLimitation[],
  limitation: UserLimitation,
): UserLimitation[] => {
  const next = values.filter((value) => value.id !== limitation.id);
  return [limitation, ...next].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
};

export const upsertRecoveryCheckIn = (
  values: RecoveryCheckIn[],
  checkIn: RecoveryCheckIn,
): RecoveryCheckIn[] => {
  const next = values.filter((value) => value.id !== checkIn.id);
  return [checkIn, ...next].sort(
    (left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt),
  );
};
