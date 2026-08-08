import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

type HomeSummaryCardProps = {
  caloriesLabel: string;
  caloriesRemainingLabel: string;
  currentWeightLabel: string;
  currentWeightTitle: string;
  isCaloriesOverTarget: boolean;
  motivation: string;
  streakLabel?: string;
  streakTitle: string;
  title: string;
  todayLabel: string;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text selectable style={styles.metricLabel}>
        {label}
      </Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

export function HomeSummaryCard({
  caloriesLabel,
  caloriesRemainingLabel,
  currentWeightLabel,
  currentWeightTitle,
  isCaloriesOverTarget,
  motivation,
  streakLabel,
  streakTitle,
  title,
  todayLabel,
}: HomeSummaryCardProps) {
  return (
    <AppCard style={[styles.card, isCaloriesOverTarget && styles.cardWarning]}>
      <View style={styles.hero}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.kicker}>
            {todayLabel}
          </Text>
          <Text selectable style={styles.title}>
            {title}
          </Text>
          <Text selectable style={styles.subheadline}>
            {motivation}
          </Text>
        </View>

        <View style={styles.caloriesStatus}>
          <Text selectable style={styles.caloriesLabel}>
            {caloriesLabel}
          </Text>
          <Text
            selectable
            style={[styles.caloriesValue, isCaloriesOverTarget && styles.caloriesValueWarning]}>
            {caloriesRemainingLabel}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <Metric label={currentWeightTitle} value={currentWeightLabel} />
        <Metric label={streakTitle} value={streakLabel ?? '—'} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  caloriesLabel: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textAlign: 'right',
  },
  caloriesStatus: {
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: 2,
    maxWidth: '100%',
    minWidth: 0,
    paddingTop: 2,
  },
  caloriesValue: {
    color: Colors.dark.textPrimary,
    flexShrink: 1,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.heroMetric.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    textAlign: 'right',
  },
  caloriesValueWarning: { color: Colors.dark.warning },
  card: {
    backgroundColor: Colors.dark.surfaceAccent,
    gap: Spacing.three,
  },
  cardWarning: { backgroundColor: Colors.dark.warningSoft },
  divider: {
    backgroundColor: Colors.dark.borderSubtle,
    height: StyleSheet.hairlineWidth,
  },
  headerCopy: { flex: 1, flexBasis: 180, gap: 4, minWidth: 0 },
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  kicker: {
    color: Colors.dark.accent,
    flexShrink: 1,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  metric: {
    flex: 1,
    gap: 2,
    minWidth: 120,
  },
  metricLabel: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    flexShrink: 1,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  subheadline: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
    marginTop: Spacing.one,
  },
  title: {
    color: Colors.dark.textPrimary,
    flexShrink: 1,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});