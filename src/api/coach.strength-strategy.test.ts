import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@/api/client';
import { createCoachApi } from './coach';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';

const response = {
  run: {
    id: runId,
    userId,
    domain: 'strength',
    requestType: 'strength_strategy_proposal',
    status: 'rejected',
    idempotencyKey: 'strength-strategy-1',
    requestData: { requestedSessionId: sessionId, historyLimit: 8 },
    contextSnapshot: {},
    result: {
      kind: 'strength-run-rejected',
      reason: 'strength_model_provider_unavailable',
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
};

const makeClient = (post: ApiClient['post']): ApiClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post,
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
});

describe('Strength Strategy API contract', () => {
  it('sends only run selection and idempotency inputs', async () => {
    const postMock = vi.fn(async () => response);
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'access-token'),
        refreshAccessToken: vi.fn(async () => null),
      },
      makeClient(postMock as unknown as ApiClient['post']),
    );

    const result = await api.startStrengthRun({
      requestType: 'strength_strategy_proposal',
      requestedSessionId: sessionId,
      historyLimit: 8,
      idempotencyKey: 'strength-strategy-1',
    });

    expect(result.run.requestType).toBe('strength_strategy_proposal');
    expect(postMock).toHaveBeenCalledWith(
      '/v1/coach/strength/runs',
      {
        requestType: 'strength_strategy_proposal',
        requestedSessionId: sessionId,
        historyLimit: 8,
        idempotencyKey: 'strength-strategy-1',
      },
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      }),
    );
    expect(JSON.stringify(postMock.mock.calls[0]?.[1])).not.toContain('sets');
    expect(JSON.stringify(postMock.mock.calls[0]?.[1])).not.toContain('weight');
  });
});
