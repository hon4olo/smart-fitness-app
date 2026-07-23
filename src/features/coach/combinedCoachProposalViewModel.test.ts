import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildCombinedCoachProposalViewModel } from './combinedCoachProposalViewModel';

const runId = '11111111-1111-4111-8111-111111111111';
const strengthRunId = '22222222-2222-4222-8222-222222222222';
const nutritionRunId = '33333333-3333-4333-8333-333333333333';
const safetyRunId = '44444444-4444-4444-8444-444444444444';
const timestamp = '2026-07-24T12:00:00.000Z';

const envelope = (overrides: Record<string, unknown> = {}): CoachRunEnvelope => ({
  run: {
    id: runId,
    userId: 'user-1',
    domain: 'combined',
    requestType: 'combined_proposal_review',
    status: 'completed',
    idempotencyKey: null,
    requestData: { requestType: 'combined_proposal_review' },
    contextSnapshot: null,
    result: {
      kind: 'combined-coach-proposal-review',
      childRunIds: {
        strength: strengthRunId,
        nutrition: nutritionRunId,
        safety: safetyRunId,
      },
      review: {
        policyVersion: 'combined-coach-proposal-v1',
        status: 'modify',
        strength: {
          runId: strengthRunId,
          status: 'ready',
          sourceSessionId: '55555555-5555-4555-8555-555555555555',
          sets: [
            {
              sourceSetId: '66666666-6666-4666-8666-666666666666',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              weight: 80,
              reps: 8,
              targetRpe: 8,
              adjustment: 'maintain',
            },
          ],
          proposedTonnage: 640,
          guardrailStatus: 'valid',
        },
        nutrition: {
          runId: nutritionRunId,
          status: 'ready',
          targetId: '77777777-7777-4777-8777-777777777777',
          targetRevision: 4,
          currentTargets: { calories: 2400, protein: 160, carbs: 280, fats: 70 },
          proposedTargets: { calories: 2500, protein: 165, carbs: 295, fats: 72 },
          changed: true,
          guardrailStatus: 'valid',
          requiresConfirmation: true,
          applied: false,
        },
        safety: {
          runId: safetyRunId,
          status: 'modify',
          recommendedLoadMultiplier: 0.8,
          restrictionCount: 1,
          issueCount: 1,
        },
        maximumStrengthLoadMultiplier: 0.8,
        strengthRequiresSafetyAdjustment: true,
        pendingActions: [
          'review_strength_proposal',
          'confirm_nutrition_target',
          'apply_safety_load_ceiling',
        ],
        issues: [
          {
            code: 'COMBINED_SAFETY_LOAD_CEILING_REQUIRED',
            severity: 'modify',
            domain: 'safety_recovery',
            message: 'Strength must respect the recovery ceiling.',
          },
        ],
        requiresExplicitConfirmation: true,
        automaticApplication: false,
      },
      ...overrides,
    },
    error: null,
    policyVersions: { finalGuardrail: 'combined-coach-proposal-v1' },
    requestedAt: timestamp,
    startedAt: timestamp,
    completedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  agentRuns: [],
});

describe('Combined Coach proposal view model', () => {
  it('accepts a strict read-only proposal and preserves pending actions', () => {
    const viewModel = buildCombinedCoachProposalViewModel(envelope());

    expect(viewModel).toMatchObject({
      kind: 'review',
      status: 'modify',
      maximumStrengthLoadMultiplier: 0.8,
      strengthRequiresSafetyAdjustment: true,
      requiresExplicitConfirmation: true,
      automaticApplication: false,
      pendingActions: [
        'review_strength_proposal',
        'confirm_nutrition_target',
        'apply_safety_load_ceiling',
      ],
    });
  });

  it('fails closed when automatic application is enabled', () => {
    const value = envelope();
    const result = value.run.result as Record<string, unknown>;
    result.review = {
      ...(result.review as Record<string, unknown>),
      automaticApplication: true,
    };

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({
      kind: 'failed',
      title: 'Invalid Combined proposal',
    });
  });

  it('fails closed when the Safety ceiling and adjustment flag disagree', () => {
    const value = envelope();
    const result = value.run.result as Record<string, unknown>;
    result.review = {
      ...(result.review as Record<string, unknown>),
      strengthRequiresSafetyAdjustment: false,
    };

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({ kind: 'failed' });
  });

  it('accepts blocked rejected results only as read-only reviews', () => {
    const value = envelope({
      kind: 'combined-coach-proposal-run-rejected',
      reason: 'combined_coach_proposal_blocked',
    });
    value.run.status = 'rejected';
    const result = value.run.result as Record<string, unknown>;
    result.review = {
      ...(result.review as Record<string, unknown>),
      status: 'blocked',
      safety: {
        ...((result.review as Record<string, unknown>).safety as Record<string, unknown>),
        status: 'blocked',
        recommendedLoadMultiplier: 0,
      },
      maximumStrengthLoadMultiplier: 0,
      strengthRequiresSafetyAdjustment: true,
    };

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({
      kind: 'review',
      rejected: true,
      status: 'blocked',
      automaticApplication: false,
    });
  });
});
