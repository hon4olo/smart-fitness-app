import { createContext, useContext } from 'react';

import type { AppActions, AppContextType, AppInfrastructure } from '@/types';

export const AppContext = createContext<AppContextType | null>(null);
export const AppActionsContext = createContext<AppActions | null>(null);
export const AppInfrastructureContext = createContext<AppInfrastructure | null>(null);

const useRequiredContext = <Value>(
  context: React.Context<Value | null>,
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
