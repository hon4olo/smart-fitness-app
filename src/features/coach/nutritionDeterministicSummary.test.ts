import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import {
  getNutritionRejectionCopy,
  readNutritionDeterministicSummary,
} from './nutritionDeterministicSummary';

const makeEnvelope = (): CoachRunEnvelope => ({
  run: {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    domain: 'nutrition',
    requestType: 'nutrition_review',
    status: 'completed',
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result: {
      kind: 'nutrition-review',
      agentReadiness: {
        policyVersion: 'nutrition-agent-readiness-v1',
        status: 'ready',
        ageYears: 26,
        profileRevision: 4,
        trackedDays: 10,
      },
      energyMetrics: {
        policyVersion: 'nutrition-energy-v1',
        formulaVersion: 'mifflin-st-jeor-v1',
        inputs: {
          ageYears: 26,
          weightKg: 70,
          heightCm: 175,
          calculationSex: 'male',
          activityLevel: 'moderate',
          goal: 'fat_loss',
          requestedWeeklyWeightChangeKg: -0.4,
        },
        bmrCalories: 1669,
        activityFactor: 1.55,
        tdeeCalories: 2587,
        requestedDailyEnergyDeltaKcal: -440,
        appliedDailyEnergyDeltaKcal: -440,
        deltaWasClamped: false,
        goalAdjustedCalories: 2147,
        permissibleCalories: { min: 2047, max: 2247 },
        proteinGrams: { min: 126, max: 168 },
        fatGrams: { min: 42, max: 70 },
      },
      targetAvailable: true,
      latestWeightAvailable: true,
    },
    error: null,
    policyVersions: {},
    requestedAt: '2026-07-23T12:00:00.000Z',
    startedAt: '2026-07-23T12:00:01.000Z',
    completedAt: '2026-07-23T12:00:02.000Z',
    createdAt: '2026-07-23T12:00:00.000Z',
    updatedAt: '2026-07-23T12:00:02.000Z',
  },
  agentRuns: [],
});

describe('deterministic nutrition summary', () => {
  it('reads a versioned ready profile and energy metrics', () => {
    expect(readNutritionDeterministicSummary(makeEnvelope())).toEqual({
      readiness: {
        status: 'ready',
        ageYears: 26,
        profileRevision: 4,
        trackedDays: 10,
      },
      energy: {
        formulaVersion: 'mifflin-st-jeor-v1',
        ageYears: 26,
        weightKg: 70,
        heightCm: 175,
        calculationSex: 'male',
        activityLevel: 'moderate',
        goal: 'fat_loss',
        requestedWeeklyWeightChangeKg: -0.4,
        bmrCalories: 1669,
        activityFactor: 1.55,
        tdeeCalories: 2587,
        requestedDailyEnergyDeltaKcal: -440,
        appliedDailyEnergyDeltaKcal: -440,
        deltaWasClamped: false,
        goalAdjustedCalories: 2147,
        permissibleCalories: { min: 2047, max: 2247 },
        proteinGrams: { min: 126, max: 168 },
        fatGrams: { min: 42, max: 70 },
      },
    });
  });

  it('reads missing profile inputs without inventing energy metrics', () => {
    const envelope = makeEnvelope();
    if (!envelope.run.result) throw new Error('Missing result fixture');
    envelope.run.result.agentReadiness = {
      policyVersion: 'nutrition-agent-readiness-v1',
      status: 'needs_input',
      missingFields: ['fitnessProfile.dateOfBirth', 'fitnessProfile.calculationSex'],
      messageCode: 'nutrition_agent_profile_incomplete',
    };
    envelope.run.result.energyMetrics = null;

    expect(readNutritionDeterministicSummary(envelope)).toEqual({
      readiness: {
        status: 'needs_input',
        missingFields: ['fitnessProfile.dateOfBirth', 'fitnessProfile.calculationSex'],
        messageCode: 'nutrition_agent_profile_incomplete',
      },
      energy: null,
    });
  });

  it('rejects malformed versions, ranges and mismatched ages', () => {
    const wrongVersion = makeEnvelope();
    if (!wrongVersion.run.result || !wrongVersion.run.result.agentReadiness) {
      throw new Error('Missing result fixture');
    }
    (wrongVersion.run.result.agentReadiness as Record<string, unknown>).policyVersion =
      'nutrition-agent-readiness-v0';
    expect(readNutritionDeterministicSummary(wrongVersion)).toBeNull();

    const invalidRange = makeEnvelope();
    if (!invalidRange.run.result || !invalidRange.run.result.energyMetrics) {
      throw new Error('Missing result fixture');
    }
    (invalidRange.run.result.energyMetrics as Record<string, unknown>).proteinGrams = {
      min: 180,
      max: 120,
    };
    expect(readNutritionDeterministicSummary(invalidRange)).toBeNull();

    const mismatchedAge = makeEnvelope();
    if (!mismatchedAge.run.result || !mismatchedAge.run.result.energyMetrics) {
      throw new Error('Missing result fixture');
    }
    const inputs = (mismatchedAge.run.result.energyMetrics as Record<string, unknown>).inputs;
    if (typeof inputs !== 'object' || inputs === null || Array.isArray(inputs)) {
      throw new Error('Missing inputs fixture');
    }
    (inputs as Record<string, unknown>).ageYears = 27;
    expect(readNutritionDeterministicSummary(mismatchedAge)).toBeNull();
  });
});

describe('nutrition rejection copy', () => {
  it('describes unreconcilable targets instead of claiming days are missing', () => {
    expect(getNutritionRejectionCopy('nutrition_target_unreconcilable')).toEqual({
      title: 'Current target is mathematically inconsistent',
      message:
        'The current calorie and macro values cannot be reconciled safely without making a macro negative. Edit the target manually, synchronize it, and generate a new proposal.',
    });
  });
});
