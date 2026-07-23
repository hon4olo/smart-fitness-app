import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildSafetyRecoveryViewModel } from './safetyRecoveryViewModel';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

const makeEnvelope = (
  status: CoachRunEnvelope['run']['status'],
  result: Record<string, unknown> | null,
): CoachRunEnvelope => ({
  run: {
    id: runId,
    userId,
    domain: 'safety_recovery',
    requestType: 'safety_recovery_review',
    status,
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result,
    error: null,
    policyVersions: {
      context: 'safety-recovery-context-v1',
      readiness: 'safety-recovery-readiness-v1',
    },
    requestedAt: '2026-07-23T11:00:00.000Z',
    startedAt: '2026-07-23T11:00:01.000Z',
    completedAt: status === 'queued' || status === 'running' ? null : '2026-07-23T11:00:02.000Z',
    createdAt: '2026-07-23T11:00:00.000Z',
    updatedAt: '2026-07-23T11:00:02.000Z',
  },
  agentRuns: [],
});

const readiness = {
  policyVersion: 'safety-recovery-readiness-v1',
  status: 'ready',
  latestCheckInAt: '2026-07-23T09:00:00.000Z',
  latestCheckInAgeHours: 2,
  signalCount: 4,
  recommendedLoadMultiplier: 1,
  restrictions: [],
  issues: [],
  requiresExplicitConfirmation: false,
  approvedForAutomaticApply: false,
} as const;

describe('Safety Recovery view model', () => {
  it('parses a ready deterministic review without inventing an apply action', () => {
    expect(
      buildSafetyRecoveryViewModel(
        makeEnvelope('completed', {
          kind: 'safety-recovery-review',
          readiness,
        }),
      ),
    ).toMatchObject({
      kind: 'result',
      title: 'Ready for normal training',
      rejectionReason: null,
      readiness: {
        status: 'ready',
        recommendedLoadMultiplier: 1,
        approvedForAutomaticApply: false,
      },
    });
  });

  it('preserves movement restrictions and load reduction metadata', () => {
    const viewModel = buildSafetyRecoveryViewModel(
      makeEnvelope('completed', {
        kind: 'safety-recovery-review',
        readiness: {
          ...readiness,
          status: 'modify',
          recommendedLoadMultiplier: 0.7,
          requiresExplicitConfirmation: true,
          restrictions: [
            {
              limitationId: '33333333-3333-4333-8333-333333333333',
              bodyRegion: 'shoulder',
              side: 'left',
              severity: 'moderate',
              action: 'avoid_movement',
              movementPatterns: ['vertical_press'],
              maximumLoadMultiplier: 0,
            },
          ],
          issues: [
            {
              code: 'LIMITATION_MOVEMENT_AVOIDANCE_REQUIRED',
              severity: 'modify',
              path: 'limitations.33333333-3333-4333-8333-333333333333',
              message: 'The listed movement patterns must be excluded.',
              actual: 'avoid_movement',
            },
          ],
        },
      }),
    );

    expect(viewModel).toMatchObject({
      kind: 'result',
      title: 'Training should be modified',
      readiness: {
        recommendedLoadMultiplier: 0.7,
        restrictions: [
          {
            bodyRegion: 'shoulder',
            action: 'avoid_movement',
            movementPatterns: ['vertical_press'],
          },
        ],
      },
    });
  });

  it('parses a typed input-required rejection', () => {
    expect(
      buildSafetyRecoveryViewModel(
        makeEnvelope('rejected', {
          kind: 'safety-recovery-run-rejected',
          reason: 'safety_recovery_input_required',
          readiness: {
            ...readiness,
            status: 'needs_input',
            latestCheckInAt: null,
            latestCheckInAgeHours: null,
            signalCount: 0,
            requiresExplicitConfirmation: true,
            issues: [
              {
                code: 'RECOVERY_CHECK_IN_REQUIRED',
                severity: 'input_required',
                path: 'recoveryCheckIns',
                message: 'A recent recovery check-in is required.',
              },
            ],
          },
        }),
      ),
    ).toMatchObject({
      kind: 'result',
      title: 'Recovery input required',
      rejectionReason: 'safety_recovery_input_required',
      readiness: { status: 'needs_input', signalCount: 0 },
    });
  });

  it('fails closed on automatic application or inconsistent lifecycle states', () => {
    expect(
      buildSafetyRecoveryViewModel(
        makeEnvelope('completed', {
          kind: 'safety-recovery-review',
          readiness: {
            ...readiness,
            approvedForAutomaticApply: true,
          },
        }),
      ),
    ).toMatchObject({ kind: 'failed', title: 'Invalid readiness result' });

    expect(
      buildSafetyRecoveryViewModel(
        makeEnvelope('completed', {
          kind: 'safety-recovery-review',
          readiness: {
            ...readiness,
            status: 'blocked',
          },
        }),
      ),
    ).toMatchObject({ kind: 'failed', title: 'Invalid review state' });
  });
});
