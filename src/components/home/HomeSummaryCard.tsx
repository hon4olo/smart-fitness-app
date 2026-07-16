import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

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
    <AppCard style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.kicker}>
            Today’s summary
          </Text>
          <Text selectable style={styles.title}>
            Fitness status at a glance
          </Text>
          <Text selectable style={styles.subheadline}>
            {motivation}
          </Text>
        </View>

        <View style={[styles.caloriesBadge, isCaloriesOverTarget && styles.caloriesBadgeWarning]}>
          <Text selectable style={styles.caloriesBadgeLabel}>
            Calories
          </Text>
          <Text selectable style={[styles.caloriesBadgeValue, isCaloriesOverTarget && styles.caloriesBadgeValueWarning]}>
            {caloriesRemainingLabel}
          </Text>
        </View>
      </View>

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
  card: {
    backgroundColor: Colors.dark.surfaceAccent,
  },
  caloriesBadge: {
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  caloriesBadgeLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textTransform: 'uppercase',
  },
  caloriesBadgeValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.heroMetric.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  caloriesBadgeValueWarning: {
    color: Colors.dark.warning,
  },
  caloriesBadgeWarning: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  kicker: {
    color: Colors.dark.accent,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    textTransform: 'uppercase',
  },
  miniStat: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
    minWidth: 92,
    padding: Spacing.three,
  },
  miniStatLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textTransform: 'uppercase',
  },
  miniStatValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  statusList: {
    gap: Spacing.two,
  },
  statusRow: {
    borderColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingTop: Spacing.two,
  },
  statusValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.callout.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
  },
  subheadline: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
    marginTop: Spacing.one,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
