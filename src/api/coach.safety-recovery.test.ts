import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@/api/client';
import { createCoachApi } from './coach';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

const response = {
  run: {
    id: runId,
    userId,
    domain: 'safety_recovery',
    requestType: 'safety_recovery_review',
    status: 'completed',
    idempotencyKey: 'mobile-safety-review-1',
    requestData: { requestType: 'safety_recovery_review', lookbackDays: 7 },
    contextSnapshot: {},
    result: {
      kind: 'safety-recovery-review',
      readiness: {
        policyVersion: 'safety-recovery-readiness-v1',
        status: 'modify',
        latestCheckInAt: '2026-07-23T09:00:00.000Z',
        latestCheckInAgeHours: 1,
        signalCount: 5,
        recommendedLoadMultiplier: 0.7,
        restrictions: [],
        issues: [],
        requiresExplicitConfirmation: true,
        approvedForAutomaticApply: false,
      },
    },
    error: null,
    policyVersions: { readiness: 'safety-recovery-readiness-v1' },
    requestedAt: '2026-07-23T10:00:00.000Z',
    startedAt: '2026-07-23T10:00:00.000Z',
    completedAt: '2026-07-23T10:00:00.000Z',
    createdAt: '2026-07-23T10:00:00.000Z',
    updatedAt: '2026-07-23T10:00:00.000Z',
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

describe('Safety Recovery Coach API contract', () => {
  it('posts only the deterministic review request fields', async () => {
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

    const result = await api.startSafetyRecoveryRun({
      lookbackDays: 7,
      idempotencyKey: 'mobile-safety-review-1',
    });

    expect(result.run).toMatchObject({
      domain: 'safety_recovery',
      requestType: 'safety_recovery_review',
      status: 'completed',
    });
    expect(postMock).toHaveBeenCalledWith(
      '/v1/coach/safety/runs',
      {
        requestType: 'safety_recovery_review',
        lookbackDays: 7,
        idempotencyKey: 'mobile-safety-review-1',
      },
      expect.objectContaining({
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      }),
    );
    const serialized = JSON.stringify(postMock.mock.calls[0]?.[1]);
    expect(serialized).not.toContain('notes');
    expect(serialized).not.toContain('limitations');
    expect(serialized).not.toContain('recoveryCheckIns');
  });
});
