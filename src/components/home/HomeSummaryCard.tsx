import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type HomeSummaryCardProps = {
  caloriesRemainingLabel: string;
  currentWeightLabel: string;
  isCaloriesOverTarget: boolean;
  latestWorkoutLabel: string;
  motivation: string;
  nutritionCompletionLabel: string;
  streakLabel?: string;
  workoutCompletionLabel: string;
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text selectable style={styles.miniStatLabel}>
        {label}
      </Text>
      <Text selectable style={styles.miniStatValue}>
        {value}
      </Text>
    </View>
  );
}

export function HomeSummaryCard({
  caloriesRemainingLabel,
  currentWeightLabel,
  isCaloriesOverTarget,
  latestWorkoutLabel,
  motivation,
  nutritionCompletionLabel,
  streakLabel,
  workoutCompletionLabel,
}: HomeSummaryCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.kicker}>
            Today’s summary
          </Text>
          <Text selectable style={styles.title}>
            Fitness status at a glance
          </Text>
        </View>
        <View style={[styles.caloriesBadge, isCaloriesOverTarget && styles.caloriesBadgeWarning]}>
          <Text selectable style={styles.caloriesBadgeLabel}>
            Calories remaining
          </Text>
          <Text selectable style={[styles.caloriesBadgeValue, isCaloriesOverTarget && styles.caloriesBadgeValueWarning]}>
            {caloriesRemainingLabel}
          </Text>
        </View>
      </View>

      <Text selectable style={styles.subheadline}>
        {motivation}
      </Text>

      <View style={styles.statsGrid}>
        <MiniStat label="Current weight" value={currentWeightLabel} />
        <MiniStat label="Latest workout" value={latestWorkoutLabel} />
        <MiniStat label="Streak" value={streakLabel ?? '—'} />
      </View>

      <View style={styles.statusList}>
        <View style={styles.statusRow}>
          <Text selectable style={styles.statusLabel}>
            Nutrition completion
          </Text>
          <Text selectable style={styles.statusValue}>
            {nutritionCompletionLabel}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text selectable style={styles.statusLabel}>
            Workout completion
          </Text>
          <Text selectable style={styles.statusValue}>
            {workoutCompletionLabel}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  caloriesBadge: {
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  caloriesBadgeLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  caloriesBadgeValue: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  caloriesBadgeValueWarning: {
    color: '#FF9F7A',
  },
  caloriesBadgeWarning: {
    borderColor: '#63322A',
    backgroundColor: '#2A1814',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  kicker: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  miniStat: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 92,
    padding: Spacing.two,
  },
  miniStatLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  miniStatValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  statusList: {
    gap: Spacing.two,
  },
  statusRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: 2,
    paddingTop: Spacing.two,
  },
  statusValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subheadline: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
