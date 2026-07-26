import { describe, expect, it } from 'vitest';

import { createFitnessProfileQueueOperation } from '@/cloud/FitnessProfileSync';
import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';
import { defaultState } from '@/data/defaults';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const now = '2026-07-26T18:00:00.000Z';

const createProfileOperation = () =>
  createFitnessProfileQueueOperation({
    action: 'create',
    profile: {
      ...defaultState.profile,
      activityLevel: 'moderate',
      dateOfBirth: '2008-01-01',
      goalType: 'gain_muscle',
      targetWeight: 82.7,
      trainingDaysPerWeek: 3,
    },
    userId,
    deviceId,
    baseRevision: 0,
    now,
  });

describe('fitness profile sync payload compatibility', () => {
  it('keeps device identity in queue metadata, not the strict entity payload', () => {
    const operation = createProfileOperation();

    expect(operation.metadata?.deviceId).toBe(deviceId);
    expect(operation.payload).not.toHaveProperty('deviceId');
  });

  it('repairs a persisted legacy profile operation before retrying it', () => {
    const operation = createProfileOperation();
    const legacyIdempotencyKey =
      `queue:fitnessProfiles:${operation.entityId}:create:legacy`;
    const normalized = normalizeOfflineSyncQueueOperation({
      ...operation,
      idempotencyKey: legacyIdempotencyKey,
      metadata: { ...operation.metadata, requestId: legacyIdempotencyKey },
      payload: { ...operation.payload, deviceId },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.payload).not.toHaveProperty('deviceId');
    expect(normalized?.idempotencyKey).not.toBe(legacyIdempotencyKey);
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
  });

  it('does not strip deviceId from unrelated persisted entity payloads', () => {
    const legacyIdempotencyKey =
      'queue:nutritionTargets:33333333-3333-4333-8333-333333333333:create:legacy';
    const normalized = normalizeOfflineSyncQueueOperation({
      opId: 'nutrition-target-test',
      entityType: 'nutritionTargets',
      entityId: '33333333-3333-4333-8333-333333333333',
      action: 'create',
      payload: { schemaVersion: 1, deviceId },
      clientTimestamp: now,
      idempotencyKey: legacyIdempotencyKey,
      retryCount: 0,
      status: 'pending',
    });

    expect(normalized?.payload?.deviceId).toBe(deviceId);
    expect(normalized?.idempotencyKey).toBe(legacyIdempotencyKey);
  });
});
