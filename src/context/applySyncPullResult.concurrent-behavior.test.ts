import { describe, expect, it, vi } from 'vitest';

import { defaultState } from '@/data/defaults';

import { applySyncPullResult } from './applySyncPullResult';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

const createMetadataStore = (load: () => Promise<Map<string, never>>) => ({
  load: vi.fn(load),
  clear: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(new Map()),
});

const remoteExerciseId = '11111111-1111-4111-8111-111111111111';

const remoteExercisePayload = {
  schemaVersion: 1,
  id: remoteExerciseId,
  name: 'Remote press',
  aliases: [],
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: ['machine'],
  movementPattern: ['horizontal_push'],
  difficulty: 'beginner',
  exerciseType: 'compound',
  unilateral: false,
  tags: [],
  instructions: [],
  tips: [],
  commonMistakes: [],
  isCustom: true,
  source: 'remote',
  favorite: false,
  createdAt: '2026-07-31T04:00:00.000Z',
};

describe('applySyncPullResult concurrent behavior', () => {
  it('preserves a local mutation that lands while metadata loads and still materializes remote data', async () => {
    const delayedMetadata = createDeferred<Map<string, never>>();
    const immediateStore = () => createMetadataStore(async () => new Map());
    const customExerciseMetadataStore = createMetadataStore(() => delayedMetadata.promise);
    const weightMetadataStore = immediateStore();
    const cursorStore = { set: vi.fn().mockResolvedValue(undefined) };
    let currentState = defaultState;
    let replacedState = defaultState;

    const applyPromise = applySyncPullResult({
      bodyMeasurementMetadataStore: immediateStore() as never,
      cursorStore: cursorStore as never,
      customExerciseMetadataStore: customExerciseMetadataStore as never,
      fitnessProfileMetadataStore: immediateStore() as never,
      foodEntryMetadataStore: immediateStore() as never,
      getState: () => currentState,
      mealTemplateMetadataStore: immediateStore() as never,
      metadataStore: weightMetadataStore as never,
      nextConflictCount: 0,
      nutritionTargetMetadataStore: immediateStore() as never,
      pullResult: {
        serverTimestamp: '2026-07-31T04:05:00.000Z',
        serverRevision: 4,
        changedEntities: [
          {
            entityType: 'customExercises',
            entityId: remoteExerciseId,
            operationType: 'upsert',
            revision: 4,
            payload: remoteExercisePayload,
          },
        ],
        deletedEntities: [],
        operations: [{ entity: 'customExercises' }],
      },
      replaceState: (nextState) => {
        replacedState = nextState;
      },
      safetyRecoveryMetadataStore: immediateStore() as never,
      session: { device: { id: 'device-a' }, user: { id: 'user-a' } },
      trainingProgramMetadataStore: immediateStore() as never,
      workoutSessionMetadataStore: immediateStore() as never,
      workoutTemplateMetadataStore: immediateStore() as never,
    });

    currentState = { ...currentState, onboardingCompleted: true };
    delayedMetadata.resolve(new Map());
    await applyPromise;

    expect(replacedState.onboardingCompleted).toBe(true);
    expect(replacedState.exercises).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: remoteExerciseId,
          name: 'Remote press',
          isCustom: true,
          source: 'remote',
        }),
      ]),
    );
    expect(customExerciseMetadataStore.load).toHaveBeenCalledTimes(1);
    expect(cursorStore.set).toHaveBeenCalledWith({
      userId: 'user-a',
      deviceId: 'device-a',
      serverRevision: 4,
      lastSyncedAt: '2026-07-31T04:05:00.000Z',
    });
  });
});
