import type { CoachRunEnvelope } from '@/api/coach';
import { getNutritionRejectionCopy } from './nutritionDeterministicSummary';

export type NutritionStrategyIssue = {
  code: string;
  severity: 'modify' | 'block';
  path: string;
  message: string;
};

export type NutritionStrategyProposal = {
  strategy: 'maintain' | 'reduce' | 'increase' | 'recompose';
  calorieTarget: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  adjustmentCadenceDays: number;
  rationaleCodes: Array<
    | 'goal_energy_delta'
    | 'weight_trend'
    | 'tracked_intake'
    | 'protein_floor'
    | 'fat_floor'
    | 'adherence_stability'
    | 'current_target_continuity'
  >;
  caveatCodes: Array<
    | 'limited_tracking_coverage'
    | 'weight_trend_unavailable'
    | 'short_observation_window'
    | 'target_requires_confirmation'
  >;
  dataQuality: 'partial' | 'sufficient' | 'strong';
  confidence: number;
  userSummary: string;
};

type NutritionStrategyValidatedDetails = {
  proposal: NutritionStrategyProposal;
  guardrailStatus: 'valid';
  issues: NutritionStrategyIssue[];
  calculatedMacroCalories: number;
  calorieMathMismatch: number;
  modelAttempts: number;
  modelLatencyMs: number;
  requiresConfirmation: true;
};

export type NutritionStrategyViewModel =
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
      issues: NutritionStrategyIssue[];
    }
  | (NutritionStrategyValidatedDetails & {
      kind: 'proposal';
      title: string;
      message: string;
      applied: false;
    })
  | (NutritionStrategyValidatedDetails & {
      kind: 'applied';
      title: string;
      message: string;
      applied: true;
      appliedAt: string;
      appliedRevision: number;
      confirmationIdempotencyKey: string;
    });

const STRATEGIES = new Set(['maintain', 'reduce', 'increase', 'recompose']);
const DATA_QUALITY = new Set(['partial', 'sufficient', 'strong']);
const RATIONALE_CODES = new Set([
  'goal_energy_delta',
  'weight_trend',
  'tracked_intake',
  'protein_floor',
  'fat_floor',
  'adherence_stability',
  'current_target_continuity',
]);
const CAVEAT_CODES = new Set([
  'limited_tracking_coverage',
  'weight_trend_unavailable',
  'short_observation_window',
  'target_requires_confirmation',
]);
const GUARDRAIL_STATUSES = new Set(['valid', 'modify', 'blocked']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

const readPositiveInteger = (
  record: Record<string, unknown>,
  key: string,
): number | null => {
  const value = readNonnegativeInteger(record, key);
  return value !== null && value > 0 ? value : null;
};

const readCodeArray = <Code extends string>(
  value: unknown,
  allowed: Set<string>,
): Code[] | null => {
  if (!Array.isArray(value)) return null;
  const codes: Code[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item)) return null;
    codes.push(item as Code);
  }
  return codes;
};

const readIssues = (value: unknown): NutritionStrategyIssue[] | null => {
  if (!Array.isArray(value)) return null;
  const issues: NutritionStrategyIssue[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.code !== 'string' ||
      !item.code.trim() ||
      (item.severity !== 'modify' && item.severity !== 'block') ||
      typeof item.path !== 'string' ||
      !item.path.trim() ||
      typeof item.message !== 'string' ||
      !item.message.trim()
    ) {
      return null;
    }
    issues.push({
      code: item.code,
      severity: item.severity,
      path: item.path,
      message: item.message,
    });
  }
  return issues;
};

