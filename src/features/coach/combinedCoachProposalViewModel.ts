import type { CoachRunEnvelope } from '@/api/coach';

import type {
  CombinedCoachProposalViewModel,
  CombinedProposalStatus,
} from './combinedCoachProposalContracts';
import { parseCombinedProposalReview } from './combinedCoachProposalParser';

export type {
  CombinedCoachProposalViewModel,
  CombinedEffectiveStrengthPlan,
  CombinedEffectiveStrengthSet,
  CombinedProposalAction,
  CombinedProposalIssue,
  CombinedProposalSet,
  CombinedProposalStatus,
  CombinedProposalTargets,
  CombinedSafetyRestriction,
} from './combinedCoachProposalContracts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const copyForStatus = (status: CombinedProposalStatus) => {
  if (status === 'blocked') {
    return {
      title: 'Combined proposal blocked',
      message: 'Safety or a child proposal has a hard block.',
    };
  }
  if (status === 'needs_input') {
    return {
      title: 'More data required',
      message: 'At least one child proposal needs additional synchronized input.',
    };
  }
  if (status === 'modify') {
    return {
      title: 'Review modifications',
      message: 'The proposals are available with explicit guardrail adjustments.',
    };
  }
  return {
    title: 'Combined proposal ready',
    message: 'All child proposals passed the deterministic final guardrail.',
  };
};

export const buildCombinedCoachProposalViewModel = (
  envelope: CoachRunEnvelope,
): CombinedCoachProposalViewModel => {
  const { run } = envelope;
  if (run.domain !== 'combined' || run.requestType !== 'combined_proposal_review') {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result is not a Combined proposal review.',
    };
  }
  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Building proposals',
      message: 'Strength, Nutrition, and Safety child runs are being evaluated.',
    };
  }
  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Combined proposal failed',
      message: run.error?.message ?? 'The run could not complete.',
    };
  }
  if (
    !isRecord(run.result) ||
    !isRecord(run.result.review) ||
    !isRecord(run.result.childRunIds)
  ) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'The Combined proposal could not be read safely.',
    };
  }

  const rejected = run.result.kind === 'combined-coach-proposal-run-rejected';
  const completed = run.result.kind === 'combined-coach-proposal-review';
  const review = parseCombinedProposalReview(run.result.review);
  const reason = rejected ? readString(run.result, 'reason') : null;
  if (
    (!rejected && !completed) ||
    (run.status === 'rejected' && !rejected) ||
    (run.status === 'completed' && !completed) ||
    !review ||
    readString(run.result.childRunIds, 'strength') !== review.strength.runId ||
    readString(run.result.childRunIds, 'nutrition') !== review.nutrition.runId ||
    readString(run.result.childRunIds, 'safety') !== review.safety.runId ||
    (rejected && !reason) ||
    (rejected && review.status !== 'blocked' && review.status !== 'needs_input') ||
    (completed && review.status !== 'ready' && review.status !== 'modify')
  ) {
    return {
      kind: 'failed',
      title: 'Invalid Combined proposal',
      message: 'The deterministic proposal contract failed validation.',
    };
  }

  return {
    kind: 'review',
    ...copyForStatus(review.status),
    rejected,
    reason,
    ...review,
  };
};
