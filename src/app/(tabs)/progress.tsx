import { router } from 'expo-router';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFloatingTabBarBottomClearance } from '@/components/navigation/floatingTabBarLayout';
import { AddBodyMeasurementCard } from '@/components/progress/AddBodyMeasurementCard';
import {
  ProgressTrendChart,
  type ProgressTrendPoint,
} from '@/components/progress/ProgressTrendChart';
import { SafetyRecoveryProgressCard } from '@/components/progress/SafetyRecoveryProgressCard';
import { SafetyRecoveryWeeklyTrendCard } from '@/components/progress/SafetyRecoveryWeeklyTrendCard';
import { WeeklyWorkoutVolumeCard } from '@/components/progress/WeeklyWorkoutVolumeCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppActions, useWorkoutState } from '@/context/AppContext';
import { useProgressState } from '@/context/ProgressStateContext';
import {
  buildBodyMeasurement,
  createBodyMeasurementDraft,
  getDefaultBodyMeasurementUnit,
} from '@/features/progress/bodyMeasurementModel';
import {
  getBodyMeasurementDisplayLabel,
  getBodyMeasurementError,
} from '@/features/progress/progressLocalization';
import { createUuid } from '@/lib/ids';
import {
  getProgressAnalytics,
  getWeightTrendEntries,
  type WeightTrendRange,
} from '@/lib/progress';
import { useLocalization } from '@/localization';
import type { BodyMeasurementMetric, BodyMeasurementUnit } from '@/types';
import { weightFromKg, useUnitPreferences } from '@/units';

const weightTrendRanges: WeightTrendRange[] = [7, 30, 90];

const SectionRow = memo(function SectionRow({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionRowCopy}>
        <Text selectable style={styles.rowLabel}>{label}</Text>
        <Text selectable style={styles.rowValue}>{value}</Text>
      </View>
      {detail ? <Text selectable style={styles.rowDetail}>{detail}</Text> : null}
    </View>
  );
});

