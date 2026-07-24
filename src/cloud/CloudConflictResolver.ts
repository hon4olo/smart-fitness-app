import type {
  ConflictRecord,
  ConflictResolutionStrategy,
  ConflictStatus,
  SyncMetadata,
  SyncOperation,
  SyncRevision,
} from './CloudSyncTypes';
import {
  type ConflictPolicy,
  type ConflictPolicyRegistry,
  createConflictPolicyRegistry,
  normalizeConflictPolicy,
} from './CloudConflictPolicies';
import { CLOUD_CONFLICT_RESOLUTION_STRATEGIES, CLOUD_CONFLICT_STATUSES } from './CloudSyncTypes';
import {
  cloneValue,
  compareRecency,
  deepEqual,
  isPlainObject,
  mergeThreeWayValue,
  stableStringify,
  unionAppendOnlyValues,
} from './CloudConflictResolverValues';

export type ConflictDetectionInput = {
  entityType: string;
  entityId: string;
  localVersion: unknown;
  remoteVersion: unknown;
  baseVersion?: unknown;
  localRevision?: SyncRevision;
  remoteRevision?: SyncRevision;
  detectedAt?: string;
  metadata?: SyncMetadata;
  localOperation?: SyncOperation;
  remoteOperation?: SyncOperation;
  reason?: string;
};

export type ConflictResolutionOutcome = 'autoResolved' | 'resolved' | 'needsReview' | 'ignored';

export type ConflictResolutionResult = {
  outcome: ConflictResolutionOutcome;
  chosenStrategy: ConflictResolutionStrategy;
  resolvedValue?: unknown;
  conflictingFields: string[];
  explanation: string;
  requiresManualReview: boolean;
  record: ConflictRecord;
  reason: string;
};

export type ConflictResolver = {
  detectConflict(input: ConflictDetectionInput): ConflictRecord | null;
  resolveConflict(record: ConflictRecord, policy?: ConflictPolicy): ConflictResolutionResult;
  resolveBatch(
    records: ConflictRecord[],
    policies?: ConflictPolicyRegistry | Record<string, ConflictPolicy>,
  ): ConflictResolutionResult[];
  canAutoResolve(record: ConflictRecord, policy?: ConflictPolicy): boolean;
  explainResolution(result: ConflictResolutionResult): string;
};

const getDeleteConflictReason = (record: ConflictRecord): string => {
  if (record.localVersion === null && record.remoteVersion !== null) {
    return 'local delete versus remote update';
  }
  if (record.remoteVersion === null && record.localVersion !== null) {
    return 'local update versus remote delete';
  }
  return 'versions differ';
};

const isConflictPolicyRegistry = (value: unknown): value is ConflictPolicyRegistry =>
  typeof value === 'object' &&
  value !== null &&
  'getPolicy' in value &&
  typeof (value as { getPolicy?: unknown }).getPolicy === 'function';

const normalizeRegistryLookup = (
  lookup?: ConflictPolicyRegistry | Record<string, ConflictPolicy>,
): ConflictPolicyRegistry => {
  if (!lookup) return createConflictPolicyRegistry();
  if (isConflictPolicyRegistry(lookup)) return lookup;
  return createConflictPolicyRegistry(lookup);
};

const determinePolicy = (
  record: Pick<ConflictRecord, 'entityType'>,
  policy?: ConflictPolicy,
  registry?: ConflictPolicyRegistry,
): ConflictPolicy =>
  normalizeConflictPolicy(policy ?? registry?.getPolicy(record.entityType), record.entityType);

const makeConflictId = (input: ConflictDetectionInput): string =>
  [
    'conflict',
    input.entityType,
    input.entityId,
    input.localRevision?.id ?? '',
    input.remoteRevision?.id ?? '',
    input.localRevision?.number ?? '',
    input.remoteRevision?.number ?? '',
    stableStringify(input.localVersion),
    stableStringify(input.remoteVersion),
  ].join(':');

