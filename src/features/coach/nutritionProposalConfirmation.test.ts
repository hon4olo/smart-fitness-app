import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { readAppliedNutritionProposal } from './nutritionProposalConfirmation';

const makeEnvelope = (): CoachRunEnvelope => ({
  run: {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    domain: 'nutrition',
    requestType: 'nutrition_target_proposal',
    status: 'completed',
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result: {
      kind: 'nutrition-target-proposal',
      guardrail: {
        status: 'valid',
        requiresConfirmation: true,
        approvedForAutomaticApply: false,
      },
      requiresConfirmation: true,
      applied: true,
      appliedRevision: 21,
      appliedAt: '2026-07-22T16:00:00.000Z',
      confirmationIdempotencyKey: 'coach-confirm:run:key',
    },
    error: null,
    policyVersions: {},
    requestedAt: '2026-07-22T15:59:00.000Z',
    startedAt: '2026-07-22T15:59:01.000Z',
    completedAt: '2026-07-22T15:59:02.000Z',
    createdAt: '2026-07-22T15:59:00.000Z',
    updatedAt: '2026-07-22T16:00:00.000Z',
  },
  agentRuns: [],
});

describe('applied nutrition proposal response', () => {
  it('reads a completed revision-safe confirmation', () => {
    expect(readAppliedNutritionProposal(makeEnvelope())).toEqual({
      revision: 21,
      appliedAt: '2026-07-22T16:00:00.000Z',
      confirmationIdempotencyKey: 'coach-confirm:run:key',
    });
  });

  it('rejects unapplied, malformed and cross-domain responses', () => {
    const unapplied = makeEnvelope();
    if (unapplied.run.result) unapplied.run.result.applied = false;
    expect(() => readAppliedNutritionProposal(unapplied)).toThrow(
      'Invalid applied nutrition proposal: result',
    );

    const malformedRevision = makeEnvelope();
    if (malformedRevision.run.result) malformedRevision.run.result.appliedRevision = 1.5;
    expect(() => readAppliedNutritionProposal(malformedRevision)).toThrow(
      'Invalid applied nutrition proposal: appliedRevision',
    );

    const strength = makeEnvelope();
    strength.run.domain = 'strength';
    strength.run.requestType = 'session_review';
    expect(() => readAppliedNutritionProposal(strength)).toThrow(
      'Invalid applied nutrition proposal: run',
    );
  });
});
