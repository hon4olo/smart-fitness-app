import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type FinishWorkoutSummaryProps = {
  dateTimeLabel: string;
  durationLabel: string;
  workoutName: string;
};

export const FinishWorkoutSummary = memo(function FinishWorkoutSummary({ dateTimeLabel, durationLabel, workoutName }: FinishWorkoutSummaryProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.block}>
      <Text selectable style={styles.label}>Workout</Text>
      <Text selectable style={styles.value}>{workoutName}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <Text selectable style={styles.label}>Date & time</Text>
          <Text selectable style={styles.value}>{dateTimeLabel}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text selectable style={styles.label}>Duration</Text>
          <Text selectable style={styles.value}>{durationLabel}</Text>
        </View>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    block: {
      gap: Spacing.two,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    metaCell: {
      flex: 1,
      gap: 4,
    },
    metaRow: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 21,
    },
  });
