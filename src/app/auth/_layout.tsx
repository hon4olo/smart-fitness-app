import { Stack } from 'expo-router';

import { useAppTheme } from '@/theme/AppThemeProvider';

export default function AuthLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}
