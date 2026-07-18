import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type SessionHeaderProps = {
  elapsedLabel: string;
  finishDisabled?: boolean;
  onBack: () => void;
  onFinish: () => void;
  onOverflow: () => void;
  reps: number;
  sets: number;
  title: string;
  volume: number;
};

export const SessionHeader = memo(function SessionHeader({
  elapsedLabel,
  finishDisabled = false,
  onBack,
  onFinish,
  onOverflow,
}: SessionHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <View style={[styles.topRow, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.flatIconButton, pressed && styles.pressed]}>
          <Text style={styles.flatIconLabel}>⌄</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.flatIconButton, pressed && styles.pressed]}>
          <Text style={styles.timerIcon}>⏱</Text>
        </Pressable>
        <View style={styles.topSpacer} />
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onOverflow} style={({ pressed }) => [styles.overflowButton, pressed && styles.pressed]}>
          <Text style={styles.overflowLabel}>•••</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: finishDisabled }}
          disabled={finishDisabled}
          onPress={onFinish}
          style={({ pressed }) => [styles.finishButton, finishDisabled && styles.finishButtonDisabled, pressed && !finishDisabled && styles.finishButtonPressed]}>
          <Text style={[styles.finishLabel, finishDisabled && styles.finishLabelDisabled]}>Finish</Text>
        </Pressable>
      </View>

      <Text selectable style={styles.timer}>
        {elapsedLabel}
      </Text>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      backgroundColor: '#000000',
      paddingBottom: 42,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: '#0A8DFF',
      borderCurve: 'continuous',
      borderRadius: 18,
      height: 48,
      justifyContent: 'center',
      minWidth: 88,
      paddingHorizontal: Spacing.three,
    },
    finishButtonDisabled: {
      opacity: 0.42,
    },
    finishButtonPressed: {
      opacity: 0.9,
    },
    finishLabel: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      textAlign: 'center',
    },
    finishLabelDisabled: {
      color: colors.textSecondary,
    },
    flatIconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    flatIconLabel: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: '600',
      lineHeight: 34,
    },
    overflowButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    overflowLabel: {
      color: '#0A8DFF',
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1,
    },
    pressed: {
      opacity: 0.72,
    },
    timer: {
      color: colors.textPrimary,
      fontSize: 38,
      fontVariant: ['tabular-nums'],
      fontWeight: '700',
      lineHeight: 46,
      marginTop: 58,
      textAlign: 'center',
    },
    timerIcon: {
      color: colors.textPrimary,
      fontSize: 27,
      lineHeight: 30,
    },
    topRow: {
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 58,
      paddingHorizontal: Spacing.three,
    },
    topSpacer: {
      flex: 1,
    },
  });
