import { ensureUuid } from '@/lib/ids';
import type { AppState, BodyMeasurement, ProfileGoalType, WeightEntry } from '@/types';

export type ProfileGoalsUpdate = {
  targetWeight: number;
  goalType: ProfileGoalType;
  weeklyWeightChangeGoal: number;
  trainingDaysPerWeek: number;
};

export type OnboardingSetup = {
  currentWeight: number;
  targetWeight: number;
  goalType: ProfileGoalType;
  trainingDaysPerWeek: number;
};

export type InitialWeightEntryInput = {
  id: string;
  date: string;
  createdAt: string;
};

export function updateProfileGoalsInState(
  currentState: AppState,
  goals: ProfileGoalsUpdate,
): AppState {
  return {
    ...currentState,
    profile: {
      ...currentState.profile,
      ...goals,
    },
  };
}

export function addWeightEntryToState(
  currentState: AppState,
  entry: WeightEntry,
): AppState {
  return {
    ...currentState,
    weightHistory: [entry, ...currentState.weightHistory],
  };
}

export function updateWeightEntryInState(
  currentState: AppState,
  entryId: string,
  entry: WeightEntry,
): AppState {
  const index = currentState.weightHistory.findIndex((item) => item.id === entryId);

  if (index < 0) {
    return currentState;
  }

  const nextHistory = [...currentState.weightHistory];
  nextHistory[index] = entry;

  return {
    ...currentState,
    weightHistory: nextHistory,
  };
}

export function deleteWeightEntryFromState(
  currentState: AppState,
  entryId: string,
): AppState {
  return {
    ...currentState,
    weightHistory: currentState.weightHistory.filter((item) => item.id !== entryId),
  };
}

export function addBodyMeasurementToState(
  currentState: AppState,
  entry: BodyMeasurement,
): AppState {
  return {
    ...currentState,
    bodyMeasurements: [entry, ...currentState.bodyMeasurements],
  };
}

export function deleteBodyMeasurementFromState(
  currentState: AppState,
  entryId: string,
): AppState {
  return {
    ...currentState,
    bodyMeasurements: currentState.bodyMeasurements.filter((entry) => entry.id !== entryId),
  };
}

export function completeOnboardingInState(
  currentState: AppState,
  setup: OnboardingSetup,
  initialWeightInput: InitialWeightEntryInput,
): { nextState: AppState; initialWeightEntry: WeightEntry } {
  const initialWeightEntry: WeightEntry = {
    id: ensureUuid(initialWeightInput.id),
    date: initialWeightInput.date,
    weight: setup.currentWeight,
    createdAt: initialWeightInput.createdAt,
  };

  return {
    initialWeightEntry,
    nextState: {
      ...currentState,
      onboardingCompleted: true,
      profile: {
        ...currentState.profile,
        targetWeight: setup.targetWeight,
        goalType: setup.goalType,
        weeklyWeightChangeGoal: currentState.profile.weeklyWeightChangeGoal,
        trainingDaysPerWeek: setup.trainingDaysPerWeek,
        weight: `${setup.currentWeight.toFixed(1)} kg`,
      },
      weightHistory: [initialWeightEntry, ...currentState.weightHistory],
    },
  };
}

export function resetOnboardingInState(currentState: AppState): AppState {
  return {
    ...currentState,
    onboardingCompleted: false,
  };
}
