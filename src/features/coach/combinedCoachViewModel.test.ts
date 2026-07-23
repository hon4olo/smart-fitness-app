import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildCombinedCoachViewModel } from './combinedCoachViewModel';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const strengthRunId = '33333333-3333-4333-8333-333333333333';
const nutritionRunId = '44444444-4444-4444-8444-444444444444';
const safetyRunId = '55555555-5555-4555-8555-555555555555';
const sessionId = '66666666-6666-4666-8666-666666666666';

const makeEnvelope = (): CoachRunEnvelope => ({
  run: {
    id: runId,
    userId,
    domain: 'combined',
    requestType: 'combined_review',
    status: 'completed',
    idempotencyKey: 'combined-1',
    requestData: {},
    contextSnapshot: {},
    result: {
      kind: 'combined-coach-review',
      childRunIds: {
        strength: strengthRunId,
        nutrition: nutritionRunId,
        safety: safetyRunId,
      },
      review: {
        policyVersion: 'combined-coach-review-v1',
        status: 'ready',
        strength: {
          runId: strengthRunId,
          status: 'ready',
          completedSets: 8,
          totalReps: 64,
          totalTonnage: 5_120,
          averageActualRpe: 8,
          primarySessionId: sessionId,
        },
        nutrition: {
          runId: nutritionRunId,
          status: 'ready',
          trackedDays: 7,
          coveragePercent: 100,
          averageCaloriesPerTrackedDay: 2_450,
          averageProteinPerTrackedDay: 175,
          targetAvailable: true,
          agentReadiness: 'ready',
        },
        safety: {
          runId: safetyRunId,
          status: 'ready',
          recommendedLoadMultiplier: 1,
          restrictionCount: 0,
          issueCount: 0,
        },
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
});

describe('Combined Coach view model', () => {
  it('parses a ready deterministic three-domain review', () => {
    expect(buildCombinedCoachViewModel(makeEnvelope())).toEqual({
      kind: 'review',
      title: 'Combined review ready',
      message:
        'Strength, Nutrition, and Safety inputs passed the deterministic final guardrail.',
      status: 'ready',
      rejected: false,
      reason: null,
      policyVersion: 'combined-coach-review-v1',
      strength: {
        runId: strengthRunId,
        status: 'ready',
        completedSets: 8,
        totalReps: 64,
        totalTonnage: 5_120,
        averageActualRpe: 8,
        primarySessionId: sessionId,
      },
      nutrition: {
        runId: nutritionRunId,
        status: 'ready',
        trackedDays: 7,
        coveragePercent: 100,
        averageCaloriesPerTrackedDay: 2_450,
        averageProteinPerTrackedDay: 175,
        targetAvailable: true,
        agentReadiness: 'ready',
      },
      safety: {
        runId: safetyRunId,
        status: 'ready',
        recommendedLoadMultiplier: 1,
        restrictionCount: 0,
        issueCount: 0,
      },
      issues: [],
      automaticApplication: false,
    });
  });

  it('parses typed needs-input and blocked parent rejections', () => {
    const needsInput = makeEnvelope();
    needsInput.run.status = 'rejected';
    if (!needsInput.run.result) throw new Error('Missing combined fixture');
    needsInput.run.result.kind = 'combined-coach-run-rejected';
    needsInput.run.result.reason = 'combined_coach_input_required';
    const review = needsInput.run.result.review as Record<string, unknown>;
    review.status = 'needs_input';
    const nutrition = review.nutrition as Record<string, unknown>;
    nutrition.status = 'needs_input';
    nutrition.agentReadiness = 'needs_input';
    review.issues = [
      {
        code: 'COMBINED_NUTRITION_INPUT_REQUIRED',
        severity: 'input_required',
        domain: 'nutrition',
        message: 'Nutrition inputs are incomplete.',
      },
    ];
    expect(buildCombinedCoachViewModel(needsInput)).toMatchObject({
      kind: 'review',
      status: 'needs_input',
      rejected: true,
      reason: 'combined_coach_input_required',
      title: 'More data required',
    });

    const blocked = makeEnvelope();
    blocked.run.status = 'rejected';
    if (!blocked.run.result) throw new Error('Missing blocked fixture');
    blocked.run.result.kind = 'combined-coach-run-rejected';
    blocked.run.result.reason = 'combined_coach_hard_block';
    const blockedReview = blocked.run.result.review as Record<string, unknown>;
    blockedReview.status = 'blocked';
    const safety = blockedReview.safety as Record<string, unknown>;
    safety.status = 'blocked';
    safety.recommendedLoadMultiplier = 0;
    safety.restrictionCount = 1;
    safety.issueCount = 1;
    blockedReview.issues = [
      {
        code: 'COMBINED_TRAINING_BLOCKED',
        severity: 'hard_block',
        domain: 'safety_recovery',
        message: 'An explicit limitation pauses training.',
      },
    ];
    expect(buildCombinedCoachViewModel(blocked)).toMatchObject({
      kind: 'review',
      status: 'blocked',
      rejected: true,
      reason: 'combined_coach_hard_block',
      title: 'Combined review blocked',
      safety: { recommendedLoadMultiplier: 0 },
    });
  });

  it('rejects lifecycle mismatches, child ID mismatches, and automatic apply', () => {
    const lifecycle = makeEnvelope();
    lifecycle.run.status = 'rejected';
    expect(buildCombinedCoachViewModel(lifecycle)).toMatchObject({
      kind: 'failed',
      title: 'Unsupported result',
    });

    const childMismatch = makeEnvelope();
    if (!childMismatch.run.result) throw new Error('Missing child fixture');
    (childMismatch.run.result.childRunIds as Record<string, unknown>).strength =
      '77777777-7777-4777-8777-777777777777';
    expect(buildCombinedCoachViewModel(childMismatch)).toMatchObject({
      kind: 'failed',
      title: 'Invalid combined review',
    });

    const unsafe = makeEnvelope();
    if (!unsafe.run.result) throw new Error('Missing unsafe fixture');
    (unsafe.run.result.review as Record<string, unknown>).automaticApplication = true;
    expect(buildCombinedCoachViewModel(unsafe)).toMatchObject({
      kind: 'failed',
      title: 'Invalid combined review',
    });
  });

  it('rejects malformed domain metrics instead of coercing them', () => {
    const malformed = makeEnvelope();
    if (!malformed.run.result) throw new Error('Missing malformed fixture');
    const review = malformed.run.result.review as Record<string, unknown>;
    (review.strength as Record<string, unknown>).completedSets = '8';
    expect(buildCombinedCoachViewModel(malformed)).toMatchObject({
      kind: 'failed',
      title: 'Invalid combined review',
    });
  });
});
