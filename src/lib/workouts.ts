import type { Workout } from '@/types';

import { DEFAULT_WORKOUT_PROGRAM_ID, createDefaultTrainingProgram } from '@/features/workouts/defaults';
import {
  calculateEstimated1RM,
  estimateWorkoutDurationFromPlan,
  estimateWorkoutDurationMinutesFromPlan,
  formatWorkoutPlanDescription,
  formatWorkoutPlanExercise,
  getLatestWorkoutSession,
  getLatestWorkoutSessionForWorkout,
  getSessionExercises,
  getSessionVolume,
  getWeeklyWorkoutCount,
  getWorkoutTimestamp,
  parseWorkoutPlanDescription,
} from '@/features/workouts/historyModel';
import {
  PROGRAM_MUSCLE_GROUP_KEYS,
  PROGRAM_MUSCLE_GROUPS,
  deleteWorkoutProgram,
  duplicateWorkoutProgram,
  getTrainingProgramOverview,
  getTrainingProgramValidation,
  getWorkoutProgramById,
  getWorkoutProgramSchedule,
  getWorkoutProgramSummary,
  getWorkoutPrograms,
  resetProgramModelState,
  saveWorkoutProgram,
  toggleWorkoutProgramFavorite,
} from '@/features/workouts/programModel';
import { resolveWorkoutProgramRouteState, resolveWorkoutSessionRouteState, resolveWorkoutTemplateRouteState } from '@/features/workouts/routeResolution';
import { buildCompletedWorkoutSessionSnapshot, formatWorkoutSessionElapsedLabel, upsertWorkoutSessionById } from '@/features/workouts/sessionModel';
import { completeActiveWorkoutSession, discardActiveWorkoutSession, finishActiveWorkoutSession, getActiveWorkoutSession, getActiveWorkoutSessionDraft, isActiveWorkoutSessionStatus, markActiveWorkoutSessionCompleted, markActiveWorkoutSessionFinishing, resumeActiveWorkoutSession, startWorkoutSession } from '@/features/workouts/sessionService';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionStatus, hydrateActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { getWorkoutHubViewModel } from '@/features/workouts/selectors';
import type { WorkoutSessionDraft, WorkoutTemplateDraftExercise } from '@/features/workouts/types';
import { getRecentExercisesFromWorkoutSessions, getRecentlyUsedWorkoutTemplates, getSimilarExercises, getSuggestedWorkoutTemplates, getWorkoutTemplateById, getWorkoutTemplateSummary, isWorkoutTemplateFavorite, resolveExerciseByName, resetWorkoutModelState, searchExercises, toggleWorkoutTemplateFavorite, type SimilarExerciseMatch } from '@/features/workouts/workoutModel';

export {
  DEFAULT_WORKOUT_PROGRAM_ID,
  buildCompletedWorkoutSessionSnapshot,
  calculateEstimated1RM,
  clearActiveWorkoutSessionDraft,
  completeActiveWorkoutSession,
  createDefaultTrainingProgram,
  deleteWorkoutProgram,
  discardActiveWorkoutSession,
  duplicateWorkoutProgram,
  estimateWorkoutDurationFromPlan,
  estimateWorkoutDurationMinutesFromPlan,
  finishActiveWorkoutSession,
  formatWorkoutPlanDescription,
  formatWorkoutPlanExercise,
  formatWorkoutSessionElapsedLabel,
  getActiveWorkoutSession,
  getActiveWorkoutSessionDraft,
  getActiveWorkoutSessionStatus,
  getLatestWorkoutSession,
  getLatestWorkoutSessionForWorkout,
  getRecentExercisesFromWorkoutSessions,
  getRecentlyUsedWorkoutTemplates,
  getSessionExercises,
  getSessionVolume,
  getSimilarExercises,
  getSuggestedWorkoutTemplates,
  getTrainingProgramOverview,
  getTrainingProgramValidation,
  getWorkoutHubViewModel,
  getWorkoutProgramById,
  getWorkoutProgramSchedule,
  getWorkoutProgramSummary,
  getWorkoutPrograms,
  getWorkoutTemplateById,
  getWorkoutTemplateSummary,
  getWorkoutTimestamp,
  getWeeklyWorkoutCount,
  hydrateActiveWorkoutSessionDraft,
  isActiveWorkoutSessionStatus,
  isWorkoutTemplateFavorite,
  markActiveWorkoutSessionCompleted,
  markActiveWorkoutSessionFinishing,
  parseWorkoutPlanDescription,
  resolveExerciseByName,
  resolveWorkoutProgramRouteState,
  resolveWorkoutSessionRouteState,
  resolveWorkoutTemplateRouteState,
  saveWorkoutProgram,
  searchExercises,
  setActiveWorkoutSessionDraft,
  startWorkoutSession,
  toggleWorkoutProgramFavorite,
  toggleWorkoutTemplateFavorite,
  upsertWorkoutSessionById,
  PROGRAM_MUSCLE_GROUPS,
  PROGRAM_MUSCLE_GROUP_KEYS,
};

export const resetWorkoutHubState = () => {
  resetProgramModelState();
  resetWorkoutModelState();
  clearActiveWorkoutSessionDraft();
};

export const startWorkoutSessionDraft = startWorkoutSession;

export const startEmptyWorkoutSessionDraft = (startedAt = new Date().toISOString()) => {
  const draft: WorkoutSessionDraft = {
    id: `${Date.now()}`,
    workoutId: 'empty-workout',
    workoutTitle: 'Empty workout',
    startedAt,
    sets: [],
  };

  setActiveWorkoutSessionDraft(draft);
  return draft;
};

export const buildWorkoutTemplateSavePayload = (
  workout: Workout,
  draftTitle: string,
  draftExercises: WorkoutTemplateDraftExercise[],
) => {
  const normalizedTitle = draftTitle.trim() || workout.title;

  return {
    title: normalizedTitle,
    description: formatWorkoutPlanDescription(workout.description ?? '', draftExercises),
    exercises: draftExercises.map((exercise) => exercise.name),
  };
};

export type { SimilarExerciseMatch };
