import { describe, expect, it } from 'vitest';

import {
  calculateEstimated1RM,
  estimateWorkoutDurationFromPlan,
  formatWorkoutPlanDescription,
  getLatestWorkoutSession,
  getLatestWorkoutSessionForWorkout,
  getSessionExercises,
  getSessionVolume,
  getWeeklyWorkoutCount,
  parseWorkoutPlanDescription,
} from '@/lib/workouts';

describe('workout helpers', () => {
  const sessionA = {
    id: 'session-a',
    workoutId: 'push',
    workoutTitle: 'Push',
    startedAt: '2026-01-01T08:00:00.000Z',
    finishedAt: '2026-01-01T08:45:00.000Z',
    sets: [
      { id: 'a-1', exerciseId: 'bench-press', exerciseName: 'Bench Press', reps: 8, weight: 80 },
      { id: 'a-2', exerciseId: 'bench-press', exerciseName: 'Bench Press', reps: 6, weight: 82.5 },
      { id: 'a-3', exerciseId: 'row', exerciseName: 'Row', reps: 10, weight: 60 },
    ],
  };

  const sessionB = {
    id: 'session-b',
    workoutId: 'push',
    workoutTitle: 'Push',
    startedAt: '2026-01-02T08:00:00.000Z',
    finishedAt: '2026-01-02T08:40:00.000Z',
    sets: [
      { id: 'b-1', exerciseId: 'bench-press', exerciseName: 'Bench Press', reps: 5, weight: 85 },
      { id: 'b-2', exerciseId: 'overhead-press', exerciseName: 'Overhead Press', reps: 8, weight: 45 },
    ],
  };

  it('calculates session metrics and latest sessions', () => {
    expect(getSessionVolume(sessionA)).toBe(80 * 8 + 82.5 * 6 + 60 * 10);
    expect(getSessionExercises(sessionA)).toEqual(['Bench Press', 'Row']);
    expect(getLatestWorkoutSession([sessionA, sessionB])?.id).toBe('session-b');
    expect(getLatestWorkoutSessionForWorkout('push', [sessionA, sessionB])?.id).toBe('session-b');
    expect(getWeeklyWorkoutCount([sessionA, sessionB], Date.parse('2026-01-02T00:00:00.000Z'))).toBe(1);
  });

  it('round-trips workout plan descriptions', () => {
    const planText = formatWorkoutPlanDescription('Upper body focus', [
      { name: 'Bench Press', targetSets: 4, targetReps: 6, restSeconds: 120, notes: 'Controlled tempo' },
      { name: 'Row', targetSets: 3, targetReps: 10 },
    ]);

    expect(planText).toContain('Workout plan:');
    expect(planText).toContain('1. Bench Press — 4 sets x 6 reps · 120 sec rest');
    expect(planText).toContain('Notes: Controlled tempo');

    expect(parseWorkoutPlanDescription(planText)).toEqual({
      baseDescription: 'Upper body focus',
      exercises: [
        {
          name: 'Bench Press',
          targetSets: 4,
          targetReps: 6,
          restSeconds: 120,
          notes: 'Controlled tempo',
        },
        { name: 'Row', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    });
  });

  it('estimates workout duration and 1RM', () => {
    expect(estimateWorkoutDurationFromPlan([])).toBe('15 min');
    expect(
      estimateWorkoutDurationFromPlan([
        { name: 'Bench Press', targetSets: 4, targetReps: 6, restSeconds: 120 },
      ])
    ).toBe('15 min');
    expect(calculateEstimated1RM(100, 10)).toBeCloseTo(133.3333, 4);
  });
});
