import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/context/AppContext';

export default function TabLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: '#090B0F' },
            headerStyle: { backgroundColor: '#090B0F' },
            headerTintColor: '#F5F7FA',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout-session"
            options={{
              headerBackTitle: 'Back',
              title: 'Workout Session',
            }}
          />
        </Stack>
      </AppProvider>
    </ThemeProvider>
  );
}
