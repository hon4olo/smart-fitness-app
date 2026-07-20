import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        enableOssExerciseDb: false,
      },
    },
    manifest: null,
  },
}));

import {
  EXERCISE_CACHE_KEYS,
  buildMuscleHighlights,
  calculateExerciseProgressMetrics,
  isOssExerciseDbEnabled,
  mapMuscleNameToCanonicalId,
  normalizeExerciseDbExercise,
  exerciseRepository,
  normalizeOssExercise,
  selectCompletedSetsByExerciseId,
} from '@/features/exercises';
import { normalizeWorkoutSessions } from '@/features/workouts';
import { addWorkoutSessionExercises } from '@/features/workouts/sessionScreenModel';
import type { WorkoutSession } from '@/types';

afterEach(() => {
  vi.unstubAllEnvs();
});

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

describe('exercise provider selection', () => {
  it('keeps OSS ExerciseDB disabled by default outside dev builds', () => {
    vi.stubEnv('EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB', undefined);

    expect(isOssExerciseDbEnabled()).toBe(false);
  });

  it('allows OSS ExerciseDB in explicitly flagged internal builds', () => {
    vi.stubEnv('EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB', 'true');

    expect(isOssExerciseDbEnabled()).toBe(true);
  });

  it('uses provider-specific cache keys', () => {
    expect(EXERCISE_CACHE_KEYS).toEqual({
      local: 'exercise-cache:local:v1',
      ossExerciseDb: 'exercise-cache:oss-exercisedb:v2',
    });
  });
});

describe('oss exercisedb provider normalization', () => {
  it('normalizes the discovered OSS ExerciseDB V1 response shape', () => {
    const exercise = normalizeOssExercise(
      {
        exerciseId: '01qpYSe',
        name: 'upward facing dog',
        gifUrl: 'https://static.exercisedb.dev/media/01qpYSe.gif',
        bodyParts: ['back'],
        equipments: ['body weight'],
        targetMuscles: ['spine'],
        secondaryMuscles: ['shoulders', 'chest'],
        instructions: ['Step:1 Lie face down.', 'Step:2 Press your hands firmly into the floor.'],
      },
      new Map(),
    );

    expect(exercise).toMatchObject({
      id: 'exdb-01qpYSe',
      source: {
        provider: 'oss-exercisedb',
        sourceId: '01qpYSe',
      },
      name: 'upward facing dog',
      bodyPart: 'back',
      equipment: ['body weight'],
      primaryMuscles: ['spine'],
      secondaryMuscles: ['shoulders', 'chest'],
      instructions: ['Lie face down.', 'Press your hands firmly into the floor.'],
      media: {
        animationUrl: 'https://static.exercisedb.dev/media/01qpYSe.gif',
      },
    });
  });

  it('reuses a local id when remote name and equipment match', () => {
    const local = normalizeExerciseDbExercise({
      internalId: 'bench-press',
      id: 'local-bench-press',
      name: 'Bench Press',
      equipment: 'barbell',
      primaryMuscles: ['chest'],
    }, 'local-fixture');

    const exercise = normalizeOssExercise(
      {
        exerciseId: 'remote-bench',
        name: 'Bench Press',
        gifUrl: 'https://static.exercisedb.dev/media/remote-bench.gif',
        equipments: ['barbell'],
        targetMuscles: ['pectorals'],
      },
      new Map([['bench press::barbell', local]]),
    );

    expect(exercise.id).toBe('bench-press');
    expect(exercise.source.sourceId).toBe('remote-bench');
  });

  it('enriches local records with remote GIF media without letting empty local media win', () => {
    const local = normalizeExerciseDbExercise({
      aliases: ['barbell bench press', 'flat bench press'],
      internalId: 'bench-press',
      id: 'local-bench-press',
      name: 'Bench Press',
      equipment: 'barbell',
      primaryMuscles: ['chest'],
    }, 'local-fixture');

    const exercise = normalizeOssExercise(
      {
        exerciseId: 'remote-bench',
        name: 'barbell bench press',
        gifUrl: 'https://static.exercisedb.dev/media/remote-bench.gif',
        bodyParts: ['chest'],
        equipments: ['barbell'],
        targetMuscles: ['pectorals'],
        secondaryMuscles: ['triceps'],
      },
      new Map([['bench press::barbell', local]]),
    );

    expect(exercise).toMatchObject({
      id: 'bench-press',
      name: 'Bench Press',
      source: {
        provider: 'oss-exercisedb',
        sourceId: 'remote-bench',
      },
      media: {
        animationUrl: 'https://static.exercisedb.dev/media/remote-bench.gif',
        gifUri: 'https://static.exercisedb.dev/media/remote-bench.gif',
        thumbnailUrl: 'https://static.exercisedb.dev/media/remote-bench.gif',
      },
      primaryMuscles: ['pectorals'],
    });
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
