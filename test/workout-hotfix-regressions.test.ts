import { beforeEach, describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { buildCompletedWorkoutSessionSnapshot, buildWorkoutTemplateSavePayload, clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft, startWorkoutSessionDraft, upsertWorkoutSessionById } from '@/lib/workouts';
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
