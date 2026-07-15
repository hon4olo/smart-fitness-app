import { beforeEach, describe, expect, it } from 'vitest';

import { createExercise } from '@/domain/models';
import { clearActiveWorkoutSessionDraft, createDefaultTrainingProgram, deleteWorkoutProgram, duplicateWorkoutProgram, getActiveWorkoutSessionDraft, getRecentlyUsedWorkoutTemplates, getSuggestedWorkoutTemplates, getWorkoutHubViewModel, getWorkoutProgramById, getWorkoutPrograms, isWorkoutTemplateFavorite, resetWorkoutHubState, saveWorkoutProgram, startEmptyWorkoutSessionDraft, startWorkoutSessionDraft, toggleWorkoutProgramFavorite, toggleWorkoutTemplateFavorite } from '@/lib/workouts';
import type { TrainingProgram } from '@/types';

const bench = createExercise({
  createdAt: '2026-01-01T00:00:00.000Z',
  id: 'bench-press',
  name: 'Bench Press',
  muscleGroup: 'Chest',
});

const row = createExercise({
  createdAt: '2026-01-01T00:00:00.000Z',
  id: 'barbell-row',
  name: 'Barbell Row',
  muscleGroup: 'Back',
});

const squat = createExercise({
  createdAt: '2026-01-01T00:00:00.000Z',
  id: 'back-squat',
  name: 'Back Squat',
  muscleGroup: 'Legs',
});

const workouts = [
  {
    createdAt: '2026-01-01T00:00:00.000Z',
    description: 'Push template',
    duration: '45 min',
    exercises: [bench],
    id: 'push',
    isCustom: false,
    title: 'Push Day',
  },
  {
    createdAt: '2026-01-01T00:00:00.000Z',
    description: 'Pull template',
    duration: '50 min',
    exercises: [row],
    id: 'pull',
    isCustom: false,
    title: 'Pull Day',
  },
  {
    createdAt: '2026-01-01T00:00:00.000Z',
    description: 'Leg template',
    duration: '55 min',
    exercises: [squat],
    id: 'legs',
    isCustom: false,
    title: 'Leg Day',
  },
];

const sessions = [
  {
    finishedAt: '2026-01-01T08:30:00.000Z',
    id: 'session-1',
    sets: [{ id: 's-1', exerciseId: 'bench-press', exerciseName: 'Bench Press', reps: 8, weight: 80 }],
    startedAt: '2026-01-01T08:00:00.000Z',
    workoutId: 'push',
    workoutTitle: 'Push Day',
  },
  {
    finishedAt: '2026-01-02T08:30:00.000Z',
    id: 'session-2',
    sets: [{ id: 's-2', exerciseId: 'barbell-row', exerciseName: 'Barbell Row', reps: 8, weight: 70 }],
    startedAt: '2026-01-02T08:00:00.000Z',
    workoutId: 'pull',
    workoutTitle: 'Pull Day',
  },
] as const;

const program: TrainingProgram = {
  createdAt: '2026-01-01T00:00:00.000Z',
  days: [
    { id: 'mon', weekday: 'monday', workoutTemplateId: 'push', workoutTemplateName: 'Push Day' },
    { id: 'tue', weekday: 'tuesday', restDay: true },
    { id: 'wed', weekday: 'wednesday', workoutTemplateId: 'pull', workoutTemplateName: 'Pull Day' },
  ],
  difficulty: 'intermediate',
  durationWeeks: 8,
  goal: 'Hypertrophy',
  id: 'hypertrophy-8',
  isCustom: true,
  name: 'Hypertrophy Split',
};

describe('workouts hub helpers', () => {
  beforeEach(() => {
    resetWorkoutHubState();
    clearActiveWorkoutSessionDraft();
  });

  it('selects active workout state and sticky CTA labels', () => {
    startWorkoutSessionDraft(workouts[0]);
    const viewModel = getWorkoutHubViewModel({ activeProgram: null, workouts: workouts as any, workoutSessions: [] });

    expect(viewModel.activeWorkout?.workout.id).toBe('push');
    expect(viewModel.activeWorkout?.progressLabel).toBe('0/1 exercises');
    expect(viewModel.stickyActionLabel).toBe('Continue Workout');
    expect(viewModel.hasFreshStartNowState).toBe(true);
  });

  it('starts an empty workout draft and keeps it isolated', () => {
    startEmptyWorkoutSessionDraft();
    expect(getActiveWorkoutSessionDraft()?.workoutId).toBe('empty-workout');
    expect(getWorkoutHubViewModel({ activeProgram: null, workouts: workouts as any, workoutSessions: [] }).stickyActionLabel).toBe('Continue Workout');
  });

  it('surfaces suggested workouts and recent workouts', () => {
    const suggestions = getSuggestedWorkoutTemplates(workouts as any, sessions as any, null);
    const recent = getRecentlyUsedWorkoutTemplates(workouts as any, sessions as any, 4);

    expect(suggestions[0]?.workout.id).toBe('pull');
    expect(recent.map((item) => item.workout.id)).toEqual(['pull', 'push']);
  });

  it('keeps program store operations isolated from completed history', () => {
    const stored = saveWorkoutProgram(program);
    const duplicated = duplicateWorkoutProgram(program.id, workouts as any);

    expect(stored.id).toBe(program.id);
    expect(getWorkoutPrograms(workouts as any).some((item) => item.id === program.id)).toBe(true);
    expect(duplicated?.id).not.toBe(program.id);

    const favoriteState = toggleWorkoutProgramFavorite(program.id);
    expect(favoriteState).toBe(true);
    expect(toggleWorkoutTemplateFavorite('push')).toBe(true);
    expect(isWorkoutTemplateFavorite('push')).toBe(true);
    deleteWorkoutProgram(program.id);
    expect(getWorkoutProgramById(program.id, workouts as any)).toBeNull();
    expect(sessions).toHaveLength(2);
  });

  it('exposes a fresh-user start now state and starter workout', () => {
    const viewModel = getWorkoutHubViewModel({ activeProgram: null, workouts: workouts as any, workoutSessions: [] });

    expect(viewModel.hasFreshStartNowState).toBe(true);
    expect(viewModel.starterWorkout?.workout.id).toBe('push');
    expect(viewModel.stickyActionLabel).toBe('Start Empty Workout');
  });

  it('derives a default program without custom programs', () => {
    const defaultProgram = createDefaultTrainingProgram(workouts as any);
    expect(defaultProgram.days).toHaveLength(7);
    expect(defaultProgram.name).toBe('Strength Program');
  });
});
