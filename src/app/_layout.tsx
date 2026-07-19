import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { AppProvider } from '@/context/AppContext';
import { AppThemeProvider, useAppTheme } from '@/theme/AppThemeProvider';

function RootNavigator() {
  const { colors, resolvedAppearance } = useAppTheme();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousBody = document.body.style.backgroundColor;
    const previousHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = colors.background;
    document.documentElement.style.backgroundColor = colors.background;

    return () => {
      document.body.style.backgroundColor = previousBody;
      document.documentElement.style.backgroundColor = previousHtml;
    };
  }, [colors.background]);

  const navigationTheme = useMemo(
    () => ({
      ...(resolvedAppearance === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(resolvedAppearance === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        card: colors.surfacePrimary,
        border: colors.borderSubtle,
        primary: colors.accent,
        text: colors.textPrimary,
        notification: colors.error,
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
            contentStyle: { backgroundColor: colors.background },
            headerBackTitle: 'Back',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.surfacePrimary },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { color: colors.textPrimary },
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
