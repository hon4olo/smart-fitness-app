import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@/api/client';
import { createCoachApi } from './coach';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

const appliedStrategyEnvelope = {
  run: {
    id: runId,
    userId,
    domain: 'nutrition',
    requestType: 'nutrition_strategy_proposal',
    status: 'completed',
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
        rationaleCodes: ['goal_energy_delta'],
        caveatCodes: ['target_requires_confirmation'],
        dataQuality: 'sufficient',
        confidence: 0.82,
        userSummary: 'Validated strategy.',
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
        attempts: 1,
        latencyMs: 100,
      },
      requiresConfirmation: true,
      applied: true,
      appliedAt: '2026-07-23T13:00:00.000Z',
      appliedRevision: 21,
      confirmationIdempotencyKey: `coach-confirm:${runId}:confirm-strategy`,
    },
    error: null,
    policyVersions: {},
    requestedAt: '2026-07-23T12:00:00.000Z',
    startedAt: '2026-07-23T12:00:01.000Z',
    completedAt: '2026-07-23T13:00:00.000Z',
    createdAt: '2026-07-23T12:00:00.000Z',
    updatedAt: '2026-07-23T13:00:00.000Z',
  },
  agentRuns: [],
};

const makeClient = (post: ApiClient['post']): ApiClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post,
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
});

describe('Nutrition Strategy confirmation API', () => {
  it('sends only the confirmation idempotency key and reads the applied run', async () => {
    const post = vi.fn(async () => appliedStrategyEnvelope) as unknown as ApiClient['post'];
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'access-token'),
        refreshAccessToken: vi.fn(async () => null),
      },
      makeClient(post),
    );

    const result = await api.confirmRun(runId, {
      idempotencyKey: 'confirm-strategy',
    });

    expect(post).toHaveBeenCalledWith(
      `/v1/coach/runs/${runId}/confirm`,
      { idempotencyKey: 'confirm-strategy' },
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      }),
    );
    const sentBody = vi.mocked(post).mock.calls[0]?.[1];
    expect(sentBody).toEqual({ idempotencyKey: 'confirm-strategy' });
    expect(JSON.stringify(sentBody)).not.toContain('calories');
    expect(JSON.stringify(sentBody)).not.toContain('protein');
    expect(JSON.stringify(sentBody)).not.toContain('carbs');
    expect(JSON.stringify(sentBody)).not.toContain('fats');
    expect(result.run.result).toEqual(
      expect.objectContaining({
        applied: true,
        appliedRevision: 21,
        confirmationIdempotencyKey: `coach-confirm:${runId}:confirm-strategy`,
      }),
    );
  });
});
