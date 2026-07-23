import { describe, expect, it } from 'vitest';

import {
  createSafetyRecoverySourceFingerprint,
  type SafetyRecoveryReviewSnapshot,
} from '@/features/coach/safetyRecoveryReviewSnapshot';
import type { RecoveryCheckIn, UserLimitation } from '@/types';
import { buildWorkoutSafetyGateDecision } from './workoutSafetyGateModel';

const userId = '11111111-1111-4111-8111-111111111111';
const checkIn: RecoveryCheckIn = {
  id: '22222222-2222-4222-8222-222222222222',
  recordedAt: '2026-07-23T10:00:00.000Z',
  sleepDurationHours: 7,
  sleepQuality: 4,
  fatigue: 2,
  soreness: null,
  stress: null,
  painInterference: null,
  readiness: null,
  createdAt: '2026-07-23T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
};
const limitation: UserLimitation = {
  id: '33333333-3333-4333-8333-333333333333',
  kind: 'pain',
  bodyRegion: 'shoulder',
  side: 'right',
  severity: 'moderate',
  status: 'active',
  trainingImpact: 'reduce_load',
  movementPatterns: ['vertical_push'],
  onsetDate: null,
  resolvedDate: null,
  createdAt: '2026-07-23T09:00:00.000Z',
  updatedAt: '2026-07-23T09:00:00.000Z',
};

const snapshot = (status: SafetyRecoveryReviewSnapshot['status']): SafetyRecoveryReviewSnapshot => ({
  schemaVersion: 1,
  userId,
  runId: '44444444-4444-4444-8444-444444444444',
  completedAt: '2026-07-23T11:00:00.000Z',
  savedAt: '2026-07-23T11:00:10.000Z',
  sourceFingerprint: createSafetyRecoverySourceFingerprint({
    recoveryCheckIns: [checkIn],
    userLimitations: [limitation],
  }),
  status,
  latestCheckInAt: checkIn.recordedAt,
  signalCount: 3,
  recommendedLoadMultiplier: status === 'ready' ? 1 : 0.7,
  requiresExplicitConfirmation: status !== 'ready',
  restrictions: status === 'ready'
    ? []
    : [
        {
          limitationId: limitation.id,
          bodyRegion: 'shoulder',
          side: 'right',
          severity: 'moderate',
          action: 'reduce_load',
          movementPatterns: ['vertical_push'],
          maximumLoadMultiplier: 0.7,
        },
      ],
  issues: [],
});

describe('workout Safety Recovery gate', () => {
  it('allows a current ready review without an extra checkbox', () => {
    expect(
      buildWorkoutSafetyGateDecision({
        snapshot: snapshot('ready'),
        currentUserId: userId,
        recoveryCheckIns: [checkIn],
        userLimitations: [limitation],
        now: '2026-07-23T12:00:00.000Z',
      }),
    ).toMatchObject({
      kind: 'ready',
      requiresAcknowledgement: false,
      reviewStatus: 'ready',
      recommendedLoadPercent: 100,
    });
  });

  it('requires explicit acknowledgement for modify and blocked results', () => {
    expect(
      buildWorkoutSafetyGateDecision({
        snapshot: snapshot('modify'),
        currentUserId: userId,
        recoveryCheckIns: [checkIn],
        userLimitations: [limitation],
        now: '2026-07-23T12:00:00.000Z',
      }),
    ).toMatchObject({
      kind: 'confirmation_required',
      requiresAcknowledgement: true,
      reviewStatus: 'modify',
      recommendedLoadPercent: 70,
    });

    expect(
      buildWorkoutSafetyGateDecision({
        snapshot: snapshot('blocked'),
        currentUserId: userId,
        recoveryCheckIns: [checkIn],
        userLimitations: [limitation],
        now: '2026-07-23T12:00:00.000Z',
      }),
    ).toMatchObject({
      kind: 'confirmation_required',
      requiresAcknowledgement: true,
      reviewStatus: 'blocked',
    });
  });

  it('marks the review stale when structured source data changes', () => {
    expect(
      buildWorkoutSafetyGateDecision({
        snapshot: snapshot('ready'),
        currentUserId: userId,
        recoveryCheckIns: [{ ...checkIn, fatigue: 4 }],
        userLimitations: [limitation],
        now: '2026-07-23T12:00:00.000Z',
      }),
    ).toMatchObject({
      kind: 'review_stale',
      requiresAcknowledgement: true,
      reviewStatus: 'ready',
    });
  });

  it('requires acknowledgement when no account-scoped review is available', () => {
    expect(
      buildWorkoutSafetyGateDecision({
        snapshot: null,
        currentUserId: null,
        recoveryCheckIns: [checkIn],
        userLimitations: [limitation],
      }),
    ).toMatchObject({
      kind: 'review_missing',
      requiresAcknowledgement: true,
      reviewStatus: null,
    });
  });
});
