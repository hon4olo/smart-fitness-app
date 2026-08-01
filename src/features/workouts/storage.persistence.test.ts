import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  hydrateActiveWorkoutSessionDraft,
  resetWorkoutSessionStorage,
  setActiveWorkoutSessionDraft,
} from './storage';
import type { WorkoutSessionDraft } from './types';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    removeItem: vi.fn(async () => undefined),
    setItem: vi.fn(async () => undefined),
  },
}));

const createDraft = (reps: number): WorkoutSessionDraft => ({
  id: 'active-session',
  workoutId: 'workout-1',
  workoutTitle: 'Measured workout',
  startedAt: '2026-08-01T12:00:00.000Z',
  sets: [
    {
      id: 'set-1',
      exerciseId: 'exercise-1',
      exerciseName: 'Bench Press',
      kg: 80,
      reps,
      completed: false,
    },
  ],
});

const flushQueuedWrites = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
};

describe('active workout draft persistence measurements', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetWorkoutSessionStorage();
    await hydrateActiveWorkoutSessionDraft();
  });

  test('rapid revisions commit only the latest draft snapshot', async () => {
    setActiveWorkoutSessionDraft(createDraft(8));
    setActiveWorkoutSessionDraft(createDraft(9));
    setActiveWorkoutSessionDraft(createDraft(10));

    await flushQueuedWrites();

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    const [, serializedDraft] = vi.mocked(AsyncStorage.setItem).mock.calls[0];
    expect(JSON.parse(serializedDraft).sets[0].reps).toBe(10);
  });

  test('sequential edits separated by a completed write each commit once', async () => {
    setActiveWorkoutSessionDraft(createDraft(8));
    await flushQueuedWrites();
    setActiveWorkoutSessionDraft(createDraft(9));
    await flushQueuedWrites();

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
  });
});
