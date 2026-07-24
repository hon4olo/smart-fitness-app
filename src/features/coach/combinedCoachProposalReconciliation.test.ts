import { describe, expect, it } from 'vitest';

import { parseCombinedProposalReview } from './combinedCoachProposalParser';

const strengthRunId = '11111111-1111-4111-8111-111111111111';
const nutritionRunId = '22222222-2222-4222-8222-222222222222';
const safetyRunId = '33333333-3333-4333-8333-333333333333';
const sessionId = '44444444-4444-4444-8444-444444444444';
const setId = '55555555-5555-4555-8555-555555555555';
const targetId = '66666666-6666-4666-8666-666666666666';
const limitationId = '77777777-7777-4777-8777-777777777777';

const review = () => ({
  policyVersion: 'combined-coach-proposal-v3',
  status: 'modify',
  strength: {
    runId: strengthRunId,
    status: 'ready',
    sourceSessionId: sessionId,
    sets: [
      {
        sourceSetId: setId,
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
        sourceSetId: setId,
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
    proposedTargets: { calories: 2400, protein: 165, carbs: 275, fats: 70 },
    changed: true,
    guardrailStatus: 'valid',
    requiresConfirmation: true,
    applied: false,
  },
  nutritionReconciliation: {
    policyVersion: 'combined-nutrition-reconciliation-v1',
    status: 'aligned',
    decision: 'preserve_proposal',
    currentCalories: 2400,
    proposedCalories: 2400,
    energyDeltaCalories: 0,
    safetyLoadMultiplier: 0.8,
    effectiveTrainingLoadRatio: 0.8,
    reasonCodes: [
      'macro_only_energy_preserved',
      'reduced_training_load_observed',
    ],
    approvedForConfirmation: true,
    requiresExplicitConfirmation: true,
    automaticApplication: false,
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
      message: 'Strength must respect the deterministic recovery load ceiling.',
    },
  ],
  requiresExplicitConfirmation: true,
  automaticApplication: false,
});

describe('Combined proposal v3 Nutrition reconciliation', () => {
  it('accepts an energy-neutral proposal under reduced training load', () => {
    expect(parseCombinedProposalReview(review())).toMatchObject({
      policyVersion: 'combined-coach-proposal-v3',
      status: 'modify',
      nutritionReconciliation: {
        status: 'aligned',
        decision: 'preserve_proposal',
        energyDeltaCalories: 0,
        effectiveTrainingLoadRatio: 0.8,
        approvedForConfirmation: true,
      },
      pendingActions: expect.arrayContaining(['confirm_nutrition_target']),
      automaticApplication: false,
    });
  });

  it('accepts an unknown calorie delta only as hold-for-review', () => {
    const value = review();
    value.nutrition.proposedTargets.calories = 2500;
    value.nutritionReconciliation.status = 'needs_review';
    value.nutritionReconciliation.decision = 'hold_for_review';
    value.nutritionReconciliation.proposedCalories = 2500;
    value.nutritionReconciliation.energyDeltaCalories = 100;
    value.nutritionReconciliation.reasonCodes = [
      'energy_change_policy_unavailable',
      'reduced_training_load_observed',
    ];
    value.nutritionReconciliation.approvedForConfirmation = false;
    value.pendingActions = value.pendingActions.filter(
      (action) => action !== 'confirm_nutrition_target',
    );

    expect(parseCombinedProposalReview(value)).toMatchObject({
      status: 'modify',
      nutritionReconciliation: {
        status: 'needs_review',
        decision: 'hold_for_review',
        energyDeltaCalories: 100,
        approvedForConfirmation: false,
      },
      pendingActions: expect.not.arrayContaining(['confirm_nutrition_target']),
    });
  });

  it('fails closed when reconciliation arithmetic disagrees with Nutrition', () => {
    const value = review();
    value.nutritionReconciliation.energyDeltaCalories = 100;
    expect(parseCombinedProposalReview(value)).toBeNull();
  });

  it('fails closed when the effective training ratio is altered', () => {
    const value = review();
    value.nutritionReconciliation.effectiveTrainingLoadRatio = 0.7;
    expect(parseCombinedProposalReview(value)).toBeNull();
  });

  it('fails closed when a held proposal still exposes confirmation', () => {
    const value = review();
    value.nutrition.proposedTargets.calories = 2500;
    value.nutritionReconciliation.status = 'needs_review';
    value.nutritionReconciliation.decision = 'hold_for_review';
    value.nutritionReconciliation.proposedCalories = 2500;
    value.nutritionReconciliation.energyDeltaCalories = 100;
    value.nutritionReconciliation.reasonCodes = [
      'energy_change_policy_unavailable',
      'reduced_training_load_observed',
    ];
    value.nutritionReconciliation.approvedForConfirmation = false;

    expect(parseCombinedProposalReview(value)).toBeNull();
  });
});
