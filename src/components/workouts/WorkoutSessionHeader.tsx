import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionHeaderProps = {
  nextExerciseName?: string;
  progressPercent: number;
  summaryLabel: string;
  workoutTitle: string;
};

export function WorkoutSessionHeader({ nextExerciseName, progressPercent, summaryLabel, workoutTitle }: WorkoutSessionHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nextLabel = nextExerciseName ? `Next: ${nextExerciseName}` : undefined;
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <AppCard style={styles.card}>
      <View style={styles.copyBlock}>
        <Text numberOfLines={2} selectable style={styles.title}>
          {workoutTitle}
        </Text>
        <Text selectable style={styles.summaryLabel}>
          {summaryLabel}
        </Text>
        {nextLabel ? (
          <Text numberOfLines={1} selectable style={styles.nextLabel}>
            {nextLabel}
          </Text>
        ) : null}
      </View>

      <View accessibilityLabel={`${clampedProgress.toFixed(0)} percent complete`} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampedProgress}%` }]} />
      </View>
    </AppCard>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    card: {
      gap: Spacing.three,
      padding: Spacing.four,
    },
    copyBlock: {
      gap: 4,
    },
    nextLabel: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
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
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
  });