const makeResolutionExplanation = (result: ConflictResolutionResult): string => {
  const parts = [
    `entity ${result.record.entityType}:${result.record.entityId}`,
    `outcome ${result.outcome}`,
    `strategy ${result.chosenStrategy}`,
  ];

  if (result.conflictingFields.length > 0) {
    parts.push(`conflicts ${result.conflictingFields.join(', ')}`);
  }
  if (result.requiresManualReview) parts.push('manual review required');
  return parts.join(' | ');
};

const chooseByPolicy = (
  record: ConflictRecord,
  policy: ConflictPolicy,
): {
  outcome: ConflictResolutionOutcome;
  resolvedValue?: unknown;
  conflictingFields: string[];
  reason: string;
} => {
  const localValue = record.localVersion;
  const remoteValue = record.remoteVersion;
  const deleteConflict = localValue === null || remoteValue === null;

  if (policy.strategy === 'manualReview') {
    return {
      outcome: 'needsReview',
      conflictingFields: deleteConflict ? ['root'] : [],
      reason: getDeleteConflictReason(record),
    };
  }
  if (policy.strategy === 'localWins') {
    return {
      outcome: 'autoResolved',
      resolvedValue: cloneValue(localValue),
      conflictingFields: [],
      reason: 'local version chosen',
    };
  }
  if (policy.strategy === 'remoteWins') {
    return {
      outcome: 'autoResolved',
      resolvedValue: cloneValue(remoteValue),
      conflictingFields: [],
      reason: 'remote version chosen',
    };
  }
  if (policy.strategy === 'lastWriteWins') {
    const comparison = compareRecency(
      { value: localValue, revision: record.localRevision },
      { value: remoteValue, revision: record.remoteRevision },
      policy.preferStableTieBreak ?? 'local',
    );
    if (comparison > 0) {
      return {
        outcome: 'autoResolved',
        resolvedValue: cloneValue(localValue),
        conflictingFields: [],
        reason: 'local version is newer',
      };
    }
    if (comparison < 0) {
      return {
        outcome: 'autoResolved',
        resolvedValue: cloneValue(remoteValue),
        conflictingFields: [],
        reason: 'remote version is newer',
      };
    }
    return {
      outcome: 'autoResolved',
      resolvedValue: cloneValue(
        policy.preferStableTieBreak === 'remote' ? remoteValue : localValue,
      ),
      conflictingFields: [],
      reason: 'deterministic tie resolved by policy',
    };
  }
  if (policy.strategy === 'appendUnion') {
    if (deleteConflict && policy.allowDeleteStrategy === 'manualReview') {
      return {
        outcome: 'needsReview',
        conflictingFields: ['root'],
        reason: getDeleteConflictReason(record),
      };
    }
    const union = unionAppendOnlyValues(localValue, remoteValue);
    if (union.value !== undefined) {
      return {
        outcome: 'autoResolved',
        resolvedValue: union.value,
        conflictingFields: [],
        reason: 'append-only union applied',
      };
    }
    return {
      outcome: 'needsReview',
      conflictingFields: union.conflictingFields,
      reason: 'append-only union unavailable',
    };
  }
  if (policy.strategy === 'mergeFields') {
    if (deleteConflict && policy.allowDeleteStrategy === 'manualReview') {
      return {
        outcome: 'needsReview',
        conflictingFields: ['root'],
        reason: getDeleteConflictReason(record),
      };
    }
    if (record.baseVersion === undefined) {
      if (isPlainObject(localValue) && isPlainObject(remoteValue)) {
        const merged = mergeThreeWayValue({}, localValue, remoteValue);
        if (merged.conflictingFields.length === 0 && merged.value !== undefined) {
          return {
            outcome: 'autoResolved',
            resolvedValue: merged.value,
            conflictingFields: [],
            reason: 'merged without base using identical structure',
          };
        }
      }
      return {
        outcome: 'needsReview',
        conflictingFields: ['root'],
        reason: 'base version required for structured merge',
      };
    }

    const merged = mergeThreeWayValue(record.baseVersion, localValue, remoteValue);
    if (merged.conflictingFields.length === 0 && merged.value !== undefined) {
      return {
        outcome: 'autoResolved',
        resolvedValue: merged.value,
        conflictingFields: [],
        reason: 'three-way merge applied',
      };
    }
    return {
      outcome: 'needsReview',
      conflictingFields:
        merged.conflictingFields.length > 0 ? merged.conflictingFields : ['root'],
      reason: 'overlapping changes require review',
    };
  }

  return {
    outcome: 'needsReview',
    conflictingFields: ['root'],
    reason: 'manual review required',
  };
};

