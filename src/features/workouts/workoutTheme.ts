import { useAppTheme } from '@/theme/AppThemeProvider';

export function useWorkoutTheme() {
  const { colors, resolvedAppearance } = useAppTheme();

  return {
    colors,
    isWorkoutDarkMode: resolvedAppearance === 'dark',
  } as const;
}
