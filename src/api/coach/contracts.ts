export type CoachRunStatus = 'queued' | 'running' | 'completed' | 'rejected' | 'failed';
export type CoachDomain = 'strength' | 'nutrition' | 'safety_recovery' | 'combined';
export type StrengthCoachRequestType =
  | 'session_review'
  | 'next_workout_proposal'
  | 'strength_strategy_proposal';
export type NutritionCoachRequestType =
  | 'nutrition_review'
  | 'nutrition_target_proposal'
  | 'nutrition_strategy_proposal';
export type SafetyRecoveryCoachRequestType = 'safety_recovery_review';
export type CombinedCoachRequestType = 'combined_review' | 'combined_proposal_review';
export type CoachRequestType =
  | StrengthCoachRequestType
  | NutritionCoachRequestType
  | SafetyRecoveryCoachRequestType
  | CombinedCoachRequestType;

export type CoachCapabilities = {
  schemaVersion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  nutrition: {
    deterministicReview: true;
    deterministicTargetProposal: true;
    structuredStrategyProposal: boolean;
    structuredStrategyConfirmation?: boolean;
    strategyRequiresConfirmation: true;
  };
  strength?: {
    deterministicReview: true;
    deterministicMockProposal: true;
    structuredStrategyProposal: boolean;
    structuredStrategyConfirmation: boolean;
    strategyRequiresConfirmation: true;
  };
  safety?: {
    deterministicRecoveryReview: true;
    revisionedLimitations: true;
    revisionedRecoveryCheckIns: true;
    automaticApplication: false;
  };
  combined?: {
    deterministicReview: true;
    deterministicProposalReview?: true;
    proposalRequiresExplicitConfirmation?: true;
    effectiveStrengthConfirmation?: boolean;
    automaticApplication: false;
  };
};

export type CoachRunError = {
  code: string;
  message: string;
  details?: unknown;
};

export type CoachRunRecord = {
  id: string;
  userId: string;
  domain: CoachDomain;
  requestType: CoachRequestType;
  status: CoachRunStatus;
  idempotencyKey: string | null;
  requestData: Record<string, unknown>;
  contextSnapshot: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: CoachRunError | null;
  policyVersions: Record<string, string>;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoachAgentRunRecord = {
  id: string;
  coachRunId: string;
  userId: string;
  sequence: number;
  agentName: string;
  status: CoachRunStatus;
  policyVersion: string | null;
  inputSnapshot: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: CoachRunError | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoachRunEnvelope = {
  run: CoachRunRecord;
  agentRuns: CoachAgentRunRecord[];
};

export type StartStrengthCoachRunInput = {
  requestType: StrengthCoachRequestType;
  requestedSessionId?: string;
  historyLimit?: number;
  idempotencyKey?: string;
};

export type StartNutritionCoachRunInput = {
  requestType?: NutritionCoachRequestType;
  lookbackDays?: number;
  idempotencyKey?: string;
};

export type StartSafetyRecoveryRunInput = {
  requestType?: SafetyRecoveryCoachRequestType;
  lookbackDays?: number;
  idempotencyKey?: string;
};

export type StartCombinedCoachRunInput = {
  requestType?: CombinedCoachRequestType;
  requestedSessionId?: string;
  strengthHistoryLimit?: number;
  nutritionLookbackDays?: number;
  safetyLookbackDays?: number;
  idempotencyKey?: string;
};

export type ConfirmCoachRunInput = {
  idempotencyKey: string;
};

type WaitForRunOptions = {
  intervalMs?: number;
  maxPolls?: number;
  signal?: AbortSignal;
};

export type CoachApi = {
  getCapabilities(): Promise<CoachCapabilities>;
  startStrengthRun(input: StartStrengthCoachRunInput): Promise<CoachRunEnvelope>;
  startNutritionRun(input?: StartNutritionCoachRunInput): Promise<CoachRunEnvelope>;
  startSafetyRecoveryRun(input?: StartSafetyRecoveryRunInput): Promise<CoachRunEnvelope>;
  startCombinedRun(input?: StartCombinedCoachRunInput): Promise<CoachRunEnvelope>;
  confirmRun(runId: string, input: ConfirmCoachRunInput): Promise<CoachRunEnvelope>;
  confirmCombinedEffectiveStrength(
    runId: string,
    input: ConfirmCoachRunInput,
  ): Promise<CoachRunEnvelope>;
  getRun(runId: string): Promise<CoachRunEnvelope>;
  waitForTerminalRun(initial: CoachRunEnvelope, options?: WaitForRunOptions): Promise<CoachRunEnvelope>;
};
