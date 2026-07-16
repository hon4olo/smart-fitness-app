import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionHeaderProps = {
  completedLabel: string;
  elapsedLabel: string;
  nextExerciseName?: string;
  progressPercent: number;
  workoutTitle: string;
};

export function WorkoutSessionHeader({ completedLabel, elapsedLabel, nextExerciseName, progressPercent, workoutTitle }: WorkoutSessionHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <AppCard style={styles.card}>
      <View style={styles.topRow}>
        <Text numberOfLines={2} selectable style={styles.title}>
          {workoutTitle}
        </Text>
        <Text selectable style={styles.elapsedLabel}>
          {elapsedLabel}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text selectable style={styles.completedLabel}>
          {completedLabel}
        </Text>
        {nextExerciseName ? (
          <Text numberOfLines={1} selectable style={styles.nextLabel}>
            Next: {nextExerciseName}
          </Text>
        ) : null}
      </View>

      <View accessibilityLabel={`${clampedProgress.toFixed(0)} percent complete`} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampedProgress}%` }]} />
      </View>
    </AppCard>
  );
}

const createStyles = (colors: typeof import('@/constants/theme').Colors.dark) =>
  StyleSheet.create({
    card: {
      gap: Spacing.two,
      padding: Spacing.four,
    },
    completedLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.callout.fontSize,
      fontWeight: '800',
      lineHeight: Typography.callout.lineHeight,
    },
    elapsedLabel: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.callout.lineHeight,
    },
    metaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    nextLabel: {
      color: colors.textSecondary,
      flexShrink: 1,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
      textAlign: 'right',
    },
    progressFill: {
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      height: 6,
    },
    progressTrack: {
      backgroundColor: colors.backgroundSelected,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      height: 8,
      overflow: 'hidden',
    },
    topRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    title: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
  });
