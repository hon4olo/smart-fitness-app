import {
  SAFETY_RECOVERY_REVIEW_MAX_CHECK_IN_AGE_HOURS,
  createSafetyRecoverySourceFingerprint,
  type SafetyRecoveryReviewSnapshot,
} from '@/features/coach/safetyRecoveryReviewSnapshot';
import type {
  SafetyRecoveryIssueView,
  SafetyRecoveryRestrictionView,
  SafetyRecoveryStatus,
} from '@/features/coach/safetyRecoveryViewModel';
import type { RecoveryCheckIn, UserLimitation } from '@/types';

export type WorkoutSafetyGateKind =
  | 'review_missing'
  | 'review_stale'
  | 'ready'
  | 'confirmation_required';

export type WorkoutSafetyGateDecision = {
  kind: WorkoutSafetyGateKind;
  title: string;
  message: string;
  requiresAcknowledgement: boolean;
  reviewStatus: SafetyRecoveryStatus | null;
  reviewRunId: string | null;
  sourceFingerprint: string | null;
  recommendedLoadPercent: number | null;
  restrictions: SafetyRecoveryRestrictionView[];
  issues: SafetyRecoveryIssueView[];
};

const statusCopy = (
  status: SafetyRecoveryStatus,
): Pick<WorkoutSafetyGateDecision, 'title' | 'message'> => {
  if (status === 'ready') {
    return {
      title: 'Ready for normal training',
      message: 'The latest synchronized review does not require a workout modification.',
    };
  }
  if (status === 'modify') {
    return {
      title: 'Review recommends modifications',
      message:
        'Review the load and movement restrictions below. The app will not change the workout automatically.',
    };
  }
  if (status === 'blocked') {
    return {
      title: 'Latest review returned a hard block',
      message:
        'The deterministic review returned an explicit hard block. Continuing requires a deliberate acknowledgement.',
    };
  }
  return {
    title: 'Latest review needs more input',
    message:
      'The backend could not produce a complete readiness result. Continuing requires a deliberate acknowledgement.',
  };
};

export const buildWorkoutSafetyGateDecision = (input: {
  snapshot: SafetyRecoveryReviewSnapshot | null;
  currentUserId: string | null;
  recoveryCheckIns: RecoveryCheckIn[];
  userLimitations: UserLimitation[];
  now?: string;
}): WorkoutSafetyGateDecision => {
  const currentFingerprint = createSafetyRecoverySourceFingerprint({
    recoveryCheckIns: input.recoveryCheckIns,
    userLimitations: input.userLimitations,
  });

  if (!input.snapshot || !input.currentUserId) {
    return {
      kind: 'review_missing',
      title: 'No current Safety & Recovery review',
      message:
        'You can continue, but there is no account-scoped deterministic review available for this workout.',
      requiresAcknowledgement: true,
      reviewStatus: null,
      reviewRunId: null,
      sourceFingerprint: null,
      recommendedLoadPercent: null,
      restrictions: [],
      issues: [],
    };
  }

  if (input.snapshot.userId !== input.currentUserId) {
    return {
      kind: 'review_missing',
      title: 'Review belongs to another account',
      message: 'Run a new Safety & Recovery review for the currently signed-in account.',
      requiresAcknowledgement: true,
      reviewStatus: null,
      reviewRunId: null,
      sourceFingerprint: null,
      recommendedLoadPercent: null,
      restrictions: [],
      issues: [],
    };
  }

  const nowMs = Number.isFinite(Date.parse(input.now ?? ''))
    ? Date.parse(input.now as string)
    : Date.now();
  const latestCheckInAgeHours = input.snapshot.latestCheckInAt
    ? Math.max(0, nowMs - Date.parse(input.snapshot.latestCheckInAt)) / 3_600_000
    : null;
  const stale =
    input.snapshot.sourceFingerprint !== currentFingerprint ||
    latestCheckInAgeHours === null ||
    !Number.isFinite(latestCheckInAgeHours) ||
    latestCheckInAgeHours > SAFETY_RECOVERY_REVIEW_MAX_CHECK_IN_AGE_HOURS;

  if (stale) {
    return {
      kind: 'review_stale',
      title: 'Safety & Recovery review is stale',
      message:
        'Recovery signals or limitations changed, or the reviewed check-in is older than 72 hours. A new review is recommended.',
      requiresAcknowledgement: true,
      reviewStatus: input.snapshot.status,
      reviewRunId: input.snapshot.runId,
      sourceFingerprint: input.snapshot.sourceFingerprint,
      recommendedLoadPercent: Math.round(input.snapshot.recommendedLoadMultiplier * 100),
      restrictions: input.snapshot.restrictions,
      issues: input.snapshot.issues,
    };
  }

  const copy = statusCopy(input.snapshot.status);
  const requiresAcknowledgement =
    input.snapshot.status !== 'ready' || input.snapshot.requiresExplicitConfirmation;

  return {
    kind: requiresAcknowledgement ? 'confirmation_required' : 'ready',
    ...copy,
    requiresAcknowledgement,
    reviewStatus: input.snapshot.status,
    reviewRunId: input.snapshot.runId,
    sourceFingerprint: input.snapshot.sourceFingerprint,
    recommendedLoadPercent: Math.round(input.snapshot.recommendedLoadMultiplier * 100),
    restrictions: input.snapshot.restrictions,
    issues: input.snapshot.issues,
  };
};
