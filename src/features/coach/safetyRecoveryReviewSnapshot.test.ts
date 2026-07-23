import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import type { RecoveryCheckIn, UserLimitation } from '@/types';
import {
  buildSafetyRecoveryReviewSnapshot,
  createSafetyRecoverySourceFingerprint,
  parseSafetyRecoveryReviewSnapshot,
} from './safetyRecoveryReviewSnapshot';
import type { SafetyRecoveryViewModel } from './safetyRecoveryViewModel';

const checkIn: RecoveryCheckIn = {
  id: '11111111-1111-4111-8111-111111111111',
  recordedAt: '2026-07-23T10:00:00.000Z',
  sleepDurationHours: 7.5,
  sleepQuality: 4,
  fatigue: 2,
  soreness: null,
  stress: null,
  painInterference: null,
  readiness: null,
  notes: 'Free text must not affect the fingerprint.',
  createdAt: '2026-07-23T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
};

const limitation: UserLimitation = {
  id: '22222222-2222-4222-8222-222222222222',
  kind: 'pain',
  bodyRegion: 'shoulder',
  side: 'right',
  severity: 'moderate',
  status: 'active',
  trainingImpact: 'reduce_load',
  movementPatterns: ['vertical_push'],
  onsetDate: '2026-07-20',
  resolvedDate: null,
  notes: 'This note is not part of deterministic context.',
  createdAt: '2026-07-20T08:00:00.000Z',
  updatedAt: '2026-07-23T09:00:00.000Z',
};

const run: CoachRunEnvelope = {
  run: {
    id: '33333333-3333-4333-8333-333333333333',
    userId: '44444444-4444-4444-8444-444444444444',
    domain: 'safety_recovery',
    requestType: 'safety_recovery_review',
    status: 'completed',
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result: {},
    error: null,
    policyVersions: { readiness: 'safety-recovery-readiness-v1' },
    requestedAt: '2026-07-23T11:00:00.000Z',
    startedAt: '2026-07-23T11:00:01.000Z',
    completedAt: '2026-07-23T11:00:02.000Z',
    createdAt: '2026-07-23T11:00:00.000Z',
    updatedAt: '2026-07-23T11:00:02.000Z',
  },
  agentRuns: [],
};

const viewModel: SafetyRecoveryViewModel = {
  kind: 'result',
  title: 'Training should be modified',
  message: 'Structured modifications are required.',
  rejectionReason: null,
  readiness: {
    status: 'modify',
    policyVersion: 'safety-recovery-readiness-v1',
    latestCheckInAt: checkIn.recordedAt,
    latestCheckInAgeHours: 1,
    signalCount: 3,
    recommendedLoadMultiplier: 0.75,
    restrictions: [
      {
        limitationId: limitation.id,
        bodyRegion: 'shoulder',
        side: 'right',
        severity: 'moderate',
        action: 'reduce_load',
        movementPatterns: ['vertical_push'],
        maximumLoadMultiplier: 0.75,
      },
    ],
    issues: [
      {
        code: 'RECOVERY_LOAD_REDUCTION_REQUIRED',
        severity: 'modify',
        message: 'Reduce reviewed training load.',
      },
    ],
    requiresExplicitConfirmation: true,
    approvedForAutomaticApply: false,
  },
};

const createSnapshot = () => {
  const snapshot = buildSafetyRecoveryReviewSnapshot({
    run,
    viewModel,
    recoveryCheckIns: [checkIn],
    userLimitations: [limitation],
    savedAt: '2026-07-23T11:01:00.000Z',
  });
  if (!snapshot) throw new Error('Expected a valid Safety Recovery snapshot');
  return snapshot;
};

describe('Safety Recovery review snapshot', () => {
  it('builds and parses a strict account-scoped snapshot', () => {
    const snapshot = createSnapshot();

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      userId: run.run.userId,
      runId: run.run.id,
      status: 'modify',
      recommendedLoadMultiplier: 0.75,
      requiresExplicitConfirmation: true,
    });
    expect(parseSafetyRecoveryReviewSnapshot(snapshot)).toEqual(snapshot);
  });

  it('does not let free-text notes affect the structured source fingerprint', () => {
    const base = createSafetyRecoverySourceFingerprint({
      recoveryCheckIns: [checkIn],
      userLimitations: [limitation],
    });
    const changedNotes = createSafetyRecoverySourceFingerprint({
      recoveryCheckIns: [{ ...checkIn, notes: 'Different note' }],
      userLimitations: [{ ...limitation, notes: 'Different note' }],
    });
    const changedSignal = createSafetyRecoverySourceFingerprint({
      recoveryCheckIns: [{ ...checkIn, fatigue: 4 }],
      userLimitations: [limitation],
    });

    expect(changedNotes).toBe(base);
    expect(changedSignal).not.toBe(base);
  });

  it('rejects malformed stored data', () => {
    const snapshot = createSnapshot();
    expect(
      parseSafetyRecoveryReviewSnapshot({ ...snapshot, recommendedLoadMultiplier: 2 }),
    ).toBeNull();
    expect(parseSafetyRecoveryReviewSnapshot({ ...snapshot, status: 'unknown' })).toBeNull();
  });
});
