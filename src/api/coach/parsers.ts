import type {
  CoachAgentRunRecord,
  CoachCapabilities,
  CoachDomain,
  CoachRequestType,
  CoachRunEnvelope,
  CoachRunError,
  CoachRunRecord,
  CoachRunStatus,
  NutritionCoachRequestType,
  StrengthCoachRequestType,
} from './contracts';

const RUN_STATUSES = new Set<CoachRunStatus>([
  'queued',
  'running',
  'completed',
  'rejected',
  'failed',
]);
const STRENGTH_REQUEST_TYPES = new Set<StrengthCoachRequestType>([
  'session_review',
  'next_workout_proposal',
  'strength_strategy_proposal',
]);
const NUTRITION_REQUEST_TYPES = new Set<NutritionCoachRequestType>([
  'nutrition_review',
  'nutrition_target_proposal',
  'nutrition_strategy_proposal',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const readNullableString = (
  record: Record<string, unknown>,
  key: string,
): string | null => {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const readRecord = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> => {
  const value = record[key];
  if (!isRecord(value)) {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const readNullableRecord = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null => {
  const value = record[key];
  if (value === null) return null;
  if (!isRecord(value)) {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const parseError = (value: unknown): CoachRunError | null => {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error('Invalid coach response: error');
  const code = readString(value, 'code');
  const message = readString(value, 'message');
  return value.details === undefined
    ? { code, message }
    : { code, message, details: value.details };
};

const parseStatus = (value: unknown): CoachRunStatus => {
  if (typeof value !== 'string' || !RUN_STATUSES.has(value as CoachRunStatus)) {
    throw new Error('Invalid coach response: status');
  }
  return value as CoachRunStatus;
};

const parseDomain = (value: unknown): CoachDomain => {
  if (
    value !== 'strength' &&
    value !== 'nutrition' &&
    value !== 'safety_recovery' &&
    value !== 'combined'
  ) {
    throw new Error('Invalid coach response: domain');
  }
  return value;
};

const parseRequestType = (
  domain: CoachDomain,
  value: unknown,
): CoachRequestType => {
  if (typeof value !== 'string') {
    throw new Error('Invalid coach response: requestType');
  }
  if (
    domain === 'strength' &&
    STRENGTH_REQUEST_TYPES.has(value as StrengthCoachRequestType)
  ) {
    return value as StrengthCoachRequestType;
  }
  if (
    domain === 'nutrition' &&
    NUTRITION_REQUEST_TYPES.has(value as NutritionCoachRequestType)
  ) {
    return value as NutritionCoachRequestType;
  }
  if (domain === 'safety_recovery' && value === 'safety_recovery_review') {
    return value;
  }
  if (
    domain === 'combined' &&
    (value === 'combined_review' || value === 'combined_proposal_review')
  ) {
    return value;
  }
  throw new Error('Invalid coach response: requestType');
};

const parseCoachRun = (value: unknown): CoachRunRecord => {
  if (!isRecord(value)) throw new Error('Invalid coach response: run');
  const domain = parseDomain(value.domain);
  return {
    id: readString(value, 'id'),
    userId: readString(value, 'userId'),
    domain,
    requestType: parseRequestType(domain, value.requestType),
    status: parseStatus(value.status),
    idempotencyKey: readNullableString(value, 'idempotencyKey'),
    requestData: readRecord(value, 'requestData'),
    contextSnapshot: readNullableRecord(value, 'contextSnapshot'),
    result: readNullableRecord(value, 'result'),
    error: parseError(value.error),
    policyVersions: Object.fromEntries(
      Object.entries(readRecord(value, 'policyVersions')).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
    requestedAt: readString(value, 'requestedAt'),
    startedAt: readNullableString(value, 'startedAt'),
    completedAt: readNullableString(value, 'completedAt'),
    createdAt: readString(value, 'createdAt'),
    updatedAt: readString(value, 'updatedAt'),
  };
};

const parseAgentRun = (value: unknown): CoachAgentRunRecord => {
  if (
    !isRecord(value) ||
    typeof value.sequence !== 'number' ||
    !Number.isInteger(value.sequence)
  ) {
    throw new Error('Invalid coach response: agent run');
  }
  return {
    id: readString(value, 'id'),
    coachRunId: readString(value, 'coachRunId'),
    userId: readString(value, 'userId'),
    sequence: value.sequence,
    agentName: readString(value, 'agentName'),
    status: parseStatus(value.status),
    policyVersion: readNullableString(value, 'policyVersion'),
    inputSnapshot: readRecord(value, 'inputSnapshot'),
    output: readNullableRecord(value, 'output'),
    error: parseError(value.error),
    startedAt: readNullableString(value, 'startedAt'),
    completedAt: readNullableString(value, 'completedAt'),
    createdAt: readString(value, 'createdAt'),
    updatedAt: readString(value, 'updatedAt'),
  };
};

const parseNutritionCapabilities = (
  value: Record<string, unknown>,
  schemaVersion: CoachCapabilities['schemaVersion'],
): CoachCapabilities['nutrition'] => {
  if (
    value.deterministicReview !== true ||
    value.deterministicTargetProposal !== true ||
    typeof value.structuredStrategyProposal !== 'boolean' ||
    value.strategyRequiresConfirmation !== true ||
    (schemaVersion >= 2 &&
      typeof value.structuredStrategyConfirmation !== 'boolean')
  ) {
    throw new Error('Invalid coach capabilities response');
  }
  return {
    deterministicReview: true,
    deterministicTargetProposal: true,
    structuredStrategyProposal: value.structuredStrategyProposal,
    ...(schemaVersion >= 2
      ? {
          structuredStrategyConfirmation:
            value.structuredStrategyConfirmation as boolean,
        }
      : {}),
    strategyRequiresConfirmation: true,
  };
};

const parseStrengthCapabilities = (
  value: unknown,
  schemaVersion: 3 | 4 | 5 | 6 | 7 | 8,
): NonNullable<CoachCapabilities['strength']> => {
  if (!isRecord(value)) throw new Error('Invalid coach capabilities response');
  if (
    value.deterministicReview !== true ||
    value.deterministicMockProposal !== true ||
    typeof value.structuredStrategyProposal !== 'boolean' ||
    typeof value.structuredStrategyConfirmation !== 'boolean' ||
    (schemaVersion === 3 && value.structuredStrategyConfirmation !== false) ||
    value.strategyRequiresConfirmation !== true
  ) {
    throw new Error('Invalid coach capabilities response');
  }
  return {
    deterministicReview: true,
    deterministicMockProposal: true,
    structuredStrategyProposal: value.structuredStrategyProposal,
    structuredStrategyConfirmation: value.structuredStrategyConfirmation,
    strategyRequiresConfirmation: true,
  };
};

const parseSafetyCapabilities = (
  value: unknown,
): NonNullable<CoachCapabilities['safety']> => {
  if (
    !isRecord(value) ||
    value.deterministicRecoveryReview !== true ||
    value.revisionedLimitations !== true ||
    value.revisionedRecoveryCheckIns !== true ||
    value.automaticApplication !== false
  ) {
    throw new Error('Invalid coach capabilities response');
  }
  return {
    deterministicRecoveryReview: true,
    revisionedLimitations: true,
    revisionedRecoveryCheckIns: true,
    automaticApplication: false,
  };
};

const parseCombinedCapabilities = (
  value: unknown,
  schemaVersion: 6 | 7 | 8,
): NonNullable<CoachCapabilities['combined']> => {
  if (
    !isRecord(value) ||
    value.deterministicReview !== true ||
    value.automaticApplication !== false ||
    (schemaVersion >= 7 &&
      (value.deterministicProposalReview !== true ||
        value.proposalRequiresExplicitConfirmation !== true)) ||
    (schemaVersion === 8 && value.effectiveStrengthConfirmation !== true)
  ) {
    throw new Error('Invalid coach capabilities response');
  }
  return {
    deterministicReview: true,
    ...(schemaVersion >= 7
      ? {
          deterministicProposalReview: true as const,
          proposalRequiresExplicitConfirmation: true as const,
        }
      : {}),
    ...(schemaVersion === 8
      ? { effectiveStrengthConfirmation: true }
      : {}),
    automaticApplication: false,
  };
};

export const parseCoachCapabilities = (value: unknown): CoachCapabilities => {
  if (
    !isRecord(value) ||
    ![1, 2, 3, 4, 5, 6, 7, 8].includes(value.schemaVersion as number) ||
    !isRecord(value.nutrition)
  ) {
    throw new Error('Invalid coach capabilities response');
  }
  const schemaVersion = value.schemaVersion as CoachCapabilities['schemaVersion'];
  const nutrition = parseNutritionCapabilities(value.nutrition, schemaVersion);
  if (schemaVersion === 1 || schemaVersion === 2) {
    return { schemaVersion, nutrition };
  }
  const strength = parseStrengthCapabilities(value.strength, schemaVersion);
  if (schemaVersion === 3 || schemaVersion === 4) {
    return { schemaVersion, nutrition, strength };
  }
  const safety = parseSafetyCapabilities(value.safety);
  if (schemaVersion === 5) {
    return { schemaVersion, nutrition, strength, safety };
  }
  return {
    schemaVersion,
    nutrition,
    strength,
    safety,
    combined: parseCombinedCapabilities(value.combined, schemaVersion),
  };
};

export const parseCoachRunEnvelope = (value: unknown): CoachRunEnvelope => {
  if (!isRecord(value) || !Array.isArray(value.agentRuns)) {
    throw new Error('Invalid coach response envelope');
  }
  const run = parseCoachRun(value.run);
  const agentRuns = value.agentRuns
    .map(parseAgentRun)
    .sort((left, right) => left.sequence - right.sequence);
  if (
    agentRuns.some(
      (agentRun) =>
        agentRun.coachRunId !== run.id || agentRun.userId !== run.userId,
    )
  ) {
    throw new Error('Invalid coach response ownership');
  }
  return { run, agentRuns };
};
