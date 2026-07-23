import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildSafetyRecoveryViewModel } from './safetyRecoveryViewModel';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const limitationId = '33333333-3333-4333-8333-333333333333';

const makeEnvelope = (): CoachRunEnvelope => ({
  run: {
    id: runId,
    userId,
    domain: 'safety_recovery',
    requestType: 'safety_recovery_review',
    status: 'completed',
    idempotencyKey: 'safety-review-1',
    requestData: { requestType: 'safety_recovery_review', lookbackDays: 14 },
    contextSnapshot: {},
    result: {
      kind: 'safety-recovery-review',
      readiness: {
        policyVersion: 'safety-recovery-readiness-v1',
        status: 'modify',
        latestCheckInAt: '2026-07-23T10:00:00.000Z',
        latestCheckInAgeHours: 2,
        signalCount: 5,
        recommendedLoadMultiplier: 0.7,
        restrictions: [
          {
            limitationId,
            bodyRegion: 'shoulder',
            side: 'right',
            severity: 'moderate',
            action: 'avoid_movement',
            movementPatterns: ['overhead', 'vertical_push'],
            maximumLoadMultiplier: 0,
          },
        ],
        issues: [
          {
            code: 'RECOVERY_FATIGUE_HIGH',
            severity: 'modify',
            path: 'recoveryCheckIns.0.fatigue',
            message: 'High self-reported fatigue requires a load reduction.',
            actual: 4,
            limit: 4,
          },
        ],
        requiresExplicitConfirmation: true,
        approvedForAutomaticApply: false,
      },
    },
    error: null,
    policyVersions: { readiness: 'safety-recovery-readiness-v1' },
    requestedAt: '2026-07-23T12:00:00.000Z',
    startedAt: '2026-07-23T12:00:01.000Z',
    completedAt: '2026-07-23T12:00:02.000Z',
    createdAt: '2026-07-23T12:00:00.000Z',
    updatedAt: '2026-07-23T12:00:02.000Z',
  },
  agentRuns: [],
});

describe('Safety Recovery view model', () => {
  it('parses a guarded load reduction and movement restriction', () => {
    expect(buildSafetyRecoveryViewModel(makeEnvelope())).toEqual({
      kind: 'review',
      title: 'Modify today’s training',
      message:
        'The deterministic policy recommends reducing load or excluding movements.',
      status: 'modify',
      rejected: false,
      reason: null,
      policyVersion: 'safety-recovery-readiness-v1',
      latestCheckInAt: '2026-07-23T10:00:00.000Z',
      latestCheckInAgeHours: 2,
      signalCount: 5,
      recommendedLoadMultiplier: 0.7,
      restrictions: [
        {
          limitationId,
          bodyRegion: 'shoulder',
          side: 'right',
          severity: 'moderate',
          action: 'avoid_movement',
          movementPatterns: ['overhead', 'vertical_push'],
          maximumLoadMultiplier: 0,
        },
      ],
      issues: [
        {
          code: 'RECOVERY_FATIGUE_HIGH',
          severity: 'modify',
          path: 'recoveryCheckIns.0.fatigue',
          message: 'High self-reported fatigue requires a load reduction.',
          actual: 4,
          limit: 4,
        },
      ],
      requiresExplicitConfirmation: true,
      approvedForAutomaticApply: false,
    });
  });

  it('preserves typed input-required and hard-block rejections', () => {
    const needsInput = makeEnvelope();
    needsInput.run.status = 'rejected';
    needsInput.run.result = {
      kind: 'safety-recovery-run-rejected',
      reason: 'safety_recovery_input_required',
      readiness: {
        policyVersion: 'safety-recovery-readiness-v1',
        status: 'needs_input',
        latestCheckInAt: null,
        latestCheckInAgeHours: null,
        signalCount: 0,
        recommendedLoadMultiplier: 1,
        restrictions: [],
        issues: [
          {
            code: 'RECOVERY_CHECK_IN_REQUIRED',
            severity: 'input_required',
            path: 'recoveryCheckIns',
            message: 'A recent recovery check-in is required.',
          },
        ],
        requiresExplicitConfirmation: true,
        approvedForAutomaticApply: false,
      },
    };
    expect(buildSafetyRecoveryViewModel(needsInput)).toMatchObject({
      kind: 'review',
      status: 'needs_input',
      rejected: true,
      reason: 'safety_recovery_input_required',
      title: 'Recovery check-in required',
    });

    const blocked = makeEnvelope();
    blocked.run.status = 'rejected';
    blocked.run.result = {
      kind: 'safety-recovery-run-rejected',
      reason: 'safety_recovery_hard_block',
      readiness: {
        policyVersion: 'safety-recovery-readiness-v1',
        status: 'blocked',
        latestCheckInAt: '2026-07-23T10:00:00.000Z',
        latestCheckInAgeHours: 2,
        signalCount: 2,
        recommendedLoadMultiplier: 1,
        restrictions: [
          {
            limitationId,
            bodyRegion: 'systemic',
            side: 'not_applicable',
            severity: 'severe',
            action: 'pause_training',
            movementPatterns: [],
            maximumLoadMultiplier: 0,
          },
        ],
        issues: [
          {
            code: 'LIMITATION_TRAINING_PAUSED',
            severity: 'hard_block',
            path: `limitations.${limitationId}`,
            message: 'Training is paused by an explicit limitation.',
          },
        ],
        requiresExplicitConfirmation: true,
        approvedForAutomaticApply: false,
      },
    };
    expect(buildSafetyRecoveryViewModel(blocked)).toMatchObject({
      kind: 'review',
      status: 'blocked',
      rejected: true,
      reason: 'safety_recovery_hard_block',
      title: 'Training paused',
    });
  });

  it('rejects malformed multipliers, automatic apply, and lifecycle mismatches', () => {
    const invalidMultiplier = makeEnvelope();
    if (!invalidMultiplier.run.result) throw new Error('Missing result fixture');
    const readiness = invalidMultiplier.run.result.readiness as Record<string, unknown>;
    readiness.recommendedLoadMultiplier = 1.2;
    expect(buildSafetyRecoveryViewModel(invalidMultiplier)).toMatchObject({
      kind: 'failed',
      title: 'Invalid review',
    });

    const automaticApply = makeEnvelope();
    if (!automaticApply.run.result) throw new Error('Missing result fixture');
    (automaticApply.run.result.readiness as Record<string, unknown>).approvedForAutomaticApply = true;
    expect(buildSafetyRecoveryViewModel(automaticApply)).toMatchObject({
      kind: 'failed',
      title: 'Invalid review',
    });

    const mismatch = makeEnvelope();
    mismatch.run.status = 'rejected';
    expect(buildSafetyRecoveryViewModel(mismatch)).toMatchObject({
      kind: 'failed',
      title: 'Unsupported result',
    });
  });
});
