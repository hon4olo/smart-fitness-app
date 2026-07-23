import type {
  UserLimitation,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationStatus,
  UserLimitationTrainingImpact,
} from '@/types';

export type UserLimitationDraft = {
  kind: UserLimitationKind | null;
  bodyRegion: UserLimitationBodyRegion | null;
  side: UserLimitationSide | null;
  severity: UserLimitationSeverity | null;
  status: UserLimitationStatus;
  trainingImpact: UserLimitationTrainingImpact | null;
  movementPatterns: UserLimitationMovementPattern[];
  onsetDate: string;
  resolvedDate: string;
  notes: string;
};

export type UserLimitationFormResult =
  | { ok: true; limitation: UserLimitation }
  | { ok: false; message: string };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const emptyUserLimitationDraft = (): UserLimitationDraft => ({
  kind: null,
  bodyRegion: null,
  side: null,
  severity: null,
  status: 'active',
  trainingImpact: null,
  movementPatterns: [],
  onsetDate: '',
  resolvedDate: '',
  notes: '',
});

export const draftFromUserLimitation = (
  limitation: UserLimitation,
): UserLimitationDraft => ({
  kind: limitation.kind,
  bodyRegion: limitation.bodyRegion,
  side: limitation.side,
  severity: limitation.severity,
  status: limitation.status,
  trainingImpact: limitation.trainingImpact,
  movementPatterns: [...limitation.movementPatterns],
  onsetDate: limitation.onsetDate ?? '',
  resolvedDate: limitation.resolvedDate ?? '',
  notes: limitation.notes ?? '',
});

const parseDateOnly = (
  value: string,
  label: string,
): { ok: true; value: string | null } | { ok: false; message: string } => {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!DATE_ONLY_PATTERN.test(trimmed)) {
    return { ok: false, message: `${label} must use YYYY-MM-DD.` };
  }
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== trimmed
  ) {
    return { ok: false, message: `${label} is not a valid calendar date.` };
  }
  return { ok: true, value: trimmed };
};

export const buildUserLimitation = (input: {
  draft: UserLimitationDraft;
  id: string;
  now: string;
  existing?: UserLimitation | null;
}): UserLimitationFormResult => {
  if (!input.draft.kind) {
    return { ok: false, message: 'Select a limitation type.' };
  }
  if (!input.draft.bodyRegion) {
    return { ok: false, message: 'Select the affected body region.' };
  }
  if (!input.draft.side) {
    return { ok: false, message: 'Select the affected side.' };
  }
  if (!input.draft.severity) {
    return { ok: false, message: 'Select the self-reported severity.' };
  }
  if (!input.draft.trainingImpact) {
    return { ok: false, message: 'Select an explicit training impact.' };
  }

  const onsetDate = parseDateOnly(input.draft.onsetDate, 'Onset date');
  if (!onsetDate.ok) return onsetDate;
  const resolvedDate = parseDateOnly(input.draft.resolvedDate, 'Resolved date');
  if (!resolvedDate.ok) return resolvedDate;

  if (input.draft.status === 'active' && resolvedDate.value !== null) {
    return { ok: false, message: 'Active limitations cannot have a resolved date.' };
  }
  if (input.draft.status === 'resolved' && resolvedDate.value === null) {
    return { ok: false, message: 'Resolved limitations require a resolved date.' };
  }
  if (
    onsetDate.value !== null &&
    resolvedDate.value !== null &&
    resolvedDate.value < onsetDate.value
  ) {
    return { ok: false, message: 'Resolved date cannot be before onset date.' };
  }

  const movementPatterns = [...new Set(input.draft.movementPatterns)].sort();
  if (
    input.draft.trainingImpact === 'avoid_movement' &&
    movementPatterns.length === 0
  ) {
    return {
      ok: false,
      message: 'Select at least one movement pattern to avoid.',
    };
  }

  const notes = input.draft.notes.trim();
  if (notes.length > 2_000) {
    return { ok: false, message: 'Notes cannot exceed 2,000 characters.' };
  }

  const timestamp = new Date(input.now);
  if (!Number.isFinite(timestamp.getTime())) {
    return { ok: false, message: 'The limitation timestamp is invalid.' };
  }
  const now = timestamp.toISOString();
  const createdAt = input.existing?.createdAt ?? now;

  return {
    ok: true,
    limitation: {
      id: input.id,
      kind: input.draft.kind,
      bodyRegion: input.draft.bodyRegion,
      side: input.draft.side,
      severity: input.draft.severity,
      status: input.draft.status,
      trainingImpact: input.draft.trainingImpact,
      movementPatterns,
      onsetDate: onsetDate.value,
      resolvedDate: resolvedDate.value,
      ...(notes ? { notes } : {}),
      createdAt,
      updatedAt: now,
    },
  };
};
