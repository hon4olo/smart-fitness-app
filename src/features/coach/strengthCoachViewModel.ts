import type { CoachRunEnvelope } from '@/api/coach';

export type StrengthCoachMetricSummary = {
  completedSets: number;
  totalReps: number;
  totalTonnage: number;
  averageActualRpe: number | null;
};

export type StrengthCoachProposalSet = {
  sourceSetId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: number;
  adjustment: 'decrease' | 'maintain' | 'increase';
  adjustmentPercent: number;
};

export type StrengthCoachViewModel =
  | {
      kind: 'pending';
      title: string;
      message: string;
    }
  | {
      kind: 'failed';
      title: string;
      message: string;
    }
  | {
      kind: 'rejected';
      title: string;
      message: string;
      issues: string[];
    }
  | {
      kind: 'review';
      title: string;
      message: string;
      metrics: StrengthCoachMetricSummary;
    }
  | {
      kind: 'proposal';
      title: string;
      message: string;
      metrics: StrengthCoachMetricSummary;
      sets: StrengthCoachProposalSet[];
      guardrailStatus: 'valid' | 'modify' | 'blocked';
      issues: string[];
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readFiniteNumber = (record: Record<string, unknown>, key: string): number | null => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readMetricSummary = (value: unknown): StrengthCoachMetricSummary | null => {
  if (!isRecord(value)) {
    return null;
  }
  const completedSets = readFiniteNumber(value, 'completedSets');
  const totalReps = readFiniteNumber(value, 'totalReps');
  const totalTonnage = readFiniteNumber(value, 'totalTonnage');
  const averageActualRpeValue = value.averageActualRpe;
  const averageActualRpe =
    averageActualRpeValue === null
      ? null
      : typeof averageActualRpeValue === 'number' && Number.isFinite(averageActualRpeValue)
        ? averageActualRpeValue
        : undefined;

  if (completedSets === null || totalReps === null || totalTonnage === null || averageActualRpe === undefined) {
    return null;
  }

  return { completedSets, totalReps, totalTonnage, averageActualRpe };
};

const readIssueMessages = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (isRecord(item) && typeof item.message === 'string' ? item.message.trim() : ''))
    .filter(Boolean);
};

const readProposalSets = (value: unknown): StrengthCoachProposalSet[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const sets: StrengthCoachProposalSet[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }
    const adjustment = item.adjustment;
    const sourceSetId = item.sourceSetId;
    const exerciseId = item.exerciseId;
    const exerciseName = item.exerciseName;
    const weight = readFiniteNumber(item, 'weight');
    const reps = readFiniteNumber(item, 'reps');
    const targetRpe = readFiniteNumber(item, 'targetRpe');
    const adjustmentPercent = readFiniteNumber(item, 'adjustmentPercent');

    if (
      typeof sourceSetId !== 'string' ||
      typeof exerciseId !== 'string' ||
      typeof exerciseName !== 'string' ||
      (adjustment !== 'decrease' && adjustment !== 'maintain' && adjustment !== 'increase') ||
      weight === null ||
      reps === null ||
      targetRpe === null ||
      adjustmentPercent === null
    ) {
      return null;
    }

    sets.push({
      sourceSetId,
      exerciseId,
      exerciseName,
      weight,
      reps,
      targetRpe,
      adjustment,
      adjustmentPercent,
    });
  }

  return sets;
};

export const buildStrengthCoachViewModel = (envelope: CoachRunEnvelope): StrengthCoachViewModel => {
  const { run } = envelope;

  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Analysis in progress',
      message: 'Your synchronized training history is being validated and analysed.',
    };
  }

  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Analysis failed',
      message: run.error?.message ?? 'Strength Coach could not complete this run.',
    };
  }

  const result = run.result;
  if (!isRecord(result)) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'Strength Coach returned an unsupported result format.',
    };
  }

  if (run.status === 'rejected') {
    const completeness = isRecord(result.completeness) ? result.completeness : null;
    const guardrail = isRecord(result.guardrail) ? result.guardrail : null;
    const issues = [
      ...readIssueMessages(completeness?.issues),
      ...readIssueMessages(guardrail?.issues),
    ];
    return {
      kind: 'rejected',
      title: 'More data is required',
      message: 'The deterministic validation layer did not approve a result.',
      issues: issues.length > 0 ? issues : ['Complete more logged training before trying again.'],
    };
  }

  const metrics = readMetricSummary(result.metrics);
  if (!metrics) {
    return {
      kind: 'failed',
      title: 'Invalid metrics',
      message: 'Strength Coach metrics could not be read safely.',
    };
  }

  if (result.kind === 'strength-session-review') {
    return {
      kind: 'review',
      title: 'Workout review',
      message: 'Metrics were calculated deterministically from synchronized completed sets.',
      metrics,
    };
  }

  if (result.kind === 'strength-next-workout-proposal' && isRecord(result.proposal) && isRecord(result.guardrail)) {
    const sets = readProposalSets(result.proposal.sets);
    const guardrailStatus = result.guardrail.status;
    if (
      !sets ||
      (guardrailStatus !== 'valid' && guardrailStatus !== 'modify' && guardrailStatus !== 'blocked')
    ) {
      return {
        kind: 'failed',
        title: 'Invalid proposal',
        message: 'Strength Coach proposal could not be read safely.',
      };
    }

    return {
      kind: 'proposal',
      title: 'Next workout proposal',
      message:
        typeof result.proposal.summary === 'string'
          ? result.proposal.summary
          : 'A deterministic proposal was generated from your most recent completed session.',
      metrics,
      sets,
      guardrailStatus,
      issues: readIssueMessages(result.guardrail.issues),
    };
  }

  return {
    kind: 'failed',
    title: 'Unsupported result',
    message: 'This Strength Coach result type is not supported by the current app version.',
  };
};
