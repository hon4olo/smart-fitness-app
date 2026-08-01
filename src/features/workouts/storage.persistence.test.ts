import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
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
      weight: 80,
      reps,
      completed: false,
    },
  ],
});

const flushQueuedWrites = async () => {
  for (let index = 0; index < 32; index += 1) {
    await Promise.resolve();
  }
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

describe('active workout draft persistence measurements', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.removeItem).mockResolvedValue(undefined);
    vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
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

  test('a revision queued behind an in-flight write commits afterward as the latest snapshot', async () => {
    const firstWrite = deferred<void>();
    vi.mocked(AsyncStorage.setItem)
      .mockImplementationOnce(() => firstWrite.promise)
      .mockResolvedValue(undefined);

    setActiveWorkoutSessionDraft(createDraft(8));
    await flushQueuedWrites();
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    setActiveWorkoutSessionDraft(createDraft(9));
    firstWrite.resolve();
    await flushQueuedWrites();

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    const [, serializedDraft] = vi.mocked(AsyncStorage.setItem).mock.calls[1];
    expect(JSON.parse(serializedDraft).sets[0].reps).toBe(9);
  });

  test('clear supersedes a pending draft write and removes the stored snapshot last', async () => {
    const firstWrite = deferred<void>();
    vi.mocked(AsyncStorage.setItem).mockImplementationOnce(() => firstWrite.promise);

    setActiveWorkoutSessionDraft(createDraft(8));
    await flushQueuedWrites();
    clearActiveWorkoutSessionDraft();

    firstWrite.resolve();
    await flushQueuedWrites();

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(vi.mocked(AsyncStorage.removeItem).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(AsyncStorage.setItem).mock.invocationCallOrder[0],
    );
    expect(getActiveWorkoutSessionDraft()).toBeNull();
  });

  test('an in-memory edit made during hydration is not replaced by the stored draft', async () => {
    const storedDraft = createDraft(8);
    const hydrationRead = deferred<string | null>();

    resetWorkoutSessionStorage();
    vi.mocked(AsyncStorage.getItem).mockImplementationOnce(() => hydrationRead.promise);
    const hydration = hydrateActiveWorkoutSessionDraft();

    setActiveWorkoutSessionDraft(createDraft(10));
    hydrationRead.resolve(JSON.stringify(storedDraft));
    await hydration;
    await flushQueuedWrites();

    expect(getActiveWorkoutSessionDraft()?.sets[0].reps).toBe(10);
    const [, serializedDraft] = vi.mocked(AsyncStorage.setItem).mock.calls.at(-1) ?? [];
    expect(JSON.parse(serializedDraft).sets[0].reps).toBe(10);
  });
});
