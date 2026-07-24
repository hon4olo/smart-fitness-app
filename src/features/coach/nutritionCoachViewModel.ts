import type { CoachRunEnvelope } from '@/api/coach';

import {
  isNutritionCoachRecord,
  readNutritionBoolean,
  readNutritionCoachMetrics,
} from './nutritionCoachMetricParser';
import { readNutritionProposalViewModel } from './nutritionCoachProposalParser';
import type { NutritionCoachViewModel } from './nutritionCoachViewModelTypes';

export type {
  NutritionCoachMetricSummary,
  NutritionCoachViewModel,
  NutritionDailyMetric,
  NutritionMetricTotals,
  NutritionProposalIssue,
} from './nutritionCoachViewModelTypes';

export const buildNutritionCoachViewModel = (
  run: CoachRunEnvelope,
): NutritionCoachViewModel => {
  if (run.status === 'pending' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Nutrition review in progress',
      message: 'The Coach is evaluating logged nutrition data deterministically.',
    };
  }
  if (run.status === 'failed' || run.status === 'cancelled') {
    return {
      kind: 'failed',
      title: run.status === 'cancelled' ? 'Review cancelled' : 'Review failed',
      message:
        run.error?.message ??
        (run.status === 'cancelled'
          ? 'This review was cancelled.'
          : 'The Nutrition Coach could not complete this review.'),
    };
  }
  if (!run.result || !isNutritionCoachRecord(run.result)) {
    return {
      kind: 'failed',
      title: 'Review unavailable',
      message: 'The completed run did not return a supported Nutrition result.',
    };
  }

  const result = run.result;
  const accepted = readNutritionBoolean(result, 'accepted');
  const outcome = result.outcome;
  if (accepted === false || outcome === 'rejected') {
    return {
      kind: 'rejected',
      title: 'More nutrition data is required',
      message:
        typeof result.reason === 'string'
          ? result.reason
          : 'The deterministic review rejected this snapshot.',
      reason:
        typeof result.reason === 'string'
          ? result.reason
          : 'Insufficient or invalid input.',
      metrics: readNutritionCoachMetrics(result.metrics),
    };
  }

  if (outcome === 'proposal') {
    const proposal = readNutritionProposalViewModel(result);
    if (!proposal) {
      return {
        kind: 'failed',
        title: 'Proposal unavailable',
        message: 'The completed run did not return a supported proposal payload.',
      };
    }
    return proposal;
  }

  const metrics = readNutritionCoachMetrics(result.metrics);
  const targetAvailable = readNutritionBoolean(result, 'targetAvailable');
  const latestWeightAvailable = readNutritionBoolean(
    result,
    'latestWeightAvailable',
  );
  if (
    accepted !== true ||
    outcome !== 'review' ||
    !metrics ||
    targetAvailable === null ||
    latestWeightAvailable === null
  ) {
    return {
      kind: 'failed',
      title: 'Review unavailable',
      message: 'The completed run did not return a supported Nutrition review.',
    };
  }

  return {
    kind: 'review',
    title: 'Nutrition review ready',
    message: 'This output is read-only and based only on logged deterministic metrics.',
    targetAvailable,
    latestWeightAvailable,
    metrics,
  };
};
