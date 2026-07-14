import { describe, expect, it } from 'vitest';

import { createExercise } from '@/domain/models';
import {
  calculateEstimated1RM,
  estimateWorkoutDurationFromPlan,
  formatWorkoutPlanDescription,
  getLatestWorkoutSession,
  getLatestWorkoutSessionForWorkout,
  getRecentExercisesFromWorkoutSessions,
  getSessionExercises,
  getSessionVolume,
  getSimilarExercises,
  getWeeklyWorkoutCount,
  parseWorkoutPlanDescription,
  searchExercises,
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

  it('searches aliases, equipment, and muscle names with ranking', () => {
    const bench = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'bench-press',
      name: 'Bench Press',
      aliases: ['barbell bench press'],
      equipment: ['barbell'],
      muscleGroup: 'Chest',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
    });
    const incline = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'incline-db',
      name: 'Incline Dumbbell Press',
      aliases: ['incline db press'],
      equipment: ['dumbbell', 'bench'],
      muscleGroup: 'Chest',
      primaryMuscles: ['upper chest'],
      secondaryMuscles: ['front delts'],
    });
    const pull = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'pull-up',
      name: 'Pull-up',
      aliases: ['chin up'],
      equipment: ['bar'],
      muscleGroup: 'Back',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps'],
    });

    expect(searchExercises([pull, incline, bench], 'barbell bench').map((exercise) => exercise.id)).toEqual(['bench-press']);
    expect(searchExercises([pull, incline, bench], 'incline db').map((exercise) => exercise.id)[0]).toBe('incline-db');
    expect(searchExercises([pull, incline, bench], 'lats').map((exercise) => exercise.id)[0]).toBe('pull-up');
  });

  it('returns the last 10 unique recent exercises from workout history', () => {
    const exercises = [
      createExercise({ createdAt: '2026-01-01T00:00:00.000Z', id: 'bench', name: 'Bench Press', muscleGroup: 'Chest' }),
      createExercise({ createdAt: '2026-01-01T00:00:00.000Z', id: 'row', name: 'Barbell Row', muscleGroup: 'Back' }),
      createExercise({ createdAt: '2026-01-01T00:00:00.000Z', id: 'squat', name: 'Squat', muscleGroup: 'Quads' }),
    ];

    const sessions = [
      {
        id: 'old',
        workoutId: 'legs',
        workoutTitle: 'Legs',
        startedAt: '2026-01-01T08:00:00.000Z',
        finishedAt: '2026-01-01T09:00:00.000Z',
        sets: [
          { id: 'o1', exerciseId: 'squat', exerciseName: 'Squat', reps: 8, weight: 100 },
        ],
      },
      {
        id: 'new',
        workoutId: 'upper',
        workoutTitle: 'Upper',
        startedAt: '2026-01-05T08:00:00.000Z',
        finishedAt: '2026-01-05T09:00:00.000Z',
        sets: [
          { id: 'n1', exerciseId: 'bench', exerciseName: 'Bench Press', reps: 8, weight: 80 },
          { id: 'n2', exerciseId: 'row', exerciseName: 'Barbell Row', reps: 8, weight: 70 },
          { id: 'n3', exerciseId: 'bench', exerciseName: 'Bench Press', reps: 6, weight: 82.5 },
        ],
      },
    ];

    expect(getRecentExercisesFromWorkoutSessions(sessions, exercises, 10).map((exercise) => exercise.id)).toEqual(['bench', 'row', 'squat']);
  });

  it('finds similar exercises using muscles, equipment, and movement patterns', () => {
    const bench = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'bench',
      name: 'Bench Press',
      category: 'chest',
      equipment: ['barbell', 'bench'],
      exerciseType: 'compound',
      difficulty: 'intermediate',
      movementPattern: ['horizontal_push'],
      muscleGroup: 'Chest',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps', 'front delts'],
    });
    const incline = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'incline',
      name: 'Incline Dumbbell Press',
      category: 'chest',
      equipment: ['dumbbell', 'bench'],
      exerciseType: 'compound',
      difficulty: 'intermediate',
      movementPattern: ['incline_push'],
      muscleGroup: 'Chest',
      primaryMuscles: ['upper chest'],
      secondaryMuscles: ['front delts'],
    });
    const fly = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'fly',
      name: 'Cable Fly',
      category: 'chest',
      equipment: ['cable'],
      exerciseType: 'isolation',
      difficulty: 'beginner',
      movementPattern: ['horizontal_adduction'],
      muscleGroup: 'Chest',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['front delts'],
    });
    const pull = createExercise({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'pull',
      name: 'Pull-up',
      category: 'back',
      equipment: ['bar'],
      exerciseType: 'compound',
      difficulty: 'intermediate',
      movementPattern: ['vertical_pull'],
      muscleGroup: 'Back',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps'],
    });

    const similar = getSimilarExercises(bench, [bench, incline, fly, pull], 3);

    expect(similar.map((match) => match.exercise.id)).toEqual(['incline', 'fly']);
    expect(similar[0].sharedMuscles).toContain('Chest');
    expect(similar[0].sharedEquipment).toContain('Bench');
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
