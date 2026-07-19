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
  reps,
  sets,
  volume,
}: SessionHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <View style={[styles.topRow, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.flatIconButton, pressed && styles.pressed]}>
          <View style={styles.chevronDown} />
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.flatIconButton, pressed && styles.pressed]}>
          <View style={styles.stopwatchIcon}>
            <View style={styles.stopwatchStem} />
            <View style={styles.stopwatchHand} />
          </View>
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

      {sets > 0 ? (
        <View style={styles.statsRow}>
          <Stat label="Sets" value={`${sets}`} />
          <Stat label="Reps" value={`${reps}`} />
          <Stat label="Volume" value={`${Math.round(volume).toLocaleString()} kg`} />
        </View>
      ) : null}

      <Text selectable style={styles.timer}>
        {elapsedLabel}
      </Text>
    </View>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text selectable style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      backgroundColor: '#000000',
      paddingBottom: 52,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: '#0A84FF',
      borderCurve: 'continuous',
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      width: 78,
    },
    finishButtonDisabled: {
      opacity: 0.42,
    },
    finishButtonPressed: {
      opacity: 0.9,
    },
    finishLabel: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 18,
      textAlign: 'center',
    },
    finishLabelDisabled: {
      color: colors.textSecondary,
    },
    flatIconButton: {
      alignItems: 'center',
      height: 50,
      justifyContent: 'center',
      width: 24,
    },
    chevronDown: {
      borderBottomColor: colors.textPrimary,
      borderBottomWidth: 1.75,
      borderRightColor: colors.textPrimary,
      borderRightWidth: 1.75,
      height: 15,
      marginTop: -7,
      transform: [{ rotate: '45deg' }],
      width: 15,
    },
    overflowButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    overflowLabel: {
      color: '#0A84FF',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1.2,
      lineHeight: 18,
    },
    pressed: {
      opacity: 0.72,
    },
    stat: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
    },
    statLabel: {
      color: '#5F5F66',
      fontSize: 12,
      lineHeight: 16,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 16,
      fontVariant: ['tabular-nums'],
      lineHeight: 22,
    },
    timer: {
      color: colors.textPrimary,
      fontSize: 32,
      fontVariant: ['tabular-nums'],
      fontWeight: '700',
      lineHeight: 40,
      marginTop: 48,
      textAlign: 'center',
    },
    stopwatchHand: {
      backgroundColor: colors.textPrimary,
      height: 7,
      left: 9,
      position: 'absolute',
      top: 4,
      transform: [{ rotate: '0deg' }],
      width: 1.5,
    },
    stopwatchIcon: {
      borderColor: colors.textPrimary,
      borderRadius: 999,
      borderWidth: 1.75,
      height: 21,
      position: 'relative',
      width: 21,
    },
    stopwatchStem: {
      backgroundColor: colors.textPrimary,
      height: 5,
      left: 8,
      position: 'absolute',
      top: -7,
      width: 4,
    },
    topRow: {
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 24,
      minHeight: 50,
      paddingLeft: 16,
      paddingRight: 24,
    },
    topSpacer: {
      flex: 1,
    },
  });
