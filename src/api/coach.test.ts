import { describe, expect, it, vi } from 'vitest';

import { ApiError, type ApiClient } from '@/api/client';
import { createCoachApi, parseCoachRunEnvelope } from './coach';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

type RawCoachAgentRun = Record<string, unknown>;
type RawCoachEnvelope = {
  run: Record<string, unknown>;
  agentRuns: RawCoachAgentRun[];
};

const makeStrengthEnvelope = (
  status: 'queued' | 'running' | 'completed' | 'rejected' | 'failed',
): RawCoachEnvelope => ({
  run: {
    id: runId,
    userId,
    domain: 'strength',
    requestType: 'session_review',
    status,
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result: status === 'completed' ? { kind: 'strength-session-review' } : null,
    error: null,
    policyVersions: { metrics: 'strength-metrics-v2' },
    requestedAt: '2026-07-22T12:00:00.000Z',
    startedAt: '2026-07-22T12:00:01.000Z',
    completedAt: status === 'completed' ? '2026-07-22T12:00:02.000Z' : null,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:02.000Z',
  },
  agentRuns: [],
});

const makeNutritionEnvelope = (
  status: 'queued' | 'running' | 'completed' | 'rejected' | 'failed' = 'completed',
  requestType: 'nutrition_review' | 'nutrition_target_proposal' = 'nutrition_review',
): RawCoachEnvelope => ({
  run: {
    id: runId,
    userId,
    domain: 'nutrition',
    requestType,
    status,
    idempotencyKey: null,
    requestData: { lookbackDays: 14 },
    contextSnapshot: {},
    result:
      status === 'completed'
        ? {
            kind:
              requestType === 'nutrition_review'
                ? 'nutrition-review'
                : 'nutrition-target-proposal',
            metrics: {},
          }
        : null,
    error: null,
    policyVersions: {
      context: 'nutrition-context-v1',
      math: 'nutrition-math-v1',
      proposal: 'nutrition-target-proposal-v1',
      guardrail: 'nutrition-target-guardrail-v1',
    },
    requestedAt: '2026-07-22T12:00:00.000Z',
    startedAt: '2026-07-22T12:00:01.000Z',
    completedAt: status === 'completed' ? '2026-07-22T12:00:02.000Z' : null,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:02.000Z',
  },
  agentRuns: [],
});

const makeClient = (overrides: Partial<ApiClient>): ApiClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

describe('coach API', () => {
  it('parses and sorts a valid strength run envelope', () => {
    const value = makeStrengthEnvelope('completed');
    value.agentRuns = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        coachRunId: runId,
        userId,
        sequence: 2,
        agentName: 'strength-metrics',
        status: 'completed',
        policyVersion: 'strength-metrics-v2',
        inputSnapshot: {},
        output: {},
        error: null,
        startedAt: '2026-07-22T12:00:01.000Z',
        completedAt: '2026-07-22T12:00:02.000Z',
        createdAt: '2026-07-22T12:00:01.000Z',
        updatedAt: '2026-07-22T12:00:02.000Z',
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        coachRunId: runId,
        userId,
        sequence: 1,
        agentName: 'strength-data-completeness',
        status: 'completed',
        policyVersion: 'strength-data-completeness-v2',
        inputSnapshot: {},
        output: {},
        error: null,
        startedAt: '2026-07-22T12:00:01.000Z',
        completedAt: '2026-07-22T12:00:02.000Z',
        createdAt: '2026-07-22T12:00:01.000Z',
        updatedAt: '2026-07-22T12:00:02.000Z',
      },
    ];

    const parsed = parseCoachRunEnvelope(value);
    expect(parsed.agentRuns.map((agentRun) => agentRun.sequence)).toEqual([1, 2]);
  });

  it('starts an authenticated nutrition review on the nutrition endpoint', async () => {
    const post = vi.fn(async () => makeNutritionEnvelope());
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'token'),
        refreshAccessToken: vi.fn(async () => null),
      },
      makeClient({ post: post as unknown as ApiClient['post'] }),
    );

    const result = await api.startNutritionRun({ lookbackDays: 14 });

    expect(result.run.domain).toBe('nutrition');
    expect(result.run.requestType).toBe('nutrition_review');
    expect(post).toHaveBeenCalledWith(
      '/v1/coach/nutrition/runs',
      { requestType: 'nutrition_review', lookbackDays: 14 },
      expect.objectContaining({
        headers: { authorization: 'Bearer token' },
        retry: false,
      }),
    );
  });

  it('starts a guarded nutrition target proposal on the same endpoint', async () => {
    const post = vi.fn(async () =>
      makeNutritionEnvelope('completed', 'nutrition_target_proposal'),
    );
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'token'),
        refreshAccessToken: vi.fn(async () => null),
      },
      makeClient({ post: post as unknown as ApiClient['post'] }),
    );

    const result = await api.startNutritionRun({
      requestType: 'nutrition_target_proposal',
      lookbackDays: 14,
    });

    expect(result.run.requestType).toBe('nutrition_target_proposal');
    expect(post).toHaveBeenCalledWith(
      '/v1/coach/nutrition/runs',
      { requestType: 'nutrition_target_proposal', lookbackDays: 14 },
      expect.objectContaining({ retry: false }),
    );
  });

  it('rejects a request type that does not belong to the response domain', () => {
    const invalid = makeNutritionEnvelope();
    invalid.run.requestType = 'session_review';

    expect(() => parseCoachRunEnvelope(invalid)).toThrow(
      'Invalid coach response: requestType',
    );
  });

  it('refreshes an expired access token once and retries the request', async () => {
    const post = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ code: 'unauthorized', message: 'Unauthorized', status: 401 }),
      )
      .mockResolvedValueOnce(makeStrengthEnvelope('completed'));
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'expired-token'),
        refreshAccessToken: vi.fn(async () => 'fresh-token'),
      },
      makeClient({ post }),
    );

    const result = await api.startStrengthRun({ requestType: 'session_review' });

    expect(result.run.status).toBe('completed');
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({ headers: { authorization: 'Bearer fresh-token' } }),
    );
  });

  it('polls queued runs until a terminal response is returned', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce(makeStrengthEnvelope('running'))
      .mockResolvedValueOnce(makeStrengthEnvelope('completed'));
    const api = createCoachApi(
      {
        getAccessToken: vi.fn(async () => 'token'),
        refreshAccessToken: vi.fn(async () => null),
      },
      makeClient({ get }),
    );

    const result = await api.waitForTerminalRun(
      parseCoachRunEnvelope(makeStrengthEnvelope('queued')),
      { intervalMs: 1, maxPolls: 3 },
    );

    expect(result.run.status).toBe('completed');
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('rejects cross-user agent run records', () => {
    const value = makeStrengthEnvelope('completed');
    value.agentRuns = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        coachRunId: runId,
        userId: '99999999-9999-4999-8999-999999999999',
        sequence: 1,
        agentName: 'strength-metrics',
        status: 'completed',
        policyVersion: null,
        inputSnapshot: {},
        output: {},
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: '2026-07-22T12:00:01.000Z',
        updatedAt: '2026-07-22T12:00:02.000Z',
      },
    ];

    expect(() => parseCoachRunEnvelope(value)).toThrow('Invalid coach response ownership');
  });
});
