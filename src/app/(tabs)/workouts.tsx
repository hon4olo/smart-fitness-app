import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import WorkoutsScreen from '@/features/workouts/screens/WorkoutsScreen';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function WorkoutsRoute() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <WorkoutsScreen />
      <Pressable
        accessibilityHint="Opens completed workout history and filters"
        accessibilityLabel="Workout history"
        accessibilityRole="button"
        onPress={() => router.push('/workout-history')}
        style={({ pressed }) => [
          styles.historyButton,
          { bottom: insets.bottom + 58 },
          pressed && styles.pressed,
        ]}>
        <Text style={styles.historyIcon}>↺</Text>
        <Text style={styles.historyLabel}>History</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    historyButton: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      left: Spacing.three,
      minHeight: 42,
      paddingHorizontal: Spacing.three,
      position: 'absolute',
      zIndex: 20,
    },
    historyIcon: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 20,
    },
    historyLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: '900',
      lineHeight: Typography.label.lineHeight,
    },
    pressed: {
      opacity: 0.68,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
  });
