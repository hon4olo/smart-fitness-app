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
    idempotencyKey: null,
    requestData: { lookbackDays: 7 },
    contextSnapshot: {},
    result: {
      kind: 'safety-recovery-review',
      readiness: {
        policyVersion: 'safety-recovery-readiness-v1',
        status: 'modify',
        latestCheckInAt: '2026-07-23T09:00:00.000Z',
        latestCheckInAgeHours: 1,
        signalCount: 5,
        recommendedLoadMultiplier: 0.7,
        restrictions: [
          {
            limitationId,
            bodyRegion: 'shoulder',
            side: 'left',
            severity: 'moderate',
            action: 'avoid_movement',
            movementPatterns: ['overhead'],
            maximumLoadMultiplier: 0,
          },
        ],
        issues: [
          {
            code: 'RECOVERY_FATIGUE_HIGH',
            severity: 'modify',
            path: 'recoveryCheckIns.0.fatigue',
            message: 'High self-reported fatigue requires a load reduction.',
          },
        ],
        requiresExplicitConfirmation: true,
        approvedForAutomaticApply: false,
      },
    },
    error: null,
    policyVersions: {},
    requestedAt: '2026-07-23T10:00:00.000Z',
    startedAt: '2026-07-23T10:00:00.000Z',
    completedAt: '2026-07-23T10:00:00.000Z',
    createdAt: '2026-07-23T10:00:00.000Z',
    updatedAt: '2026-07-23T10:00:00.000Z',
  },
  agentRuns: [],
});

describe('Safety Recovery view model', () => {
  it('reads deterministic modifications and movement restrictions', () => {
    expect(buildSafetyRecoveryViewModel(makeEnvelope())).toEqual({
      kind: 'readiness',
      title: 'Training should be modified',
      message: 'Use the validated load reduction and movement restrictions below.',
      status: 'modify',
      latestCheckInAt: '2026-07-23T09:00:00.000Z',
      latestCheckInAgeHours: 1,
      signalCount: 5,
      recommendedLoadMultiplier: 0.7,
      restrictions: [
        {
          limitationId,
          bodyRegion: 'shoulder',
          side: 'left',
          severity: 'moderate',
          action: 'avoid_movement',
          movementPatterns: ['overhead'],
          maximumLoadMultiplier: 0,
        },
      ],
      issues: [
        {
          code: 'RECOVERY_FATIGUE_HIGH',
          severity: 'modify',
          message: 'High self-reported fatigue requires a load reduction.',
        },
      ],
      requiresExplicitConfirmation: true,
      approvedForAutomaticApply: false,
      rejectedReason: null,
    });
  });

  it('maps needs-input rejection without treating it as a failed transport', () => {
    const envelope = makeEnvelope();
    envelope.run.status = 'rejected';
    envelope.run.result = {
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

    expect(buildSafetyRecoveryViewModel(envelope)).toMatchObject({
      kind: 'readiness',
      status: 'needs_input',
      title: 'Recovery input required',
      rejectedReason: 'safety_recovery_input_required',
    });
  });

  it('rejects automatic apply, invalid multipliers and duplicate restrictions', () => {
    const automatic = makeEnvelope();
    const readiness = (automatic.run.result as Record<string, unknown>)
      .readiness as Record<string, unknown>;
    readiness.approvedForAutomaticApply = true;
    expect(buildSafetyRecoveryViewModel(automatic)).toMatchObject({ kind: 'failed' });

    const invalidMultiplier = makeEnvelope();
    ((invalidMultiplier.run.result as Record<string, unknown>)
      .readiness as Record<string, unknown>).recommendedLoadMultiplier = 1.2;
    expect(buildSafetyRecoveryViewModel(invalidMultiplier)).toMatchObject({ kind: 'failed' });

    const duplicate = makeEnvelope();
    const duplicateReadiness = (duplicate.run.result as Record<string, unknown>)
      .readiness as Record<string, unknown>;
    duplicateReadiness.restrictions = [
      ...((duplicateReadiness.restrictions as unknown[]) ?? []),
      ...((duplicateReadiness.restrictions as unknown[]) ?? []),
    ];
    expect(buildSafetyRecoveryViewModel(duplicate)).toMatchObject({ kind: 'failed' });
  });
});
