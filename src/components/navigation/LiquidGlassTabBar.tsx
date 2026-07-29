import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Brain, Dumbbell, Home, TrendingUp, Utensils, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: Home,
  workouts: Dumbbell,
  nutrition: Utensils,
  progress: TrendingUp,
  coach: Brain,
};

const VISIBLE_TABS = new Set(Object.keys(TAB_ICONS));

export function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.outerContainer,
          {
            bottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <BlurView
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
          intensity={Platform.OS === 'ios' ? 50 : 80}
          tint="systemMaterialDark"
          style={styles.glassPanel}>
          {visibleRoutes.map((route) => {
            const descriptor = descriptors[route.key];
            const options = descriptor.options;
            const isActive = state.routes[state.index]?.key === route.key;
            const Icon = TAB_ICONS[route.name];
            const label =
              typeof options.tabBarAccessibilityLabel === 'string'
                ? options.tabBarAccessibilityLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            const handlePress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                accessibilityLabel={label}
                accessibilityRole="button"
                accessibilityState={isActive ? { selected: true } : {}}
                key={route.key}
                onLongPress={handleLongPress}
                onPress={handlePress}
                style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}
                testID={options.tabBarButtonTestID}>
                {isActive ? <View style={styles.activePill} /> : null}
                <Icon
                  color={isActive ? '#ffffff' : '#8e8e93'}
                  size={24}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  outerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glassPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 64,
    borderCurve: 'continuous',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(20, 20, 20, 0.45)',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pressed: {
    opacity: 0.7,
  },
  activePill: {
    position: 'absolute',
    width: 48,
    height: 36,
    borderCurve: 'continuous',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
