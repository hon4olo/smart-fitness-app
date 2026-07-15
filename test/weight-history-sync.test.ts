import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client/errors';
import { createProductionCloudProvider } from '@/cloud/createProductionCloudProvider';
import { applyRemoteWeightHistoryChanges, createWeightHistoryQueueOperation } from '@/cloud/WeightHistorySync';
import type { AppState } from '@/types';

const baseState = (): AppState => ({
  workouts: [],
  exercises: [],
  workoutSessions: [],
  foodEntries: [],
  mealTemplates: [],
  nutrition: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 70,
  },
  nutritionTargets: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 70,
  },
  weightHistory: [
    { id: 'local-1', date: '2025-01-01', weight: 80, createdAt: '2025-01-01T10:00:00.000Z' },
  ],
  bodyMeasurements: [],
  profile: {
    height: '180 cm',
    weight: '80.0 kg',
    goal: 'lose fat',
    activityLevel: 'moderate',
    targetWeight: 75,
    goalType: 'lose_fat',
    weeklyWeightChangeGoal: 0.5,
    trainingDaysPerWeek: 3,
  },
  onboardingCompleted: true,
});

describe('weight history sync helpers', () => {
  it('builds deterministic queue operations', () => {
    const operation = createWeightHistoryQueueOperation({
      action: 'create',
      entry: { id: 'w1', date: '2025-01-02', weight: 81.5, createdAt: '2025-01-02T09:00:00.000Z' },
      deviceId: 'device-a',
      baseRevision: 0,
      actorId: 'user-1',
      now: '2025-01-02T09:00:00.000Z',
    });

    expect(operation.opId).toBe('weightHistory:w1');
    expect(operation.entityType).toBe('weightHistory');
    expect(operation.action).toBe('create');
    expect(operation.baseRevision?.number).toBe(0);
    expect(operation.idempotencyKey).toContain('queue:weightHistory:w1:create');
  });

  it('applies remote upserts, tombstones, and duplicate replay deterministically', () => {
    const state = baseState();
    const apply = () =>
      applyRemoteWeightHistoryChanges(
        state,
        [
          {
            entityType: 'weightHistory',
            entityId: 'remote-1',
            revision: 11,
            appliedAt: '2025-01-03T12:00:00.000Z',
            payload: {
              id: 'remote-1',
              weight: 79.25,
              recordedAt: '2025-01-03T11:59:00.000Z',
              createdAt: '2025-01-03T11:59:00.000Z',
              updatedAt: '2025-01-03T12:00:00.000Z',
              deletedAt: null,
              revision: 11,
              deviceId: 'device-b',
            },
          },
        ],
        [
          {
            id: 'local-1',
            entityId: 'local-1',
            entityType: 'weightHistory',
            revision: 12,
            appliedAt: '2025-01-03T12:05:00.000Z',
          },
        ],
        new Map(),
        '2025-01-03T12:30:00.000Z',
      );

    const first = apply();
    const second = apply();

    expect(first.nextState.weightHistory.map((entry) => entry.id)).toEqual(['remote-1']);
    expect(first.appliedRecordIds).toEqual(['remote-1']);
    expect(first.deletedRecordIds).toEqual(['local-1']);
    expect(first.metadata).toHaveLength(2);
    expect(second.nextState.weightHistory.map((entry) => entry.id)).toEqual(['remote-1']);
    expect(second.deletedRecordIds).toEqual(['local-1']);
  });
});

describe('production cloud provider', () => {
  it('pushes, pulls, retries 5xx, and refreshes on 401', async () => {
    const request = vi
      .fn()
      .mockImplementationOnce(async ({ method, path }: { method: string; path: string }) => {
        expect(method).toBe('GET');
        expect(path).toBe('/v1/sync/status');
        return { status: 'idle', pendingOperations: 0, conflictCount: 0, lastSyncedAt: '2025-01-03T12:00:00.000Z' };
      })
      .mockImplementationOnce(async ({ method, path }: { method: string; path: string }) => {
        expect(method).toBe('POST');
        expect(path).toBe('/v1/sync/push');
        throw new ApiError({ code: 'unauthorized', message: 'unauthorized', status: 401 });
      })
      .mockImplementationOnce(async () => ({
        status: 'idle',
        pendingOperations: 0,
        conflictCount: 0,
        lastSyncedAt: '2025-01-03T12:01:00.000Z',
        appliedOperations: [{ id: 'weightHistory:w1' }],
      }))
      .mockImplementationOnce(async () => ({
        status: 'idle',
        pendingOperations: 0,
        conflictCount: 0,
        lastSyncedAt: '2025-01-03T12:02:00.000Z',
        changedEntities: [
          {
            id: 'remote-1',
            weight: 79.1,
            recordedAt: '2025-01-03T11:59:00.000Z',
            createdAt: '2025-01-03T11:59:00.000Z',
            updatedAt: '2025-01-03T12:02:00.000Z',
            deletedAt: null,
            revision: 12,
            deviceId: 'device-b',
          },
        ],
        deletedEntities: [
          {
            id: 'remote-delete',
            revision: 13,
            appliedAt: '2025-01-03T12:03:00.000Z',
          },
        ],
      }));

    const authService = {
      getAccessToken: vi.fn().mockResolvedValue('token-a'),
      refresh: vi.fn().mockResolvedValue({ tokens: { accessToken: 'token-b' } }),
      getCurrentSession: vi.fn().mockResolvedValue({ device: { id: 'device-a' } }),
    };

    const provider = createProductionCloudProvider({
      apiClient: { request } as never,
      authService: authService as never,
      now: () => '2025-01-03T12:30:00.000Z',
    });

    const status = await provider.status();
    expect(status.status).toBe('idle');

    const push = await provider.pushOperations({
      id: 'batch-1',
      operations: [
        {
          id: 'weightHistory:w1',
          entity: 'weightHistory',
          entityId: 'w1',
          action: 'upsert',
          payload: { id: 'w1', weight: 81.2 },
          revision: { id: 'rev-0', number: 0, createdAt: '2025-01-01T00:00:00.000Z' },
          metadata: { entityName: 'weightHistory', source: 'local', deviceId: 'device-a' },
          createdAt: '2025-01-03T12:00:00.000Z',
        },
      ],
      createdAt: '2025-01-03T12:00:00.000Z',
    });
    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(push.pendingOperations).toBe(0);

    const pull = await provider.pullChanges();
    expect(pull.operations).toHaveLength(2);
    expect(pull.operations[0].entity).toBe('weightHistory');
    expect(pull.operations[1].action).toBe('delete');
    expect(request).toHaveBeenCalledTimes(4);
  });

  it('retries transient 500 errors and tolerates malformed pull payloads', async () => {
    const request = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new ApiError({ code: 'unavailable', message: 'boom', status: 500 });
      })
      .mockImplementationOnce(async () => ({ status: 'idle', pendingOperations: 0, conflictCount: 0 }))
      .mockImplementationOnce(async () => ({ status: 'idle', pendingOperations: 0, conflictCount: 0, changedEntities: 'bad' }));

    const provider = createProductionCloudProvider({
      apiClient: { request } as never,
      authService: {
        getAccessToken: vi.fn().mockResolvedValue('token-a'),
        refresh: vi.fn(),
        getCurrentSession: vi.fn().mockResolvedValue({ device: { id: 'device-a' } }),
      } as never,
      now: () => '2025-01-03T12:30:00.000Z',
    });

    const status = await provider.status();
    expect(status.status).toBe('idle');

    const pull = await provider.pullChanges();
    expect(pull.operations).toEqual([]);
    expect(request).toHaveBeenCalledTimes(3);
  });
});
