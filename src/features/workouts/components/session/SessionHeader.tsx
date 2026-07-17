import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

type SessionHeaderProps = {
  elapsedLabel: string;
  finishDisabled?: boolean;
  onBack: () => void;
  onFinish: () => void;
  onOverflow: () => void;
  title: string;
};

export const SessionHeader = memo(function SessionHeader({ elapsedLabel, finishDisabled = false, onBack, onFinish, onOverflow, title }: SessionHeaderProps) {
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle, paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconLabel}>‹</Text>
        </Pressable>
        <Text selectable style={styles.timer}>
          {elapsedLabel}
        </Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onOverflow} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconLabel}>⋯</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: finishDisabled }} disabled={finishDisabled} onPress={onFinish} style={({ pressed }) => [styles.finishButton, finishDisabled && styles.finishButtonDisabled, pressed && !finishDisabled && styles.finishButtonPressed]}>
          <Text style={[styles.finishLabel, finishDisabled && styles.finishLabelDisabled]}>Finish</Text>
        </Pressable>
      </View>
      <Text selectable style={styles.title}>
        {title}
      </Text>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: 6,
      paddingHorizontal: Spacing.three,
      paddingBottom: Spacing.two,
    },
    finishButton: {
      backgroundColor: '#36D6D2',
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: 8,
    },
    finishButtonDisabled: {
      opacity: 0.42,
    },
    finishButtonPressed: {
      opacity: 0.9,
    },
    finishLabel: {
      color: '#102726',
      fontSize: 13,
      fontWeight: '900',
    },
    finishLabelDisabled: {
      color: colors.textSecondary,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    iconLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    timer: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontVariant: ['tabular-nums'],
      fontWeight: '900',
      letterSpacing: -0.2,
      textAlign: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.3,
      lineHeight: 26,
    },
  });
