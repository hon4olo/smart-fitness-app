import type { ConflictResolutionStrategy, ConflictRecord } from './CloudSyncTypes';

export type ConflictPolicy = {
  strategy: ConflictResolutionStrategy;
  allowDeleteStrategy?: 'localWins' | 'remoteWins' | 'manualReview';
  preserveChildOrdering?: boolean;
  preferStableTieBreak?: 'local' | 'remote';
};

export type ConflictPolicyRegistry = {
  getPolicy(entityType: string): ConflictPolicy;
  hasPolicy(entityType: string): boolean;
  entries(): Array<[string, ConflictPolicy]>;
};

export const DEFAULT_CONFLICT_POLICY: ConflictPolicy = {
  strategy: 'manualReview',
  allowDeleteStrategy: 'manualReview',
  preferStableTieBreak: 'local',
};

export const DEFAULT_CONFLICT_POLICIES: Record<string, ConflictPolicy> = {
  workoutSessions: {
    strategy: 'appendUnion',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  weightHistory: {
    strategy: 'appendUnion',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  bodyMeasurements: {
    strategy: 'appendUnion',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  foodEntries: {
    strategy: 'appendUnion',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  profile: {
    strategy: 'lastWriteWins',
    allowDeleteStrategy: 'manualReview',
    preferStableTieBreak: 'local',
  },
  nutritionTargets: {
    strategy: 'lastWriteWins',
    allowDeleteStrategy: 'manualReview',
    preferStableTieBreak: 'local',
  },
  workouts: {
    strategy: 'mergeFields',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  mealTemplates: {
    strategy: 'mergeFields',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  trainingPrograms: {
    strategy: 'mergeFields',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
  customExercises: {
    strategy: 'mergeFields',
    allowDeleteStrategy: 'manualReview',
    preserveChildOrdering: true,
    preferStableTieBreak: 'local',
  },
};

export const createConflictPolicyRegistry = (overrides: Record<string, ConflictPolicy> = {}): ConflictPolicyRegistry => {
  const policies = new Map<string, ConflictPolicy>([...Object.entries(DEFAULT_CONFLICT_POLICIES), ...Object.entries(overrides)]);

  return {
    getPolicy(entityType: string): ConflictPolicy {
      return policies.get(entityType) ?? DEFAULT_CONFLICT_POLICY;
    },
    hasPolicy(entityType: string): boolean {
      return policies.has(entityType);
    },
    entries(): Array<[string, ConflictPolicy]> {
      return [...policies.entries()];
    },
  };
};

export const normalizeConflictPolicy = (policy: ConflictPolicy | undefined, entityType: string): ConflictPolicy =>
  policy ?? DEFAULT_CONFLICT_POLICIES[entityType] ?? DEFAULT_CONFLICT_POLICY;

export const isConflictRecord = (value: unknown): value is ConflictRecord =>
  typeof value === 'object' && value !== null && 'conflictId' in value && 'entityType' in value && 'entityId' in value;
