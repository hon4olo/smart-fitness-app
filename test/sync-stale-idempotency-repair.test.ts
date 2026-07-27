import { describe, expect, it } from 'vitest';

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
