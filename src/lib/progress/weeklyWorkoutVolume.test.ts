import { describe, expect, test } from 'vitest';

import type { WorkoutSession, WorkoutSet } from '@/types';

import { getWeeklyWorkoutVolume } from './weeklyWorkoutVolume';

const createSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: 'set-1',
  exerciseId: 'exercise-1',
  exerciseName: 'Squat',
  weight: 100,
  reps: 5,
  completed: true,
  ...overrides,
});

const createSession = (
  id: string,
  finishedAt: string,
  sets: WorkoutSet[] = [createSet()],
): WorkoutSession => ({
  id,
  workoutId: 'workout-1',
  workoutTitle: 'Workout',
  startedAt: finishedAt,
  finishedAt,
  sets,
});

describe('getWeeklyWorkoutVolume', () => {
  test('returns no buckets without a valid session anchor', () => {
    expect(getWeeklyWorkoutVolume([])).toEqual([]);
    expect(getWeeklyWorkoutVolume([createSession('invalid', 'not-a-date')])).toEqual([]);
  });

  test('returns a bounded continuous series including empty weeks', () => {
    const points = getWeeklyWorkoutVolume(
      [
        createSession('older', '2026-06-16T12:00:00.000Z'),
        createSession('latest', '2026-07-14T12:00:00.000Z'),
      ],
      { weeks: 8 },
    );

    expect(points).toHaveLength(8);
    expect(points.at(-1)).toMatchObject({ key: '2026-07-13', volume: 500, workoutCount: 1 });
    expect(points.some((point) => point.volume === 0 && point.workoutCount === 0)).toBe(true);
  });

  test('counts valid completed and legacy sets while ignoring incomplete or invalid sets', () => {
    const points = getWeeklyWorkoutVolume([
      createSession('session', '2026-07-14T12:00:00.000Z', [
        createSet({ id: 'completed', completed: true, weight: 100, reps: 5 }),
        createSet({ id: 'legacy', completed: undefined, weight: 50, reps: 10 }),
        createSet({ id: 'incomplete', completed: false, weight: 200, reps: 10 }),
        createSet({ id: 'zero', completed: true, weight: 0, reps: 10 }),
      ]),
    ]);

    expect(points.at(-1)).toMatchObject({ volume: 1000, workoutCount: 1 });
  });

  test('groups sessions by the supplied local timezone week boundary', () => {
    const points = getWeeklyWorkoutVolume(
      [createSession('monday-local', '2026-07-12T23:30:00.000Z')],
      { timezoneOffsetMinutes: 120, weeks: 8 },
    );

    expect(points.at(-1)).toMatchObject({
      key: '2026-07-13',
      startAt: '2026-07-12T22:00:00.000Z',
      volume: 500,
    });
  });

  test('clamps requested output to the supported 8 to 12 week range', () => {
    const sessions = [createSession('latest', '2026-07-14T12:00:00.000Z')];
    expect(getWeeklyWorkoutVolume(sessions, { weeks: 2 })).toHaveLength(8);
    expect(getWeeklyWorkoutVolume(sessions, { weeks: 20 })).toHaveLength(12);
  });
});
