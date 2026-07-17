import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSavedSummaryProps = {
  dateTimeLabel: string;
  durationLabel: string;
  notes?: string;
  onBackToWorkouts: () => void;
  onHome: () => void;
  setCount: number;
  workoutName: string;
};

export const WorkoutSavedSummary = memo(function WorkoutSavedSummary({
  dateTimeLabel,
  durationLabel,
  notes,
  onBackToWorkouts,
  onHome,
  setCount,
  workoutName,
}: WorkoutSavedSummaryProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.three, backgroundColor: colors.background }]}>
      <View style={styles.savedState}>
        <Text selectable style={styles.savedTitle}>Workout saved</Text>
        <Text selectable style={styles.savedWorkoutName}>{workoutName}</Text>
        <Text selectable style={styles.savedMeta}>{dateTimeLabel} · {durationLabel} · {setCount} set{setCount === 1 ? '' : 's'}</Text>
        {notes?.trim() ? <Text selectable style={styles.savedNotes}>{notes.trim()}</Text> : null}
        <View style={styles.savedActions}>
          <AppButton label="Back to Workouts" onPress={onBackToWorkouts} />
          <AppButton label="Home" onPress={onHome} variant="secondary" />
        </View>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    savedActions: {
      gap: Spacing.one,
      marginTop: Spacing.two,
    },
    savedMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    savedNotes: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
    },
    savedState: {
      gap: Spacing.one,
      padding: Spacing.three,
    },
    savedTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    savedWorkoutName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    screen: {
      flex: 1,
    },
  });
