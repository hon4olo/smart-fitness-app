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
  DEFAULT_CONFLICT_POLICY,
  normalizeConflictPolicy,
} from './CloudConflictPolicies';
import { CLOUD_CONFLICT_RESOLUTION_STRATEGIES, CLOUD_CONFLICT_STATUSES } from './CloudSyncTypes';

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
  resolveBatch(records: ConflictRecord[], policies?: ConflictPolicyRegistry | Record<string, ConflictPolicy>): ConflictResolutionResult[];
  canAutoResolve(record: ConflictRecord, policy?: ConflictPolicy): boolean;
  explainResolution(result: ConflictResolutionResult): string;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isIdObject = (value: unknown): value is Record<string, unknown> & { id: string } => isPlainObject(value) && typeof value.id === 'string' && value.id.trim().length > 0;

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  return `{${Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(',')}}`;
};

const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)])) as T;
  }

  return value;
};

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left).filter((key) => left[key] !== undefined).sort();
    const rightKeys = Object.keys(right).filter((key) => right[key] !== undefined).sort();
    if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) {
      return false;
    }

    return leftKeys.every((key) => deepEqual(left[key], right[key]));
  }

  return false;
};

const getTimestampValue = (value: unknown): number | null => {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of ['updatedAt', 'modifiedAt', 'createdAt'] as const) {
    const candidate = value[key];
    if (typeof candidate === 'string') {
      const parsed = Date.parse(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const compareRevisions = (left?: SyncRevision, right?: SyncRevision): number => {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return -1;
  }

  if (!right) {
    return 1;
  }

  if (left.number !== right.number) {
    return left.number - right.number;
  }

  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  if (left.id !== right.id) {
    return left.id.localeCompare(right.id);
  }

  return (left.parentRevisionId ?? '').localeCompare(right.parentRevisionId ?? '');
};

const compareRecency = (
  left: { value: unknown; revision?: SyncRevision },
  right: { value: unknown; revision?: SyncRevision },
  tieBreaker: 'local' | 'remote' = 'local',
): number => {
  const revisionComparison = compareRevisions(left.revision, right.revision);
  if (revisionComparison !== 0) {
    return revisionComparison;
  }

  const leftTimestamp = Math.max(getTimestampValue(left.value) ?? Number.NEGATIVE_INFINITY, left.revision ? Date.parse(left.revision.createdAt) : Number.NEGATIVE_INFINITY);
  const rightTimestamp = Math.max(getTimestampValue(right.value) ?? Number.NEGATIVE_INFINITY, right.revision ? Date.parse(right.revision.createdAt) : Number.NEGATIVE_INFINITY);
  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  return tieBreaker === 'local' ? 0 : 0;
};

const getStableId = (value: unknown): string | null => (isIdObject(value) ? value.id.trim() : null);

const uniqueKeys = (values: Array<Record<string, unknown> | undefined>): string[] => {
  const keys = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const key of Object.keys(value)) {
      keys.add(key);
    }
  }
  return [...keys].sort();
};

