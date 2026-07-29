import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient,
  Path,
  Skia,
  usePathInterpolation,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Brain, Dumbbell, Home, TrendingUp, Utensils, type LucideIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: Home,
  workouts: Dumbbell,
  nutrition: Utensils,
  progress: TrendingUp,
  coach: Brain,
};

const VISIBLE_TABS = new Set(Object.keys(TAB_ICONS));
const TAB_COUNT = Object.keys(TAB_ICONS).length;
const PANEL_HEIGHT = 64;
const PANEL_RADIUS = 32;
const DEFAULT_PANEL_WIDTH = 340;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_SPRING = {
  damping: 18,
  stiffness: 340,
  mass: 0.55,
} as const;

const MORPH_SPRING = {
  damping: 19,
  stiffness: 235,
  mass: 0.72,
  overshootClamping: false,
} as const;

type TabButtonProps = {
  accessibilityLabel: string;
  isActive: boolean;
  Icon: LucideIcon;
  onLongPress: () => void;
  onPress: () => void;
  testID?: string;
};

type LiquidGeometryProps = {
  activeIndex: number;
  width: number;
};

function makePanelPath(width: number): SkPath {
  const right = width;
  const bottom = PANEL_HEIGHT;
  const radius = PANEL_RADIUS;
  const path = Skia.Path.MakeFromSVGString(
    `M ${radius} 0 H ${right - radius} ` +
      `C ${right - 12} 0 ${right} 12 ${right} ${radius} ` +
      `V ${bottom - radius} C ${right} ${bottom - 12} ${right - 12} ${bottom} ${right - radius} ${bottom} ` +
      `H ${radius} C 12 ${bottom} 0 ${bottom - 12} 0 ${bottom - radius} ` +
      `V ${radius} C 0 12 12 0 ${radius} 0 Z`,
  );

  if (!path) {
    throw new Error('Unable to create Skia panel path');
  }

  return path;
}

function makeBlobPath(width: number, index: number): SkPath {
  const tabWidth = width / TAB_COUNT;
  const centerX = tabWidth * (index + 0.5);
  const centerY = PANEL_HEIGHT / 2;
  const horizontalRadius = Math.min(30, tabWidth * 0.42);
  const verticalRadius = 20;
  const organicBias = index % 2 === 0 ? 1.8 : -1.8;

  const left = centerX - horizontalRadius;
  const right = centerX + horizontalRadius;
  const top = centerY - verticalRadius;
  const bottom = centerY + verticalRadius;

  const path = Skia.Path.MakeFromSVGString(
    `M ${centerX} ${top} ` +
      `C ${centerX + 13 + organicBias} ${top - 1} ${right + 1} ${centerY - 10} ${right} ${centerY} ` +
      `C ${right - 1} ${centerY + 11} ${centerX + 15 - organicBias} ${bottom + 1} ${centerX} ${bottom} ` +
      `C ${centerX - 15 - organicBias} ${bottom + 1} ${left + 1} ${centerY + 11} ${left} ${centerY} ` +
      `C ${left - 1} ${centerY - 10} ${centerX - 13 + organicBias} ${top - 1} ${centerX} ${top} Z`,
  );

  if (!path) {
    throw new Error('Unable to create Skia blob path');
  }

  return path;
}

const TabButton = memo(function TabButton({
  accessibilityLabel,
  isActive,
  Icon,
  onLongPress,
  onPress,
  testID,
}: TabButtonProps) {
  const pressScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
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
      accessibilityState={{ selected: isActive }}
      onLongPress={onLongPress}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedButtonStyle]}
      testID={testID}>
      <Icon color={isActive ? '#FFFFFF' : '#8F8F98'} size={24} strokeWidth={2} />
    </AnimatedPressable>
  );
});

function LiquidGeometry({ activeIndex, width }: LiquidGeometryProps) {
  const activePosition = useSharedValue(activeIndex);
  const panelPath = useMemo(() => makePanelPath(width), [width]);
  const blobPaths = useMemo(
    () => Array.from({ length: TAB_COUNT }, (_, index) => makeBlobPath(width, index)),
    [width],
  );

  useEffect(() => {
    activePosition.value = withSpring(activeIndex, MORPH_SPRING);
  }, [activeIndex, activePosition]);

  const blobPath = usePathInterpolation(
    activePosition,
    [0, 1, 2, 3, 4],
    blobPaths,
  );

  return (
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Group>
        <Path path={panelPath} color="rgba(6, 6, 10, 0.38)">
          <BlurMask blur={18} style="outer" />
        </Path>
        <Path path={panelPath} color="rgba(18, 18, 22, 0.54)" />
        <Path
          path={panelPath}
          color="rgba(255, 255, 255, 0.16)"
          style="stroke"
          strokeWidth={0.75}
        />
        <Path
          path={panelPath}
          color="rgba(255, 255, 255, 0.08)"
          style="stroke"
          strokeWidth={0.35}
        />
      </Group>

      <Path path={blobPath} color="rgba(255, 255, 255, 0.13)">
        <BlurMask blur={5} style="solid" />
      </Path>
      <Path path={blobPath} color="rgba(255, 255, 255, 0.10)">
        <LinearGradient
          start={vec(0, 8)}
          end={vec(width, PANEL_HEIGHT)}
          colors={['rgba(255,255,255,0.19)', 'rgba(255,255,255,0.07)']}
        />
      </Path>
      <Path
        path={blobPath}
        color="rgba(255, 255, 255, 0.22)"
        style="stroke"
        strokeWidth={0.7}
      />
    </Canvas>
  );
}

export function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.has(route.name));
  const activeRouteKey = state.routes[state.index]?.key;
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === activeRouteKey),
  );

  const handlePanelLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setPanelWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) > 0.5 ? nextWidth : currentWidth,
    );
  }, []);

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
        <View onLayout={handlePanelLayout} style={styles.glassShell}>
          <BlurView
            blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
            intensity={Platform.OS === 'ios' ? 52 : 76}
            pointerEvents="none"
            tint="systemMaterialDark"
            style={StyleSheet.absoluteFill}
          />
          <LiquidGeometry activeIndex={activeVisibleIndex} width={panelWidth} />
          <View style={styles.tabRow}>
            {visibleRoutes.map((route) => {
              const descriptor = descriptors[route.key];
              const options = descriptor.options;
              const isActive = activeRouteKey === route.key;
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
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
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
    backgroundColor: 'rgba(8, 8, 12, 0.28)',
    shadowColor: '#08080C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
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
    backgroundColor: 'rgba(10, 10, 14, 0.16)',
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 6,
  },
  glassShell: {
    width: '100%',
    height: PANEL_HEIGHT,
    borderCurve: 'continuous',
    borderRadius: PANEL_RADIUS,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      android: 'rgba(20, 20, 24, 0.90)',
      default: 'rgba(18, 18, 22, 0.32)',
    }),
  },
  tabRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
