import type {
  RecoveryCheckIn,
  RecoveryScaleOneToFive,
  RecoveryScaleZeroToFive,
} from '@/types';

export type RecoveryCheckInDraft = {
  sleepDurationHours: string;
  sleepQuality: RecoveryScaleOneToFive | null;
  fatigue: RecoveryScaleOneToFive | null;
  soreness: RecoveryScaleZeroToFive | null;
  stress: RecoveryScaleOneToFive | null;
  painInterference: RecoveryScaleZeroToFive | null;
  readiness: RecoveryScaleOneToFive | null;
};

export type RecoveryCheckInFormResult =
  | { ok: true; checkIn: RecoveryCheckIn; signalCount: number }
  | { ok: false; message: string };

export const emptyRecoveryCheckInDraft = (): RecoveryCheckInDraft => ({
  sleepDurationHours: '',
  sleepQuality: null,
  fatigue: null,
  soreness: null,
  stress: null,
  painInterference: null,
  readiness: null,
});

export const buildRecoveryCheckIn = (input: {
  draft: RecoveryCheckInDraft;
  id: string;
  now: string;
}): RecoveryCheckInFormResult => {
  const trimmedSleep = input.draft.sleepDurationHours.trim().replace(',', '.');
  const parsedSleep = trimmedSleep ? Number(trimmedSleep) : null;
  if (
    parsedSleep !== null &&
    (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24)
  ) {
    return { ok: false, message: 'Sleep duration must be between 0 and 24 hours.' };
  }

  const signals = [
    parsedSleep,
    input.draft.sleepQuality,
    input.draft.fatigue,
    input.draft.soreness,
    input.draft.stress,
    input.draft.painInterference,
    input.draft.readiness,
  ];
  const signalCount = signals.filter((value) => value !== null).length;
  if (signalCount < 2) {
    return { ok: false, message: 'Add at least two recovery signals before saving.' };
  }

  const timestamp = new Date(input.now);
  if (!Number.isFinite(timestamp.getTime())) {
    return { ok: false, message: 'The check-in timestamp is invalid.' };
  }
  const now = timestamp.toISOString();

  return {
    ok: true,
    signalCount,
    checkIn: {
      id: input.id,
      recordedAt: now,
      sleepDurationHours:
        parsedSleep === null ? null : Math.round(parsedSleep * 100) / 100,
      sleepQuality: input.draft.sleepQuality,
      fatigue: input.draft.fatigue,
      soreness: input.draft.soreness,
      stress: input.draft.stress,
      painInterference: input.draft.painInterference,
      readiness: input.draft.readiness,
      createdAt: now,
      updatedAt: now,
    },
  };
};
