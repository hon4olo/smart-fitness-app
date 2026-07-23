import type { RecoveryCheckIn, UserLimitation } from '@/types';

export const SAFETY_RECOVERY_FRESH_CHECK_IN_HOURS = 72;

export type SafetyRecoveryLocalReadiness =
  | 'missing_check_in'
  | 'stale_check_in'
  | 'insufficient_signals'
  | 'ready';

export type SafetyRecoveryLocalSummary = {
  readiness: SafetyRecoveryLocalReadiness;
  reviewReady: boolean;
  latestCheckInId: string | null;
  latestCheckInAt: string | null;
  latestCheckInAgeHours: number | null;
  latestSignalCount: number;
  activeLimitationCount: number;
  resolvedLimitationCount: number;
};

const countSignals = (checkIn: RecoveryCheckIn): number =>
  [
    checkIn.sleepDurationHours,
    checkIn.sleepQuality,
    checkIn.fatigue,
    checkIn.soreness,
    checkIn.stress,
    checkIn.painInterference,
    checkIn.readiness,
  ].filter((value) => value !== null).length;

export const buildSafetyRecoveryLocalSummary = (input: {
  recoveryCheckIns: RecoveryCheckIn[];
  userLimitations: UserLimitation[];
  now?: string;
}): SafetyRecoveryLocalSummary => {
  const now = new Date(input.now ?? new Date().toISOString());
  const nowMs = Number.isFinite(now.getTime()) ? now.getTime() : Date.now();
  const latest = [...input.recoveryCheckIns]
    .filter((checkIn) => Number.isFinite(Date.parse(checkIn.recordedAt)))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0] ?? null;
  const latestAtMs = latest ? Date.parse(latest.recordedAt) : null;
  const latestCheckInAgeHours =
    latestAtMs === null
      ? null
      : Math.round((Math.max(0, nowMs - latestAtMs) / 3_600_000) * 100) / 100;
  const latestSignalCount = latest ? countSignals(latest) : 0;
  const readiness: SafetyRecoveryLocalReadiness = !latest
    ? 'missing_check_in'
    : latestCheckInAgeHours !== null &&
        latestCheckInAgeHours > SAFETY_RECOVERY_FRESH_CHECK_IN_HOURS
      ? 'stale_check_in'
      : latestSignalCount < 2
        ? 'insufficient_signals'
        : 'ready';
  const activeLimitationCount = input.userLimitations.filter(
    (limitation) => limitation.status === 'active',
  ).length;

  return {
    readiness,
    reviewReady: readiness === 'ready',
    latestCheckInId: latest?.id ?? null,
    latestCheckInAt: latest?.recordedAt ?? null,
    latestCheckInAgeHours,
    latestSignalCount,
    activeLimitationCount,
    resolvedLimitationCount: input.userLimitations.length - activeLimitationCount,
  };
};
