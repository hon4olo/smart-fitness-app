import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

import type {
  NutritionCoachMetricSummary,
  NutritionMetricTotals,
} from '../nutritionCoachViewModel';
import type { NutritionCoachScreenStyles } from '../screens/nutritionCoachScreen.styles';

const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

const formatDate = (value: string): string => {
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
    : value;
};

function MacroGrid({ totals }: { totals: NutritionMetricTotals }) {
  const items = [
    { label: 'Calories', value: formatNumber(totals.calories, 0) },
    { label: 'Protein', value: `${formatNumber(totals.protein)} g` },
    { label: 'Carbs', value: `${formatNumber(totals.carbs)} g` },
    { label: 'Fats', value: `${formatNumber(totals.fats)} g` },
  ];

  return (
    <View style={metricStyles.metricGrid}>
      {items.map((item) => (
        <View key={item.label} style={metricStyles.metricCell}>
          <Text style={metricStyles.metricValue}>{item.value}</Text>
          <Text style={metricStyles.metricLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function NutritionCoachReviewMetrics({
  metrics,
  styles,
}: {
  metrics: NutritionCoachMetricSummary;
  styles: NutritionCoachScreenStyles;
}) {
  const trackedAverage = metrics.averages.perTrackedDay;

  return (
    <View style={styles.resultStack}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>{metrics.completeness.trackedDays}</Text>
          <Text style={styles.metaText}>Tracked days</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>{metrics.completeness.missingDays}</Text>
          <Text style={styles.metaText}>Missing days</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>
            {formatNumber(metrics.completeness.coveragePercent)}%
          </Text>
          <Text style={styles.metaText}>Coverage</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Average per calendar day</Text>
        <MacroGrid totals={metrics.averages.perCalendarDay} />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Average per tracked day</Text>
        {trackedAverage ? (
          <MacroGrid totals={trackedAverage} />
        ) : (
          <Text style={styles.bodyText}>No tracked-day average is available.</Text>
        )}
      </View>

      {metrics.targetComparison ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Current target comparison</Text>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Days within ±10% calories</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.daysWithinCaloriesTenPercent}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Tracked-day adherence</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.trackedDayAdherencePercent === null
                ? '—'
                : `${formatNumber(metrics.targetComparison.trackedDayAdherencePercent)}%`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Tracked calorie delta</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.averageTrackedDayDelta
                ? `${metrics.targetComparison.averageTrackedDayDelta.calories > 0 ? '+' : ''}${formatNumber(
                    metrics.targetComparison.averageTrackedDayDelta.calories,
                    0,
                  )} kcal`
                : '—'}
            </Text>
          </View>
        </View>
      ) : null}

      {metrics.proteinPerKg ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Protein relative to body weight</Text>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Weight baseline</Text>
            <Text style={styles.infoValue}>{formatNumber(metrics.proteinPerKg.weightKg)} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Calendar-day average</Text>
            <Text style={styles.infoValue}>
              {formatNumber(metrics.proteinPerKg.averageCalendarDay, 2)} g/kg
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Tracked-day average</Text>
            <Text style={styles.infoValue}>
              {metrics.proteinPerKg.averageTrackedDay === null
                ? '—'
                : `${formatNumber(metrics.proteinPerKg.averageTrackedDay, 2)} g/kg`}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Daily coverage</Text>
        {metrics.days.map((day) => (
          <View key={day.date} style={styles.dayRow}>
            <View style={styles.dayCopy}>
              <Text style={styles.dayTitle}>{formatDate(day.date)}</Text>
              <Text style={styles.metaText}>
                {day.tracked
                  ? `${day.entryCount} entr${day.entryCount === 1 ? 'y' : 'ies'}`
                  : 'No entries'}
              </Text>
            </View>
            <View style={styles.dayValues}>
              <Text style={styles.infoValue}>{formatNumber(day.totals.calories, 0)} kcal</Text>
              <Text style={styles.metaText}>{formatNumber(day.totals.protein)} g protein</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  metricCell: {
    flexBasis: '47%',
    gap: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  metricLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
});
