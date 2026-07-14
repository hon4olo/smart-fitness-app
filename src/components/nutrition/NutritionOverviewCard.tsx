import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { formatMacroTargetPair, formatNumber, formatRemaining, type NutritionSummary } from '@/lib/nutrition';

type NutritionOverviewCardProps = {
  dateLabel: string;
  summary: NutritionSummary;
};

const macroRows = [
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fats', label: 'Fats', unit: 'g' },
] as const;

export function NutritionOverviewCard({ dateLabel, summary }: NutritionOverviewCardProps) {
  const remainingCaloriesLabel = formatRemaining(summary.remaining.calories, ' kcal');

  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.title}>
            Daily overview
          </Text>
          <Text selectable style={styles.subtitle}>
            {dateLabel}
          </Text>
        </View>
        <View style={styles.remainingBadge}>
          <Text selectable style={styles.remainingLabel}>
            {summary.isOverTarget ? 'Over' : 'Remaining'}
          </Text>
          <Text selectable style={styles.remainingValue}>
            {remainingCaloriesLabel}
          </Text>
        </View>
      </View>

      <View style={styles.calorieBlock}>
        <View style={styles.calorieCopy}>
          <Text selectable style={styles.metricLabel}>
            Calories consumed
          </Text>
          <Text selectable style={styles.metricValue}>
            {formatNumber(summary.consumed.calories)} kcal
          </Text>
          <Text selectable style={styles.metricHint}>
            {formatMacroTargetPair(summary.consumed.calories, summary.target.calories, 'kcal')}
          </Text>
        </View>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(summary.calorieProgress * 100)}%` }]} />
          </View>
          <Text selectable style={styles.progressHint}>
            {summary.calorieProgress >= 1 ? 'Target reached' : 'Progress to target'}
          </Text>
        </View>
      </View>

      <View style={styles.macroGrid}>
        {macroRows.map((macro) => {
          const consumed = summary.consumed[macro.key];
          const target = summary.target[macro.key];
          const remaining = summary.remaining[macro.key];

          return (
            <View key={macro.key} style={styles.macroCard}>
              <Text selectable style={styles.macroLabel}>
                {macro.label}
              </Text>
              <Text selectable style={styles.macroValue}>
                {formatMacroTargetPair(consumed, target, macro.unit)}
              </Text>
              <Text selectable style={styles.macroRemaining}>
                {formatRemaining(remaining, ` ${macro.unit}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  calorieBlock: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  calorieCopy: {
    gap: 2,
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
  },
  macroCard: {
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
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  macroLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroRemaining: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  macroValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  metricHint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  progressFill: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 999,
    height: '100%',
    minWidth: 16,
  },
  progressHint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressWrap: {
    gap: Spacing.one,
  },
  remainingBadge: {
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  remainingLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  remainingValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
