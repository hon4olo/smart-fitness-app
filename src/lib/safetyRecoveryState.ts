import { ensureUuid } from './ids';
import type {
  RecoveryCheckIn,
  RecoveryScaleOneToFive,
  RecoveryScaleZeroToFive,
  UserLimitation,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationStatus,
  UserLimitationTrainingImpact,
} from '@/types';

const LIMITATION_KINDS = new Set<UserLimitationKind>([
  'injury',
  'pain',
  'mobility',
  'medical_restriction',
  'other',
]);
const BODY_REGIONS = new Set<UserLimitationBodyRegion>([
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
]);
const SIDES = new Set<UserLimitationSide>([
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable',
]);
const SEVERITIES = new Set<UserLimitationSeverity>([
  'mild',
  'moderate',
  'severe',
]);
const STATUSES = new Set<UserLimitationStatus>(['active', 'resolved']);
const TRAINING_IMPACTS = new Set<UserLimitationTrainingImpact>([
  'monitor',
  'reduce_load',
  'avoid_movement',
  'pause_training',
]);
const MOVEMENT_PATTERNS = new Set<UserLimitationMovementPattern>([
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
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toIso = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
};

const toDateOnly = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value
    : null;
};

const readNotes = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 2_000) : undefined;

const readOneToFive = (value: unknown): RecoveryScaleOneToFive | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
    ? (value as RecoveryScaleOneToFive)
    : null;

const readZeroToFive = (value: unknown): RecoveryScaleZeroToFive | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5
    ? (value as RecoveryScaleZeroToFive)
    : null;

export const normalizeUserLimitation = (
  value: unknown,
): UserLimitation | null => {
  if (!isRecord(value)) return null;
  const kind = value.kind;
  const bodyRegion = value.bodyRegion;
  const side = value.side;
  const severity = value.severity;
  const status = value.status;
  const trainingImpact = value.trainingImpact;
  const createdAt = toIso(value.createdAt);
  const updatedAt = toIso(value.updatedAt) ?? createdAt;
  const onsetDate = toDateOnly(value.onsetDate);
  const resolvedDate = toDateOnly(value.resolvedDate);
  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof kind !== 'string' ||
    !LIMITATION_KINDS.has(kind as UserLimitationKind) ||
    typeof bodyRegion !== 'string' ||
    !BODY_REGIONS.has(bodyRegion as UserLimitationBodyRegion) ||
    typeof side !== 'string' ||
    !SIDES.has(side as UserLimitationSide) ||
    typeof severity !== 'string' ||
    !SEVERITIES.has(severity as UserLimitationSeverity) ||
    typeof status !== 'string' ||
    !STATUSES.has(status as UserLimitationStatus) ||
    typeof trainingImpact !== 'string' ||
    !TRAINING_IMPACTS.has(trainingImpact as UserLimitationTrainingImpact) ||
    !createdAt ||
    !updatedAt ||
    !Array.isArray(value.movementPatterns)
  ) {
    return null;
  }

  const movementPatterns = [
    ...new Set(
      value.movementPatterns.filter(
        (item): item is UserLimitationMovementPattern =>
          typeof item === 'string' &&
          MOVEMENT_PATTERNS.has(item as UserLimitationMovementPattern),
      ),
    ),
  ].sort();
  if (
    (status === 'active' && resolvedDate !== null) ||
    (status === 'resolved' && resolvedDate === null) ||
    (onsetDate !== null && resolvedDate !== null && resolvedDate < onsetDate) ||
    (trainingImpact === 'avoid_movement' && movementPatterns.length === 0)
  ) {
    return null;
  }

  return {
    id: ensureUuid(value.id),
    kind: kind as UserLimitationKind,
    bodyRegion: bodyRegion as UserLimitationBodyRegion,
    side: side as UserLimitationSide,
    severity: severity as UserLimitationSeverity,
    status: status as UserLimitationStatus,
    trainingImpact: trainingImpact as UserLimitationTrainingImpact,
    movementPatterns,
    onsetDate,
    resolvedDate,
    ...(readNotes(value.notes) ? { notes: readNotes(value.notes) } : {}),
    createdAt,
    updatedAt,
  };
};

export const normalizeRecoveryCheckIn = (
  value: unknown,
): RecoveryCheckIn | null => {
  if (!isRecord(value)) return null;
  const recordedAt = toIso(value.recordedAt);
  const createdAt = toIso(value.createdAt) ?? recordedAt;
  const updatedAt = toIso(value.updatedAt) ?? createdAt;
  const sleepDurationHours =
    value.sleepDurationHours === null || value.sleepDurationHours === undefined
      ? null
      : typeof value.sleepDurationHours === 'number' &&
          Number.isFinite(value.sleepDurationHours) &&
          value.sleepDurationHours >= 0 &&
          value.sleepDurationHours <= 24
        ? Math.round(value.sleepDurationHours * 100) / 100
        : null;
  const sleepQuality = readOneToFive(value.sleepQuality);
  const fatigue = readOneToFive(value.fatigue);
  const soreness = readZeroToFive(value.soreness);
  const stress = readOneToFive(value.stress);
  const painInterference = readZeroToFive(value.painInterference);
  const readiness = readOneToFive(value.readiness);
  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    !recordedAt ||
    !createdAt ||
    !updatedAt ||
    (sleepDurationHours === null &&
      sleepQuality === null &&
      fatigue === null &&
      soreness === null &&
      stress === null &&
      painInterference === null &&
      readiness === null)
  ) {
    return null;
  }

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
    ...(readNotes(value.notes) ? { notes: readNotes(value.notes) } : {}),
    createdAt,
    updatedAt,
  };
};

export const normalizeUserLimitations = (value: unknown): UserLimitation[] =>
  (Array.isArray(value) ? value : [])
    .map(normalizeUserLimitation)
    .filter((item): item is UserLimitation => Boolean(item))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

export const normalizeRecoveryCheckIns = (value: unknown): RecoveryCheckIn[] =>
  (Array.isArray(value) ? value : [])
    .map(normalizeRecoveryCheckIn)
    .filter((item): item is RecoveryCheckIn => Boolean(item))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
