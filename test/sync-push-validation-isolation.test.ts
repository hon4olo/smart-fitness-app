import { describe, expect, it, vi } from 'vitest';

import type { CloudProvider, CloudPushResult } from '@/cloud/CloudProvider';
import { simulatePush } from '@/cloud/SyncCoordinatorOperations';
import type { SyncBatch, SyncOperation } from '@/cloud/CloudSyncTypes';
import { formatRejectedSyncOperationsError } from '@/context/syncContextModel';

const now = '2026-07-26T22:00:00.000Z';

const operation = (id: string, entityId: string): SyncOperation => ({
  id,
  entity: 'weightHistory',
  entityId,
  action: 'upsert',
  payload: { id: entityId, weight: 70, recordedAt: now },
  createdAt: now,
});

const batch = (operations: SyncOperation[]): SyncBatch => ({
  id: 'batch:test',
  operations,
  createdAt: now,
});

const providerWith = (pushOperations: CloudProvider['pushOperations']): CloudProvider =>
  ({ pushOperations } as unknown as CloudProvider);

const appliedResult = (currentBatch: SyncBatch): CloudPushResult => ({
  status: 'idle',
  pendingOperations: 0,
  conflictCount: 0,
  revision: currentBatch.operations.length,
  serverTimestamp: now,
  appliedOperations: currentBatch.operations,
});

describe('sync push validation isolation', () => {
  it('keeps valid siblings moving and reports only the rejected operation', async () => {
    const pushOperations = vi.fn(async (currentBatch: SyncBatch) => {
      if (currentBatch.operations.some((item) => item.id === 'bad')) {
        throw Object.assign(new Error('Validation failed'), {
          status: 400,
          code: 'validation_error',
          requestId: 'req-bad',
          body: {
            message: 'Validation failed',
            details: [
              { path: 'operations[0].entityId', message: 'Invalid UUID' },
            ],
          },
        });
      }
      return appliedResult(currentBatch);
    });
    const provider = providerWith(pushOperations);

    const result = await simulatePush(
      { provider },
      batch([
        operation('good-a', '11111111-1111-4111-8111-111111111111'),
        operation('bad', 'not-a-uuid'),
        operation('good-b', '22222222-2222-4222-8222-222222222222'),
      ]),
    );

    expect(pushOperations.mock.calls.length).toBeGreaterThan(1);
    expect(result.result?.appliedOperations?.map((item) => item.id).sort()).toEqual([
      'good-a',
      'good-b',
    ]);
    expect(result.result?.rejectedOperations).toEqual([
      expect.objectContaining({
        operationId: 'bad',
        entityType: 'weightHistory',
        entityId: 'not-a-uuid',
        status: 400,
        code: 'validation_error',
        requestId: 'req-bad',
      }),
    ]);
    expect(result.result?.pendingOperations).toBe(1);
    expect(result.result?.status).toBe('error');

    const message = formatRejectedSyncOperationsError(
      result.result?.rejectedOperations ?? [],
    );
    expect(message).toContain('weightHistory');
    expect(message).toContain('HTTP 400');
    expect(message).toContain('Invalid UUID');
    expect(message).toContain('req-bad');
  });

  it('uses one request when the original batch is valid', async () => {
    const pushOperations = vi.fn(async (currentBatch: SyncBatch) =>
      appliedResult(currentBatch),
    );
    const provider = providerWith(pushOperations);

    const result = await simulatePush(
      { provider },
      batch([
        operation('good-a', '11111111-1111-4111-8111-111111111111'),
        operation('good-b', '22222222-2222-4222-8222-222222222222'),
      ]),
    );

    expect(pushOperations).toHaveBeenCalledTimes(1);
    expect(result.result?.rejectedOperations).toBeUndefined();
    expect(result.result?.appliedOperations).toHaveLength(2);
  });

  it('does not split transient server failures', async () => {
    const pushOperations = vi.fn(async () => {
      throw Object.assign(new Error('Service unavailable'), {
        status: 503,
        code: 'unavailable',
      });
    });
    const provider = providerWith(pushOperations);

    await expect(
      simulatePush(
        { provider },
        batch([operation('good-a', '11111111-1111-4111-8111-111111111111')]),
      ),
    ).rejects.toThrow('Service unavailable');
    expect(pushOperations).toHaveBeenCalledTimes(1);
  });
});
