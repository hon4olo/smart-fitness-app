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
  UserLimitationTrainingImpact,
} from '@/types';

export type RecoveryCheckInFormInput = {
  sleepDurationHours: string;
  fatigue: RecoveryScaleOneToFive;
  soreness: RecoveryScaleZeroToFive;
  readiness: RecoveryScaleOneToFive;
};

export type UserLimitationFormInput = {
  kind: UserLimitationKind;
  bodyRegion: UserLimitationBodyRegion;
  side: UserLimitationSide;
  severity: UserLimitationSeverity;
  trainingImpact: UserLimitationTrainingImpact;
  movementPatterns: UserLimitationMovementPattern[];
};

export type FormResult<Value> =
  | { ok: true; value: Value }
  | { ok: false; error: string };

export const createRecoveryCheckInFromForm = (input: {
  id: string;
  now: string;
  form: RecoveryCheckInFormInput;
}): FormResult<RecoveryCheckIn> => {
  const sleepText = input.form.sleepDurationHours.trim();
  const sleepDurationHours = sleepText ? Number(sleepText) : null;
  if (
    sleepDurationHours !== null &&
    (!Number.isFinite(sleepDurationHours) ||
      sleepDurationHours < 0 ||
      sleepDurationHours > 24)
  ) {
    return { ok: false, error: 'Sleep duration must be between 0 and 24 hours.' };
  }

  const checkIn: RecoveryCheckIn = {
    id: input.id,
    recordedAt: input.now,
    sleepDurationHours,
    sleepQuality: null,
    fatigue: input.form.fatigue,
    soreness: input.form.soreness,
    stress: null,
    painInterference: null,
    readiness: input.form.readiness,
    createdAt: input.now,
    updatedAt: input.now,
  };
  return { ok: true, value: checkIn };
};

export const createUserLimitationFromForm = (input: {
  id: string;
  now: string;
  form: UserLimitationFormInput;
}): FormResult<UserLimitation> => {
  const movementPatterns = [...new Set(input.form.movementPatterns)].sort();
  if (
    input.form.trainingImpact === 'avoid_movement' &&
    movementPatterns.length === 0
  ) {
    return {
      ok: false,
      error: 'Choose at least one movement pattern for Avoid movement.',
    };
  }

  const limitation: UserLimitation = {
    id: input.id,
    kind: input.form.kind,
    bodyRegion: input.form.bodyRegion,
    side: input.form.side,
    severity: input.form.severity,
    status: 'active',
    trainingImpact: input.form.trainingImpact,
    movementPatterns,
    onsetDate: null,
    resolvedDate: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
  return { ok: true, value: limitation };
};