const mergeStableArrays = (base: unknown[], local: unknown[], remote: unknown[]) => {
  const baseIds = base.map(getStableId).filter((id): id is string => Boolean(id));
  const localIds = local.map(getStableId).filter((id): id is string => Boolean(id));
  const remoteIds = remote.map(getStableId).filter((id): id is string => Boolean(id));

  if (baseIds.length === 0 && localIds.length === 0 && remoteIds.length === 0) {
    return { value: deepEqual(local, remote) ? cloneValue(local) : undefined, conflictingFields: deepEqual(local, remote) ? [] : ['root'] as string[] };
  }

  const order: string[] = [];
  for (const id of [...baseIds, ...localIds, ...remoteIds]) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }

  const baseMap = new Map<string, unknown>(base.filter(isIdObject).map((item) => [item.id.trim(), item]));
  const localMap = new Map<string, unknown>(local.filter(isIdObject).map((item) => [item.id.trim(), item]));
  const remoteMap = new Map<string, unknown>(remote.filter(isIdObject).map((item) => [item.id.trim(), item]));

  const merged: unknown[] = [];
  const conflicts: string[] = [];

  const pushUnique = (item: unknown) => {
    const id = getStableId(item);
    if (id) {
      if (merged.some((existing) => getStableId(existing) === id)) {
        return;
      }
      merged.push(cloneValue(item));
      return;
    }

    if (!merged.some((existing) => deepEqual(existing, item))) {
      merged.push(cloneValue(item));
    }
  };

  for (const id of order) {
    const baseItem = baseMap.get(id);
    const localItem = localMap.get(id);
    const remoteItem = remoteMap.get(id);

    if (localItem && remoteItem) {
      if (deepEqual(localItem, remoteItem)) {
        pushUnique(localItem);
        continue;
      }

      if (baseItem && deepEqual(localItem, baseItem)) {
        pushUnique(remoteItem);
        continue;
      }

      if (baseItem && deepEqual(remoteItem, baseItem)) {
        pushUnique(localItem);
        continue;
      }

      if (isPlainObject(baseItem) && isPlainObject(localItem) && isPlainObject(remoteItem)) {
        const nested = mergeThreeWayValue(baseItem, localItem, remoteItem, id);
        if (nested.conflictingFields.length === 0 && nested.value !== undefined) {
          pushUnique(nested.value);
        } else {
          conflicts.push(...nested.conflictingFields.map((field) => `${id}.${field}`));
        }
        continue;
      }

      const localRecency = compareRecency({ value: localItem }, { value: remoteItem }, 'local');
      pushUnique(localRecency >= 0 ? localItem : remoteItem);
      continue;
    }

    if (localItem || remoteItem) {
      pushUnique(localItem ?? remoteItem);
    }
  }

  return { value: merged, conflictingFields: conflicts };
};

const mergeThreeWayValue = (base: unknown, local: unknown, remote: unknown, path = ''): { value: unknown; conflictingFields: string[] } => {
  if (deepEqual(local, remote)) {
    return { value: cloneValue(local), conflictingFields: [] };
  }

  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    return mergeStableArrays(base, local, remote);
  }

  if (isPlainObject(base) && isPlainObject(local) && isPlainObject(remote)) {
    const result: Record<string, unknown> = {};
    const conflicts: string[] = [];

    for (const key of uniqueKeys([base, local, remote])) {
      const currentPath = path ? `${path}.${key}` : key;
      const baseValue = base[key];
      const localValue = local[key];
      const remoteValue = remote[key];
      const localChanged = !deepEqual(localValue, baseValue);
      const remoteChanged = !deepEqual(remoteValue, baseValue);

      if (!localChanged && !remoteChanged) {
        if (baseValue !== undefined) {
          result[key] = cloneValue(baseValue);
        }
        continue;
      }

      if (localChanged && !remoteChanged) {
        result[key] = cloneValue(localValue);
        continue;
      }

      if (!localChanged && remoteChanged) {
        result[key] = cloneValue(remoteValue);
        continue;
      }

      if (Array.isArray(baseValue) && Array.isArray(localValue) && Array.isArray(remoteValue)) {
        const nested = mergeThreeWayValue(baseValue, localValue, remoteValue, currentPath);
        if (nested.conflictingFields.length === 0) {
          result[key] = nested.value;
        } else {
          conflicts.push(...nested.conflictingFields);
        }
        continue;
      }

      if (isPlainObject(baseValue) && isPlainObject(localValue) && isPlainObject(remoteValue)) {
        const nested = mergeThreeWayValue(baseValue, localValue, remoteValue, currentPath);
        if (nested.conflictingFields.length === 0) {
          result[key] = nested.value;
        } else {
          conflicts.push(...nested.conflictingFields);
        }
        continue;
      }

      if (deepEqual(localValue, remoteValue)) {
        result[key] = cloneValue(localValue);
        continue;
      }

      conflicts.push(currentPath);
    }

    return { value: result, conflictingFields: conflicts };
  }

  if (deepEqual(local, base)) {
    return { value: cloneValue(remote), conflictingFields: [] };
  }

  if (deepEqual(remote, base)) {
    return { value: cloneValue(local), conflictingFields: [] };
  }

  return { value: undefined, conflictingFields: path ? [path] : ['root'] };
};

