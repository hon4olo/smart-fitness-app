import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import { useAppContext } from '@/context/AppContext';
import type { AppState } from '@/types';

export type ProfileDataState = Pick<AppState, 'onboardingCompleted' | 'profile'>;

const ProfileDataStateContext = createContext<ProfileDataState | null>(null);

export function ProfileStateProvider({ children }: PropsWithChildren) {
  const { onboardingCompleted, profile } = useAppContext();
  const value = useMemo<ProfileDataState>(
    () => ({ onboardingCompleted, profile }),
    [onboardingCompleted, profile],
  );

  return (
    <ProfileDataStateContext.Provider value={value}>
      {children}
    </ProfileDataStateContext.Provider>
  );
}

export function useProfileState() {
  const value = useContext(ProfileDataStateContext);
  if (!value) {
    throw new Error('useProfileState must be used inside ProfileStateProvider');
  }
  return value;
}