const readProposal = (value: unknown): NutritionStrategyProposal | null => {
  if (!isRecord(value) || value.schemaVersion !== 'nutrition-strategy-v1') return null;
  if (!isRecord(value.macros)) return null;

  const calorieTarget = readPositiveInteger(value, 'calorieTarget');
  const protein = readNonnegativeInteger(value.macros, 'protein');
  const carbs = readNonnegativeInteger(value.macros, 'carbs');
  const fats = readNonnegativeInteger(value.macros, 'fats');
  const adjustmentCadenceDays = readPositiveInteger(value, 'adjustmentCadenceDays');
  const confidence = readFiniteNumber(value, 'confidence');
  const rationaleCodes = readCodeArray<NutritionStrategyProposal['rationaleCodes'][number]>(
    value.rationaleCodes,
    RATIONALE_CODES,
  );
  const caveatCodes = readCodeArray<NutritionStrategyProposal['caveatCodes'][number]>(
    value.caveatCodes,
    CAVEAT_CODES,
  );

  if (
    typeof value.strategy !== 'string' ||
    !STRATEGIES.has(value.strategy) ||
    calorieTarget === null ||
    protein === null ||
    carbs === null ||
    fats === null ||
    adjustmentCadenceDays === null ||
    adjustmentCadenceDays < 3 ||
    adjustmentCadenceDays > 60 ||
    !rationaleCodes ||
    rationaleCodes.length < 1 ||
    rationaleCodes.length > 8 ||
    !caveatCodes ||
    caveatCodes.length > 8 ||
    typeof value.dataQuality !== 'string' ||
    !DATA_QUALITY.has(value.dataQuality) ||
    confidence === null ||
    confidence < 0 ||
    confidence > 1 ||
    typeof value.userSummary !== 'string' ||
    !value.userSummary.trim() ||
    value.userSummary.length > 800
  ) {
    return null;
  }

  return {
    strategy: value.strategy as NutritionStrategyProposal['strategy'],
    calorieTarget,
    macros: { protein, carbs, fats },
    adjustmentCadenceDays,
    rationaleCodes,
    caveatCodes,
    dataQuality: value.dataQuality as NutritionStrategyProposal['dataQuality'],
    confidence,
    userSummary: value.userSummary.trim(),
  };
};

const readGuardrail = (value: unknown) => {
  if (
    !isRecord(value) ||
    value.policyVersion !== 'nutrition-strategy-guardrail-v1' ||
    typeof value.status !== 'string' ||
    !GUARDRAIL_STATUSES.has(value.status) ||
    value.requiresConfirmation !== true ||
    value.approvedForAutomaticApply !== false
  ) {
    return null;
  }

  const calculatedMacroCalories = readFiniteNumber(value, 'calculatedMacroCalories');
  const calorieMathMismatch = readFiniteNumber(value, 'calorieMathMismatch');
  const issues = readIssues(value.issues);
  if (calculatedMacroCalories === null || calorieMathMismatch === null || !issues) {
    return null;
  }

  return {
    status: value.status as 'valid' | 'modify' | 'blocked',
    calculatedMacroCalories,
    calorieMathMismatch,
    issues,
  };
};

const readModelMetadata = (value: unknown) => {
  if (!isRecord(value)) return null;
  const attempts = readPositiveInteger(value, 'attempts');
  const latencyMs = readNonnegativeInteger(value, 'latencyMs');
  if (
    typeof value.provider !== 'string' ||
    !value.provider.trim() ||
    typeof value.model !== 'string' ||
    !value.model.trim() ||
    attempts === null ||
    attempts > 3 ||
    latencyMs === null
  ) {
    return null;
  }
  return { attempts, latencyMs };
};

const readAppliedMetadata = (result: Record<string, unknown>) => {
  const appliedRevision = readNonnegativeInteger(result, 'appliedRevision');
  if (
    typeof result.appliedAt !== 'string' ||
    !Number.isFinite(new Date(result.appliedAt).getTime()) ||
    appliedRevision === null ||
    typeof result.confirmationIdempotencyKey !== 'string' ||
    !result.confirmationIdempotencyKey.trim()
  ) {
    return null;
  }
  return {
    appliedAt: new Date(result.appliedAt).toISOString(),
    appliedRevision,
    confirmationIdempotencyKey: result.confirmationIdempotencyKey.trim(),
  };
};