const unionAppendOnlyValues = (local: unknown, remote: unknown): { value?: unknown; conflictingFields: string[] } => {
  if (Array.isArray(local) && Array.isArray(remote)) {
    const merged: unknown[] = [];
    const seen = new Set<string>();
    const visit = (items: unknown[]) => {
      for (const item of items) {
        const id = getStableId(item);
        const key = id ?? stableStringify(item);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        merged.push(cloneValue(item));
      }
    };

    visit(local);
    visit(remote);
    return { value: merged, conflictingFields: [] };
  }

  if (deepEqual(local, remote)) {
    return { value: cloneValue(local), conflictingFields: [] };
  }

  return { conflictingFields: ['root'] };
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
  typeof value === 'object' && value !== null && 'getPolicy' in value && typeof (value as { getPolicy?: unknown }).getPolicy === 'function';

const normalizeRegistryLookup = (lookup?: ConflictPolicyRegistry | Record<string, ConflictPolicy>): ConflictPolicyRegistry => {
  if (!lookup) {
    return createConflictPolicyRegistry();
  }

  if (isConflictPolicyRegistry(lookup)) {
    return lookup;
  }

  return createConflictPolicyRegistry(lookup);
};

const determinePolicy = (record: Pick<ConflictRecord, 'entityType'>, policy?: ConflictPolicy, registry?: ConflictPolicyRegistry): ConflictPolicy =>
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

  if (result.requiresManualReview) {
    parts.push('manual review required');
  }

  return parts.join(' | ');
};

const chooseByPolicy = (
  record: ConflictRecord,
  policy: ConflictPolicy,
): { outcome: ConflictResolutionOutcome; resolvedValue?: unknown; conflictingFields: string[]; reason: string } => {
  const localValue = record.localVersion;
  const remoteValue = record.remoteVersion;
  const deleteConflict = localValue === null || remoteValue === null;

  if (policy.strategy === 'manualReview') {
    return { outcome: 'needsReview', conflictingFields: deleteConflict ? ['root'] : [], reason: getDeleteConflictReason(record) };
  }

  if (policy.strategy === 'localWins') {
    return { outcome: 'autoResolved', resolvedValue: cloneValue(localValue), conflictingFields: [], reason: 'local version chosen' };
  }

  if (policy.strategy === 'remoteWins') {
    return { outcome: 'autoResolved', resolvedValue: cloneValue(remoteValue), conflictingFields: [], reason: 'remote version chosen' };
  }

  if (policy.strategy === 'lastWriteWins') {
    const comparison = compareRecency({ value: localValue, revision: record.localRevision }, { value: remoteValue, revision: record.remoteRevision }, policy.preferStableTieBreak ?? 'local');
    if (comparison > 0) {
      return { outcome: 'autoResolved', resolvedValue: cloneValue(localValue), conflictingFields: [], reason: 'local version is newer' };
    }

    if (comparison < 0) {
      return { outcome: 'autoResolved', resolvedValue: cloneValue(remoteValue), conflictingFields: [], reason: 'remote version is newer' };
    }

    return {
      outcome: 'autoResolved',
      resolvedValue: cloneValue(policy.preferStableTieBreak === 'remote' ? remoteValue : localValue),
      conflictingFields: [],
      reason: 'deterministic tie resolved by policy',
    };
  }

  if (policy.strategy === 'appendUnion') {
    if (deleteConflict && policy.allowDeleteStrategy === 'manualReview') {
      return { outcome: 'needsReview', conflictingFields: ['root'], reason: getDeleteConflictReason(record) };
    }

    const union = unionAppendOnlyValues(localValue, remoteValue);
    if (union.value !== undefined) {
      return { outcome: 'autoResolved', resolvedValue: union.value, conflictingFields: [], reason: 'append-only union applied' };
    }

    return { outcome: 'needsReview', conflictingFields: union.conflictingFields, reason: 'append-only union unavailable' };
  }

  if (policy.strategy === 'mergeFields') {
    if (deleteConflict && policy.allowDeleteStrategy === 'manualReview') {
      return { outcome: 'needsReview', conflictingFields: ['root'], reason: getDeleteConflictReason(record) };
    }

    if (record.baseVersion === undefined) {
      if (isPlainObject(localValue) && isPlainObject(remoteValue)) {
        const merged = mergeThreeWayValue({}, localValue, remoteValue);
        if (merged.conflictingFields.length === 0 && merged.value !== undefined) {
          return { outcome: 'autoResolved', resolvedValue: merged.value, conflictingFields: [], reason: 'merged without base using identical structure' };
        }
      }

      return { outcome: 'needsReview', conflictingFields: ['root'], reason: 'base version required for structured merge' };
    }

    const merged = mergeThreeWayValue(record.baseVersion, localValue, remoteValue);
    if (merged.conflictingFields.length === 0 && merged.value !== undefined) {
      return { outcome: 'autoResolved', resolvedValue: merged.value, conflictingFields: [], reason: 'three-way merge applied' };
    }

    return { outcome: 'needsReview', conflictingFields: merged.conflictingFields.length > 0 ? merged.conflictingFields : ['root'], reason: 'overlapping changes require review' };
  }

  return { outcome: 'needsReview', conflictingFields: ['root'], reason: 'manual review required' };
};

