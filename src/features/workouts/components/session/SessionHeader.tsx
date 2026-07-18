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
      paddingBottom: 40,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: '#0A84FF',
      borderCurve: 'continuous',
      borderRadius: 17,
      height: 34,
      justifyContent: 'center',
      minWidth: 80,
      paddingHorizontal: Spacing.four,
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
      fontWeight: '500',
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
      fontSize: 30,
      fontWeight: '400',
      lineHeight: 30,
    },
    overflowButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    overflowLabel: {
      color: '#0A84FF',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1,
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
      marginTop: 60,
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
      gap: Spacing.one,
      minHeight: 48,
      paddingHorizontal: Spacing.four,
    },
    topSpacer: {
      flex: 1,
    },
  });
