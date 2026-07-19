import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

const TAB_ICONS: Record<'Home' | 'Workouts' | 'Nutrition' | 'Progress' | 'Profile', string> = {
  Home: '🏠',
  Workouts: '🏋️',
  Nutrition: '🥗',
  Progress: '📈',
  Profile: '👤',
};

function TabIcon({ focused, label, tabColors }: { focused: boolean; label: keyof typeof TAB_ICONS; tabColors: typeof Colors.light }) {
  return (
    <View style={[styles.iconWrap, { backgroundColor: focused ? tabColors.accentSoft : tabColors.backgroundSelected }]}>
      <Text style={styles.icon}>{TAB_ICONS[label]}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
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
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" tabColors={tabColors} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Workouts" tabColors={tabColors} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Nutrition" tabColors={tabColors} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Progress" tabColors={tabColors} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" tabColors={tabColors} />,
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