export const createConflictResolver = (registry: ConflictPolicyRegistry = createConflictPolicyRegistry()): ConflictResolver => {
  const detectConflict = (input: ConflictDetectionInput): ConflictRecord | null => {
    const localVersion = cloneValue(input.localVersion);
    const remoteVersion = cloneValue(input.remoteVersion);

    if (deepEqual(localVersion, remoteVersion)) {
      return null;
    }

    const policy = registry.getPolicy(input.entityType);
    const status: ConflictStatus = 'unresolved';

    return {
      conflictId: makeConflictId(input),
      entityType: input.entityType,
      entity: input.entityType,
      entityId: input.entityId,
      localVersion,
      remoteVersion,
      baseVersion: input.baseVersion !== undefined ? cloneValue(input.baseVersion) : undefined,
      localRevision: input.localRevision,
      remoteRevision: input.remoteRevision,
      detectedAt: input.detectedAt ?? new Date().toISOString(),
      status,
      resolutionStrategy: policy.strategy,
      reason: input.reason ?? getDeleteConflictReason({
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

  const resolveConflict = (record: ConflictRecord, policy?: ConflictPolicy): ConflictResolutionResult => {
    const selectedPolicy = determinePolicy(record, policy, registry);
    const choice = chooseByPolicy(record, selectedPolicy);
    const status: ConflictStatus =
      choice.outcome === 'autoResolved' ? 'autoResolved' : choice.outcome === 'resolved' ? 'resolved' : choice.outcome === 'ignored' ? 'ignored' : 'needsReview';

    const resolvedRecord: ConflictRecord = {
      ...record,
      status,
      resolutionStrategy: selectedPolicy.strategy,
      resolvedVersion: choice.resolvedValue,
      reason: choice.reason,
    };

    return {
      outcome: choice.outcome,
      chosenStrategy: selectedPolicy.strategy,
      resolvedValue: choice.resolvedValue,
      conflictingFields: choice.conflictingFields,
      explanation: makeResolutionExplanation({
        outcome: choice.outcome,
        chosenStrategy: selectedPolicy.strategy,
        resolvedValue: choice.resolvedValue,
        conflictingFields: choice.conflictingFields,
        explanation: '',
        requiresManualReview: choice.outcome === 'needsReview',
        record: resolvedRecord,
        reason: choice.reason,
      }),
      requiresManualReview: choice.outcome === 'needsReview',
      record: resolvedRecord,
      reason: choice.reason,
    };
  };

  const resolveBatch = (records: ConflictRecord[], policies?: ConflictPolicyRegistry | Record<string, ConflictPolicy>): ConflictResolutionResult[] => {
    const lookup = normalizeRegistryLookup(policies);
    return records.map((record) => resolveConflict(record, lookup.getPolicy(record.entityType)));
  };

  const canAutoResolve = (record: ConflictRecord, policy?: ConflictPolicy): boolean => resolveConflict(record, policy).outcome !== 'needsReview';

  const explainResolution = (result: ConflictResolutionResult): string => result.explanation || makeResolutionExplanation(result);

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
