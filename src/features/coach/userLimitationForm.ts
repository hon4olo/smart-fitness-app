import type {
  UserLimitation,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationTrainingImpact,
} from '@/types';

export type UserLimitationDraft = {
  kind: UserLimitationKind | null;
  bodyRegion: UserLimitationBodyRegion | null;
  side: UserLimitationSide | null;
  severity: UserLimitationSeverity | null;
  trainingImpact: UserLimitationTrainingImpact | null;
  movementPatterns: UserLimitationMovementPattern[];
  onsetDate: string;
};

export type UserLimitationFormResult =
  | { ok: true; limitation: UserLimitation }
  | { ok: false; message: string };

export const emptyUserLimitationDraft = (): UserLimitationDraft => ({
  kind: null,
  bodyRegion: null,
  side: null,
  severity: null,
  trainingImpact: null,
  movementPatterns: [],
  onsetDate: '',
});

const parseDateOnly = (
  value: string,
  today: string,
): string | null | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== trimmed ||
    trimmed > today ||
    trimmed < '1900-01-01'
  ) {
    return undefined;
  }
  return trimmed;
};

export const buildActiveUserLimitation = (input: {
  draft: UserLimitationDraft;
  id: string;
  now: string;
}): UserLimitationFormResult => {
  const timestamp = new Date(input.now);
  if (!Number.isFinite(timestamp.getTime())) {
    return { ok: false, message: 'The limitation timestamp is invalid.' };
  }
  const now = timestamp.toISOString();
  const today = now.slice(0, 10);
  const onsetDate = parseDateOnly(input.draft.onsetDate, today);
  if (onsetDate === undefined) {
    return { ok: false, message: 'Onset date must be a valid past or current YYYY-MM-DD date.' };
  }
  if (!input.draft.kind) {
    return { ok: false, message: 'Select a limitation type.' };
  }
  if (!input.draft.bodyRegion) {
    return { ok: false, message: 'Select a body region.' };
  }
  if (!input.draft.side) {
    return { ok: false, message: 'Select the affected side.' };
  }
  if (!input.draft.severity) {
    return { ok: false, message: 'Select a severity.' };
  }
  if (!input.draft.trainingImpact) {
    return { ok: false, message: 'Select the training impact.' };
  }

  const movementPatterns = [...new Set(input.draft.movementPatterns)].sort();
  if (input.draft.trainingImpact === 'avoid_movement' && movementPatterns.length === 0) {
    return {
      ok: false,
      message: 'Select at least one movement pattern to avoid.',
    };
  }

  return {
    ok: true,
    limitation: {
      id: input.id,
      kind: input.draft.kind,
      bodyRegion: input.draft.bodyRegion,
      side: input.draft.side,
      severity: input.draft.severity,
      status: 'active',
      trainingImpact: input.draft.trainingImpact,
      movementPatterns,
      onsetDate,
      resolvedDate: null,
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const transitionUserLimitationStatus = (input: {
  limitation: UserLimitation;
  status: 'active' | 'resolved';
  now: string;
}): UserLimitationFormResult => {
  const timestamp = new Date(input.now);
  if (!Number.isFinite(timestamp.getTime())) {
    return { ok: false, message: 'The limitation timestamp is invalid.' };
  }
  const now = timestamp.toISOString();
  const today = now.slice(0, 10);
  if (
    input.status === 'resolved' &&
    input.limitation.onsetDate !== null &&
    today < input.limitation.onsetDate
  ) {
    return { ok: false, message: 'Resolved date cannot be before the onset date.' };
  }

  return {
    ok: true,
    limitation: {
      ...input.limitation,
      status: input.status,
      resolvedDate: input.status === 'resolved' ? today : null,
      updatedAt: now,
    },
  };
};
