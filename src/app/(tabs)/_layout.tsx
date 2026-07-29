import { Tabs } from 'expo-router';

import { LiquidGlassTabBar } from '@/components/navigation/LiquidGlassTabBar';
import { useLocalization } from '@/localization';

export default function TabsLayout() {
  const { t } = useLocalization();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <LiquidGlassTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: t('tabs.workouts'),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs.nutrition'),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t('tabs.coach'),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="labs" options={{ href: null }} />
      <Tabs.Screen name="track" options={{ href: null }} />
      <Tabs.Screen name="eat" options={{ href: null }} />
    </Tabs>
  );
}
