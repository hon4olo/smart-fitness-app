import { Tabs } from 'expo-router';
import { Text, View, type ViewStyle } from 'react-native';
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

function TabIcon({ focused, label }: { focused: boolean; label: keyof typeof TAB_ICONS }) {
  return (
    <View style={[styles.iconWrap, focused ? styles.iconWrapFocused : styles.iconWrapIdle]}>
      <Text style={styles.icon}>{TAB_ICONS[label]}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
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
          backgroundColor: colors.surfacePrimary,
          borderTopColor: colors.divider,
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
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Workouts" />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Nutrition" />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Progress" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" />,
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
  iconWrapFocused: {
    backgroundColor: Colors.dark.accentSoft,
  },
  iconWrapIdle: {
    backgroundColor: Colors.dark.backgroundSelected,
  } satisfies ViewStyle,
};
