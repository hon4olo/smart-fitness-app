import type { CoachRunEnvelope } from '@/api/coach';
import { isUuid } from '@/lib/ids';

export type StrengthStrategyMetricSummary = {
  completedSets: number;
  totalReps: number;
  totalTonnage: number;
  averageActualRpe: number | null;
};

export type StrengthStrategyIssue = {
  code: string;
  severity: 'hard_block' | 'modify' | 'warning';
  path: string;
  message: string;
};

export type StrengthStrategySet = {
  sourceSetId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: number;
  adjustment: 'decrease' | 'maintain' | 'increase';
  rationaleCode:
    | 'high_recorded_rpe'
    | 'low_recorded_rpe'
    | 'stable_performance'
    | 'volume_policy'
    | 'limited_rpe_data';
};

type StrengthStrategyProposalFields = {
  runId: string;
  title: string;
  message: string;
  metrics: StrengthStrategyMetricSummary;
  sourceSessionId: string;
  strategy: 'deload' | 'maintain' | 'progress';
  sets: StrengthStrategySet[];
  rationaleCodes: string[];
  caveatCodes: string[];
  dataQuality: 'sufficient' | 'limited';
  confidence: number;
  guardrailStatus: 'valid' | 'modify' | 'blocked';
  proposedTonnage: number;
  volumeChangePercent: number | null;
  issues: StrengthStrategyIssue[];
  provider: string;
  model: string;
  attempts: number;
  latencyMs: number;
  requiresConfirmation: true;
};

export type StrengthStrategyViewModel =
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
      reason: string;
      issues: string[];
    }
  | (StrengthStrategyProposalFields & {
      kind: 'proposal';
      applied: false;
    })
  | (StrengthStrategyProposalFields & {
      kind: 'applied';
      applied: true;
      appliedAt: string;
      appliedRevision: number;
      templateId: string;
    });

export type StrengthStrategyDisplayViewModel = Extract<
  StrengthStrategyViewModel,
  { kind: 'proposal' | 'applied' }
>;

const VALID_RPE = new Set([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const readFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const readNonnegativeInteger = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = readFiniteNumber(record, key);
  return value !== null && Number.isSafeInteger(value) && value >= 0 ? value : null;
};

const readStrings = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const values = value.filter(
    (item): item is string => typeof item === 'string' && Boolean(item.trim()),
  );
  return values.length === value.length ? values : null;
};

const readMetrics = (value: unknown): StrengthStrategyMetricSummary | null => {
  if (!isRecord(value)) return null;
  const completedSets = readNonnegativeInteger(value, 'completedSets');
  const totalReps = readNonnegativeInteger(value, 'totalReps');
  const totalTonnage = readFiniteNumber(value, 'totalTonnage');
  const averageActualRpeValue = value.averageActualRpe;
  const averageActualRpe =
    averageActualRpeValue === null
      ? null
      : typeof averageActualRpeValue === 'number' &&
          Number.isFinite(averageActualRpeValue) &&
          averageActualRpeValue >= 6 &&
          averageActualRpeValue <= 10
        ? averageActualRpeValue
        : undefined;

  if (
    completedSets === null ||
    totalReps === null ||
    totalTonnage === null ||
    totalTonnage < 0 ||
    averageActualRpe === undefined
  ) {
    return null;
  }
  return { completedSets, totalReps, totalTonnage, averageActualRpe };
};

const readSets = (value: unknown): StrengthStrategySet[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const sets: StrengthStrategySet[] = [];
  const sourceIds = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) return null;
    const sourceSetId = readString(item, 'sourceSetId');
    const exerciseId = readString(item, 'exerciseId');
    const exerciseName = readString(item, 'exerciseName');
    const weight = readFiniteNumber(item, 'weight');
    const reps = readNonnegativeInteger(item, 'reps');
    const targetRpe = readFiniteNumber(item, 'targetRpe');
    const adjustment = item.adjustment;
    const rationaleCode = item.rationaleCode;

    if (
      !sourceSetId ||
      sourceIds.has(sourceSetId) ||
      !exerciseId ||
      !exerciseName ||
      weight === null ||
      weight < 0 ||
      reps === null ||
      reps < 1 ||
      targetRpe === null ||
      !VALID_RPE.has(targetRpe) ||
      (adjustment !== 'decrease' &&
        adjustment !== 'maintain' &&
        adjustment !== 'increase') ||
      (rationaleCode !== 'high_recorded_rpe' &&
        rationaleCode !== 'low_recorded_rpe' &&
        rationaleCode !== 'stable_performance' &&
        rationaleCode !== 'volume_policy' &&
        rationaleCode !== 'limited_rpe_data')
    ) {
      return null;
    }

    sourceIds.add(sourceSetId);
    sets.push({
      sourceSetId,
      exerciseId,
      exerciseName,
      weight,
      reps,
      targetRpe,
      adjustment,
      rationaleCode,
    });
  }

  return sets;
};

const readIssues = (value: unknown): StrengthStrategyIssue[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: StrengthStrategyIssue[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const code = readString(item, 'code');
    const path = readString(item, 'path');
    const message = readString(item, 'message');
    const severity = item.severity;
    if (
      !code ||
      !path ||
      !message ||
      (severity !== 'hard_block' && severity !== 'modify' && severity !== 'warning')
    ) {
      return null;
    }
    issues.push({ code, path, message, severity });
  }
  return issues;
};

