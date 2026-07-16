import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionProgressCardProps = {
  nextExerciseName?: string;
  progressLabel: string;
  progressPercent: number;
  selectedExerciseName?: string;
};

export function WorkoutSessionProgressCard({ nextExerciseName, progressLabel, progressPercent, selectedExerciseName }: WorkoutSessionProgressCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));
  const nextLabel = nextExerciseName ? `Next: ${nextExerciseName}` : null;

  return (
    <AppCard style={styles.card}>
      <View style={styles.copyBlock}>
        {selectedExerciseName ? (
          <Text numberOfLines={2} selectable style={styles.title}>
            {selectedExerciseName}
          </Text>
        ) : null}
        <Text selectable style={styles.summaryLabel}>
          {progressLabel}
        </Text>
        {nextLabel ? (
          <Text numberOfLines={1} selectable style={styles.nextLabel}>
            {nextLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampedProgress}%` }]} />
      </View>
    </AppCard>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    card: {
      gap: Spacing.two,
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
