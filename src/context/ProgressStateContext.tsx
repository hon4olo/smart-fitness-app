import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

import { useAppContext } from './AppContext';
import type { AppState } from '@/types';

export type ProgressState = Pick<AppState, 'bodyMeasurements' | 'weightHistory'>;

const ProgressStateContext = createContext<ProgressState | null>(null);

export function ProgressStateProvider({ children }: PropsWithChildren) {
  const { bodyMeasurements, weightHistory } = useAppContext();
  const value = useMemo<ProgressState>(
    () => ({ bodyMeasurements, weightHistory }),
    [bodyMeasurements, weightHistory],
  );

  return (
    <ProgressStateContext.Provider value={value}>
      {children}
    </ProgressStateContext.Provider>
  );
}

export function useProgressState() {
  const value = useContext(ProgressStateContext);

  if (!value) {
    throw new Error('useProgressState must be used inside ProgressStateProvider');
  }

  return value;
}
