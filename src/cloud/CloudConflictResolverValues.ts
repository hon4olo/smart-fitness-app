import type { SyncRevision } from './CloudSyncTypes';

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIdObject = (value: unknown): value is Record<string, unknown> & { id: string } =>
  isPlainObject(value) && typeof value.id === 'string' && value.id.trim().length > 0;

export const stableStringify = (value: unknown): string => {
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

export const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)]),
    ) as T;
  }

  return value;
};

export const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => deepEqual(item, right[index]))
    );
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left)
      .filter((key) => left[key] !== undefined)
      .sort();
    const rightKeys = Object.keys(right)
      .filter((key) => right[key] !== undefined)
      .sort();
    if (
      leftKeys.length !== rightKeys.length ||
      leftKeys.some((key, index) => key !== rightKeys[index])
    ) {
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
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;
  if (left.number !== right.number) return left.number - right.number;

  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);
  if (leftTime !== rightTime) return leftTime - rightTime;
  if (left.id !== right.id) return left.id.localeCompare(right.id);
  return (left.parentRevisionId ?? '').localeCompare(right.parentRevisionId ?? '');
};

export const compareRecency = (
  left: { value: unknown; revision?: SyncRevision },
  right: { value: unknown; revision?: SyncRevision },
  tieBreaker: 'local' | 'remote' = 'local',
): number => {
  const revisionComparison = compareRevisions(left.revision, right.revision);
  if (revisionComparison !== 0) return revisionComparison;

  const leftTimestamp = Math.max(
    getTimestampValue(left.value) ?? Number.NEGATIVE_INFINITY,
    left.revision ? Date.parse(left.revision.createdAt) : Number.NEGATIVE_INFINITY,
  );
  const rightTimestamp = Math.max(
    getTimestampValue(right.value) ?? Number.NEGATIVE_INFINITY,
    right.revision ? Date.parse(right.revision.createdAt) : Number.NEGATIVE_INFINITY,
  );
  if (leftTimestamp !== rightTimestamp) return leftTimestamp - rightTimestamp;
  return tieBreaker === 'local' ? 0 : 0;
};

const getStableId = (value: unknown): string | null =>
  isIdObject(value) ? value.id.trim() : null;

const uniqueKeys = (values: Array<Record<string, unknown> | undefined>): string[] => {
  const keys = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const key of Object.keys(value)) keys.add(key);
  }
  return [...keys].sort();
};

type MergeValueResult = { value: unknown; conflictingFields: string[] };

const mergeStableArrays = (base: unknown[], local: unknown[], remote: unknown[]) => {
  const baseIds = base.map(getStableId).filter((id): id is string => Boolean(id));
  const localIds = local.map(getStableId).filter((id): id is string => Boolean(id));
  const remoteIds = remote.map(getStableId).filter((id): id is string => Boolean(id));

  if (baseIds.length === 0 && localIds.length === 0 && remoteIds.length === 0) {
    return {
      value: deepEqual(local, remote) ? cloneValue(local) : undefined,
      conflictingFields: deepEqual(local, remote) ? [] : (['root'] as string[]),
    };
  }

  const order: string[] = [];
  for (const id of [...baseIds, ...localIds, ...remoteIds]) {
    if (!order.includes(id)) order.push(id);
  }

  const baseMap = new Map<string, unknown>(
    base.filter(isIdObject).map((item) => [item.id.trim(), item]),
  );
  const localMap = new Map<string, unknown>(
    local.filter(isIdObject).map((item) => [item.id.trim(), item]),
  );
  const remoteMap = new Map<string, unknown>(
    remote.filter(isIdObject).map((item) => [item.id.trim(), item]),
  );
  const merged: unknown[] = [];
  const conflicts: string[] = [];

  const pushUnique = (item: unknown) => {
    const id = getStableId(item);
    if (id) {
      if (merged.some((existing) => getStableId(existing) === id)) return;
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
      const localRecency = compareRecency(
        { value: localItem },
        { value: remoteItem },
        'local',
      );
      pushUnique(localRecency >= 0 ? localItem : remoteItem);
      continue;
    }

    if (localItem || remoteItem) pushUnique(localItem ?? remoteItem);
  }

  return { value: merged, conflictingFields: conflicts };
};

export const mergeThreeWayValue = (
  base: unknown,
  local: unknown,
  remote: unknown,
  path = '',
): MergeValueResult => {
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
        if (baseValue !== undefined) result[key] = cloneValue(baseValue);
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
      if (
        (Array.isArray(baseValue) && Array.isArray(localValue) && Array.isArray(remoteValue)) ||
        (isPlainObject(baseValue) && isPlainObject(localValue) && isPlainObject(remoteValue))
      ) {
        const nested = mergeThreeWayValue(baseValue, localValue, remoteValue, currentPath);
        if (nested.conflictingFields.length === 0) result[key] = nested.value;
        else conflicts.push(...nested.conflictingFields);
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
  if (deepEqual(local, base)) return { value: cloneValue(remote), conflictingFields: [] };
  if (deepEqual(remote, base)) return { value: cloneValue(local), conflictingFields: [] };
  return { value: undefined, conflictingFields: path ? [path] : ['root'] };
};

export const unionAppendOnlyValues = (
  local: unknown,
  remote: unknown,
): { value?: unknown; conflictingFields: string[] } => {
  if (Array.isArray(local) && Array.isArray(remote)) {
    const merged: unknown[] = [];
    const seen = new Set<string>();
    const visit = (items: unknown[]) => {
      for (const item of items) {
        const id = getStableId(item);
        const key = id ?? stableStringify(item);
        if (seen.has(key)) continue;
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
