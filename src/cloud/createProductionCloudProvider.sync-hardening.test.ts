import { describe, expect, it } from 'vitest';

import type { ApiClient, ApiRequestOptions } from '@/api/client';
import type { AuthService } from '@/auth';
import { createProductionCloudProvider } from './createProductionCloudProvider';

const session = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    displayName: null,
    avatarUrl: null,
    createdAt: '2026-07-24T08:00:00.000Z',
    updatedAt: '2026-07-24T08:00:00.000Z',
  },
  device: {
    id: 'device-1',
    userId: 'user-1',
    deviceName: 'iPhone',
    platform: 'ios',
    appVersion: '1.0.0',
    lastSeenAt: '2026-07-24T08:00:00.000Z',
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    deviceId: 'device-1',
    expiresAt: '2026-08-24T08:00:00.000Z',
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

describe('production pull sync hardening', () => {
  it('does not mark custom exercise or safety entities as unsupported', async () => {
    const requests: ApiRequestOptions[] = [];
    const apiClient = {
      async request(options: ApiRequestOptions) {
        requests.push(options);
        return {
          revision: 20,
          changedEntities: [
            {
              id: 'operation-custom-exercise',
              idempotencyKey: 'queue:customExercises:exercise-1:update:unique',
              entityType: 'custom_exercises',
              entityId: 'exercise-1',
              operationType: 'upsert',
              revision: 17,
              payload: { schemaVersion: 1, id: 'exercise-1', name: 'Cable Y Raise' },
              appliedAt: '2026-07-24T10:00:00.000Z',
            },
            {
              id: 'operation-limitation',
              idempotencyKey: 'queue:userLimitations:limitation-1:update:unique',
              entityType: 'user_limitations',
              entityId: 'limitation-1',
              operationType: 'upsert',
              revision: 18,
              payload: { schemaVersion: 1, id: 'limitation-1' },
              appliedAt: '2026-07-24T10:00:01.000Z',
            },
            {
              id: 'operation-recovery',
              idempotencyKey: 'queue:recoveryCheckIns:check-in-1:update:unique',
              entityType: 'recovery_check_ins',
              entityId: 'check-in-1',
              operationType: 'upsert',
              revision: 19,
              payload: { schemaVersion: 1, id: 'check-in-1' },
              appliedAt: '2026-07-24T10:00:02.000Z',
            },
            {
              id: 'operation-unknown',
              entityType: 'future_entity',
              entityId: 'future-1',
              operationType: 'upsert',
              revision: 20,
              payload: { id: 'future-1' },
              appliedAt: '2026-07-24T10:00:03.000Z',
            },
          ],
          deletedEntities: [],
          conflicts: [],
          serverTimestamp: '2026-07-24T10:00:03.000Z',
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
            serverRevision: 16,
            lastSyncedAt: '2026-07-24T09:30:00.000Z',
          };
        },
      },
      now: () => '2026-07-24T10:00:03.000Z',
    });

    const result = await provider.pullChanges();

    expect((requests[0]?.body as { clientRevision: number }).clientRevision).toBe(16);
    expect(result.operations).toEqual([
      expect.objectContaining({
        entity: 'customExercises',
        entityId: 'exercise-1',
        metadata: expect.objectContaining({
          requestId: 'queue:customExercises:exercise-1:update:unique',
        }),
      }),
      expect.objectContaining({ entity: 'userLimitations', entityId: 'limitation-1' }),
      expect.objectContaining({ entity: 'recoveryCheckIns', entityId: 'check-in-1' }),
    ]);
    expect(result.metadata?.unsupportedEntityCount).toBe(1);
  });
});
