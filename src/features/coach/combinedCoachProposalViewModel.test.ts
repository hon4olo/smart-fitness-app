import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildCombinedCoachProposalViewModel } from './combinedCoachProposalViewModel';

const runId = '11111111-1111-4111-8111-111111111111';
const strengthRunId = '22222222-2222-4222-8222-222222222222';
const nutritionRunId = '33333333-3333-4333-8333-333333333333';
const safetyRunId = '44444444-4444-4444-8444-444444444444';
const sessionId = '55555555-5555-4555-8555-555555555555';
const sourceSetId = '66666666-6666-4666-8666-666666666666';
const targetId = '77777777-7777-4777-8777-777777777777';
const limitationId = '88888888-8888-4888-8888-888888888888';
const timestamp = '2026-07-24T12:00:00.000Z';

const envelope = (): CoachRunEnvelope => ({
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
        policyVersion: 'combined-coach-proposal-v2',
        status: 'modify',
        strength: {
          runId: strengthRunId,
          status: 'ready',
          sourceSessionId: sessionId,
          sets: [
            {
              sourceSetId,
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
        effectiveStrength: {
          policyVersion: 'combined-effective-strength-v1',
          status: 'modify',
          sourceSessionId: sessionId,
          loadMultiplier: 0.8,
          sets: [
            {
              sourceSetId,
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              proposedWeight: 80,
              maximumAllowedWeight: 64,
              effectiveWeight: 64,
              reps: 8,
              targetRpe: 8,
              safetyAdjusted: true,
            },
          ],
          proposedTonnage: 640,
          effectiveTonnage: 512,
          unresolvedMovementPatterns: [],
          requiresExplicitConfirmation: true,
          automaticApplication: false,
        },
        nutrition: {
          runId: nutritionRunId,
          status: 'ready',
          targetId,
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
          restrictions: [
            {
              limitationId,
              action: 'reduce_load',
              movementPatterns: [],
              maximumLoadMultiplier: 0.8,
            },
          ],
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
    },
    error: null,
    policyVersions: { finalGuardrail: 'combined-coach-proposal-v2' },
    requestedAt: timestamp,
    startedAt: timestamp,
    completedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  agentRuns: [],
});

const resultRecord = (value: CoachRunEnvelope): Record<string, unknown> =>
  value.run.result as Record<string, unknown>;

const reviewRecord = (value: CoachRunEnvelope): Record<string, unknown> =>
  resultRecord(value).review as Record<string, unknown>;

describe('Combined Coach proposal view model', () => {
  it('accepts v2 effective loads and strict Safety restrictions', () => {
    expect(buildCombinedCoachProposalViewModel(envelope())).toMatchObject({
      kind: 'review',
      policyVersion: 'combined-coach-proposal-v2',
      status: 'modify',
      maximumStrengthLoadMultiplier: 0.8,
      strengthRequiresSafetyAdjustment: true,
      effectiveStrength: {
        policyVersion: 'combined-effective-strength-v1',
        effectiveTonnage: 512,
        sets: [
          {
            proposedWeight: 80,
            maximumAllowedWeight: 64,
            effectiveWeight: 64,
            safetyAdjusted: true,
          },
        ],
      },
      safety: {
        restrictions: [{ action: 'reduce_load', maximumLoadMultiplier: 0.8 }],
      },
      pendingActions: [
        'review_strength_proposal',
        'confirm_nutrition_target',
        'apply_safety_load_ceiling',
      ],
      requiresExplicitConfirmation: true,
      automaticApplication: false,
    });
  });

  it('continues to accept persisted v1 read-only proposals', () => {
    const value = envelope();
    const review = reviewRecord(value);
    review.policyVersion = 'combined-coach-proposal-v1';
    delete review.effectiveStrength;
    const safety = review.safety as Record<string, unknown>;
    delete safety.restrictions;

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({
      kind: 'review',
      policyVersion: 'combined-coach-proposal-v1',
      effectiveStrength: null,
      safety: { restrictions: [] },
    });
  });

  it('fails closed when effective Strength arithmetic is altered', () => {
    const value = envelope();
    const effective = reviewRecord(value).effectiveStrength as Record<string, unknown>;
    const sets = effective.sets as Record<string, unknown>[];
    sets[0] = { ...sets[0], effectiveWeight: 65 };

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({
      kind: 'failed',
      title: 'Invalid Combined proposal',
    });
  });

  it('fails closed when automatic application is enabled', () => {
    const value = envelope();
    reviewRecord(value).automaticApplication = true;

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({
      kind: 'failed',
      title: 'Invalid Combined proposal',
    });
  });

  it('accepts unresolved movement restrictions only as a blocked read-only result', () => {
    const value = envelope();
    value.run.status = 'rejected';
    const result = resultRecord(value);
    result.kind = 'combined-coach-proposal-run-rejected';
    result.reason = 'combined_coach_proposal_blocked';
    const review = reviewRecord(value);
    review.status = 'blocked';
    review.strengthRequiresSafetyAdjustment = false;
    review.maximumStrengthLoadMultiplier = 1;
    review.pendingActions = [
      'review_strength_proposal',
      'confirm_nutrition_target',
      'resolve_movement_restrictions',
    ];
    review.issues = [
      {
        code: 'COMBINED_SAFETY_LOAD_CEILING_REQUIRED',
        severity: 'modify',
        domain: 'safety_recovery',
        message: 'Strength requires Safety review.',
      },
      {
        code: 'COMBINED_MOVEMENT_RESTRICTION_UNRESOLVED',
        severity: 'hard_block',
        domain: 'safety_recovery',
        message: 'Restricted movement patterns are unresolved.',
      },
    ];
    const safety = review.safety as Record<string, unknown>;
    safety.recommendedLoadMultiplier = 1;
    safety.restrictions = [
      {
        limitationId,
        action: 'avoid_movement',
        movementPatterns: ['horizontal_push'],
        maximumLoadMultiplier: 0,
      },
    ];
    const effective = review.effectiveStrength as Record<string, unknown>;
    effective.status = 'blocked';
    effective.loadMultiplier = 1;
    effective.sets = [];
    effective.effectiveTonnage = null;
    effective.unresolvedMovementPatterns = ['horizontal_push'];

    expect(buildCombinedCoachProposalViewModel(value)).toMatchObject({
      kind: 'review',
      rejected: true,
      status: 'blocked',
      strengthRequiresSafetyAdjustment: false,
      effectiveStrength: {
        status: 'blocked',
        unresolvedMovementPatterns: ['horizontal_push'],
      },
      pendingActions: expect.arrayContaining(['resolve_movement_restrictions']),
      automaticApplication: false,
    });
  });
});
