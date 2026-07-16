import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type HomeSummaryCardProps = {
  caloriesRemainingLabel: string;
  currentWeightLabel: string;
  isCaloriesOverTarget: boolean;
  latestWorkoutLabel: string;
  motivation: string;
  streakLabel?: string;
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

export function HomeSummaryCard({ caloriesRemainingLabel, currentWeightLabel, isCaloriesOverTarget, latestWorkoutLabel, motivation, streakLabel }: HomeSummaryCardProps) {
  return (
    <AppCard style={[styles.card, isCaloriesOverTarget && styles.cardWarning]}>
      <View style={styles.hero}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.kicker}>
            Today
          </Text>
          <Text selectable style={styles.title}>
            What matters now
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
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surfaceAccent,
  },
  cardWarning: {
    backgroundColor: Colors.dark.warningSoft,
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
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.warningSoft,
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
