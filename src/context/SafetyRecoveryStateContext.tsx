import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import { useAppContext } from '@/context/AppContext';
import type { AppState } from '@/types';

export type SafetyRecoveryState = Pick<AppState, 'recoveryCheckIns' | 'userLimitations'>;

const SafetyRecoveryStateContext = createContext<SafetyRecoveryState | null>(null);

export function SafetyRecoveryStateProvider({ children }: PropsWithChildren) {
  const { recoveryCheckIns, userLimitations } = useAppContext();
  const value = useMemo<SafetyRecoveryState>(
    () => ({ recoveryCheckIns, userLimitations }),
    [recoveryCheckIns, userLimitations],
  );

  return (
    <SafetyRecoveryStateContext.Provider value={value}>
      {children}
    </SafetyRecoveryStateContext.Provider>
  );
}

export function useSafetyRecoveryState() {
  const value = useContext(SafetyRecoveryStateContext);
  if (!value) {
    throw new Error(
      'useSafetyRecoveryState must be used inside SafetyRecoveryStateProvider',
    );
  }
  return value;
}
