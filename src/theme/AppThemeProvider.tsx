import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { Colors, type AppearanceMode, type ResolvedAppearance } from '@/constants/theme';

import { loadAppearanceMode, resolveAppearance, saveAppearanceMode } from './appearance';

export type AppThemeContextValue = {
  colors: typeof Colors.dark;
  mode: AppearanceMode;
  resolvedAppearance: ResolvedAppearance;
  setMode: (mode: AppearanceMode) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const [hydrated, setHydrated] = useState(false);
  const resolvedAppearance = resolveAppearance(mode, systemScheme);

  useEffect(() => {
    let cancelled = false;

    void loadAppearanceMode().then((storedMode) => {
      if (!cancelled) {
        setModeState(storedMode);
        setHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (mode === 'system') {
      (Appearance as any).setColorScheme(null);
    } else {
      Appearance.setColorScheme(mode);
    }

    void saveAppearanceMode(mode);
  }, [hydrated, mode]);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colors: Colors.dark,
      mode,
      resolvedAppearance,
      setMode: setModeState,
    }),
    [mode, resolvedAppearance]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
