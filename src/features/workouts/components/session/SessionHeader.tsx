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
  title,
  volume,
}: SessionHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showStats = sets > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle, paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.topRow}>
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

      {showStats ? (
        <View style={styles.statsRow}>
          <Stat label="Sets" value={`${sets}`} />
          <Stat label="Reps" value={`${reps}`} />
          <Stat label="Volume" value={`${Math.round(volume).toLocaleString()} kg`} />
        </View>
      ) : null}

      <Text selectable style={[styles.timer, showStats && styles.timerWithStats]}>
        {elapsedLabel}
      </Text>
      {!showStats ? (
        <Text selectable numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : null}
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: Spacing.three,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: '#0A8DFF',
      borderCurve: 'continuous',
      borderRadius: 18,
      height: 50,
      justifyContent: 'center',
      minWidth: 94,
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
      fontSize: 16,
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
      fontSize: 32,
      fontWeight: '600',
      lineHeight: 32,
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
    stat: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 20,
    },
    statsRow: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingTop: Spacing.three,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontVariant: ['tabular-nums'],
      lineHeight: 23,
    },
    timer: {
      color: colors.textPrimary,
      fontSize: 48,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
      lineHeight: 58,
      textAlign: 'center',
    },
    timerIcon: {
      color: colors.textPrimary,
      fontSize: 27,
      lineHeight: 30,
    },
    timerWithStats: {
      marginTop: Spacing.five,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 34,
    },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    topSpacer: {
      flex: 1,
    },
  });
