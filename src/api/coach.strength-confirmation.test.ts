import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@/api/client';
import { createCoachApi } from './coach';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const templateId = '33333333-3333-4333-8333-333333333333';
const sessionId = '44444444-4444-4444-8444-444444444444';
const setId = '55555555-5555-4555-8555-555555555555';

const response = {
  run: {
    id: runId,
    userId,
    domain: 'strength',
    requestType: 'strength_strategy_proposal',
    status: 'completed',
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result: {
      kind: 'strength-strategy-proposal',
      metrics: {
        completedSets: 1,
        totalReps: 8,
        totalTonnage: 640,
        averageActualRpe: 7.5,
      },
      proposal: {
        schemaVersion: 'strength-strategy-v1',
        sourceSessionId: sessionId,
        strategy: 'progress',
        sets: [
          {
            sourceSetId: setId,
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            weight: 82.5,
            reps: 8,
            targetRpe: 8,
            adjustment: 'increase',
            rationaleCode: 'low_recorded_rpe',
          },
        ],
        rationaleCodes: ['primary_session_continuity'],
        caveatCodes: ['requires_confirmation'],
        dataQuality: 'sufficient',
        confidence: 0.84,
        userSummary: 'Progress one set within deterministic limits.',
      },
      guardrail: {
        policyVersion: 'strength-strategy-guardrail-v1',
        status: 'valid',
        proposedTonnage: 660,
        volumeChangePercent: 3.13,
        issues: [],
        requiresConfirmation: true,
        approvedForAutomaticApply: false,
      },
      model: {
        provider: 'fixture',
        model: 'fixture-strength-model',
        attempts: 1,
        latencyMs: 12,
      },
      requiresConfirmation: true,
      applied: true,
      appliedAt: '2026-07-23T12:05:00.000Z',
      appliedRevision: 14,
      templateId,
    },
    error: null,
    policyVersions: {},
    requestedAt: '2026-07-23T12:00:00.000Z',
    startedAt: '2026-07-23T12:00:01.000Z',
    completedAt: '2026-07-23T12:00:02.000Z',
    createdAt: '2026-07-23T12:00:00.000Z',
    updatedAt: '2026-07-23T12:05:00.000Z',
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

describe('Strength confirmation API contract', () => {
  it('sends only the confirmation idempotency key for the selected run', async () => {
    const postMock = vi.fn(
      async (_path: string, _body?: unknown, _options?: unknown) => response,
    );
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'access-token'),
        refreshAccessToken: vi.fn(async () => null),
      },
      makeClient(postMock as unknown as ApiClient['post']),
    );

    const result = await api.confirmRun(runId, {
      idempotencyKey: 'mobile-strength-confirm-1',
    });

    expect(result.run.result).toMatchObject({
      applied: true,
      appliedRevision: 14,
      templateId,
    });
    expect(postMock).toHaveBeenCalledWith(
      `/v1/coach/runs/${runId}/confirm`,
      { idempotencyKey: 'mobile-strength-confirm-1' },
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      }),
    );
    const serializedBody = JSON.stringify(postMock.mock.calls[0]?.[1]);
    expect(serializedBody).not.toContain('sets');
    expect(serializedBody).not.toContain('weight');
    expect(serializedBody).not.toContain('templateId');
  });
});
