import { describe, expect, it } from 'vitest';

import type { ApiClient, ApiRequestOptions } from '@/api/client';
import type { AuthService } from '@/auth';
import type { SyncBatch } from './CloudSyncTypes';
import { createProductionCloudProvider } from './createProductionCloudProvider';

const session = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    displayName: null,
    avatarUrl: null,
    createdAt: '2026-07-22T08:00:00.000Z',
    updatedAt: '2026-07-22T08:00:00.000Z',
  },
  device: {
    id: 'device-1',
    userId: 'user-1',
    deviceName: 'iPhone',
    platform: 'ios',
    appVersion: '1.0.0',
    lastSeenAt: '2026-07-22T08:00:00.000Z',
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    deviceId: 'device-1',
    expiresAt: '2026-08-22T08:00:00.000Z',
    revokedAt: null,
  },
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer' as const,
  },
};

const authService: Pick<
  AuthService,
  'getAccessToken' | 'refresh' | 'getCurrentSession'
> = {
  async getAccessToken() {
    return 'access-token';
  },
  async refresh() {
    return session;
  },
  async getCurrentSession() {
    return session;
  },
};

const batch: SyncBatch = {
  id: 'batch-1',
  createdAt: '2026-07-22T09:00:00.000Z',
  operations: [
    {
      id: 'weightHistory:weight-1',
      entity: 'weightHistory',
      entityId: 'weight-1',
      action: 'upsert',
      payload: { id: 'weight-1', weight: 69.5 },
      revision: {
        id: 'rev-3',
        number: 3,
        createdAt: '2026-07-22T08:00:00.000Z',
      },
      metadata: {
        requestId: 'queue:weightHistory:weight-1:update:unique',
      },
      createdAt: '2026-07-22T09:00:00.000Z',
    },
  ],
};

describe('createProductionCloudProvider', () => {
  it('uses the persisted cursor and queue idempotency key for push', async () => {
    const requests: ApiRequestOptions[] = [];
    const apiClient = {
      async request(options: ApiRequestOptions) {
        requests.push(options);
        return {
          revision: 8,
          appliedOperations: [
            {
              id: 'database-operation-id',
              idempotencyKey: 'queue:weightHistory:weight-1:update:unique',
              entityType: 'weightHistory',
              entityId: 'weight-1',
              operationType: 'upsert',
              status: 'applied',
              baseRevision: 3,
              revision: 8,
              payload: { id: 'weight-1', weight: 69.5 },
              error: null,
              appliedAt: '2026-07-22T09:00:01.000Z',
              createdAt: '2026-07-22T09:00:01.000Z',
              updatedAt: '2026-07-22T09:00:01.000Z',
            },
          ],
          conflicts: [],
          duplicateIdempotencyKeys: [],
          serverTimestamp: '2026-07-22T09:00:01.000Z',
        };
      },
    } as unknown as ApiClient;

    const provider = createProductionCloudProvider({
      apiClient,
      authService,
      cursorStore: {
        async get() {
          return {
            userId: 'user-1',
            deviceId: 'device-1',
            serverRevision: 7,
            lastSyncedAt: '2026-07-22T08:30:00.000Z',
          };
        },
      },
      now: () => '2026-07-22T09:00:01.000Z',
    });

    const result = await provider.pushOperations(batch);
    const body = requests[0]?.body as {
      clientRevision: number;
      operations: Array<{ idempotencyKey: string }>;
    };

    expect(body.clientRevision).toBe(7);
    expect(body.operations[0]?.idempotencyKey).toBe(
      'queue:weightHistory:weight-1:update:unique',
    );
    expect(result.appliedOperations?.[0]?.id).toBe(
      'queue:weightHistory:weight-1:update:unique',
    );
  });

  it('preserves supported remote entity types and drops unknown ones', async () => {
    const requests: ApiRequestOptions[] = [];
    const apiClient = {
      async request(options: ApiRequestOptions) {
        requests.push(options);
        return {
          revision: 11,
          changedEntities: [
            {
              id: 'operation-1',
              idempotencyKey: 'queue:workoutSessions:session-1:update:unique',
              entityType: 'workout_sessions',
              entityId: 'session-1',
              operationType: 'upsert',
              revision: 10,
              payload: { id: 'session-1' },
              appliedAt: '2026-07-22T10:00:00.000Z',
            },
            {
              id: 'operation-2',
              entityType: 'unknown_entity',
              entityId: 'unknown-1',
              operationType: 'upsert',
              revision: 11,
              payload: { id: 'unknown-1' },
              appliedAt: '2026-07-22T10:00:01.000Z',
            },
          ],
          deletedEntities: [],
          conflicts: [],
          serverTimestamp: '2026-07-22T10:00:01.000Z',
        };
      },
    } as unknown as ApiClient;

    const provider = createProductionCloudProvider({
      apiClient,
      authService,
      cursorStore: {
        async get() {
          return {
            userId: 'user-1',
            deviceId: 'device-1',
            serverRevision: 9,
            lastSyncedAt: '2026-07-22T09:30:00.000Z',
          };
        },
      },
      now: () => '2026-07-22T10:00:01.000Z',
    });

    const result = await provider.pullChanges();
    const body = requests[0]?.body as { clientRevision: number };

    expect(body.clientRevision).toBe(9);
    expect(result.serverRevision).toBe(11);
    expect(result.operations).toEqual([
      expect.objectContaining({
        entity: 'workoutSessions',
        entityId: 'session-1',
      }),
    ]);
  });
});
