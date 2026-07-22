import { describe, expect, it } from 'vitest';

import type { CoachRunEnvelope } from '@/api/coach';
import { buildNutritionCoachViewModel } from './nutritionCoachViewModel';

const makeMetrics = () => ({
  policyVersion: 'nutrition-math-v1',
  contextSchemaVersion: 1,
  period: {
    lookbackDays: 3,
    startDate: '2026-07-20',
    endDate: '2026-07-22',
    startInclusive: '2026-07-20T00:00:00.000Z',
    endExclusive: '2026-07-23T00:00:00.000Z',
  },
  dataCompleteness: {
    entryCount: 4,
    trackedDays: 3,
    missingDays: 0,
    coveragePercent: 100,
    status: 'complete',
  },
  totals: { calories: 6600, protein: 510, carbs: 750, fats: 210 },
  averages: {
    perCalendarDay: { calories: 2200, protein: 170, carbs: 250, fats: 70 },
    perTrackedDay: { calories: 2200, protein: 170, carbs: 250, fats: 70 },
  },
  targetComparison: {
    target: { calories: 2200, protein: 170, carbs: 250, fats: 70 },
    averageCalendarDayDelta: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    averageTrackedDayDelta: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    daysWithinCaloriesTenPercent: 3,
    trackedDayAdherencePercent: 100,
  },
  proteinPerKg: {
    weightKg: 70,
    averageCalendarDay: 2.43,
    averageTrackedDay: 2.43,
  },
  days: [
    {
      date: '2026-07-20',
      entryCount: 1,
      tracked: true,
      totals: { calories: 2100, protein: 165, carbs: 235, fats: 68 },
      targetDelta: { calories: -100, protein: -5, carbs: -15, fats: -2 },
      caloriesWithinTenPercent: true,
    },
    {
      date: '2026-07-21',
      entryCount: 1,
      tracked: true,
      totals: { calories: 2200, protein: 170, carbs: 250, fats: 70 },
      targetDelta: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      caloriesWithinTenPercent: true,
    },
    {
      date: '2026-07-22',
      entryCount: 2,
      tracked: true,
      totals: { calories: 2300, protein: 175, carbs: 265, fats: 72 },
      targetDelta: { calories: 100, protein: 5, carbs: 15, fats: 2 },
      caloriesWithinTenPercent: true,
    },
  ],
});

const makeEnvelope = (
  status: CoachRunEnvelope['run']['status'] = 'completed',
): CoachRunEnvelope => ({
  run: {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    domain: 'nutrition',
    requestType: 'nutrition_review',
    status,
    idempotencyKey: null,
    requestData: { lookbackDays: 3 },
    contextSnapshot: {},
    result:
      status === 'rejected'
        ? {
            kind: 'nutrition-run-rejected',
            reason: 'insufficient_logged_days',
            metrics: {
              ...makeMetrics(),
              dataCompleteness: {
                entryCount: 1,
                trackedDays: 1,
                missingDays: 2,
                coveragePercent: 33.33,
                status: 'insufficient',
              },
            },
          }
        : status === 'completed'
          ? {
              kind: 'nutrition-review',
              metrics: makeMetrics(),
              targetAvailable: true,
              latestWeightAvailable: true,
            }
          : null,
    error: status === 'failed' ? { code: 'FAILED', message: 'Backend failed' } : null,
    policyVersions: {
      context: 'nutrition-context-v1',
      math: 'nutrition-math-v1',
    },
    requestedAt: '2026-07-22T12:00:00.000Z',
    startedAt: '2026-07-22T12:00:01.000Z',
    completedAt: status === 'completed' || status === 'rejected' ? '2026-07-22T12:00:02.000Z' : null,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:02.000Z',
  },
  agentRuns: [],
});

describe('nutrition coach view model', () => {
  it('builds a safe deterministic nutrition review', () => {
    const viewModel = buildNutritionCoachViewModel(makeEnvelope());

    expect(viewModel.kind).toBe('review');
    if (viewModel.kind !== 'review') return;
    expect(viewModel.metrics.completeness).toEqual({
      entryCount: 4,
      trackedDays: 3,
      missingDays: 0,
      coveragePercent: 100,
      status: 'complete',
    });
    expect(viewModel.metrics.averages.perTrackedDay?.calories).toBe(2200);
    expect(viewModel.metrics.targetComparison?.trackedDayAdherencePercent).toBe(100);
    expect(viewModel.metrics.proteinPerKg?.averageTrackedDay).toBe(2.43);
    expect(viewModel.metrics.days).toHaveLength(3);
  });

  it('preserves readable completeness metrics for a rejected review', () => {
    const viewModel = buildNutritionCoachViewModel(makeEnvelope('rejected'));

    expect(viewModel.kind).toBe('rejected');
    if (viewModel.kind !== 'rejected') return;
    expect(viewModel.reason).toBe('insufficient_logged_days');
    expect(viewModel.metrics?.completeness.status).toBe('insufficient');
  });

  it('rejects malformed or cross-domain results', () => {
    const malformed = makeEnvelope();
    malformed.run.result = {
      kind: 'nutrition-review',
      metrics: { ...makeMetrics(), days: [] },
      targetAvailable: true,
      latestWeightAvailable: true,
    };
    expect(buildNutritionCoachViewModel(malformed).kind).toBe('failed');

    const strength = makeEnvelope();
    strength.run.domain = 'strength';
    strength.run.requestType = 'session_review';
    expect(buildNutritionCoachViewModel(strength).kind).toBe('failed');
  });
});