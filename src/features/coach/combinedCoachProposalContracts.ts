export type CombinedProposalStatus = 'ready' | 'modify' | 'needs_input' | 'blocked';

export type CombinedProposalIssue = {
  code: string;
  severity: 'input_required' | 'warning' | 'modify' | 'hard_block';
  domain: 'strength' | 'nutrition' | 'safety_recovery';
  message: string;
};

export type CombinedProposalAction =
  | 'review_strength_proposal'
  | 'apply_safety_load_ceiling'
  | 'resolve_movement_restrictions'
  | 'confirm_nutrition_target';

export type CombinedProposalSet = {
  sourceSetId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: number;
  adjustment: 'decrease' | 'maintain' | 'increase';
};

export type CombinedProposalTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type CombinedSafetyRestriction = {
  limitationId: string;
  action: 'monitor' | 'reduce_load' | 'avoid_movement' | 'pause_training';
  movementPatterns: string[];
  maximumLoadMultiplier: number;
};

export type CombinedEffectiveStrengthSet = {
  sourceSetId: string;
  exerciseId: string;
  exerciseName: string;
  proposedWeight: number;
  maximumAllowedWeight: number;
  effectiveWeight: number;
  reps: number;
  targetRpe: number;
  safetyAdjusted: boolean;
};

export type CombinedEffectiveStrengthPlan = {
  policyVersion: 'combined-effective-strength-v1';
  status: CombinedProposalStatus;
  sourceSessionId: string | null;
  loadMultiplier: number;
  sets: CombinedEffectiveStrengthSet[];
  proposedTonnage: number | null;
  effectiveTonnage: number | null;
  unresolvedMovementPatterns: string[];
  requiresExplicitConfirmation: true;
  automaticApplication: false;
};

export type CombinedEffectiveStrengthApplication = {
  applied: true;
  appliedAt: string;
  appliedRevision: number;
  confirmationIdempotencyKey: string;
  templateId: string;
  policyVersion: 'combined-effective-strength-v1';
};

export type CombinedNutritionApplication = {
  applied: true;
  appliedAt: string;
  appliedRevision: number;
  confirmationIdempotencyKey: string;
  childRunId: string;
  targetId: string;
  requestType: 'nutrition_target_proposal';
};

export type CombinedStrengthProposal = {
  runId: string;
  status: CombinedProposalStatus;
  sourceSessionId: string | null;
  sets: CombinedProposalSet[];
  proposedTonnage: number | null;
  guardrailStatus: 'valid' | 'modify' | 'blocked' | null;
};

export type CombinedNutritionProposal = {
  runId: string;
  status: CombinedProposalStatus;
  targetId: string | null;
  targetRevision: number | null;
  currentTargets: CombinedProposalTargets | null;
  proposedTargets: CombinedProposalTargets | null;
  changed: boolean | null;
  guardrailStatus: 'valid' | 'modify' | 'blocked' | null;
  requiresConfirmation: boolean;
  applied: boolean | null;
};

export type CombinedSafetyProposal = {
  runId: string;
  status: CombinedProposalStatus;
  recommendedLoadMultiplier: number;
  restrictions: CombinedSafetyRestriction[];
  restrictionCount: number;
  issueCount: number;
};

export type ParsedCombinedProposalReview = {
  policyVersion: 'combined-coach-proposal-v1' | 'combined-coach-proposal-v2';
  status: CombinedProposalStatus;
  strength: CombinedStrengthProposal;
  effectiveStrength: CombinedEffectiveStrengthPlan | null;
  nutrition: CombinedNutritionProposal;
  safety: CombinedSafetyProposal;
  maximumStrengthLoadMultiplier: number;
  strengthRequiresSafetyAdjustment: boolean;
  pendingActions: CombinedProposalAction[];
  issues: CombinedProposalIssue[];
  requiresExplicitConfirmation: true;
  automaticApplication: false;
};

export type CombinedCoachProposalViewModel =
  | { kind: 'pending'; title: string; message: string }
  | { kind: 'failed'; title: string; message: string }
  | ({
      kind: 'review';
      title: string;
      message: string;
      rejected: boolean;
      reason: string | null;
      effectiveStrengthApplication: CombinedEffectiveStrengthApplication | null;
      nutritionApplication: CombinedNutritionApplication | null;
    } & ParsedCombinedProposalReview);
