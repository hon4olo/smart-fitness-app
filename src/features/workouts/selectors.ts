import type { FoodEntry, TrainingProgram, Workout, WorkoutSession } from '@/types';

import { addDays, formatLocalDate } from '@/lib';
import { sumNutritionTotals } from '@/lib/nutrition';
import { formatWorkoutSessionElapsedLabel } from './sessionModel';
import { getActiveWorkoutSessionDraft } from './storage';
import { getWorkoutPrograms, getWorkoutProgramSummary } from './programModel';
import { getWorkoutTemplateSummary, getSuggestedWorkoutTemplates, getRecentlyUsedWorkoutTemplates } from './workoutModel';
import type { WorkoutHubViewModel } from './types';

export type HomeSnapshotItem = {
  detail: string;
  id: string;
  label: string;
  tone?: 'neutral' | 'positive' | 'warning';
  value: string;
};

const toDateKey = (value: string) => formatLocalDate(new Date(value));

const dedupeWorkoutSessions = (workoutSessions: WorkoutSession[]) => {
  const seen = new Set<string>();

  return [...workoutSessions]
    .reverse()
    .filter((session) => {
      if (seen.has(session.id)) {
        return false;
      }

      seen.add(session.id);
      return true;
    })
    .reverse();
};

export const getHomePrimaryWorkoutActionLabel = (activeWorkoutDraft: Pick<WorkoutSession, 'id' | 'workoutId' | 'workoutTitle' | 'startedAt' | 'sets'> | null) => {
  return activeWorkoutDraft ? 'Continue workout' : 'Start workout';
};

export const getCurrentWorkoutStreak = (workoutSessions: WorkoutSession[]) => {
  const uniqueDays = [...new Set(dedupeWorkoutSessions(workoutSessions).map((session) => toDateKey(session.finishedAt)))].sort();

  if (uniqueDays.length === 0) {
    return null;
  }

  let streak = 1;
  let cursor = uniqueDays.at(-1) ?? '';

  for (let index = uniqueDays.length - 2; index >= 0; index -= 1) {
    const expectedPreviousDay = addDays(cursor, -1);

    if (uniqueDays[index] !== expectedPreviousDay) {
      break;
    }

    streak += 1;
    cursor = uniqueDays[index];
  }

  return {
    days: streak,
    latestWorkoutDate: uniqueDays.at(-1) ?? '',
  };
};

export const getWeeklyCaloriesAverage = (foodEntries: FoodEntry[], todayKey = formatLocalDate(new Date())) => {
  const weekDayKeys = Array.from({ length: 7 }, (_, index) => addDays(todayKey, index - 6));
  const totalCalories = weekDayKeys.reduce((sum, dateKey) => {
    const dayCalories = sumNutritionTotals(foodEntries.filter((entry) => entry.date === dateKey)).calories;
    return sum + dayCalories;
  }, 0);

  return totalCalories > 0 ? totalCalories / weekDayKeys.length : null;
};

export const getWeeklyWorkoutCount = (workoutSessions: WorkoutSession[], todayKey = formatLocalDate(new Date())) => {
  const weekStart = addDays(todayKey, -6);

  return dedupeWorkoutSessions(workoutSessions).filter((session) => {
    const sessionDate = toDateKey(session.finishedAt);
    return sessionDate >= weekStart && sessionDate <= todayKey;
  }).length;
};

const getSessionVolume = (session: WorkoutSession) => {
  return session.sets.reduce((total, set) => total + (set.weight ?? 0) * (set.reps ?? 0), 0);
};

export const getWeeklyWorkoutVolumeTrend = (workoutSessions: WorkoutSession[], todayKey = formatLocalDate(new Date())) => {
  const currentWeekStart = addDays(todayKey, -6);
  const previousWeekStart = addDays(todayKey, -13);
  const previousWeekEnd = addDays(todayKey, -7);

  const currentWeekVolume = dedupeWorkoutSessions(workoutSessions).reduce((total, session) => {
    const sessionDate = toDateKey(session.finishedAt);

    if (sessionDate >= currentWeekStart && sessionDate <= todayKey) {
      return total + getSessionVolume(session);
    }

    return total;
  }, 0);

  const previousWeekVolume = dedupeWorkoutSessions(workoutSessions).reduce((total, session) => {
    const sessionDate = toDateKey(session.finishedAt);

    if (sessionDate >= previousWeekStart && sessionDate <= previousWeekEnd) {
      return total + getSessionVolume(session);
    }

    return total;
  }, 0);

  return {
    currentVolume: currentWeekVolume,
    previousVolume: previousWeekVolume,
  };
};

export const getWorkoutHubViewModel = (input: { activeProgram?: TrainingProgram | null; workouts: Workout[]; workoutSessions: WorkoutSession[] }) => {
  const activeWorkoutDraft = getActiveWorkoutSessionDraft();
  const activeWorkout = activeWorkoutDraft ? input.workouts.find((workout) => workout.id === activeWorkoutDraft.workoutId) ?? null : null;
  const activeWorkoutExerciseCount = activeWorkout ? activeWorkout.exercises.length : 0;
  const starterWorkout = input.workouts[0] ? getWorkoutTemplateSummary(input.workouts[0], input.workoutSessions) : undefined;
  const suggestedWorkouts = getSuggestedWorkoutTemplates(input.workouts, input.workoutSessions, input.activeProgram);
  const recentWorkouts = getRecentlyUsedWorkoutTemplates(input.workouts, input.workoutSessions, 4);
  const programs = getWorkoutPrograms(input.workouts);
  const programSummaries = programs.map((program) => getWorkoutProgramSummary(program, input.workouts, input.workoutSessions));
  const activeSummary = activeWorkout ? getWorkoutTemplateSummary(activeWorkout, input.workoutSessions) : undefined;

  return {
    activeWorkout: activeSummary && activeWorkoutDraft
      ? {
          ...activeSummary,
          completedExercises: new Set(activeWorkoutDraft.sets.filter((set) => set.completed !== false).map((set) => set.exerciseId)).size,
          elapsedLabel: formatWorkoutSessionElapsedLabel(activeWorkoutDraft.startedAt),
          progressLabel: `${new Set(activeWorkoutDraft.sets.filter((set) => set.completed !== false).map((set) => set.exerciseId)).size}/${activeWorkoutExerciseCount} exercises`,
        }
      : undefined,
    favoritePrograms: programSummaries.filter((program) => program.isFavorite),
    mode: 'start-now' as const,
    recentWorkouts,
    suggestedWorkouts,
    starterWorkout,
    stickyActionLabel: activeWorkoutDraft ? 'Continue Workout' : 'Start Empty Workout',
    stickyActionType: activeWorkoutDraft ? 'continue' as const : 'start-empty' as const,
    programs: programSummaries,
    hasFreshStartNowState: input.workoutSessions.length === 0,
    hasFreshProgramsState: programs.length === 0,
  } satisfies WorkoutHubViewModel;
};
