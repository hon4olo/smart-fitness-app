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
  kind: UserLimitationKind;
  bodyRegion: UserLimitationBodyRegion;
  side: UserLimitationSide;
  severity: UserLimitationSeverity;
  trainingImpact: UserLimitationTrainingImpact;
  movementPatterns: UserLimitationMovementPattern[];
};

export type UserLimitationFormResult =
  | { ok: true; limitation: UserLimitation }
  | { ok: false; message: string };

export const emptyUserLimitationDraft = (): UserLimitationDraft => ({
  kind: 'pain',
  bodyRegion: 'shoulder',
  side: 'not_applicable',
  severity: 'mild',
  trainingImpact: 'monitor',
  movementPatterns: [],
});

export const buildUserLimitation = (input: {
  draft: UserLimitationDraft;
  id: string;
  now: string;
}): UserLimitationFormResult => {
  const timestamp = new Date(input.now);
  if (!Number.isFinite(timestamp.getTime())) {
    return { ok: false, message: 'The limitation timestamp is invalid.' };
  }

  const movementPatterns = [...new Set(input.draft.movementPatterns)].sort();
  if (
    input.draft.trainingImpact === 'avoid_movement' &&
    movementPatterns.length === 0
  ) {
    return {
      ok: false,
      message: 'Choose at least one movement pattern for Avoid movement.',
    };
  }

  const now = timestamp.toISOString();
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
      onsetDate: null,
      resolvedDate: null,
      createdAt: now,
      updatedAt: now,
    },
  };
};
