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

  it('treats backend server-wins push conflicts as acknowledged and not user-review conflicts', async () => {
    const apiClient = {
      async request() {
        return {
          revision: 9,
          appliedOperations: [
            {
              id: 'database-operation-id',
              idempotencyKey: 'queue:weightHistory:weight-1:update:unique',
              entityType: 'weightHistory',
              entityId: 'weight-1',
              operationType: 'upsert',
              status: 'conflict',
              baseRevision: 3,
              revision: 9,
              payload: { id: 'weight-1', weight: 69.5 },
              error: null,
              appliedAt: '2026-07-22T09:00:01.000Z',
              createdAt: '2026-07-22T09:00:01.000Z',
              updatedAt: '2026-07-22T09:00:01.000Z',
            },
          ],
          conflicts: [
            {
              id: 'conflict-1',
              userId: 'user-1',
              deviceId: 'device-1',
              entityType: 'weightHistory',
              entityId: 'weight-1',
              conflictType: 'revision_mismatch',
              status: 'pending',
              baseRevision: 3,
              localRevision: 3,
              remoteRevision: 9,
              localPayload: { id: 'weight-1', weight: 69.5 },
              remotePayload: { id: 'weight-1', weight: 70 },
              resolvedPayload: null,
              resolutionStrategy: 'server_wins',
              reason: 'Client revision does not match the server revision',
              detectedAt: '2026-07-22T09:00:01.000Z',
              resolvedAt: null,
              revision: 9,
            },
          ],
          duplicateIdempotencyKeys: [],
          serverTimestamp: '2026-07-22T09:00:01.000Z',
        };
      },
    } as unknown as ApiClient;
    const provider = createProductionCloudProvider({
      apiClient,
      authService,
      cursorStore: { async get() { return { serverRevision: 8 }; } } as never,
      now: () => '2026-07-22T09:00:01.000Z',
    });

    const result = await provider.pushOperations(batch);

    expect(result.status).toBe('idle');
    expect(result.conflictCount).toBe(0);
    expect(result.appliedOperations?.[0]?.id).toBe(
      'queue:weightHistory:weight-1:update:unique',
    );
    expect(result.conflicts?.[0]).toMatchObject({
      status: 'pending',
      resolutionStrategy: 'server_wins',
    });
  });

  it('pushes fitness profile snapshots with their canonical entity type', async () => {
    const requests: ApiRequestOptions[] = [];
    const apiClient = {
      async request(options: ApiRequestOptions) {
        requests.push(options);
        return {
          revision: 12,
          appliedOperations: [],
          conflicts: [],
          duplicateIdempotencyKeys: [],
          serverTimestamp: '2026-07-23T12:00:01.000Z',
        };
      },
    } as unknown as ApiClient;
    const provider = createProductionCloudProvider({
      apiClient,
      authService,
      cursorStore: { async get() { return null; } },
    });

    await provider.pushOperations({
      id: 'batch-profile',
      createdAt: '2026-07-23T12:00:00.000Z',
      operations: [
        {
          id: 'fitnessProfiles:profile-1',
          entity: 'fitnessProfiles',
          entityId: '11111111-1111-4111-8111-111111111111',
          action: 'upsert',
          payload: {
            schemaVersion: 1,
            goal: 'fat_loss',
            calculationSex: 'male',
          },
          revision: {
            id: 'rev-4',
            number: 4,
            createdAt: '2026-07-23T11:00:00.000Z',
          },
          metadata: {
            requestId: 'queue:fitnessProfiles:profile-1:update:unique',
          },
          createdAt: '2026-07-23T12:00:00.000Z',
        },
      ],
    });

    expect(requests[0]?.body).toEqual(
      expect.objectContaining({
        operations: [
          expect.objectContaining({
            entityType: 'fitnessProfiles',
            baseRevision: 4,
            idempotencyKey: 'queue:fitnessProfiles:profile-1:update:unique',
            payload: expect.objectContaining({ goal: 'fat_loss' }),
          }),
        ],
      }),
    );
  });

  it('preserves supported remote entity types and reports unknown ones', async () => {
    const requests: ApiRequestOptions[] = [];
    const apiClient = {
      async request(options: ApiRequestOptions) {
        requests.push(options);
        return {
          revision: 12,
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
              id: 'operation-profile',
              idempotencyKey: 'queue:fitnessProfiles:profile-1:update:unique',
              entityType: 'fitness_profiles',
              entityId: 'profile-1',
              operationType: 'upsert',
              revision: 11,
              payload: { schemaVersion: 1, id: 'profile-1', goal: 'fat_loss' },
              appliedAt: '2026-07-22T10:00:00.500Z',
            },
            {
              id: 'operation-2',
              entityType: 'unknown_entity',
              entityId: 'unknown-1',
              operationType: 'upsert',
              revision: 12,
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
    expect(result.serverRevision).toBe(12);
    expect(result.operations).toEqual([
      expect.objectContaining({
        entity: 'workoutSessions',
        entityId: 'session-1',
      }),
      expect.objectContaining({
        entity: 'fitnessProfiles',
        entityId: 'profile-1',
      }),
    ]);
    expect(result.metadata?.unsupportedEntityCount).toBe(1);
  });
});
