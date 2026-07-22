import { describe, expect, it } from 'vitest';

import { ensureUuid } from '@/lib/ids';

import {
  normalizeOfflineSyncQueueOperation,
  toOfflineSyncQueueSyncOperation,
} from './CloudQueueHelpers';

describe('legacy offline queue migration', () => {
  it('uses the same deterministic UUID for entityId and payload id', () => {
    const operation = normalizeOfflineSyncQueueOperation({
      opId: 'weightHistory:1721640000000',
      entityType: 'weightHistory',
      entityId: '1721640000000',
      action: 'update',
      payload: {
        id: '1721640000000',
        weight: 69.5,
        recordedAt: '2026-07-22T08:00:00.000Z',
      },
      clientTimestamp: '2026-07-22T09:00:00.000Z',
      idempotencyKey: 'queue:weightHistory:legacy:update:timestamp',
      retryCount: 0,
      status: 'pending',
    });

    const expectedId = ensureUuid('1721640000000');
    expect(operation?.entityId).toBe(expectedId);
    expect(operation?.payload?.id).toBe(expectedId);
  });

  it('passes the stored idempotency key into the network operation', () => {
    const operation = normalizeOfflineSyncQueueOperation({
      opId: 'weightHistory:1721640000000',
      entityType: 'weightHistory',
      entityId: '1721640000000',
      action: 'update',
      payload: {
        id: '1721640000000',
        weight: 69.5,
        recordedAt: '2026-07-22T08:00:00.000Z',
      },
      clientTimestamp: '2026-07-22T09:00:00.000Z',
      idempotencyKey: 'queue:weightHistory:legacy:update:timestamp',
      retryCount: 0,
      status: 'pending',
    });

    expect(operation).not.toBeNull();
    expect(toOfflineSyncQueueSyncOperation(operation!).metadata?.requestId).toBe(
      'queue:weightHistory:legacy:update:timestamp',
    );
  });
});
