import type { CoachRunEnvelope } from '@/api/coach';

export type AppliedNutritionProposal = {
  revision: number;
  appliedAt: string;
  confirmationIdempotencyKey: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNonemptyString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid applied nutrition proposal: ${key}`);
  }
  return value;
};

export const readAppliedNutritionProposal = (
  envelope: CoachRunEnvelope,
): AppliedNutritionProposal => {
  const { run } = envelope;
  if (
    run.domain !== 'nutrition' ||
    run.requestType !== 'nutrition_target_proposal' ||
    run.status !== 'completed'
  ) {
    throw new Error('Invalid applied nutrition proposal: run');
  }

  const result = run.result;
  if (
    !isRecord(result) ||
    result.kind !== 'nutrition-target-proposal' ||
    result.applied !== true ||
    result.requiresConfirmation !== true ||
    !isRecord(result.guardrail) ||
    result.guardrail.status !== 'valid'
  ) {
    throw new Error('Invalid applied nutrition proposal: result');
  }

  const revision = result.appliedRevision;
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) {
    throw new Error('Invalid applied nutrition proposal: appliedRevision');
  }

  const appliedAt = readNonemptyString(result, 'appliedAt');
  if (!Number.isFinite(new Date(appliedAt).getTime())) {
    throw new Error('Invalid applied nutrition proposal: appliedAt');
  }

  return {
    revision,
    appliedAt,
    confirmationIdempotencyKey: readNonemptyString(
      result,
      'confirmationIdempotencyKey',
    ),
  };
};
