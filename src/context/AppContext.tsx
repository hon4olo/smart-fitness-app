import { type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { AuthProvider } from '@/auth';
import { defaultState as defaultAppState } from '@/data/defaults';
import { getLastWorkoutSession as getLastWorkoutSessionFromState } from '@/lib/appState';
import type {
  AppContextType,
  AppState,
  BodyMeasurement,
  ProfileGoalType,
  ProfileTrainingExperience,
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
  updateRegistrationProfileInState,
} from './appContext/progressActions';
import { useAppInfrastructure } from './appContext/useAppInfrastructure';
import { useAppMutationQueue } from './appContext/useAppMutationQueue';
import { useNutritionStateActions } from './appContext/useNutritionStateActions';
import { useWeightHistoryActions } from './appContext/useWeightHistoryActions';
import { useWorkoutStateActions } from './appContext/useWorkoutStateActions';

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
  const {
    addExercise,
    addWorkoutTemplate,
    deleteExercise,
    deleteTrainingProgram,
    deleteWorkoutSession,
    deleteWorkoutTemplate,
    saveTrainingProgram,
    saveWorkoutSession,
    toggleTrainingProgramFavorite,
    updateWorkoutSession,
    updateWorkoutTemplate,
  } = useWorkoutStateActions({ scheduleStateMutation, setState });

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

  const updateRegistrationProfile = useCallback(
    (profile: { height: string; trainingExperience: ProfileTrainingExperience }) => {
      setState((currentState) => {
        const nextState = updateRegistrationProfileInState(currentState, profile);
        scheduleStateMutation({ label: 'Save registration profile', nextState });
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

  const completeOnboarding = useCallback(
    (setup: {
      age: number;
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'high' | 'very_high';
      currentWeight: number;
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
      updateRegistrationProfile,
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
      updateRegistrationProfile,
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
