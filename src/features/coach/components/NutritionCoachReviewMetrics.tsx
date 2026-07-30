import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import type { NutritionCoachCopy } from '@/localization/nutritionCoachCopy';
import { formatEnergyValue, useUnitPreferences } from '@/units';

import type {
  NutritionCoachMetricSummary,
  NutritionMetricTotals,
} from '../nutritionCoachViewModel';
import type { NutritionCoachScreenStyles } from '../screens/nutritionCoachScreen.styles';

function MacroGrid({
  copy,
  totals,
}: {
  copy: NutritionCoachCopy;
  totals: NutritionMetricTotals;
}) {
  const { formatNumber } = useLocalization();
  const { energy } = useUnitPreferences();
  const items = [
    {
      label: copy.calories,
      value: `${formatEnergyValue(totals.calories, energy)} ${energy}`,
    },
    { label: copy.protein, value: `${formatNumber(totals.protein)} g` },
    { label: copy.carbs, value: `${formatNumber(totals.carbs)} g` },
    { label: copy.fats, value: `${formatNumber(totals.fats)} g` },
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
  copy,
  metrics,
  styles,
}: {
  copy: NutritionCoachCopy;
  metrics: NutritionCoachMetricSummary;
  styles: NutritionCoachScreenStyles;
}) {
  const { formatDate, formatNumber } = useLocalization();
  const { energy, formatWeightValue, weight } = useUnitPreferences();
  const trackedAverage = metrics.averages.perTrackedDay;
  const ratioUnit = weight === 'lb' ? 'g/lb' : 'g/kg';
  const ratioValue = (value: number) => (weight === 'lb' ? value / 2.2046226218 : value);

  return (
    <View style={styles.resultStack}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>
            {formatNumber(metrics.completeness.trackedDays, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.metaText}>{copy.trackedDays}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>
            {formatNumber(metrics.completeness.missingDays, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.metaText}>{copy.missingDays}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>
            {formatNumber(metrics.completeness.coveragePercent)}%
          </Text>
          <Text style={styles.metaText}>{copy.coverage}</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{copy.calendarAverage}</Text>
        <MacroGrid copy={copy} totals={metrics.averages.perCalendarDay} />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{copy.trackedAverage}</Text>
        {trackedAverage ? (
          <MacroGrid copy={copy} totals={trackedAverage} />
        ) : (
          <Text style={styles.bodyText}>{copy.noTrackedAverage}</Text>
        )}
      </View>

      {metrics.targetComparison ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{copy.targetComparison}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>{copy.daysWithinCalories}</Text>
            <Text style={styles.infoValue}>
              {formatNumber(metrics.targetComparison.daysWithinCaloriesTenPercent, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>{copy.trackedAdherence}</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.trackedDayAdherencePercent === null
                ? '—'
                : `${formatNumber(metrics.targetComparison.trackedDayAdherencePercent)}%`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>{copy.trackedDelta}</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.averageTrackedDayDelta
                ? `${metrics.targetComparison.averageTrackedDayDelta.calories > 0 ? '+' : ''}${formatEnergyValue(
                    metrics.targetComparison.averageTrackedDayDelta.calories,
                    energy,
                  )} ${energy}`
                : '—'}
            </Text>
          </View>
        </View>
      ) : null}

      {metrics.proteinPerKg ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{copy.proteinPerWeight}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>{copy.weightBaseline}</Text>
            <Text style={styles.infoValue}>
              {formatWeightValue(metrics.proteinPerKg.weightKg)} {weight}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>{copy.calendarAverage}</Text>
            <Text style={styles.infoValue}>
              {formatNumber(ratioValue(metrics.proteinPerKg.averageCalendarDay), {
                maximumFractionDigits: 2,
              })}{' '}
              {ratioUnit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>{copy.trackedAverage}</Text>
            <Text style={styles.infoValue}>
              {metrics.proteinPerKg.averageTrackedDay === null
                ? '—'
                : `${formatNumber(ratioValue(metrics.proteinPerKg.averageTrackedDay), {
                    maximumFractionDigits: 2,
                  })} ${ratioUnit}`}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{copy.dailyCoverage}</Text>
        {metrics.days.map((day) => (
          <View key={day.date} style={styles.dayRow}>
            <View style={styles.dayCopy}>
              <Text style={styles.dayTitle}>
                {formatDate(`${day.date}T12:00:00.000Z`, { dateStyle: 'medium' })}
              </Text>
              <Text style={styles.metaText}>
                {day.tracked
                  ? copy.entries(
                      day.entryCount,
                      formatNumber(day.entryCount, { maximumFractionDigits: 0 }),
                    )
                  : copy.noEntries}
              </Text>
            </View>
            <View style={styles.dayValues}>
              <Text style={styles.infoValue}>
                {formatEnergyValue(day.totals.calories, energy)} {energy}
              </Text>
              <Text style={styles.metaText}>
                {formatNumber(day.totals.protein)} g {copy.protein.toLowerCase()}
              </Text>
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
