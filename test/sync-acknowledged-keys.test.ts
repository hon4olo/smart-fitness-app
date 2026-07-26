import { describe, expect, it } from 'vitest';

import { collectAcknowledgedSyncOperationKeys } from '@/context/syncContextModel';

describe('sync acknowledged operation keys', () => {
  it('combines applied and duplicate idempotency keys', () => {
    const keys = collectAcknowledgedSyncOperationKeys({
      appliedOperations: [{
        id: 'queue:weightHistory:one:create:now',
        entity: 'weightHistory',
        entityId: '11111111-1111-4111-8111-111111111111',
        action: 'upsert',
        createdAt: '2026-07-26T20:00:00.000Z',
      }],
      duplicateIdempotencyKeys: [
        'queue:foodEntries:two:create:now',
        'queue:weightHistory:one:create:now',
      ],
    });

    expect([...keys]).toEqual([
      'queue:weightHistory:one:create:now',
      'queue:foodEntries:two:create:now',
    ]);
  });
});
