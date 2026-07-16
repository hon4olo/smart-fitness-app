import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

import type { AppearanceMode, ResolvedAppearance } from '@/constants/theme';

export const APPEARANCE_STORAGE_KEY = 'smart-fitness-app.appearance-mode';

export const APPEARANCE_LABELS: Record<AppearanceMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export const resolveAppearance = (
  mode: AppearanceMode,
  systemScheme: ResolvedAppearance = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
): ResolvedAppearance => (mode === 'system' ? systemScheme : mode);

export const loadAppearanceMode = async (): Promise<AppearanceMode> => {
  const stored = await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
};

export const saveAppearanceMode = async (mode: AppearanceMode): Promise<void> => {
  await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
};