export const buildNutritionStrategyViewModel = (
  envelope: CoachRunEnvelope,
): NutritionStrategyViewModel => {
  const { run } = envelope;
  if (run.domain !== 'nutrition' || run.requestType !== 'nutrition_strategy_proposal') {
    return {
      kind: 'failed',
      title: 'Unsupported run',
      message: 'This result does not belong to Nutrition Strategy.',
    };
  }

  if (run.status === 'queued' || run.status === 'running') {
    return {
      kind: 'pending',
      title: 'Nutrition strategy in progress',
      message: 'The structured subagent and deterministic guardrails are evaluating the proposal.',
    };
  }

  if (run.status === 'failed') {
    return {
      kind: 'failed',
      title: 'Nutrition strategy failed',
      message: run.error?.message ?? 'The strategy pipeline could not complete this run.',
    };
  }

  if (!isRecord(run.result)) {
    return {
      kind: 'failed',
      title: 'Invalid strategy result',
      message: 'The backend returned an unsupported strategy result format.',
    };
  }

  if (run.result.kind === 'nutrition-run-rejected') {
    const reason =
      typeof run.result.reason === 'string' && run.result.reason
        ? run.result.reason
        : 'nutrition_strategy_rejected';
    const copy = getNutritionRejectionCopy(reason);
    const issues = readIssues(run.result.issues) ?? [];
    return {
      kind: 'rejected',
      title: copy.title,
      message: copy.message,
      reason,
      issues,
    };
  }

  if (run.result.kind !== 'nutrition-strategy-proposal') {
    return {
      kind: 'failed',
      title: 'Unsupported strategy result',
      message: 'This strategy result type is not supported by the current app version.',
    };
  }

  const proposal = readProposal(run.result.proposal);
  const guardrail = readGuardrail(run.result.guardrail);
  const model = readModelMetadata(run.result.model);
  if (
    !proposal ||
    !guardrail ||
    !model ||
    run.result.requiresConfirmation !== true
  ) {
    return {
      kind: 'failed',
      title: 'Invalid strategy proposal',
      message: 'The structured strategy proposal could not be read safely.',
    };
  }

  if (run.status === 'rejected' || guardrail.status !== 'valid') {
    return {
      kind: 'rejected',
      title: 'Strategy proposal did not pass guardrails',
      message: 'The preview was rejected and cannot be applied. Review the deterministic issues below.',
      reason: `nutrition_strategy_guardrail_${guardrail.status}`,
      issues: guardrail.issues,
    };
  }

  if (run.status !== 'completed') {
    return {
      kind: 'failed',
      title: 'Invalid strategy status',
      message: 'The strategy proposal has an unsupported terminal status.',
    };
  }

  const details: NutritionStrategyValidatedDetails = {
    proposal,
    guardrailStatus: 'valid',
    issues: guardrail.issues,
    calculatedMacroCalories: guardrail.calculatedMacroCalories,
    calorieMathMismatch: guardrail.calorieMathMismatch,
    modelAttempts: model.attempts,
    modelLatencyMs: model.latencyMs,
    requiresConfirmation: true,
  };

  if (run.result.applied === true) {
    const appliedMetadata = readAppliedMetadata(run.result);
    if (!appliedMetadata) {
      return {
        kind: 'failed',
        title: 'Invalid applied strategy',
        message: 'The strategy confirmation metadata could not be read safely.',
      };
    }
    return {
      ...details,
      ...appliedMetadata,
      kind: 'applied',
      title: 'Nutrition strategy applied',
      message: 'The backend revalidated the proposal and updated the active nutrition target.',
      applied: true,
    };
  }

  if (run.result.applied !== false) {
    return {
      kind: 'failed',
      title: 'Invalid strategy proposal',
      message: 'The strategy applied state could not be read safely.',
    };
  }

  return {
    ...details,
    kind: 'proposal',
    title: 'Nutrition strategy preview',
    message: 'The structured proposal passed deterministic validation. It has not been applied.',
    applied: false,
  };
};
