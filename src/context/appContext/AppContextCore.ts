import { createContext, type Context, useContext } from 'react';

import type {
  AppActions,
  AppContextType,
  AppInfrastructure,
  NutritionDataState,
  WorkoutState,
} from '@/types';

export const AppContext = createContext<AppContextType | null>(null);
export const AppActionsContext = createContext<AppActions | null>(null);
export const AppInfrastructureContext = createContext<AppInfrastructure | null>(null);
export const NutritionDataStateContext = createContext<NutritionDataState | null>(null);
export const WorkoutStateContext = createContext<WorkoutState | null>(null);

const useRequiredContext = <Value>(
  context: Context<Value | null>,
  hookName: string,
): Value => {
  const value = useContext(context);

  if (!value) {
    throw new Error(`${hookName} must be used inside AppProvider`);
  }

  return value;
};

export function useAppContext() {
  return useRequiredContext(AppContext, 'useAppContext');
}

export function useAppActions() {
  return useRequiredContext(AppActionsContext, 'useAppActions');
}

export function useAppInfrastructure() {
  return useRequiredContext(AppInfrastructureContext, 'useAppInfrastructure');
}

export function useNutritionState() {
  return useRequiredContext(NutritionDataStateContext, 'useNutritionState');
}

export function useWorkoutState() {
  return useRequiredContext(WorkoutStateContext, 'useWorkoutState');
}