const rejectionCopy = (reason: string): { title: string; message: string } => {
  if (reason === 'strength_model_provider_unavailable') {
    return {
      title: 'AI Strength Strategy unavailable',
      message:
        'The backend model provider is disabled. Deterministic workout review and the mock proposal remain available.',
    };
  }
  if (reason === 'strength_strategy_invalid_after_retries') {
    return {
      title: 'Strategy rejected after validation',
      message:
        'The structured proposal could not satisfy deterministic source-set and volume rules within three attempts.',
    };
  }
  return {
    title: 'Strength Strategy rejected',
    message: 'The deterministic pipeline rejected this strategy with a typed policy reason.',
  };
};

export const buildStrengthStrategyViewModel = (
  envelope: CoachRunEnvelope,
): StrengthStrategyViewModel => {
  const { run } = envelope;
  if (
    run.domain !== 'strength' ||
    run.requestType !== 'strength_strategy_proposal'
  ) {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result is not a Strength Strategy run.',
    };
  }

  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Strategy in progress',
      message: 'The source session and deterministic policy are being validated.',
    };
  }
  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Strategy failed',
      message: run.error?.message ?? 'Strength Strategy could not complete this run.',
    };
  }
  if (!isRecord(run.result)) {
    return {
      kind: 'failed',
      title: 'Invalid result',
      message: 'Strength Strategy returned an unsupported result format.',
    };
  }

  if (run.result.kind === 'strength-run-rejected') {
    const reason = readString(run.result, 'reason') ?? 'strength_strategy_rejected';
    const copy = rejectionCopy(reason);
    const issues = Array.isArray(run.result.issues)
      ? run.result.issues
          .map((item) =>
            isRecord(item) && typeof item.message === 'string'
              ? item.message.trim()
              : '',
          )
          .filter(Boolean)
      : [];
    return { kind: 'rejected', ...copy, reason, issues };
  }

  if (
    run.result.kind !== 'strength-strategy-proposal' ||
    !isRecord(run.result.proposal) ||
    !isRecord(run.result.guardrail) ||
    !isRecord(run.result.model)
  ) {
    return {
      kind: 'failed',
      title: 'Unsupported result',
      message: 'This Strength Strategy result type is not supported.',
    };
  }

  const proposal = run.result.proposal;
  const guardrail = run.result.guardrail;
  const model = run.result.model;
  const metrics = readMetrics(run.result.metrics);
  const sourceSessionId = readString(proposal, 'sourceSessionId');
  const strategy = proposal.strategy;
  const sets = readSets(proposal.sets);
  const rationaleCodes = readStrings(proposal.rationaleCodes);
  const caveatCodes = readStrings(proposal.caveatCodes);
  const dataQuality = proposal.dataQuality;
  const confidence = readFiniteNumber(proposal, 'confidence');
  const userSummary = readString(proposal, 'userSummary');
  const guardrailStatus = guardrail.status;
  const proposedTonnage = readFiniteNumber(guardrail, 'proposedTonnage');
  const volumeChangeValue = guardrail.volumeChangePercent;
  const volumeChangePercent =
    volumeChangeValue === null
      ? null
      : typeof volumeChangeValue === 'number' && Number.isFinite(volumeChangeValue)
        ? volumeChangeValue
        : undefined;
  const issues = readIssues(guardrail.issues);
  const provider = readString(model, 'provider');
  const modelName = readString(model, 'model');
  const attempts = readNonnegativeInteger(model, 'attempts');
  const latencyMs = readNonnegativeInteger(model, 'latencyMs');

  if (
    !metrics ||
    !sourceSessionId ||
    (strategy !== 'deload' && strategy !== 'maintain' && strategy !== 'progress') ||
    !sets ||
    !rationaleCodes ||
    !caveatCodes ||
    (dataQuality !== 'sufficient' && dataQuality !== 'limited') ||
    confidence === null ||
    confidence < 0 ||
    confidence > 1 ||
    !userSummary ||
    (guardrailStatus !== 'valid' &&
      guardrailStatus !== 'modify' &&
      guardrailStatus !== 'blocked') ||
    proposedTonnage === null ||
    proposedTonnage < 0 ||
    volumeChangePercent === undefined ||
    !issues ||
    !provider ||
    !modelName ||
    attempts === null ||
    attempts < 1 ||
    latencyMs === null ||
    run.result.requiresConfirmation !== true ||
    typeof run.result.applied !== 'boolean'
  ) {
    return {
      kind: 'failed',
      title: 'Invalid strategy',
      message: 'Strength Strategy proposal could not be read safely.',
    };
  }

  const common: StrengthStrategyProposalFields = {
    runId: run.id,
    title: 'AI Strength Strategy preview',
    message: userSummary,
    metrics,
    sourceSessionId,
    strategy,
    sets,
    rationaleCodes,
    caveatCodes,
    dataQuality,
    confidence,
    guardrailStatus,
    proposedTonnage,
    volumeChangePercent,
    issues,
    provider,
    model: modelName,
    attempts,
    latencyMs,
    requiresConfirmation: true,
  };

  if (run.result.applied === false) {
    return { ...common, kind: 'proposal', applied: false };
  }

  const appliedAt = readString(run.result, 'appliedAt');
  const appliedRevision = readNonnegativeInteger(run.result, 'appliedRevision');
  const templateId = readString(run.result, 'templateId');
  if (
    !appliedAt ||
    !Number.isFinite(new Date(appliedAt).getTime()) ||
    appliedRevision === null ||
    !templateId ||
    !isUuid(templateId)
  ) {
    return {
      kind: 'failed',
      title: 'Invalid confirmation result',
      message: 'The confirmed Strength template metadata could not be verified.',
    };
  }

  return {
    ...common,
    kind: 'applied',
    title: 'Strength template created',
    applied: true,
    appliedAt: new Date(appliedAt).toISOString(),
    appliedRevision,
    templateId,
  };
};
