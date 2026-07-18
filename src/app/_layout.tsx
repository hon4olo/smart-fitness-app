import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { Colors } from '@/constants/theme';
import { AppProvider } from '@/context/AppContext';
import { AppThemeProvider, useAppTheme } from '@/theme/AppThemeProvider';

function RootNavigator() {
  const { colors, resolvedAppearance } = useAppTheme();
  const pathname = usePathname();
  const isWorkoutFlow = pathname.startsWith('/workouts') || pathname.startsWith('/workout-session');
  const workoutColors = isWorkoutFlow ? Colors.dark : colors;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousBody = document.body.style.backgroundColor;
    const previousHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = workoutColors.background;
    document.documentElement.style.backgroundColor = workoutColors.background;

    return () => {
      document.body.style.backgroundColor = previousBody;
      document.documentElement.style.backgroundColor = previousHtml;
    };
  }, [workoutColors.background]);

  const navigationTheme = useMemo(
    () => ({
      ...(resolvedAppearance === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(resolvedAppearance === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: workoutColors.background,
        card: workoutColors.surfacePrimary,
        border: workoutColors.borderSubtle,
        primary: workoutColors.accent,
        text: workoutColors.textPrimary,
        notification: workoutColors.error,
      },
    }),
    [colors, resolvedAppearance]
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <AppProvider>
        <StatusBar style={resolvedAppearance === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: workoutColors.background },
            headerBackTitle: 'Back',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: workoutColors.surfacePrimary },
            headerTintColor: workoutColors.textPrimary,
            headerTitleStyle: { color: workoutColors.textPrimary },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/add-food" options={{ headerShown: false }} />
          <Stack.Screen name="nutrition/date-picker" options={{ headerShown: false }} />
          <Stack.Screen name="workout-session" options={{ headerShown: false }} />
          <Stack.Screen name="workout-session/exercises" options={{ headerShown: false }} />
          <Stack.Screen name="workout-session-finish" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/builder" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/program/[programId]" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/routine/new" options={{ headerShown: false }} />
          <Stack.Screen name="workouts/template/[workoutId]" options={{ headerShown: false }} />
        </Stack>
      </AppProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}
