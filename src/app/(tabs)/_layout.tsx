import { Tabs } from 'expo-router';

import { useAppTheme } from '@/theme/AppThemeProvider';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.surfacePrimary,
          borderTopColor: colors.divider,
          borderTopWidth: 0.5,
          elevation: 0,
          height: 56,
          paddingBottom: 4,
          paddingTop: 4,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="labs" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="track" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="eat" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
