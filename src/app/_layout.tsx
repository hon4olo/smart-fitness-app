import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { AppProvider } from '@/context/AppContext';
import { LocalizationProvider, useLocalization } from '@/localization';
import { RootErrorFallback } from '@/observability/RootErrorFallback';
import { AppThemeProvider, useAppTheme } from '@/theme/AppThemeProvider';
import { UnitPreferencesProvider } from '@/units';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <RootErrorFallback error={error} retry={retry} />;
}

function RootNavigator() {
  const { colors, resolvedAppearance } = useAppTheme();
  const { t } = useLocalization();

  useEffect(() => {
    if (typeof document === 'undefined') return;
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
    [colors, resolvedAppearance],
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <AppProvider>
        <StatusBar style={resolvedAppearance === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerBackTitle: t('common.back'),
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.surfacePrimary },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { color: colors.textPrimary },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="account/sessions" options={{ headerShown: false }} />
          <Stack.Screen name="settings/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings/social-profile" options={{ headerShown: false }} />
          <Stack.Screen name="social/index" options={{ headerShown: false }} />
          <Stack.Screen name="social/relationships" options={{ headerShown: false }} />
          <Stack.Screen name="social/[username]" options={{ headerShown: false }} />
          <Stack.Screen
            name="social/share-workout/[sessionId]"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="exercises/[exerciseId]" options={{ headerShown: false }} />
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

function RootLayout() {
  return (
    <AppThemeProvider>
      <LocalizationProvider>
        <UnitPreferencesProvider>
          <RootNavigator />
        </UnitPreferencesProvider>
      </LocalizationProvider>
    </AppThemeProvider>
  );
}

export default RootLayout;
