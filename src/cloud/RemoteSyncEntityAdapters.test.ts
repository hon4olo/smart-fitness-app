import { describe, expect, it } from 'vitest';

import {
  normalizeRemoteEntityType,
  toRemoteSyncOperation,
} from './RemoteSyncEntityAdapters';

describe('RemoteSyncEntityAdapters', () => {
  it('normalizes supported backend entity aliases', () => {
    expect(normalizeRemoteEntityType('weight_history')).toBe('weightHistory');
    expect(normalizeRemoteEntityType('workout_sessions')).toBe('workoutSessions');
    expect(normalizeRemoteEntityType('training-programs')).toBe('trainingPrograms');
    expect(normalizeRemoteEntityType('fitnessProfiles')).toBe('fitnessProfiles');
    expect(normalizeRemoteEntityType('fitness_profiles')).toBe('fitnessProfiles');
  });

  it('rejects unsupported entity types instead of coercing them to weight history', () => {
    expect(normalizeRemoteEntityType('unknown_entity')).toBeNull();
    expect(
      toRemoteSyncOperation({
        entityType: 'unknown_entity',
        entityId: 'entity-id',
        revision: 4,
      }),
    ).toBeNull();
  });

  it('uses entityId and idempotencyKey from the backend operation envelope', () => {
    const operation = toRemoteSyncOperation(
      {
        id: 'database-operation-id',
        idempotencyKey: 'queue:weightHistory:entry-1:update:timestamp',
        entityType: 'weight_history',
        entityId: 'entry-1',
        operationType: 'upsert',
        payload: { id: 'entry-1', weight: 70 },
        revision: 8,
        appliedAt: '2026-07-22T10:00:00.000Z',
      },
      0,
      '2026-07-22T09:00:00.000Z',
    );

    expect(operation).toMatchObject({
      id: 'queue:weightHistory:entry-1:update:timestamp',
      entity: 'weightHistory',
      entityId: 'entry-1',
      action: 'upsert',
      revision: { number: 8 },
    });
  });

  it('preserves a fitness profile full snapshot from pull', () => {
    const operation = toRemoteSyncOperation({
      idempotencyKey: 'queue:fitnessProfiles:profile:update:timestamp',
      entityType: 'fitness_profiles',
      entityId: '11111111-1111-4111-8111-111111111111',
      operationType: 'upsert',
      payload: {
        schemaVersion: 1,
        goal: 'fat_loss',
        calculationSex: 'male',
      },
      revision: 12,
      appliedAt: '2026-07-23T12:00:00.000Z',
    });

    expect(operation).toMatchObject({
      entity: 'fitnessProfiles',
      action: 'upsert',
      revision: { number: 12 },
      payload: {
        schemaVersion: 1,
        goal: 'fat_loss',
        calculationSex: 'male',
      },
    });
  });
});
