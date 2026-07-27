import { describe, expect, it } from 'vitest';

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
