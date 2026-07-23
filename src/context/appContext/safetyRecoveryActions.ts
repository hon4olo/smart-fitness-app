import type { AppState, RecoveryCheckIn, UserLimitation } from '@/types';
import {
  normalizeRecoveryCheckIn,
  normalizeUserLimitation,
} from '@/lib/safetyRecoveryState';

export const upsertUserLimitationInState = (
  state: AppState,
  limitation: UserLimitation,
): AppState => {
  const normalized = normalizeUserLimitation(limitation);
  if (!normalized) return state;
  return {
    ...state,
    userLimitations: [
      normalized,
      ...state.userLimitations.filter((item) => item.id !== normalized.id),
    ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  };
};

export const deleteUserLimitationFromState = (
  state: AppState,
  limitationId: string,
): AppState => {
  const next = state.userLimitations.filter((item) => item.id !== limitationId);
  return next.length === state.userLimitations.length
    ? state
    : { ...state, userLimitations: next };
};

export const upsertRecoveryCheckInInState = (
  state: AppState,
  checkIn: RecoveryCheckIn,
): AppState => {
  const normalized = normalizeRecoveryCheckIn(checkIn);
  if (!normalized) return state;
  return {
    ...state,
    recoveryCheckIns: [
      normalized,
      ...state.recoveryCheckIns.filter((item) => item.id !== normalized.id),
    ].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)),
  };
};

export const deleteRecoveryCheckInFromState = (
  state: AppState,
  checkInId: string,
): AppState => {
  const next = state.recoveryCheckIns.filter((item) => item.id !== checkInId);
  return next.length === state.recoveryCheckIns.length
    ? state
    : { ...state, recoveryCheckIns: next };
};
