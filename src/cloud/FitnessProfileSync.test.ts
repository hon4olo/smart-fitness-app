import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import {
  applyRemoteFitnessProfileChanges,
  createFitnessProfileQueueOperation,
  getFitnessProfileEntityId,
  normalizeFitnessProfileForSync,
} from './FitnessProfileSync';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';

const profile = {
  ...defaultState.profile,
  height: '175 cm',
  activityLevel: 'Moderately active',
  targetWeight: 68,
  goalType: 'lose_fat' as const,
  weeklyWeightChangeGoal: 0.4,
  trainingDaysPerWeek: 4,
  dateOfBirth: '2000-05-12',
  calculationSex: 'male' as const,
  trainingExperience: 'intermediate' as const,
};

describe('fitness profile sync', () => {
  it('normalizes legacy profile fields into the backend snapshot contract', () => {
    expect(normalizeFitnessProfileForSync(profile)).toEqual({
      dateOfBirth: '2000-05-12',
      calculationSex: 'male',
      heightCm: 175,
      goal: 'fat_loss',
      activityLevel: 'moderate',
      trainingExperience: 'intermediate',
      trainingDaysPerWeek: 4,
      targetWeightKg: 68,
      targetWeeklyWeightChangeKg: -0.4,
    });
  });

  it('creates a deterministic full-snapshot queue operation', () => {
    const entityId = getFitnessProfileEntityId(userId);
    const operation = createFitnessProfileQueueOperation({
      action: 'create',
      profile,
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-23T12:00:00.000Z',
    });

    expect(operation).toMatchObject({
      opId: `fitnessProfiles:${entityId}`,
      entityType: 'fitnessProfiles',
      entityId,
      action: 'create',
      actorId: userId,
      baseRevision: { number: 0 },
      payload: {
        schemaVersion: 1,
        id: entityId,
        dateOfBirth: '2000-05-12',
        calculationSex: 'male',
        heightCm: 175,
        goal: 'fat_loss',
        activityLevel: 'moderate',
        trainingExperience: 'intermediate',
        trainingDaysPerWeek: 4,
        targetWeightKg: 68,
        targetWeeklyWeightChangeKg: -0.4,
        createdAt: '2026-07-23T12:00:00.000Z',
        updatedAt: '2026-07-23T12:00:00.000Z',
        deviceId,
      },
    });
  });

  it('applies a validated remote snapshot to local state and metadata', () => {
    const entityId = getFitnessProfileEntityId(userId);
    const result = applyRemoteFitnessProfileChanges(
      { ...defaultState, profile: { ...defaultState.profile } },
      [
        {
          entityType: 'fitnessProfiles',
          entityId,
          revision: 7,
          payload: {
            schemaVersion: 1,
            id: entityId,
            dateOfBirth: '1999-01-02',
            calculationSex: 'female',
            heightCm: 168.5,
            goal: 'muscle_gain',
            activityLevel: 'high',
            trainingExperience: 'advanced',
            trainingDaysPerWeek: 5,
            targetWeightKg: 70,
            targetWeeklyWeightChangeKg: 0.25,
            deviceId,
          },
        },
      ],
      [],
      userId,
      new Map(),
      '2026-07-23T13:00:00.000Z',
    );

    expect(result.nextState.profile).toMatchObject({
      dateOfBirth: '1999-01-02',
      calculationSex: 'female',
      height: '168.5',
      goalType: 'gain_muscle',
      activityLevel: 'high',
      trainingExperience: 'advanced',
      trainingDaysPerWeek: 5,
      targetWeight: 70,
      weeklyWeightChangeGoal: 0.25,
    });
    expect(result.appliedRecordIds).toEqual([entityId]);
    expect(result.metadata[0]).toMatchObject({
      id: entityId,
      revision: 7,
      snapshot: { goal: 'muscle_gain', targetWeightKg: 70 },
    });
  });

  it('ignores malformed or wrong-id remote payloads', () => {
    const entityId = getFitnessProfileEntityId(userId);
    const originalState = { ...defaultState, profile: { ...profile } };
    const result = applyRemoteFitnessProfileChanges(
      originalState,
      [
        {
          entityType: 'fitnessProfiles',
          entityId,
          revision: 2,
          payload: {
            schemaVersion: 1,
            id: '99999999-9999-4999-8999-999999999999',
            dateOfBirth: '2000-02-30',
          },
        },
      ],
      [],
      userId,
    );

    expect(result.nextState.profile).toEqual(profile);
    expect(result.appliedRecordIds).toEqual([]);
  });

  it('resets local profile after a remote delete', () => {
    const entityId = getFitnessProfileEntityId(userId);
    const result = applyRemoteFitnessProfileChanges(
      { ...defaultState, profile },
      [],
      [
        {
          entityType: 'fitnessProfiles',
          entityId,
          revision: 8,
          appliedAt: '2026-07-23T14:00:00.000Z',
        },
      ],
      userId,
    );

    expect(result.nextState.profile).toEqual(defaultState.profile);
    expect(result.deletedRecordIds).toEqual([entityId]);
  });
});
