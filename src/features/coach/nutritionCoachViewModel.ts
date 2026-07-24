import type { CoachRunEnvelope } from '@/api/coach';

import {
  isNutritionCoachRecord,
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
  envelope: CoachRunEnvelope,
): NutritionCoachViewModel => {
  const { run } = envelope;

  if (
    run.domain !== 'nutrition' ||
    (run.requestType !== 'nutrition_review' &&
      run.requestType !== 'nutrition_target_proposal')
  ) {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result does not belong to Nutrition Coach.',
    };
  }

  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Nutrition analysis in progress',
      message: 'Synchronized food entries and targets are being validated and calculated.',
    };
  }

  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Nutrition analysis failed',
      message: run.error?.message ?? 'Nutrition Coach could not complete this run.',
    };
  }

  const result = run.result;
  if (!isNutritionCoachRecord(result)) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'Nutrition Coach returned an unsupported result format.',
    };
  }

  if (result.kind === 'nutrition-target-proposal') {
    return (
      readNutritionProposalViewModel(result) ?? {
        kind: 'failed',
        title: 'Invalid proposal',
        message: 'Nutrition target proposal could not be read safely.',
      }
    );
  }

  if (run.status === 'rejected') {
    const metrics = readNutritionCoachMetrics(result.metrics);
    const reason =
      typeof result.reason === 'string' && result.reason
        ? result.reason
        : 'insufficient_logged_days';
    return {
      kind: 'rejected',
      title:
        reason === 'nutrition_target_unavailable'
          ? 'Active nutrition target required'
          : 'More logged days are required',
      message:
        reason === 'nutrition_target_unavailable'
          ? 'Create and synchronize an active nutrition target before requesting a proposal.'
          : 'The deterministic review did not have enough tracked days to form a stable summary.',
      reason,
      metrics,
    };
  }

  if (result.kind !== 'nutrition-review') {
    return {
      kind: 'failed',
      title: 'Unsupported result',
      message: 'This Nutrition Coach result type is not supported by the current app version.',
    };
  }

  const metrics = readNutritionCoachMetrics(result.metrics);
  if (
    !metrics ||
    typeof result.targetAvailable !== 'boolean' ||
    typeof result.latestWeightAvailable !== 'boolean'
  ) {
    return {
      kind: 'failed',
      title: 'Invalid metrics',
      message: 'Nutrition Coach metrics could not be read safely.',
    };
  }

  return {
    kind: 'review',
    title: 'Nutrition review',
    message: 'All values were calculated deterministically from synchronized nutrition records.',
    targetAvailable: result.targetAvailable,
    latestWeightAvailable: result.latestWeightAvailable,
    metrics,
  };
};