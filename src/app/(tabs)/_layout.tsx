import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

const TAB_ICONS = {
  home: '🏠',
  workouts: '🏋️',
  nutrition: '🥗',
  progress: '📈',
  profile: '👤',
} as const;

type TabIconName = keyof typeof TAB_ICONS;

function TabIcon({
  focused,
  name,
  tabColors,
}: {
  focused: boolean;
  name: TabIconName;
  tabColors: typeof Colors.light;
}) {
  return (
    <View
      style={[
        styles.iconWrap,
        { backgroundColor: focused ? tabColors.accentSoft : tabColors.backgroundSelected },
      ]}>
      <Text style={styles.icon}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
  const tabColors = colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabColors.accent,
        tabBarInactiveTintColor: tabColors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 12,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: tabColors.surfacePrimary,
          borderTopColor: tabColors.divider,
          borderTopWidth: 0.5,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" tabColors={tabColors} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: t('tabs.workouts'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="workouts" tabColors={tabColors} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs.nutrition'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="nutrition" tabColors={tabColors} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="progress" tabColors={tabColors} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="profile" tabColors={tabColors} />
          ),
        }}
      />
      <Tabs.Screen name="coach" options={{ href: null }} />
      <Tabs.Screen name="labs" options={{ href: null }} />
      <Tabs.Screen name="track" options={{ href: null }} />
      <Tabs.Screen name="eat" options={{ href: null }} />
    </Tabs>
  );
}

const styles = {
  icon: {
    fontSize: 16,
    lineHeight: 18,
  },
  iconWrap: {
    alignItems: 'center' as const,
    borderCurve: 'continuous' as const,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center' as const,
    width: 24,
  },
};
