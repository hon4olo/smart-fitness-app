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
import { AppMutationFailureNotice } from './appContext/AppMutationFailureNotice';
import {
  addBodyMeasurementToState,
  completeOnboardingInState,
  deleteBodyMeasurementFromState,
  resetOnboardingInState,
  updateProfileGoalsInState,
} from './appContext/progressActions';
import { useAppInfrastructure } from './appContext/useAppInfrastructure';
import { useAppMutationQueue } from './appContext/useAppMutationQueue';
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
    dismissMutationFailure,
    mutationFailure,
    pendingMutationCount,
    retryFailedMutation,
    scheduleStateMutation,
  } = useAppMutationQueue(repository);
  const {
    addFoodEntries,
    addFoodEntry,
    addMealTemplate,
    deleteFoodEntry,
    deleteMealTemplate,
    updateFoodEntry,
    updateNutritionTargets,
  } = useNutritionStateActions({ scheduleStateMutation, setState });
  const {
    addWeightEntry,
    createWeightHistoryOutboxStep,
    deleteWeightEntry,
    updateWeightEntry,
  } = useWeightHistoryActions({
    authService,
    queueStore,
    scheduleStateMutation,
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
        scheduleStateMutation({ label: 'Save custom exercise', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
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
        scheduleStateMutation({ label: 'Save workout template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
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
        scheduleStateMutation({ label: 'Update workout template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const saveTrainingProgram = useCallback(
    (program: TrainingProgram) => {
      setState((currentState) => {
        const nextState = saveTrainingProgramToState(
          currentState,
          program,
          new Date().toISOString(),
        );
        scheduleStateMutation({ label: 'Save training program', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const deleteTrainingProgram = useCallback(
    (programId: string) => {
      setState((currentState) => {
        const nextState = deleteTrainingProgramFromState(currentState, programId);
        scheduleStateMutation({ label: 'Delete training program', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const toggleTrainingProgramFavorite = useCallback(
    (programId: string) => {
      setState((currentState) => {
        const nextState = toggleTrainingProgramFavoriteInState(
          currentState,
          programId,
          new Date().toISOString(),
        );
        scheduleStateMutation({ label: 'Update training program favorite', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const deleteWorkoutTemplate = useCallback(
    (templateId: string) => {
      setState((currentState) => {
        const nextState = deleteCustomWorkoutTemplateFromState(currentState, templateId);
        scheduleStateMutation({ label: 'Delete workout template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const deleteExercise = useCallback(
    (exerciseId: string) => {
      setState((currentState) => {
        const nextState = deleteCustomExerciseFromState(currentState, exerciseId);
        scheduleStateMutation({ label: 'Delete custom exercise', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
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
        scheduleStateMutation({ label: 'Save profile goals', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const addBodyMeasurement = useCallback(
    (entry: BodyMeasurement) => {
      setState((currentState) => {
        const nextState = addBodyMeasurementToState(currentState, entry);
        scheduleStateMutation({ label: 'Save body measurement', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const deleteBodyMeasurement = useCallback(
    (entryId: string) => {
      setState((currentState) => {
        const nextState = deleteBodyMeasurementFromState(currentState, entryId);
        scheduleStateMutation({ label: 'Delete body measurement', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const saveWorkoutSession = useCallback(
    (session: WorkoutSession) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          workoutSessions: upsertWorkoutSessionById(currentState.workoutSessions, session),
        };
        scheduleStateMutation({ label: 'Save workout session', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
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
        scheduleStateMutation({
          label: 'Complete onboarding',
          nextState,
          outbox: createWeightHistoryOutboxStep('create', initialWeightEntry),
        });
        return nextState;
      });
    },
    [createWeightHistoryOutboxStep, scheduleStateMutation],
  );

  const resetOnboarding = useCallback(() => {
    setState((currentState) => {
      const nextState = resetOnboardingInState(currentState);
      scheduleStateMutation({ label: 'Reset onboarding', nextState });
      return nextState;
    });
  }, [scheduleStateMutation]);

  const deleteWorkoutSession = useCallback(
    (sessionId: string) => {
      setState((currentState) => {
        const nextState = deleteWorkoutSessionFromState(currentState, sessionId);
        scheduleStateMutation({ label: 'Delete workout session', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const updateWorkoutSession = useCallback(
    (sessionId: string, updatedSession: WorkoutSession) => {
      setState((currentState) => {
        const nextState = updateWorkoutSessionPreservingImmutableFields(
          currentState,
          sessionId,
          updatedSession,
        );
        scheduleStateMutation({ label: 'Update workout session', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation],
  );

  const replaceState = useCallback(
    (nextState: AppState) => {
      setState(nextState);
      scheduleStateMutation({ label: 'Apply synchronized data', nextState });
    },
    [scheduleStateMutation],
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
      dismissMutationFailure,
      getLastWorkoutSession,
      isRestoringState,
      mutationFailure,
      pendingMutationCount,
      replaceState,
      resetOnboarding,
      retryFailedMutation,
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
      dismissMutationFailure,
      getLastWorkoutSession,
      isRestoringState,
      mutationFailure,
      pendingMutationCount,
      replaceState,
      resetOnboarding,
      retryFailedMutation,
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
        <AppMutationFailureNotice
          failure={mutationFailure}
          onDismiss={dismissMutationFailure}
          onRetry={retryFailedMutation}
          pendingCount={pendingMutationCount}
        />
      </AppContext.Provider>
    </AuthProvider>
  );
}
