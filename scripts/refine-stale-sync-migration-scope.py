from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


# The initial patch intentionally computed a canonical key for comparison. Restore
# normal queue semantics: stored keys remain authoritative until the backend
# specifically rejects one as reused for different content.
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """  const canonicalIdempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType,
    entityId,
    action,
    clientTimestamp,
    actorId,
    baseRevision,
    payload,
  });
  const idempotencyKey =
    !entityIdChanged &&
    !payloadCompatibility.changed &&
    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey) &&
    operation.idempotencyKey === canonicalIdempotencyKey
      ? operation.idempotencyKey
      : canonicalIdempotencyKey;
""",
    """  const idempotencyKey =
    !entityIdChanged &&
    !payloadCompatibility.changed &&
    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)
      ? operation.idempotencyKey
      : createOfflineSyncQueueIdempotencyKey({
          entityType,
          entityId,
          action,
          clientTimestamp,
          actorId,
          baseRevision,
          payload,
        });
""",
)

# Provide an explicit repair primitive used only after the backend identifies a
# reused key. It returns a new immutable queue record and updates request metadata.
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """export const createOfflineSyncQueueBackoff = (
""",
    """export const repairOfflineSyncQueueOperationIdempotencyKey = (
  operation: OfflineSyncQueueOperation,
): OfflineSyncQueueOperation => {
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: operation.entityType,
    entityId: operation.entityId,
    action: operation.action,
    clientTimestamp: operation.clientTimestamp,
    actorId: operation.actorId,
    baseRevision: operation.baseRevision,
    payload: operation.payload,
  });
  if (idempotencyKey === operation.idempotencyKey) return operation;
  return {
    ...operation,
    idempotencyKey,
    metadata: {
      ...operation.metadata,
      requestId: idempotencyKey,
    },
  };
};

export const createOfflineSyncQueueBackoff = (
""",
)
replace_once(
    'src/cloud/index.ts',
    """  normalizeOfflineSyncQueueOperation,
  sortOfflineSyncQueueOperations,
""",
    """  normalizeOfflineSyncQueueOperation,
  repairOfflineSyncQueueOperationIdempotencyKey,
  sortOfflineSyncQueueOperations,
""",
)

# Repair only the queue entries explicitly rejected by the backend. Valid sibling
# acknowledgements are already removed immediately before this block.
replace_once(
    'src/context/SyncContext.tsx',
    """import type { SyncCoordinator } from '@/cloud';
""",
    """import {
  repairOfflineSyncQueueOperationIdempotencyKey,
  type SyncCoordinator,
} from '@/cloud';
""",
)
replace_once(
    'src/context/SyncContext.tsx',
    """        await queueStore.removeAcknowledged();
      }

      if (result.status.phase === 'Failed') {
""",
    """        await queueStore.removeAcknowledged();
      }

      const reusedKeyOperationIds = new Set(
        (pushResult?.rejectedOperations ?? [])
          .filter(
            (operation) =>
              operation.status === 409 &&
              operation.code?.toUpperCase() === 'SYNC_IDEMPOTENCY_KEY_REUSE',
          )
          .map((operation) => operation.operationId),
      );
      if (reusedKeyOperationIds.size > 0) {
        const queuedOperations = await queueStore.loadOperations();
        for (const operation of queuedOperations) {
          if (!reusedKeyOperationIds.has(operation.opId)) continue;
          const repaired = repairOfflineSyncQueueOperationIdempotencyKey(operation);
          if (repaired.idempotencyKey === operation.idempotencyKey) continue;
          await queueStore.updateOperation(operation.opId, {
            idempotencyKey: repaired.idempotencyKey,
            metadata: repaired.metadata,
            status: 'pending',
            lastError: undefined,
            nextRetryAt: undefined,
          });
        }
      }

      if (result.status.phase === 'Failed') {
""",
)

# Replace the broad migration test with a unit test for targeted backend-rejection
# repair. Default normalization behavior remains unchanged and existing queue,
# outbox, and payload-scope contracts stay valid.
Path('test/sync-stale-idempotency-repair.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import {
  createOfflineSyncQueueIdempotencyKey,
  repairOfflineSyncQueueOperationIdempotencyKey,
} from '@/cloud/CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';

const now = '2026-07-27T06:00:00.000Z';
const revision = { id: 'rev-3', number: 3, createdAt: now };
const operation = (overrides: Partial<OfflineSyncQueueOperation> = {}): OfflineSyncQueueOperation => ({
  opId: 'foodEntries:entry-1',
  entityType: 'foodEntries',
  entityId: '11111111-1111-4111-8111-111111111111',
  action: 'update',
  clientTimestamp: now,
  actorId: '22222222-2222-4222-8222-222222222222',
  baseRevision: revision,
  payload: { id: '11111111-1111-4111-8111-111111111111', calories: 125 },
  idempotencyKey: 'queue:foodEntries:legacy:update:stale',
  retryCount: 0,
  status: 'pending',
  metadata: { requestId: 'queue:foodEntries:legacy:update:stale' },
  ...overrides,
});

describe('stale sync idempotency repair', () => {
  it('regenerates a backend-rejected key from current operation content', () => {
    const current = operation();
    const repaired = repairOfflineSyncQueueOperationIdempotencyKey(current);
    const expected = createOfflineSyncQueueIdempotencyKey(current);

    expect(repaired.idempotencyKey).toBe(expected);
    expect(repaired.idempotencyKey).not.toBe(current.idempotencyKey);
    expect(repaired.metadata?.requestId).toBe(expected);
    expect(repaired.payload).toEqual(current.payload);
  });

  it('returns the same operation when its key is already canonical', () => {
    const draft = operation();
    const canonical = createOfflineSyncQueueIdempotencyKey(draft);
    const current = operation({
      idempotencyKey: canonical,
      metadata: { requestId: canonical },
    });

    expect(repairOfflineSyncQueueOperationIdempotencyKey(current)).toBe(current);
  });
});
""")

print('Targeted stale key repair to backend-rejected queue operations')
