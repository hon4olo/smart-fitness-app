import type { CloudProvider } from '@/cloud';
import {
  DEFAULT_WORKOUT_TEMPLATE_IDS as DEFAULT_WORKOUT_TEMPLATE_IDS_FROM_DATA,
  defaultState as defaultAppState,
} from '@/data/defaults';
import { exerciseDatabase, mergeExerciseCatalog } from '@/data/exercises';
import type { AppState } from '@/types';
import {
  normalizeBodyMeasurements,
  normalizeExercises,
  normalizeFoodEntries,
  normalizeMealTemplates,
  normalizeWeightHistory,
  normalizeWorkouts,
  normalizeWorkoutSessions,
} from '@/lib/appState';

import type { AppRepository } from './AppRepository';
import type { StorageAdapter } from '@/storage/StorageAdapter';

export type LocalAppRepositoryOptions = {
  cloudProvider?: CloudProvider;
};

const APP_STATE_KEY = '@smart_fitness_mvp_state';
const DEFAULT_WORKOUT_TEMPLATE_IDS = DEFAULT_WORKOUT_TEMPLATE_IDS_FROM_DATA;
const defaultState: AppState = defaultAppState;

const normalizeStoredState = (storedState: Partial<AppState>): AppState => ({
  ...defaultState,
  ...storedState,
  workouts: normalizeWorkouts(
    storedState.workouts ?? defaultState.workouts,
    DEFAULT_WORKOUT_TEMPLATE_IDS,
  ),
  trainingPrograms: (storedState.trainingPrograms ?? defaultState.trainingPrograms).map(
    (program) => ({
      ...program,
      days: program.days.map((day) => ({ ...day })),
      progression: program.progression ? { ...program.progression } : undefined,
      metadata: program.metadata ? { ...program.metadata } : undefined,
    }),
  ),
  exercises: storedState.exercises
    ? mergeExerciseCatalog(exerciseDatabase, normalizeExercises(storedState.exercises))
    : defaultState.exercises,
  workoutSessions: normalizeWorkoutSessions(
    storedState.workoutSessions ?? defaultState.workoutSessions,
  ),
  foodEntries: normalizeFoodEntries(storedState.foodEntries ?? defaultState.foodEntries),
  mealTemplates: normalizeMealTemplates(
    storedState.mealTemplates ?? defaultState.mealTemplates,
  ),
  nutritionTargets: storedState.nutritionTargets ?? defaultState.nutritionTargets,
  profile: {
    ...defaultState.profile,
    ...(storedState.profile ?? {}),
  },
  onboardingCompleted:
    storedState.onboardingCompleted ?? defaultState.onboardingCompleted,
  weightHistory: normalizeWeightHistory(
    storedState.weightHistory ?? defaultState.weightHistory,
  ),
  bodyMeasurements: normalizeBodyMeasurements(
    storedState.bodyMeasurements ?? defaultState.bodyMeasurements,
  ),
});

export const createLocalAppRepository = (
  storage: StorageAdapter,
  options: LocalAppRepositoryOptions = {},
): AppRepository => {
  void options.cloudProvider;

  return {
    async loadState() {
      try {
        const storedState = await storage.read(APP_STATE_KEY);

        if (!storedState) {
          return null;
        }

        const normalizedState = normalizeStoredState(
          JSON.parse(storedState) as Partial<AppState>,
        );
        const normalizedJson = JSON.stringify(normalizedState);
        if (normalizedJson !== storedState) {
          await storage.write(APP_STATE_KEY, normalizedJson);
        }

        return normalizedState;
      } catch (error) {
        console.warn('Failed to restore MVP app state', error);
        return null;
      }
    },
    async saveState(state) {
      try {
        await storage.write(APP_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist MVP app state', error);
      }
    },
    async clearState() {
      try {
        await storage.remove(APP_STATE_KEY);
      } catch (error) {
        console.warn('Failed to clear MVP app state', error);
      }
    },
  };
};
