import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope, CoachRunStatus } from '@/api/coach';
import { buildNutritionStrategyViewModel } from './nutritionStrategyViewModel';

const makeEnvelope = (
  status: CoachRunStatus = 'completed',
): CoachRunEnvelope => ({
  run: {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    domain: 'nutrition',
    requestType: 'nutrition_strategy_proposal',
    status,
    idempotencyKey: null,
    requestData: { lookbackDays: 14 },
    contextSnapshot: {},
    result: {
      kind: 'nutrition-strategy-proposal',
      proposal: {
        schemaVersion: 'nutrition-strategy-v1',
        strategy: 'reduce',
        calorieTarget: 2_200,
        macros: { protein: 160, carbs: 250, fats: 62 },
        adjustmentCadenceDays: 14,
        rationaleCodes: ['goal_energy_delta', 'current_target_continuity'],
        caveatCodes: ['target_requires_confirmation'],
        dataQuality: 'sufficient',
        confidence: 0.82,
        userSummary: 'Keep calories stable while preserving deterministic protein and fat ranges.',
      },
      guardrail: {
        policyVersion: 'nutrition-strategy-guardrail-v1',
        status: 'valid',
        calculatedMacroCalories: 2_198,
        calorieMathMismatch: 2,
        issues: [],
        requiresConfirmation: true,
        approvedForAutomaticApply: false,
      },
      model: {
        provider: 'openai-compatible',
        model: 'nutrition-model',
        attempts: 2,
        latencyMs: 850,
        usage: { inputTokens: 200, outputTokens: 80 },
      },
      requiresConfirmation: true,
      applied: false,
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

describe('nutrition strategy view model', () => {
  it('reads a completed validated preview without exposing an apply action', () => {
    expect(buildNutritionStrategyViewModel(makeEnvelope())).toEqual({
      kind: 'proposal',
      title: 'Nutrition strategy preview',
      message: 'The structured proposal passed deterministic validation. It has not been applied.',
      proposal: {
        strategy: 'reduce',
        calorieTarget: 2_200,
        macros: { protein: 160, carbs: 250, fats: 62 },
        adjustmentCadenceDays: 14,
        rationaleCodes: ['goal_energy_delta', 'current_target_continuity'],
        caveatCodes: ['target_requires_confirmation'],
        dataQuality: 'sufficient',
        confidence: 0.82,
        userSummary: 'Keep calories stable while preserving deterministic protein and fat ranges.',
      },
      guardrailStatus: 'valid',
      issues: [],
      calculatedMacroCalories: 2_198,
      calorieMathMismatch: 2,
      modelAttempts: 2,
      modelLatencyMs: 850,
      requiresConfirmation: true,
      applied: false,
    });
  });

  it('maps the disabled provider to a typed rejection', () => {
    const envelope = makeEnvelope('rejected');
    envelope.run.result = {
      kind: 'nutrition-run-rejected',
      reason: 'nutrition_model_provider_unavailable',
    };

    expect(buildNutritionStrategyViewModel(envelope)).toEqual({
      kind: 'rejected',
      title: 'AI strategy is unavailable',
      message: 'AI strategy is not enabled on this backend.',
      reason: 'nutrition_model_provider_unavailable',
      issues: [],
    });
  });

  it('maps deterministic retry exhaustion without presenting model output as valid', () => {
    const envelope = makeEnvelope('rejected');
    envelope.run.result = {
      kind: 'nutrition-run-rejected',
      reason: 'nutrition_strategy_invalid_after_retries',
      issues: [
        {
          code: 'NUTRITION_STRATEGY_CALORIES_OUTSIDE_RANGE',
          severity: 'modify',
          path: 'calorieTarget',
          message: 'Calories must remain inside the deterministic range.',
        },
      ],
    };

    expect(buildNutritionStrategyViewModel(envelope)).toEqual({
      kind: 'rejected',
      title: 'Strategy failed deterministic validation',
      message: 'The model did not produce a valid bounded proposal after three attempts.',
      reason: 'nutrition_strategy_invalid_after_retries',
      issues: [
        {
          code: 'NUTRITION_STRATEGY_CALORIES_OUTSIDE_RANGE',
          severity: 'modify',
          path: 'calorieTarget',
          message: 'Calories must remain inside the deterministic range.',
        },
      ],
    });
  });

  it('shows final guardrail rejection instead of a valid preview', () => {
    const envelope = makeEnvelope('rejected');
    const result = envelope.run.result;
    if (!result || typeof result.guardrail !== 'object' || result.guardrail === null) {
      throw new Error('Missing guardrail fixture');
    }
    (result.guardrail as Record<string, unknown>).status = 'blocked';
    (result.guardrail as Record<string, unknown>).issues = [
      {
        code: 'NUTRITION_STRATEGY_MACRO_CALORIES_BLOCKED',
        severity: 'block',
        path: 'macros',
        message: 'Macro calories materially disagree with the proposed target.',
      },
    ];

    expect(buildNutritionStrategyViewModel(envelope)).toEqual({
      kind: 'rejected',
      title: 'Strategy proposal did not pass guardrails',
      message: 'The preview was rejected and cannot be applied. Review the deterministic issues below.',
      reason: 'nutrition_strategy_guardrail_blocked',
      issues: [
        {
          code: 'NUTRITION_STRATEGY_MACRO_CALORIES_BLOCKED',
          severity: 'block',
          path: 'macros',
          message: 'Macro calories materially disagree with the proposed target.',
        },
      ],
    });
  });

  it('rejects malformed schemas, unsafe confidence and applied strategy results', () => {
    const wrongSchema = makeEnvelope();
    const wrongSchemaResult = wrongSchema.run.result;
    if (!wrongSchemaResult || typeof wrongSchemaResult.proposal !== 'object' || wrongSchemaResult.proposal === null) {
      throw new Error('Missing proposal fixture');
    }
    (wrongSchemaResult.proposal as Record<string, unknown>).schemaVersion = 'nutrition-strategy-v0';
    expect(buildNutritionStrategyViewModel(wrongSchema)).toMatchObject({ kind: 'failed' });

    const unsafeConfidence = makeEnvelope();
    const unsafeResult = unsafeConfidence.run.result;
    if (!unsafeResult || typeof unsafeResult.proposal !== 'object' || unsafeResult.proposal === null) {
      throw new Error('Missing proposal fixture');
    }
    (unsafeResult.proposal as Record<string, unknown>).confidence = 1.5;
    expect(buildNutritionStrategyViewModel(unsafeConfidence)).toMatchObject({ kind: 'failed' });

    const applied = makeEnvelope();
    if (!applied.run.result) throw new Error('Missing result fixture');
    applied.run.result.applied = true;
    expect(buildNutritionStrategyViewModel(applied)).toMatchObject({ kind: 'failed' });
  });

  it('keeps queued runs in a pending state', () => {
    expect(buildNutritionStrategyViewModel(makeEnvelope('queued'))).toEqual({
      kind: 'pending',
      title: 'Nutrition strategy in progress',
      message: 'The structured subagent and deterministic guardrails are evaluating the proposal.',
    });
  });
});