export default function ProgressScreen() {
  const { addBodyMeasurement } = useAppActions();
  const { bodyMeasurements, weightHistory } = useProgressState();
  const { exercises, workoutSessions } = useWorkoutState();
  const { formatDate, formatNumber, t } = useLocalization();
  const {
    formatLengthValue,
    formatWeightValue,
    length: lengthUnit,
    weight: weightUnit,
  } = useUnitPreferences();
  const safeAreaInsets = useSafeAreaInsets();
  const [measurementDraft, setMeasurementDraft] = useState(() =>
    createBodyMeasurementDraft(lengthUnit),
  );
  const [measurementError, setMeasurementError] = useState<string | null>(null);
  const [weightTrendRange, setWeightTrendRange] = useState<WeightTrendRange>(30);

  const toDateLabel = (value: string) =>
    formatDate(value, { day: 'numeric', month: 'short' });

  useEffect(() => {
    setMeasurementDraft((current) => {
      if (current.value.trim().length > 0 || current.unit === 'percent') return current;
      return { ...current, unit: lengthUnit };
    });
  }, [lengthUnit]);

  const analytics = useMemo(
    () =>
      getProgressAnalytics({
        bodyMeasurements,
        exercises,
        weightHistory,
        workoutSessions,
      }),
    [bodyMeasurements, exercises, weightHistory, workoutSessions],
  );
  const selectedWeightEntries = useMemo(
    () => getWeightTrendEntries(weightHistory, weightTrendRange),
    [weightHistory, weightTrendRange],
  );
  const weightTrendPoints = useMemo<ProgressTrendPoint[]>(
    () =>
      selectedWeightEntries.map((entry) => ({
        key: entry.id,
        label: formatDate(entry.createdAt, { day: 'numeric', month: 'short' }),
        value: weightFromKg(entry.weight, weightUnit),
        displayValue: `${formatWeightValue(entry.weight)} ${weightUnit}`,
      })),
    [formatDate, formatWeightValue, selectedWeightEntries, weightUnit],
  );

  const latestWeight = analytics.weight.currentWeight;
  const weightChange7d = analytics.weight.delta7Days;
  const hasWeightChart = selectedWeightEntries.length >= 2;
  const weightSummaryLabel =
    latestWeight !== null ? `${formatWeightValue(latestWeight)} ${weightUnit}` : '—';
  const convertedWeightDelta =
    weightChange7d !== null ? weightFromKg(weightChange7d, weightUnit) : null;
  const weightTrendLabel =
    convertedWeightDelta !== null
      ? t('progress.weightTrendWeek', {
          delta: `${convertedWeightDelta > 0 ? '+' : ''}${formatNumber(convertedWeightDelta, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          })}`,
          unit: weightUnit,
        })
      : t('progress.noRecentTrend');
  const weightDetailLabel = analytics.weight.currentWeightEntry
    ? t('progress.latestCheckIn', {
        date: toDateLabel(analytics.weight.currentWeightEntry.createdAt),
      })
    : t('progress.addWeightPrompt');
  const isMeasurementDisabled =
    measurementDraft.value.trim().length === 0 ||
    (measurementDraft.metric === 'custom' && measurementDraft.customLabel.trim().length === 0);

  const changeMeasurementMetric = (metric: BodyMeasurementMetric) => {
    setMeasurementDraft((current) => ({
      ...current,
      metric,
      unit: getDefaultBodyMeasurementUnit(metric, lengthUnit),
    }));
    setMeasurementError(null);
  };

  const changeMeasurementUnit = (unit: BodyMeasurementUnit) => {
    setMeasurementDraft((current) => ({ ...current, unit }));
    setMeasurementError(null);
  };

  const saveMeasurement = () => {
    const result = buildBodyMeasurement({
      draft: measurementDraft,
      id: createUuid(),
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setMeasurementError(getBodyMeasurementError(t, result.message));
      return;
    }
    addBodyMeasurement(result.measurement);
    setMeasurementDraft(createBodyMeasurementDraft(lengthUnit));
    setMeasurementError(null);
  };

  const bodyMeasurementPreview = analytics.measurements.slice(0, 3);
  const formatMeasurementValue = (
    measurement: (typeof bodyMeasurementPreview)[number],
  ) => {
    if (measurement.canonicalUnit === 'cm' && measurement.canonicalNumericValue !== null) {
      return `${formatLengthValue(measurement.canonicalNumericValue)} ${lengthUnit}`;
    }
    if (measurement.latestUnit === 'percent' && measurement.latestNumericValue !== null) {
      return `${formatNumber(measurement.latestNumericValue, { maximumFractionDigits: 1 })}%`;
    }
    return measurement.latestValue;
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: getFloatingTabBarBottomClearance(safeAreaInsets.bottom) },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title={t('tabs.progress')} subtitle={t('progress.subtitle')} />
        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>{t('progress.weight')}</Text>
            <Text selectable style={styles.sectionSubtitle}>{weightTrendLabel}</Text>
          </View>
          <View style={styles.weightHero}>
            <View style={styles.weightHeroCopy}>
              <Text selectable style={styles.weightHeroLabel}>{t('progress.currentWeight')}</Text>
              <Text selectable style={styles.weightHeroValue}>{weightSummaryLabel}</Text>
              <Text selectable style={styles.weightHeroDetail}>{weightDetailLabel}</Text>
            </View>
            <AppButton
              label={t('progress.weightDetails')}
              onPress={() => router.push('/weight-details')}
              variant="secondary"
            />
          </View>
          <View accessibilityRole="tablist" style={styles.rangeTabs}>
            {weightTrendRanges.map((range) => {
              const selected = weightTrendRange === range;
              return (
                <Pressable
                  key={range}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setWeightTrendRange(range)}
                  style={({ pressed }) => [
                    styles.rangeTab,
                    selected && styles.rangeTabSelected,
                    pressed && styles.rangeTabPressed,
                  ]}>
                  <Text style={[styles.rangeTabLabel, selected && styles.rangeTabLabelSelected]}>
                    {range}D
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {hasWeightChart ? (
            <View style={styles.chartWrap}>
              <ProgressTrendChart
                emptyLabel={t('progress.weightChartEmpty')}
                maxLabel={`${formatNumber(Math.max(...weightTrendPoints.map((point) => point.value)), {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                })} ${weightUnit}`}
                minLabel={`${formatNumber(Math.min(...weightTrendPoints.map((point) => point.value)), {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                })} ${weightUnit}`}
                points={weightTrendPoints}
              />
            </View>
          ) : (
            <EmptyState
              compact
              description={t('progress.weightBaselineDescription')}
              message={t('progress.weightBaselineMessage')}
              title={t('progress.weightBaselineTitle')}
            />
          )}
          <View style={styles.weightActions}>
            <AppButton label={t('progress.addWeight')} onPress={() => router.push('/weight-entry')} />
            <AppButton
              label={t('progress.trainingDetails')}
              onPress={() => router.push('/weight-details')}
              variant="secondary"
            />
          </View>
        </AppCard>
        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>{t('progress.bodyMeasurements')}</Text>
          </View>
          {bodyMeasurementPreview.length > 0 ? (
            <View style={styles.stack}>
              {bodyMeasurementPreview.map((measurement) => (
                <SectionRow
                  key={measurement.id}
                  detail={toDateLabel(measurement.createdAt)}
                  label={getBodyMeasurementDisplayLabel(
                    t,
                    measurement.metric,
                    measurement.label,
                  )}
                  value={formatMeasurementValue(measurement)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              compact
              description={t('progress.measurementsEmptyDescription')}
              message={t('progress.measurementsEmptyMessage')}
              title={t('progress.measurementsEmptyTitle')}
            />
          )}
          <AddBodyMeasurementCard
            draft={measurementDraft}
            error={measurementError}
            isDisabled={isMeasurementDisabled}
            onChangeCustomLabel={(customLabel) =>
              setMeasurementDraft((current) => ({ ...current, customLabel }))
            }
            onChangeMetric={changeMeasurementMetric}
            onChangeUnit={changeMeasurementUnit}
            onChangeValue={(value) =>
              setMeasurementDraft((current) => ({ ...current, value }))
            }
            onSave={saveMeasurement}
          />
        </AppCard>
        <WeeklyWorkoutVolumeCard sessions={workoutSessions} />
        <SafetyRecoveryProgressCard
          onOpenHistory={() => router.push('/workout-history')}
          sessions={workoutSessions}
        />
        <SafetyRecoveryWeeklyTrendCard
          onOpenHistory={({ endAt, safety, startAt }) =>
            router.push({
              pathname: '/workout-history',
              params: {
                from: startAt,
                to: endAt,
                ...(safety ? { safety } : {}),
              },
            })
          }
          sessions={workoutSessions}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartWrap: { marginBottom: Spacing.three },
  container: { gap: Spacing.three, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', flexGrow: 1, padding: Spacing.three },
  rangeTab: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  rangeTabLabel: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  rangeTabLabelSelected: { color: Colors.dark.textPrimary },
  rangeTabPressed: { opacity: 0.72 },
  rangeTabs: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.three,
    padding: 3,
  },
  rangeTabSelected: { backgroundColor: Colors.dark.surfacePrimary },
  rowDetail: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  rowLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 0,
  },
  rowValue: {
    color: Colors.dark.textPrimary,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    maxWidth: '48%',
    textAlign: 'right',
  },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  sectionHeader: { gap: 2, marginBottom: Spacing.two },
  sectionRow: {
    borderColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingTop: Spacing.two,
  },
  sectionRowCopy: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  sectionSubtitle: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  stack: { gap: Spacing.two },
  weightActions: { gap: Spacing.two, marginTop: Spacing.two },
  weightHero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  weightHeroCopy: { flex: 1, flexBasis: 180, gap: 2, minWidth: 0 },
  weightHeroDetail: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  weightHeroLabel: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  weightHeroValue: {
    color: Colors.dark.textPrimary,
    flexShrink: 1,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
});
