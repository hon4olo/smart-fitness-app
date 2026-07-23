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
    domain: 'combined',
    requestType: 'combined_review',
    status: 'completed',
    idempotencyKey: 'mobile-combined-1',
    requestData: {
      requestType: 'combined_review',
      requestedSessionId: sessionId,
      strengthHistoryLimit: 8,
      nutritionLookbackDays: 7,
      safetyLookbackDays: 14,
    },
    contextSnapshot: {},
    result: {
      kind: 'combined-coach-review',
      childRunIds: {
        strength: '44444444-4444-4444-8444-444444444444',
        nutrition: '55555555-5555-4555-8555-555555555555',
        safety: '66666666-6666-4666-8666-666666666666',
      },
      review: {
        policyVersion: 'combined-coach-review-v1',
        status: 'ready',
        strength: {},
        nutrition: {},
        safety: {},
        issues: [],
        automaticApplication: false,
      },
    },
    error: null,
    policyVersions: { finalGuardrail: 'combined-coach-review-v1' },
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

describe('Combined Coach API contract', () => {
  it('sends only bounded review selectors and no domain records', async () => {
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

    const result = await api.startCombinedRun({
      requestedSessionId: sessionId,
      strengthHistoryLimit: 8,
      nutritionLookbackDays: 7,
      safetyLookbackDays: 14,
      idempotencyKey: 'mobile-combined-1',
    });

    expect(result.run.domain).toBe('combined');
    expect(result.run.requestType).toBe('combined_review');
    expect(postMock).toHaveBeenCalledWith(
      '/v1/coach/combined/runs',
      {
        requestType: 'combined_review',
        requestedSessionId: sessionId,
        strengthHistoryLimit: 8,
        nutritionLookbackDays: 7,
        safetyLookbackDays: 14,
        idempotencyKey: 'mobile-combined-1',
      },
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      }),
    );

    const serializedBody = JSON.stringify(postMock.mock.calls[0]?.[1]);
    expect(serializedBody).not.toContain('foodEntries');
    expect(serializedBody).not.toContain('workoutSets');
    expect(serializedBody).not.toContain('recoveryCheckIns');
    expect(serializedBody).not.toContain('limitations');
  });
});
