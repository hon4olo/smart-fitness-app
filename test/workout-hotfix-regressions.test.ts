import { beforeEach, describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { buildCompletedWorkoutSessionSnapshot, buildWorkoutTemplateSavePayload, clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft, startEmptyWorkoutSessionDraft, startWorkoutSessionDraft, upsertWorkoutSessionById } from '@/lib/workouts';
import { createLocalAppRepository } from '@/repositories';

const createMemoryStorage = () => {
  const store = new Map<string, string>();

  return {
    read: async (key: string) => store.get(key) ?? null,
    write: async (key: string, value: string) => {
      store.set(key, value);
    },
    remove: async (key: string) => {
      store.delete(key);
    },
  };
};

describe('workout hotfix regressions', () => {
  beforeEach(() => {
    clearActiveWorkoutSessionDraft();
  });

  it('serializes edited workout template exercises as names and reloads safely', async () => {
    const repository = createLocalAppRepository(createMemoryStorage());
    const workout = defaultState.workouts.find((item) => item.id === 'legs-a');

    expect(workout).toBeDefined();
    if (!workout) {
      throw new Error('Expected Lower Body workout fixture');
    }

    const payload = buildWorkoutTemplateSavePayload(workout, 'Lower Body', [
      {
        name: 'Calf raise',
        targetSets: 4,
        targetReps: 12,
        restSeconds: 75,
      },
    ]);

    expect(payload.exercises).toEqual(['Calf raise']);
    expect(payload.description).toContain('Calf raise — 4 sets x 12 reps · 75 sec rest');

    await repository.saveState({
      ...defaultState,
      workouts: defaultState.workouts.map((item) =>
        item.id === workout.id
          ? {
              ...item,
              title: payload.title,
              description: payload.description,
              isCustom: true,
              exercises: payload.exercises.map((name, index) => ({
                id: `${workout.id}-exercise-${index}`,
                name,
                createdAt: workout.createdAt ?? '2026-01-01T00:00:00.000Z',
                isCustom: true,
              })),
            }
          : item,
      ),
    });

    const reloaded = await repository.loadState();

    expect(reloaded).not.toBeNull();
    expect(reloaded?.workouts.find((item) => item.id === workout.id)?.title).toBe('Lower Body');
    expect(reloaded?.workouts.find((item) => item.id === workout.id)?.exercises.map((exercise) => exercise.name)).toEqual(['Calf raise']);
  });

  it('starts an empty workout draft with the empty-workout marker and no sets', () => {
    const draft = startEmptyWorkoutSessionDraft('2026-01-17T10:30:00.000Z');

    expect(draft).toMatchObject({
      id: draft.id,
      workoutId: 'empty-workout',
      workoutTitle: 'Empty workout',
      startedAt: '2026-01-17T10:30:00.000Z',
      sets: [],
    });
    expect(getActiveWorkoutSessionDraft()).toMatchObject({ workoutId: 'empty-workout', workoutTitle: 'Empty workout', sets: [] });
  });

  it('repairs repeated Lower Body exercises on hydration without destroying unique exercises', async () => {
    const repository = createLocalAppRepository(createMemoryStorage());
    const lowerBody = defaultState.workouts.find((item) => item.id === 'legs-a');

    expect(lowerBody).toBeDefined();
    if (!lowerBody) {
      throw new Error('Expected Lower Body workout fixture');
    }

    const corruptedLowerBody = {
      ...lowerBody,
      exercises: Array.from({ length: 8 }, (_, index) =>
        lowerBody.exercises.map((exercise) => ({
          ...exercise,
          id: `${exercise.id}-copy-${index}`,
        })),
      ).flat(),
    };

    await repository.saveState({
      ...defaultState,
      workouts: defaultState.workouts.map((item) => (item.id === lowerBody.id ? corruptedLowerBody : item)),
    });

    const reloaded = await repository.loadState();
    const reloadedLowerBody = reloaded?.workouts.find((item) => item.id === lowerBody.id);

    expect(reloadedLowerBody?.exercises).toHaveLength(4);
    expect(reloadedLowerBody?.exercises.map((exercise) => exercise.name)).toEqual(['Back squat', 'Romanian deadlift', 'Walking lunge', 'Calf raise']);

    const uniqueWorkout = {
      ...lowerBody,
      id: 'custom-unique-workout',
      isCustom: true,
      exercises: [
        { id: 'custom-a', name: 'Custom split squat', muscleGroup: 'quads', createdAt: '2026-01-01T00:00:00.000Z', isCustom: true },
        { id: 'custom-b', name: 'Custom split squat', muscleGroup: 'glutes', createdAt: '2026-01-01T00:00:00.000Z', isCustom: true },
      ],
    };

    await repository.saveState({
      ...reloaded!,
      workouts: [...(reloaded?.workouts ?? defaultState.workouts), uniqueWorkout],
    });

    const reloadedAgain = await repository.loadState();
    expect(reloadedAgain?.workouts.find((item) => item.id === 'custom-unique-workout')?.exercises).toHaveLength(2);
    expect(reloadedAgain?.workouts.find((item) => item.id === 'custom-unique-workout')?.exercises.map((exercise) => exercise.muscleGroup)).toEqual(['quads', 'glutes']);
  });

  it('keeps the completed workout snapshot after clearing the active draft and avoids duplicate history entries', () => {
    const workout = defaultState.workouts.find((item) => item.id === 'legs-a');

    expect(workout).toBeDefined();
    if (!workout) {
      throw new Error('Expected Lower Body workout fixture');
    }

    const draft = startWorkoutSessionDraft(workout);
    setActiveWorkoutSessionDraft({
      ...draft,
      sets: [
        {
          id: 'set-1',
          exerciseId: 'calf-raise',
          exerciseName: 'Calf raise',
          weight: 60,
          reps: 12,
          completed: true,
        },
      ],
    });

    const snapshot = buildCompletedWorkoutSessionSnapshot(getActiveWorkoutSessionDraft()!, {
      notes: 'Finished cleanly',
      finishedAt: '2026-01-17T10:15:00.000Z',
    });

    clearActiveWorkoutSessionDraft();

    expect(getActiveWorkoutSessionDraft()).toBeNull();
    expect(snapshot.notes).toBe('Finished cleanly');
    expect(snapshot.finishedAt).toBe('2026-01-17T10:15:00.000Z');

    const firstSave = upsertWorkoutSessionById([], snapshot);
    const secondSave = upsertWorkoutSessionById(firstSave, snapshot);

    expect(firstSave).toHaveLength(1);
    expect(secondSave).toHaveLength(1);
    expect(secondSave[0]).toEqual(snapshot);
  });
});