export const createConflictResolver = (
  registry: ConflictPolicyRegistry = createConflictPolicyRegistry(),
): ConflictResolver => {
  const detectConflict = (input: ConflictDetectionInput): ConflictRecord | null => {
    const localVersion = cloneValue(input.localVersion);
    const remoteVersion = cloneValue(input.remoteVersion);
    if (deepEqual(localVersion, remoteVersion)) return null;

    const policy = registry.getPolicy(input.entityType);
    const status: ConflictStatus = 'unresolved';
    return {
      conflictId: makeConflictId(input),
      entityType: input.entityType,
      entity: input.entityType,
      entityId: input.entityId,
      localVersion,
      remoteVersion,
      baseVersion:
        input.baseVersion !== undefined ? cloneValue(input.baseVersion) : undefined,
      localRevision: input.localRevision,
      remoteRevision: input.remoteRevision,
      detectedAt: input.detectedAt ?? new Date().toISOString(),
      status,
      resolutionStrategy: policy.strategy,
      reason:
        input.reason ??
        getDeleteConflictReason({
          conflictId: '',
          entityType: input.entityType,
          entity: input.entityType,
          entityId: input.entityId,
          localVersion,
          remoteVersion,
          detectedAt: input.detectedAt ?? '',
          status,
          reason: '',
        } as ConflictRecord),
      metadata: input.metadata,
      localOperation: input.localOperation,
      remoteOperation: input.remoteOperation,
    };
  };

  const resolveConflict = (
    record: ConflictRecord,
    policy?: ConflictPolicy,
  ): ConflictResolutionResult => {
    const selectedPolicy = determinePolicy(record, policy, registry);
    const choice = chooseByPolicy(record, selectedPolicy);
    const status: ConflictStatus =
      choice.outcome === 'autoResolved'
        ? 'autoResolved'
        : choice.outcome === 'resolved'
          ? 'resolved'
          : choice.outcome === 'ignored'
            ? 'ignored'
            : 'needsReview';
    const resolvedRecord: ConflictRecord = {
      ...record,
      status,
      resolutionStrategy: selectedPolicy.strategy,
      resolvedVersion: choice.resolvedValue,
      reason: choice.reason,
    };
    const result: ConflictResolutionResult = {
      outcome: choice.outcome,
      chosenStrategy: selectedPolicy.strategy,
      resolvedValue: choice.resolvedValue,
      conflictingFields: choice.conflictingFields,
      explanation: '',
      requiresManualReview: choice.outcome === 'needsReview',
      record: resolvedRecord,
      reason: choice.reason,
    };
    return { ...result, explanation: makeResolutionExplanation(result) };
  };

  const resolveBatch = (
    records: ConflictRecord[],
    policies?: ConflictPolicyRegistry | Record<string, ConflictPolicy>,
  ): ConflictResolutionResult[] => {
    const lookup = normalizeRegistryLookup(policies);
    return records.map((record) => resolveConflict(record, lookup.getPolicy(record.entityType)));
  };

  const canAutoResolve = (record: ConflictRecord, policy?: ConflictPolicy): boolean =>
    resolveConflict(record, policy).outcome !== 'needsReview';

  const explainResolution = (result: ConflictResolutionResult): string =>
    result.explanation || makeResolutionExplanation(result);

  return {
    detectConflict,
    resolveConflict,
    resolveBatch,
    canAutoResolve,
    explainResolution,
  };
};

export { CLOUD_CONFLICT_RESOLUTION_STRATEGIES, CLOUD_CONFLICT_STATUSES };
export type { ConflictPolicy, ConflictPolicyRegistry } from './CloudConflictPolicies';
