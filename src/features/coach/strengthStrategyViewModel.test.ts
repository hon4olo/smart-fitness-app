import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildStrengthStrategyViewModel } from './strengthStrategyViewModel';

const runId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const setId = '44444444-4444-4444-8444-444444444444';
const templateId = '55555555-5555-4555-8555-555555555555';

const makeEnvelope = (): CoachRunEnvelope => ({
  run: {
    id: runId,
    userId,
    domain: 'strength',
    requestType: 'strength_strategy_proposal',
    status: 'completed',
    idempotencyKey: null,
    requestData: { historyLimit: 8 },
    contextSnapshot: {},
    result: {
      kind: 'strength-strategy-proposal',
      metrics: {
        completedSets: 3,
        totalReps: 24,
        totalTonnage: 1_920,
        averageActualRpe: 7.8,
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
        rationaleCodes: ['primary_session_continuity', 'rpe_guided_progression'],
        caveatCodes: ['requires_confirmation', 'limitations_not_available'],
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
        attempts: 2,
        latencyMs: 24,
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

describe('Strength Strategy view model', () => {
  it('reads a validated preview and keeps it explicitly unapplied', () => {
    expect(buildStrengthStrategyViewModel(makeEnvelope())).toEqual({
      kind: 'proposal',
      runId,
      title: 'AI Strength Strategy preview',
      message: 'Progress one set within deterministic limits.',
      metrics: {
        completedSets: 3,
        totalReps: 24,
        totalTonnage: 1_920,
        averageActualRpe: 7.8,
      },
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
      rationaleCodes: ['primary_session_continuity', 'rpe_guided_progression'],
      caveatCodes: ['requires_confirmation', 'limitations_not_available'],
      dataQuality: 'sufficient',
      confidence: 0.84,
      guardrailStatus: 'valid',
      proposedTonnage: 660,
      volumeChangePercent: 3.13,
      issues: [],
      provider: 'fixture',
      model: 'fixture-strength-model',
      attempts: 2,
      latencyMs: 24,
      requiresConfirmation: true,
      applied: false,
    });
  });

  it('reads a confirmed template only with complete server metadata', () => {
    const applied = makeEnvelope();
    if (!applied.run.result) throw new Error('Missing result fixture');
    applied.run.result = {
      ...applied.run.result,
      applied: true,
      appliedAt: '2026-07-23T12:05:00.000Z',
      appliedRevision: 14,
      templateId,
    };

    expect(buildStrengthStrategyViewModel(applied)).toMatchObject({
      kind: 'applied',
      runId,
      title: 'Strength template created',
      applied: true,
      appliedAt: '2026-07-23T12:05:00.000Z',
      appliedRevision: 14,
      templateId,
    });

    const malformed = makeEnvelope();
    if (!malformed.run.result) throw new Error('Missing result fixture');
    malformed.run.result = {
      ...malformed.run.result,
      applied: true,
      appliedAt: 'bad-date',
      appliedRevision: 14,
      templateId,
    };
    expect(buildStrengthStrategyViewModel(malformed)).toMatchObject({
      kind: 'failed',
      title: 'Invalid confirmation result',
    });
  });

  it('maps provider-disabled and retry-exhaustion rejections to distinct copy', () => {
    const unavailable = makeEnvelope();
    unavailable.run.status = 'rejected';
    unavailable.run.result = {
      kind: 'strength-run-rejected',
      reason: 'strength_model_provider_unavailable',
    };
    expect(buildStrengthStrategyViewModel(unavailable)).toMatchObject({
      kind: 'rejected',
      title: 'AI Strength Strategy unavailable',
      reason: 'strength_model_provider_unavailable',
    });

    const exhausted = makeEnvelope();
    exhausted.run.status = 'rejected';
    exhausted.run.result = {
      kind: 'strength-run-rejected',
      reason: 'strength_strategy_invalid_after_retries',
      issues: [{ message: 'Weight increase exceeded the policy.' }],
    };
    expect(buildStrengthStrategyViewModel(exhausted)).toMatchObject({
      kind: 'rejected',
      title: 'Strategy rejected after validation',
      issues: ['Weight increase exceeded the policy.'],
    });
  });

  it('rejects duplicate source sets and malformed guardrail metadata', () => {
    const duplicate = makeEnvelope();
    const result = duplicate.run.result;
    if (!result || typeof result.proposal !== 'object' || result.proposal === null) {
      throw new Error('Missing proposal fixture');
    }
    const proposal = result.proposal as Record<string, unknown>;
    proposal.sets = [
      ...(proposal.sets as unknown[]),
      { ...((proposal.sets as Record<string, unknown>[])[0] as object) },
    ];
    expect(buildStrengthStrategyViewModel(duplicate)).toMatchObject({
      kind: 'failed',
      title: 'Invalid strategy',
    });

    const malformed = makeEnvelope();
    if (!malformed.run.result || typeof malformed.run.result.guardrail !== 'object') {
      throw new Error('Missing guardrail fixture');
    }
    (malformed.run.result.guardrail as Record<string, unknown>).issues = [
      { code: 'BAD', severity: 'invalid', path: 'sets.0', message: 'Bad' },
    ];
    expect(buildStrengthStrategyViewModel(malformed)).toMatchObject({
      kind: 'failed',
      title: 'Invalid strategy',
    });
  });
});
