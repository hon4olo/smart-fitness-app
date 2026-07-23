import { type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { AuthProvider } from '@/auth';
import { defaultState as defaultAppState } from '@/data/defaults';
import { getLastWorkoutSession as getLastWorkoutSessionFromState } from '@/lib/appState';
import { upsertWorkoutSessionById } from '@/lib/workouts';
import type {
  AppContextType,
  AppState,
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  MealType,
  NutritionState,
  NutritionTargets,
  ProfileGoalType,
  ProfileState,
  TrainingProgram,
  WeightEntry,
  Workout,
  WorkoutSession,
  WorkoutSet,
} from '@/types';

import { SyncProvider } from './SyncContext';
import { AppContext, useAppContext } from './appContext/AppContextCore';
import {
  addBodyMeasurementToState,
  completeOnboardingInState,
  deleteBodyMeasurementFromState,
  resetOnboardingInState,
  updateProfileGoalsInState,
} from './appContext/progressActions';
import { useAppInfrastructure } from './appContext/useAppInfrastructure';
import { useNutritionStateActions } from './appContext/useNutritionStateActions';
import { useWeightHistoryActions } from './appContext/useWeightHistoryActions';
import {
  addWorkoutTemplateToState,
  deleteCustomExerciseFromState,
  deleteCustomWorkoutTemplateFromState,
  deleteTrainingProgramFromState,
  deleteWorkoutSessionFromState,
  saveTrainingProgramToState,
  toggleTrainingProgramFavoriteInState,
  updateCustomWorkoutTemplateInState,
  updateWorkoutSessionPreservingImmutableFields,
} from './appContext/workoutActions';

export type {
  AppContextType,
  AppState,
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  MealType,
  NutritionState,
  NutritionTargets,
  ProfileGoalType,
  ProfileState,
  TrainingProgram,
  WeightEntry,
  Workout,
  WorkoutSession,
  WorkoutSet,
} from '@/types';

export { useAppContext };

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(defaultAppState);
  const [isRestoringState, setIsRestoringState] = useState(true);
  const {
    authService,
    queueStore,
    repository,
    syncCoordinator,
    weightSyncMetadataStore,
  } = useAppInfrastructure(setState, setIsRestoringState);
  const {
    addFoodEntries,
    addFoodEntry,
    addMealTemplate,
    deleteFoodEntry,
    deleteMealTemplate,
    updateFoodEntry,
    updateNutritionTargets,
  } = useNutritionStateActions({ repository, setState });
  const {
    addWeightEntry,
    deleteWeightEntry,
    queueWeightHistoryOperation,
    updateWeightEntry,
  } = useWeightHistoryActions({
    authService,
    queueStore,
    repository,
    setState,
    weightSyncMetadataStore,
  });

  const addExercise = useCallback(
    (exercise: {
      id: string;
      name: string;
      muscleGroup?: string;
      isCustom: boolean;
      createdAt: string;
    }) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          exercises: [
            ...currentState.exercises,
            {
              ...exercise,
              isCustom: true,
              createdAt: exercise.createdAt ?? new Date().toISOString(),
            },
          ],
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const addWorkoutTemplate = useCallback(
    (template: {
      id: string;
      title: string;
      description?: string;
      exercises: string[];
      createdAt: string;
    }) => {
      setState((currentState) => {
        const nextState = addWorkoutTemplateToState(currentState, template);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const updateWorkoutTemplate = useCallback(
    (
      templateId: string,
      updatedTemplate: { title: string; description?: string; exercises: string[] },
    ) => {
      setState((currentState) => {
        const nextState = updateCustomWorkoutTemplateInState(
          currentState,
          templateId,
          updatedTemplate,
          new Date().toISOString(),
        );
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const saveTrainingProgram = useCallback(
    (program: TrainingProgram) => {
      setState((currentState) => {
        const nextState = saveTrainingProgramToState(
          currentState,
          program,
          new Date().toISOString(),
        );
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const deleteTrainingProgram = useCallback(
    (programId: string) => {
      setState((currentState) => {
        const nextState = deleteTrainingProgramFromState(currentState, programId);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const toggleTrainingProgramFavorite = useCallback(
    (programId: string) => {
      setState((currentState) => {
        const nextState = toggleTrainingProgramFavoriteInState(
          currentState,
          programId,
          new Date().toISOString(),
        );
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const deleteWorkoutTemplate = useCallback(
    (templateId: string) => {
      setState((currentState) => {
        const nextState = deleteCustomWorkoutTemplateFromState(currentState, templateId);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const deleteExercise = useCallback(
    (exerciseId: string) => {
      setState((currentState) => {
        const nextState = deleteCustomExerciseFromState(currentState, exerciseId);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const updateProfileGoals = useCallback(
    (goals: {
      targetWeight: number;
      goalType: ProfileGoalType;
      weeklyWeightChangeGoal: number;
      trainingDaysPerWeek: number;
    }) => {
      setState((currentState) => {
        const nextState = updateProfileGoalsInState(currentState, goals);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const addBodyMeasurement = useCallback(
    (entry: BodyMeasurement) => {
      setState((currentState) => {
        const nextState = addBodyMeasurementToState(currentState, entry);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const deleteBodyMeasurement = useCallback(
    (entryId: string) => {
      setState((currentState) => {
        const nextState = deleteBodyMeasurementFromState(currentState, entryId);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const saveWorkoutSession = useCallback(
    (session: WorkoutSession) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          workoutSessions: upsertWorkoutSessionById(currentState.workoutSessions, session),
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const completeOnboarding = useCallback(
    (setup: {
      currentWeight: number;
      targetWeight: number;
      goalType: ProfileGoalType;
      trainingDaysPerWeek: number;
    }) => {
      const today = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
      }).format(new Date());
      const now = new Date().toISOString();
      const initialWeightInput = { id: `${Date.now()}`, date: today, createdAt: now };

      setState((currentState) => {
        const { nextState, initialWeightEntry } = completeOnboardingInState(
          currentState,
          setup,
          initialWeightInput,
        );
        void repository.saveState(nextState);
        void queueWeightHistoryOperation('create', initialWeightEntry);
        return nextState;
      });
    },
    [queueWeightHistoryOperation, repository],
  );

  const resetOnboarding = useCallback(() => {
    setState((currentState) => {
      const nextState = resetOnboardingInState(currentState);
      void repository.saveState(nextState);
      return nextState;
    });
  }, [repository]);

  const deleteWorkoutSession = useCallback(
    (sessionId: string) => {
      setState((currentState) => {
        const nextState = deleteWorkoutSessionFromState(currentState, sessionId);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const updateWorkoutSession = useCallback(
    (sessionId: string, updatedSession: WorkoutSession) => {
      setState((currentState) => {
        const nextState = updateWorkoutSessionPreservingImmutableFields(
          currentState,
          sessionId,
          updatedSession,
        );
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository],
  );

  const replaceState = useCallback(
    (nextState: AppState) => {
      setState(nextState);
      void repository.saveState(nextState);
    },
    [repository],
  );

  const getLastWorkoutSession = useCallback(
    () => getLastWorkoutSessionFromState(state.workoutSessions),
    [state.workoutSessions],
  );

  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      addBodyMeasurement,
      addExercise,
      addFoodEntries,
      addFoodEntry,
      addMealTemplate,
      addWeightEntry,
      addWorkoutTemplate,
      completeOnboarding,
      deleteBodyMeasurement,
      deleteExercise,
      deleteFoodEntry,
      deleteMealTemplate,
      deleteTrainingProgram,
      deleteWeightEntry,
      deleteWorkoutSession,
      deleteWorkoutTemplate,
      getLastWorkoutSession,
      isRestoringState,
      replaceState,
      resetOnboarding,
      saveTrainingProgram,
      saveWorkoutSession,
      toggleTrainingProgramFavorite,
      updateFoodEntry,
      updateNutritionTargets,
      updateProfileGoals,
      updateWeightEntry,
      updateWorkoutSession,
      updateWorkoutTemplate,
    }),
    [
      state,
      addBodyMeasurement,
      addExercise,
      addFoodEntries,
      addFoodEntry,
      addMealTemplate,
      addWeightEntry,
      addWorkoutTemplate,
      completeOnboarding,
      deleteBodyMeasurement,
      deleteExercise,
      deleteFoodEntry,
      deleteMealTemplate,
      deleteTrainingProgram,
      deleteWeightEntry,
      deleteWorkoutSession,
      deleteWorkoutTemplate,
      getLastWorkoutSession,
      isRestoringState,
      replaceState,
      resetOnboarding,
      saveTrainingProgram,
      saveWorkoutSession,
      toggleTrainingProgramFavorite,
      updateFoodEntry,
      updateNutritionTargets,
      updateProfileGoals,
      updateWeightEntry,
      updateWorkoutSession,
      updateWorkoutTemplate,
    ],
  );

  return (
    <AuthProvider service={authService}>
      <AppContext.Provider value={value}>
        <SyncProvider
          metadataStore={weightSyncMetadataStore}
          queueStore={queueStore}
          replaceState={replaceState}
          state={state}
          syncCoordinator={syncCoordinator}>
          {children}
        </SyncProvider>
      </AppContext.Provider>
    </AuthProvider>
  );
}
