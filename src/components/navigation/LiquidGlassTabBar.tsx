import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Brain, Dumbbell, Home, TrendingUp, Utensils, type LucideIcon } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: Home,
  workouts: Dumbbell,
  nutrition: Utensils,
  progress: TrendingUp,
  coach: Brain,
};

const VISIBLE_TABS = new Set(Object.keys(TAB_ICONS));
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_SPRING = {
  damping: 18,
  stiffness: 340,
  mass: 0.55,
} as const;

const ACTIVE_SPRING = {
  damping: 20,
  stiffness: 260,
  mass: 0.7,
} as const;

type TabButtonProps = {
  accessibilityLabel: string;
  isActive: boolean;
  Icon: LucideIcon;
  onLongPress: () => void;
  onPress: () => void;
  testID?: string;
};

const TabButton = memo(function TabButton({
  accessibilityLabel,
  isActive,
  Icon,
  onLongPress,
  onPress,
  testID,
}: TabButtonProps) {
  const pressScale = useSharedValue(1);
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  activeProgress.value = withSpring(isActive ? 1 : 0, ACTIVE_SPRING);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [{ scale: 0.82 + activeProgress.value * 0.18 }],
  }));

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.92, PRESS_SPRING);
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  }, [pressScale]);

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={isActive ? { selected: true } : { selected: false }}
      onLongPress={onLongPress}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedButtonStyle]}
      testID={testID}>
      <Animated.View pointerEvents="none" style={[styles.activePill, animatedPillStyle]} />
      <Icon
        color={isActive ? '#FFFFFF' : '#8F8F98'}
        size={24}
        strokeWidth={2}
      />
    </AnimatedPressable>
  );
});

export function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        pointerEvents="box-none"
        style={[
          styles.outerContainer,
          {
            bottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <View pointerEvents="none" style={styles.shadowWide} />
        <View pointerEvents="none" style={styles.shadowTight} />
        <BlurView
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
          intensity={Platform.OS === 'ios' ? 52 : 76}
          tint="systemMaterialDark"
          style={styles.glassPanel}>
          <View pointerEvents="none" style={styles.topHighlight} />
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
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabButton
                accessibilityLabel={label}
                Icon={Icon}
                isActive={isActive}
                key={route.key}
                onLongPress={handleLongPress}
                onPress={handlePress}
                testID={options.tabBarButtonTestID}
              />
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
  },
  shadowWide: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -10,
    height: 54,
    borderCurve: 'continuous',
    borderRadius: 28,
    backgroundColor: 'rgba(8, 8, 12, 0.34)',
    shadowColor: '#08080C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 10,
  },
  shadowTight: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: -4,
    height: 48,
    borderCurve: 'continuous',
    borderRadius: 24,
    backgroundColor: 'rgba(10, 10, 14, 0.18)',
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  glassPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 64,
    borderCurve: 'continuous',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: Platform.select({
      android: 'rgba(20, 20, 24, 0.90)',
      default: 'rgba(18, 18, 22, 0.56)',
    }),
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    width: 48,
    height: 36,
    borderCurve: 'continuous',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.19)',
  },
});
