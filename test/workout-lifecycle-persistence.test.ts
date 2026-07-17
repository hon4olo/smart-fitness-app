import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => {
  const data = new Map<string, string>();
  const pendingWrites: Array<{
    key: string;
    value: string;
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];

  const getItem = vi.fn(async (key: string) => data.get(key) ?? null);
  const setItem = vi.fn((key: string, value: string) =>
    new Promise<void>((resolve, reject) => {
      pendingWrites.push({ key, value, resolve, reject });
    }).then(() => {
      data.set(key, value);
    }),
  );
  const removeItem = vi.fn(async (key: string) => {
    data.delete(key);
  });

  return {
    data,
    pendingWrites,
    getItem,
    setItem,
    removeItem,
    reset() {
      data.clear();
      pendingWrites.splice(0, pendingWrites.length);
      getItem.mockReset();
      setItem.mockReset();
      removeItem.mockReset();
      getItem.mockImplementation(async (key: string) => data.get(key) ?? null);
      setItem.mockImplementation((key: string, value: string) =>
        new Promise<void>((resolve, reject) => {
          pendingWrites.push({ key, value, resolve, reject });
        }).then(() => {
          data.set(key, value);
        }),
      );
      removeItem.mockImplementation(async (key: string) => {
        data.delete(key);
      });
    },
    resolveNextWrite() {
      const next = pendingWrites.shift();
      next?.resolve();
    },
    flushData() {
      return Object.fromEntries(data.entries());
    },
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: storage.getItem,
    setItem: storage.setItem,
    removeItem: storage.removeItem,
  },
}));

import { defaultState } from '@/data/defaults';
import { getHomePrimaryWorkoutActionLabel, getWeeklyWorkoutCount, getWeeklyWorkoutVolumeTrend } from '@/lib/home';
import {
  buildCompletedWorkoutSessionSnapshot,
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
  hydrateActiveWorkoutSessionDraft,
  resetWorkoutHubState,
  startWorkoutSessionDraft,
  upsertWorkoutSessionById,
} from '@/lib/workouts';
import type { WorkoutSession } from '@/types';

const ACTIVE_DRAFT_STORAGE_KEY = 'active-workout-session-draft';
const flushMicrotasks = () => new Promise<void>((resolve) => setImmediate(resolve));

const workout = defaultState.workouts.find((item) => item.id === 'upper-body-strength') ?? defaultState.workouts[0]!;

const createCompletedSession = (): WorkoutSession => {
  const draft = {
    id: 'draft-completed',
    workoutId: workout.id,
    workoutTitle: workout.title,
    startedAt: '2024-01-03T12:00:00.000Z',
    sets: [],
  } as Parameters<typeof buildCompletedWorkoutSessionSnapshot>[0];

  return buildCompletedWorkoutSessionSnapshot(draft, {
    finishedAt: '2024-01-03T12:30:00.000Z',
    notes: 'Saved once',
  });
};

describe('workout lifecycle persistence', () => {
  beforeEach(async () => {
    storage.reset();
    resetWorkoutHubState();
    await hydrateActiveWorkoutSessionDraft();
    clearActiveWorkoutSessionDraft();
    await flushMicrotasks();
  });

  afterEach(() => {
    clearActiveWorkoutSessionDraft();
  });

  it('save clears the draft from memory', async () => {
    const draft = startWorkoutSessionDraft(workout);
    expect(getActiveWorkoutSessionDraft()).toMatchObject({ id: draft.id, workoutId: workout.id, workoutTitle: workout.title });

    clearActiveWorkoutSessionDraft();
    await flushMicrotasks();

    expect(getActiveWorkoutSessionDraft()).toBeNull();
  });

  it('save clears the draft from AsyncStorage', async () => {
    startWorkoutSessionDraft(workout);
    clearActiveWorkoutSessionDraft();
    await flushMicrotasks();

    expect(storage.flushData()[ACTIVE_DRAFT_STORAGE_KEY]).toBeUndefined();
  });

  it('reloading after save does not restore the cleared draft', async () => {
    startWorkoutSessionDraft(workout);
    clearActiveWorkoutSessionDraft();
    await flushMicrotasks();

    await hydrateActiveWorkoutSessionDraft();
    expect(getActiveWorkoutSessionDraft()).toBeNull();
  });

  it('an older delayed persistence write cannot restore a cleared session', async () => {
    startWorkoutSessionDraft(workout);

    await flushMicrotasks();
    expect(storage.pendingWrites).toHaveLength(1);

    clearActiveWorkoutSessionDraft();
    await flushMicrotasks();
    expect(storage.pendingWrites).toHaveLength(1);

    storage.resolveNextWrite();
    await flushMicrotasks();

    expect(getActiveWorkoutSessionDraft()).toBeNull();
    expect(storage.flushData()[ACTIVE_DRAFT_STORAGE_KEY]).toBeUndefined();
  });

  it('pressing save twice keeps exactly one history entry and unique weekly counts', () => {
    const completed = createCompletedSession();
    const firstSave = upsertWorkoutSessionById([], completed);
    const secondSave = upsertWorkoutSessionById(firstSave, completed);

    expect(firstSave).toHaveLength(1);
    expect(secondSave).toHaveLength(1);
    expect(secondSave[0]?.id).toBe(completed.id);

    const duplicateHistory = [completed, completed];
    expect(getWeeklyWorkoutCount(duplicateHistory, '2024-01-03')).toBe(1);
    expect(getWeeklyWorkoutVolumeTrend(duplicateHistory, '2024-01-03').currentVolume).toBe(getWeeklyWorkoutVolumeTrend([completed], '2024-01-03').currentVolume);
  });

  it('home shows Continue only while an active draft exists', async () => {
    startWorkoutSessionDraft(workout);
    clearActiveWorkoutSessionDraft();
    await flushMicrotasks();

    expect(getHomePrimaryWorkoutActionLabel(getActiveWorkoutSessionDraft())).toBe('Start workout');
  });

});
