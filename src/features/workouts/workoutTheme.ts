import { Colors } from '@/constants/theme';

export function useWorkoutTheme() {
  return {
    colors: Colors.dark,
    isWorkoutDarkMode: true,
  } as const;
}
