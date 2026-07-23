import { beforeEach, describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

import { defaultState } from '@/data/defaults';
import { createDefaultTrainingProgram } from '@/features/workouts/defaults';
import { normalizeWorkouts } from '@/lib/appState';
import { ensureUuid } from '@/lib/ids';
import {
  buildCompletedWorkoutSessionSnapshot,
  formatWorkoutSessionElapsedLabel,
  getWorkoutPrograms,
  resolveWorkoutProgramRouteState,
  resolveWorkoutSessionRouteState,
  resolveWorkoutTemplateRouteState,
  resetWorkoutHubState,
  saveWorkoutProgram,
  upsertWorkoutSessionById,
} from '@/lib/workouts';
import type { TrainingProgram } from '@/types/programs';

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

const conditioning = defaultState.workouts.find((workout) => workout.id === 'conditioning-a') ?? defaultState.workouts[0]!;

beforeEach(() => {
  resetWorkoutHubState();
});

describe('workout routing, duplicates, and timer regressions', () => {
  it('keeps template/session/program routes loading until restoration completes', () => {
    expect(
      resolveWorkoutTemplateRouteState({
        workoutId: conditioning.id,
        workouts: defaultState.workouts,
        isRestoringState: true,
      }),
    ).toEqual({ status: 'loading' });

    expect(
      resolveWorkoutTemplateRouteState({
        workoutId: conditioning.id,
        workouts: defaultState.workouts,
        isRestoringState: false,
      }),
    ).toEqual({ status: 'ready', workoutId: conditioning.id });

    expect(
      resolveWorkoutSessionRouteState({
        workoutId: conditioning.id,
        activeDraft: undefined,
        workouts: defaultState.workouts,
        isRestoringState: true,
      }),
    ).toEqual({ status: 'loading' });

    expect(
      resolveWorkoutSessionRouteState({
        workoutId: conditioning.id,
        activeDraft: {
          id: 'draft-1',
          workoutId: conditioning.id,
          workoutTitle: conditioning.title,
          startedAt: '2024-01-01T12:00:00.000Z',
          sets: [],
        },
        workouts: defaultState.workouts,
        isRestoringState: false,
      }),
    ).toEqual({ status: 'ready', workoutId: conditioning.id });

    expect(
      resolveWorkoutSessionRouteState({
        workoutId: conditioning.id,
        activeDraft: null,
        workouts: defaultState.workouts,
        isRestoringState: false,
      }),
    ).toEqual({ status: 'ready', workoutId: conditioning.id });

    expect(
      resolveWorkoutSessionRouteState({
        workoutId: undefined,
        activeDraft: null,
        workouts: defaultState.workouts,
        isRestoringState: false,
      }),
    ).toEqual({ status: 'not-found' });

    expect(
      resolveWorkoutProgramRouteState({
        programId: 'default-program',
        workouts: defaultState.workouts,
        isRestoringState: true,
      }),
    ).toEqual({ status: 'loading' });

    expect(
      resolveWorkoutProgramRouteState({
        programId: 'default-program',
        workouts: defaultState.workouts,
        isRestoringState: false,
      }),
    ).toEqual({ status: 'ready', workoutId: 'default-program' });
  });

  it('keeps the default lower body template at four exercises and seeds a three-workout program without duplication', () => {
    const lowerBody = defaultState.workouts.find((workout) => workout.id === 'legs-a') ?? defaultState.workouts[0]!;

    expect(lowerBody.exercises).toHaveLength(4);

    const seededProgram = createDefaultTrainingProgram(defaultState.workouts);
    expect(seededProgram.days.filter((day) => !day.restDay).map((day) => day.workoutTemplateId)).toEqual([
      'push-a',
      'legs-a',
      'conditioning-a',
    ]);
  });

  it('keeps the program list stable after repeated saves of the same program id', () => {
    const baseProgram: TrainingProgram = {
      id: 'default-program',
      name: 'Strength Program',
      description: 'Structured weekly program built from saved workout templates.',
      goal: 'Strength',
      difficulty: 'intermediate',
      durationWeeks: 8,
      days: [],
      progression: {
        strategy: 'linear progression',
        targetReps: 8,
        rir: 2,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      isCustom: true,
    };

    saveWorkoutProgram(baseProgram);
    saveWorkoutProgram({ ...baseProgram, name: 'Strength Program v2' });

    const programs = getWorkoutPrograms(defaultState.workouts);
    expect(programs.filter((program) => program.id === 'default-program')).toHaveLength(1);
    expect(programs.find((program) => program.id === 'default-program')?.name).toBe('Strength Program v2');
  });

  it('formats elapsed workout time from persisted start timestamp', () => {
    expect(formatWorkoutSessionElapsedLabel('2024-01-01T12:00:00.000Z', new Date('2024-01-01T12:00:59.000Z').getTime())).toBe('00:00:59');
    expect(formatWorkoutSessionElapsedLabel('2024-01-01T12:00:00.000Z', new Date('2024-01-01T12:01:05.000Z').getTime())).toBe('00:01:05');
    expect(formatWorkoutSessionElapsedLabel('2024-01-01T12:00:00.000Z', new Date('2024-01-01T13:02:03.000Z').getTime())).toBe('01:02:03');
  });

  it('preserves a completed workout snapshot exactly once after the active draft is cleared', () => {
    const draft = {
      id: 'draft-1',
      workoutId: conditioning.id,
      workoutTitle: conditioning.title,
      startedAt: '2024-01-01T12:00:00.000Z',
      sets: [],
    } as Parameters<typeof buildCompletedWorkoutSessionSnapshot>[0];

    const completed = buildCompletedWorkoutSessionSnapshot(draft, {
      finishedAt: '2024-01-01T12:45:00.000Z',
      notes: 'Great session',
    });

    const first = upsertWorkoutSessionById([], completed);
    const second = upsertWorkoutSessionById(first, completed);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({
      id: ensureUuid(draft.id),
      workoutId: draft.workoutId,
      notes: 'Great session',
    });
  });

  it('keeps the layout full screen without card or modal presentations for workout routes', () => {
    const layout = readSource('src/app/_layout.tsx');

    expect(layout).toContain('name="workout-session"');
    expect(layout).toContain('name="workout-session-finish"');
    expect(layout).toContain('name="workouts/builder"');
    expect(layout).not.toContain("presentation: 'card'");
    expect(layout).not.toContain("presentation: 'fullScreenModal'");
  });
});