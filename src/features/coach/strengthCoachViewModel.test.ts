import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildStrengthCoachViewModel } from './strengthCoachViewModel';

const makeEnvelope = (
  status: CoachRunEnvelope['run']['status'],
  result: Record<string, unknown> | null,
): CoachRunEnvelope => ({
  run: {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    domain: 'strength',
    requestType: 'next_workout_proposal',
    status,
    idempotencyKey: null,
    requestData: {},
    contextSnapshot: {},
    result,
    error: null,
    policyVersions: {},
    requestedAt: '2026-07-22T12:00:00.000Z',
    startedAt: '2026-07-22T12:00:01.000Z',
    completedAt: '2026-07-22T12:00:02.000Z',
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:02.000Z',
  },
  agentRuns: [],
});

const metrics = {
  completedSets: 3,
  totalReps: 24,
  totalTonnage: 1920,
  averageActualRpe: 8,
};

describe('strength coach view model', () => {
  it('maps deterministic session metrics', () => {
    const viewModel = buildStrengthCoachViewModel(
      makeEnvelope('completed', {
        kind: 'strength-session-review',
        metrics,
      }),
    );

    expect(viewModel).toEqual(
      expect.objectContaining({
        kind: 'review',
        metrics,
      }),
    );
  });

  it('maps a validated next-workout proposal', () => {
    const viewModel = buildStrengthCoachViewModel(
      makeEnvelope('completed', {
        kind: 'strength-next-workout-proposal',
        metrics,
        proposal: {
          summary: '1 increased, 0 maintained, 0 reduced based on recorded RPE.',
          sets: [
            {
              sourceSetId: '33333333-3333-4333-8333-333333333333',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              weight: 82,
              reps: 8,
              targetRpe: 8,
              adjustment: 'increase',
              adjustmentPercent: 2.5,
            },
          ],
        },
        guardrail: {
          status: 'valid',
          issues: [],
        },
      }),
    );

    expect(viewModel.kind).toBe('proposal');
    if (viewModel.kind === 'proposal') {
      expect(viewModel.sets[0]).toEqual(
        expect.objectContaining({ exerciseName: 'Bench Press', weight: 82, adjustment: 'increase' }),
      );
      expect(viewModel.guardrailStatus).toBe('valid');
    }
  });

  it('surfaces deterministic rejection issues', () => {
    const viewModel = buildStrengthCoachViewModel(
      makeEnvelope('rejected', {
        kind: 'strength-run-rejected',
        completeness: {
          issues: [{ message: 'Not enough completed sets are available for strength analysis.' }],
        },
      }),
    );

    expect(viewModel).toEqual(
      expect.objectContaining({
        kind: 'rejected',
        issues: ['Not enough completed sets are available for strength analysis.'],
      }),
    );
  });
});
