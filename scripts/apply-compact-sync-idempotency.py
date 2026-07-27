from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "import { ensureUuid } from '@/lib/ids';\n",
    "import { createDeterministicUuid, ensureUuid } from '@/lib/ids';\n",
)

replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "const DEFAULT_RETRY_BASE_MS = 1_000;\nconst DEFAULT_RETRY_MAX_MS = 15 * 60 * 1_000;\n",
    "const DEFAULT_RETRY_BASE_MS = 1_000;\nconst DEFAULT_RETRY_MAX_MS = 15 * 60 * 1_000;\nexport const MAX_SYNC_IDEMPOTENCY_KEY_LENGTH = 255;\n",
)

replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """export const isOfflineSyncQueueIdempotencyKey = (
  value: unknown,
): value is string =>
  isString(value) && value.startsWith('queue:') && value.split(':').length >= 5;

export const createOfflineSyncQueueIdempotencyKey = (
  operation: Pick<
    OfflineSyncQueueOperation,
    'entityId' | 'entityType' | 'action' | 'clientTimestamp'
  > & {
    actorId?: string;
    baseRevision?: SyncRevision;
    payload?: Record<string, unknown>;
  },
): string =>
  [
    'queue',
    operation.entityType,
    operation.entityId,
    operation.action,
    operation.clientTimestamp,
    operation.actorId ?? '',
    operation.baseRevision
      ? `${operation.baseRevision.id}:${operation.baseRevision.number}`
      : '',
    stableStringify(operation.payload ?? {}),
  ].join(':');
""",
    """export const isOfflineSyncQueueIdempotencyKey = (
  value: unknown,
): value is string =>
  isString(value) && value.startsWith('queue:') && value.split(':').length >= 5;

export const isServerCompatibleOfflineSyncQueueIdempotencyKey = (
  value: unknown,
): value is string =>
  isOfflineSyncQueueIdempotencyKey(value) &&
  value.length <= MAX_SYNC_IDEMPOTENCY_KEY_LENGTH;

export const createOfflineSyncQueueIdempotencyKey = (
  operation: Pick<
    OfflineSyncQueueOperation,
    'entityId' | 'entityType' | 'action' | 'clientTimestamp'
  > & {
    actorId?: string;
    baseRevision?: SyncRevision;
    payload?: Record<string, unknown>;
  },
): string => {
  const canonicalOperation = stableStringify({
    action: operation.action,
    actorId: operation.actorId ?? null,
    baseRevision: operation.baseRevision ?? null,
    clientTimestamp: operation.clientTimestamp,
    entityId: operation.entityId,
    entityType: operation.entityType,
    payload: operation.payload ?? {},
  });
  const digest = createDeterministicUuid(
    `offline-sync-idempotency:v2:${canonicalOperation}`,
  );

  return ['queue', 'v2', 'op', operation.action, digest].join(':');
};
""",
)

replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)
      ? operation.idempotencyKey
""",
    """    isServerCompatibleOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)
      ? operation.idempotencyKey
""",
)

Path('test/sync-idempotency-key-length.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import {
  MAX_SYNC_IDEMPOTENCY_KEY_LENGTH,
  createOfflineSyncQueueIdempotencyKey,
  normalizeOfflineSyncQueueOperation,
} from '@/cloud/CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';

const entityId = '438533b5-0948-5d35-b53e-449e38f0233a';
const clientTimestamp = '2026-07-27T13:00:00.000Z';
const operation = (payload: Record<string, unknown>): OfflineSyncQueueOperation => ({
  opId: `fitnessProfiles:${entityId}`,
  entityType: 'fitnessProfiles',
  entityId,
  action: 'update',
  clientTimestamp,
  actorId: '22222222-2222-4222-8222-222222222222',
  payload,
  idempotencyKey: 'queue:fitnessProfiles:legacy:update:pending',
  retryCount: 0,
  status: 'pending',
});

describe('sync idempotency key length contract', () => {
  it('hashes large payloads into a deterministic server-compatible key', () => {
    const current = operation({
      displayName: 'Profile '.repeat(100),
      notes: 'x'.repeat(4_000),
      nested: { goals: Array.from({ length: 30 }, (_, index) => `goal-${index}`) },
    });
    const key = createOfflineSyncQueueIdempotencyKey(current);

    expect(key).toMatch(/^queue:v2:op:update:/);
    expect(key.length).toBeLessThanOrEqual(MAX_SYNC_IDEMPOTENCY_KEY_LENGTH);
    expect(createOfflineSyncQueueIdempotencyKey(current)).toBe(key);
    expect(
      createOfflineSyncQueueIdempotencyKey({
        ...current,
        payload: { ...current.payload, notes: 'changed' },
      }),
    ).not.toBe(key);
  });

  it('migrates an oversized persisted key while preserving the queued payload', () => {
    const legacyKey = `queue:fitnessProfiles:${entityId}:update:${'payload'.repeat(80)}`;
    const current = operation({ displayName: 'Ivan', currentWeightKg: 82.7 });
    const normalized = normalizeOfflineSyncQueueOperation({
      ...current,
      idempotencyKey: legacyKey,
      metadata: { requestId: legacyKey },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.idempotencyKey).not.toBe(legacyKey);
    expect(normalized?.idempotencyKey.length).toBeLessThanOrEqual(
      MAX_SYNC_IDEMPOTENCY_KEY_LENGTH,
    );
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
    expect(normalized?.payload).toEqual(current.payload);
  });

  it('preserves a short legacy key to avoid changing accepted retry identity', () => {
    const legacyKey = 'queue:fitnessProfiles:legacy:update:accepted';
    const normalized = normalizeOfflineSyncQueueOperation({
      ...operation({ displayName: 'Ivan' }),
      idempotencyKey: legacyKey,
    });

    expect(normalized?.idempotencyKey).toBe(legacyKey);
  });
});
""")

replace_once(
    'PROJECT_LEARNINGS.md',
    "- A deterministic client error in one queued operation must not block valid siblings. Isolate HTTP 400/422 and `SYNC_IDEMPOTENCY_KEY_REUSE` failures, regenerate keys only for operations explicitly rejected for key reuse, preserve successful uploads if pull later fails, and surface sanitized stage/entity/status/request diagnostics without tokens, email, raw payloads, or full idempotency keys.\n",
    "- A deterministic client error in one queued operation must not block valid siblings. Isolate HTTP 400/422 and `SYNC_IDEMPOTENCY_KEY_REUSE` failures, regenerate keys only for operations explicitly rejected for key reuse, preserve successful uploads if pull later fails, and surface sanitized stage/entity/status/request diagnostics without tokens, email, raw payloads, or full idempotency keys. Idempotency keys sent to the backend must stay within its 255-character contract: hash the canonical operation content instead of embedding serialized payloads, and migrate only persisted keys that violate the server limit.\n",
)

print('Applied compact deterministic sync idempotency keys and migration tests')
