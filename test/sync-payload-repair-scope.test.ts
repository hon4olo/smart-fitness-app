import { describe, expect, it } from 'vitest';

import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';

const deviceId = '22222222-2222-4222-8222-222222222222';

 describe('strict sync payload repair scope', () => {
  it('does not rewrite payloads accepted by strip-compatible server schemas', () => {
    const idempotencyKey =
      'queue:nutritionTargets:33333333-3333-4333-8333-333333333333:create:legacy';
    const normalized = normalizeOfflineSyncQueueOperation({
      opId: 'nutrition-target-test',
      entityType: 'nutritionTargets',
      entityId: '33333333-3333-4333-8333-333333333333',
      action: 'create',
      payload: {
        schemaVersion: 1,
        calories: 2500,
        protein: 180,
        carbs: 300,
        fats: 70,
        deviceId,
      },
      clientTimestamp: '2026-07-26T19:00:00.000Z',
      idempotencyKey,
      retryCount: 0,
      status: 'pending',
    });

    expect(normalized?.payload?.deviceId).toBe(deviceId);
    expect(normalized?.idempotencyKey).toBe(idempotencyKey);
  });
});
