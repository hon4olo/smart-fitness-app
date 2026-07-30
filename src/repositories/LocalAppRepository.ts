import type { CloudProvider } from '@/cloud';
import {
  DEFAULT_WORKOUT_TEMPLATE_IDS as DEFAULT_WORKOUT_TEMPLATE_IDS_FROM_DATA,
  defaultState as defaultAppState,
} from '@/data/defaults';
import { exerciseDatabase, mergeExerciseCatalog } from '@/data/exercises';
import {
  normalizeBodyMeasurements,
  normalizeExercises,
  normalizeFoodEntries,
  normalizeMealTemplates,
  normalizeWeightHistory,
  normalizeWorkouts,
  normalizeWorkoutSessions,
} from '@/lib/appState';
import { hasCompleteOnboardingData } from '@/lib/onboarding';
import {
  normalizeRecoveryCheckIns,
  normalizeUserLimitations,
} from '@/lib/safetyRecoveryState';
import {
  createLocalStateDiagnosticsRecorder,
  type LocalStateDiagnosticsRecorder,
} from '@/storage/LocalStateDiagnostics';
import type { StorageAdapter } from '@/storage/StorageAdapter';
import type { AppState } from '@/types';

import type { AppRepository } from './AppRepository';

export type LocalAppRepositoryOptions = {
  cloudProvider?: CloudProvider;
  diagnosticsRecorder?: LocalStateDiagnosticsRecorder;
  now?: () => number;
};

export const APP_STATE_STORAGE_KEY = '@smart_fitness_mvp_state';
const DEFAULT_WORKOUT_TEMPLATE_IDS = DEFAULT_WORKOUT_TEMPLATE_IDS_FROM_DATA;
const defaultState: AppState = defaultAppState;

const normalizeStoredState = (storedState: Partial<AppState>): AppState => {
  const profile = {
    ...defaultState.profile,
    ...(storedState.profile ?? {}),
  };
  const weightHistory = normalizeWeightHistory(
    storedState.weightHistory ?? defaultState.weightHistory,
  );

  return {
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
    profile,
    onboardingCompleted:
      storedState.onboardingCompleted ??
      hasCompleteOnboardingData({ profile, weightHistory }),
    weightHistory,
    bodyMeasurements: normalizeBodyMeasurements(
      storedState.bodyMeasurements ?? defaultState.bodyMeasurements,
    ),
    userLimitations: normalizeUserLimitations(storedState.userLimitations),
    recoveryCheckIns: normalizeRecoveryCheckIns(storedState.recoveryCheckIns),
  };
};

export const createLocalAppRepository = (
  storage: StorageAdapter,
  options: LocalAppRepositoryOptions = {},
): AppRepository => {
  void options.cloudProvider;
  const diagnostics =
    options.diagnosticsRecorder ?? createLocalStateDiagnosticsRecorder(storage);
  const now = options.now ?? Date.now;

  return {
    async loadState() {
      const startedAt = now();
      let serializedState: string | undefined;
      let normalizedState: AppState | undefined;
      try {
        const storedState = await storage.read(APP_STATE_STORAGE_KEY);
        serializedState = storedState ?? undefined;

        if (!storedState) {
          diagnostics.record({
            operation: 'load',
            durationMs: now() - startedAt,
            success: true,
          });
          return null;
        }

        normalizedState = normalizeStoredState(
          JSON.parse(storedState) as Partial<AppState>,
        );
        const normalizedJson = JSON.stringify(normalizedState);
        serializedState = normalizedJson;
        if (normalizedJson !== storedState) {
          await storage.write(APP_STATE_STORAGE_KEY, normalizedJson);
        }

        diagnostics.record({
          operation: 'load',
          durationMs: now() - startedAt,
          success: true,
          serializedState,
          state: normalizedState,
        });
        return normalizedState;
      } catch (error) {
        diagnostics.record({
          operation: 'load',
          durationMs: now() - startedAt,
          success: false,
          serializedState,
          state: normalizedState,
        });
        console.warn('Failed to restore MVP app state', error);
        return null;
      }
    },
    async saveState(state) {
      const startedAt = now();
      let serializedState: string | undefined;
      try {
        serializedState = JSON.stringify(state);
        await storage.write(APP_STATE_STORAGE_KEY, serializedState);
        diagnostics.record({
          operation: 'save',
          durationMs: now() - startedAt,
          success: true,
          serializedState,
          state,
        });
      } catch (error) {
        diagnostics.record({
          operation: 'save',
          durationMs: now() - startedAt,
          success: false,
          serializedState,
          state,
        });
        console.warn('Failed to persist MVP app state', error);
        throw error;
      }
    },
    async clearState() {
      try {
        await storage.remove(APP_STATE_STORAGE_KEY);
        diagnostics.reset();
      } catch (error) {
        console.warn('Failed to clear MVP app state', error);
      }
    },
  };
};
