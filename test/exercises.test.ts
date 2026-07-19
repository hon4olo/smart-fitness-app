import { describe, expect, it } from 'vitest';

import {
  buildMuscleHighlights,
  calculateExerciseProgressMetrics,
  mapMuscleNameToCanonicalId,
  normalizeExerciseDbExercise,
  exerciseRepository,
  selectCompletedSetsByExerciseId,
} from '@/features/exercises';
import { normalizeWorkoutSessions } from '@/features/workouts';
import { addWorkoutSessionExercises } from '@/features/workouts/sessionScreenModel';
import type { WorkoutSession } from '@/types';

describe('exercise catalog normalization', () => {
  it('normalizes ExerciseDB-compatible data into the internal exercise shape', () => {
    const exercise = normalizeExerciseDbExercise({
      bodyPart: 'chest',
      equipment: 'barbell',
      gifUrl: 'https://example.test/bench.gif',
      id: '0001',
      name: 'Bench Press',
      secondaryMuscles: ['triceps', 'front delts'],
      target: 'pectorals',
      instructions: ['Lower with control.'],
    });

    expect(exercise).toMatchObject({
      id: 'bench-press',
      source: {
        provider: 'exercisedb',
        sourceId: '0001',
      },
      name: 'Bench Press',
      equipment: ['barbell'],
      bodyPart: 'chest',
      primaryMuscles: ['pectorals'],
      secondaryMuscles: ['triceps', 'front delts'],
      media: {
        gifUri: 'https://example.test/bench.gif',
        thumbnailUri: 'https://example.test/bench.gif',
      },
    });
  });

  it('keeps source id separate from the stable internal id', () => {
    const first = normalizeExerciseDbExercise({ id: 'a', name: 'Squat', bodyPart: 'upper legs', equipment: 'barbell' });
    const second = normalizeExerciseDbExercise({ id: 'b', name: 'Squat', bodyPart: 'upper legs', equipment: 'barbell' });

    expect(first.id).toBe(second.id);
    expect(first.source.sourceId).toBe('a');
    expect(second.source.sourceId).toBe('b');
  });
});

describe('exercise repository', () => {
  it('loads the local fixture through the repository', async () => {
    const exercises = await exerciseRepository.getAllExercises();

    expect(exercises).toHaveLength(15);
    expect(exercises.map((exercise) => exercise.id)).toContain('incline-dumbbell-press');
  });

  it('searches and filters normalized exercises', async () => {
    const inclineResults = await exerciseRepository.searchExercises('Incline');
    const cableChestResults = await exerciseRepository.searchExercises('', { equipment: 'cable', muscle: 'chest' });

    expect(inclineResults.map((exercise) => exercise.id)).toEqual(['incline-dumbbell-press']);
    expect(cableChestResults.map((exercise) => exercise.id)).toContain('cable-fly');
    expect(cableChestResults.every((exercise) => exercise.source.sourceId !== exercise.id)).toBe(true);
  });
});

describe('exercise muscle mapping', () => {
  it('maps provider muscle names into canonical ids', () => {
    expect(mapMuscleNameToCanonicalId('Front Delts')).toBe('front-delts');
    expect(mapMuscleNameToCanonicalId('Quadriceps')).toBe('quads');
    expect(mapMuscleNameToCanonicalId('unknown muscle')).toBeNull();
  });

  it('marks primary highlights over secondary highlights', () => {
    expect(buildMuscleHighlights(['chest'], ['triceps', 'chest'])).toEqual({
      chest: 'primary',
      triceps: 'secondary',
    });
  });
});

describe('exercise history and progress', () => {
  const sessions: WorkoutSession[] = [
    {
      id: 'session-1',
      workoutId: 'push',
      workoutTitle: 'Push',
      startedAt: '2026-01-01T10:00:00.000Z',
      finishedAt: '2026-01-01T11:00:00.000Z',
      sets: [
        { id: 'set-1', exerciseId: 'bench-press', exerciseName: 'Bench Press', weight: 100, reps: 5, completed: true, actualRpe: 8 },
        { id: 'set-2', exerciseId: 'squat', exerciseName: 'Squat', weight: 140, reps: 3, completed: true },
      ],
    },
    {
      id: 'session-2',
      workoutId: 'push',
      workoutTitle: 'Push',
      startedAt: '2026-01-08T10:00:00.000Z',
      finishedAt: '2026-01-08T11:00:00.000Z',
      sets: [
        { id: 'set-3', exerciseId: 'bench-press', exerciseName: 'Bench Press', weight: 105, reps: 4, completed: true },
        { id: 'set-4', exerciseId: 'bench-press', exerciseName: 'Bench Press', weight: 90, reps: 8, completed: false },
      ],
    },
  ];

  it('selects completed history groups by internal exerciseId', () => {
    const history = selectCompletedSetsByExerciseId(sessions, 'bench-press');

    expect(history).toHaveLength(2);
    expect(history[0].sessionId).toBe('session-2');
    expect(history[0].sets).toHaveLength(1);
    expect(history[1].sets[0].actualRpe).toBe(8);
  });

  it('calculates exercise progress metrics from completed sets', () => {
    const metrics = calculateExerciseProgressMetrics(selectCompletedSetsByExerciseId(sessions, 'bench-press'));

    expect(metrics.bestWeight).toBe(105);
    expect(metrics.bestReps).toBe(5);
    expect(metrics.totalVolume).toBe(920);
    expect(Math.round(metrics.estimatedOneRepMax)).toBe(119);
    expect(metrics.volumeTrend).toHaveLength(2);
  });

  it('fills missing legacy exercise ids without changing other set data', () => {
    const legacySessions = [
      {
        ...sessions[0],
        sets: [{ id: 'legacy-set', exerciseName: 'Bench Press', weight: 80, reps: 10 }],
      },
    ] as unknown as WorkoutSession[];

    const [normalized] = normalizeWorkoutSessions(legacySessions);

    expect(normalized.sets[0]).toMatchObject({
      id: 'legacy-set',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 10,
    });
  });

  it('adds repository exercises to workout drafts by canonical exercise id', async () => {
    const [inclinePress] = await exerciseRepository.searchExercises('Incline');
    const draft = {
      id: 'draft-1',
      workoutId: 'empty-workout',
      workoutTitle: 'Empty workout',
      startedAt: '2026-01-01T10:00:00.000Z',
      sets: [],
    };

    const nextDraft = addWorkoutSessionExercises(draft, [{ id: inclinePress.id, name: inclinePress.name }]);

    expect(inclinePress.source.sourceId).toBe('local-incline-dumbbell-press');
    expect(nextDraft.sets[0]).toMatchObject({
      exerciseId: 'incline-dumbbell-press',
      exerciseName: 'Incline Dumbbell Press',
    });
    expect(nextDraft.sets[0].exerciseId).not.toBe(inclinePress.source.sourceId);
  });
});
