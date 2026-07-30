import { router } from 'expo-router';
import { memo, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddBodyMeasurementCard } from '@/components/progress/AddBodyMeasurementCard';
import { EmptyProgressState } from '@/components/progress/EmptyProgressState';
import {
  ProgressTrendChart,
  type ProgressTrendPoint,
} from '@/components/progress/ProgressTrendChart';
import { SafetyRecoveryProgressCard } from '@/components/progress/SafetyRecoveryProgressCard';
import { SafetyRecoveryWeeklyTrendCard } from '@/components/progress/SafetyRecoveryWeeklyTrendCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
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
import { getProgressAnalytics } from '@/lib/progress';
import { useLocalization } from '@/localization';
import type { BodyMeasurementMetric, BodyMeasurementUnit } from '@/types';
import { weightFromKg, useUnitPreferences } from '@/units';

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
        <Text selectable style={styles.rowLabel}>
          {label}
        </Text>
        <Text selectable style={styles.rowValue}>
          {value}
        </Text>
      </View>
      {detail ? (
        <Text selectable style={styles.rowDetail}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
});

export default function ProgressScreen() {
  const {
    addBodyMeasurement,
    bodyMeasurements,
    exercises,
    weightHistory,
    workoutSessions,
  } = useAppContext();
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
  const toDateLabel = (value: string) =>
    formatDate(value, { day: 'numeric', month: 'short' });
  const formatWorkoutVolume = (volumeKg: number) =>
    `${formatNumber(weightFromKg(volumeKg, weightUnit), {
      maximumFractionDigits: 0,
    })} ${weightUnit}`;

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
  const latestWeight = analytics.weight.currentWeight;
  const weightChange7d = analytics.weight.delta7Days;
  const hasWeightChart = analytics.weight.recentEntries.length >= 2;
  const weightTrendPoints = useMemo<ProgressTrendPoint[]>(
    () =>
      analytics.weight.recentEntries.map((entry) => ({
        key: entry.id,
        label: formatDate(entry.createdAt, { day: 'numeric', month: 'short' }),
        value: weightFromKg(entry.weight, weightUnit),
        displayValue: `${formatWeightValue(entry.weight)} ${weightUnit}`,
      })),
    [analytics.weight.recentEntries, formatDate, formatWeightValue, weightUnit],
  );
  const latestVolumePoint = analytics.workoutVolumeTrend.at(-1) ?? null;
  const previousVolumePoint = analytics.workoutVolumeTrend.at(-2) ?? null;
  const weightSummaryLabel =
    latestWeight !== null ? `${formatWeightValue(latestWeight)} ${weightUnit}` : '—';
  const convertedWeightDelta =
    weightChange7d !== null ? weightFromKg(weightChange7d, weightUnit) : null;
  const weightTrendLabel =
    convertedWeightDelta !== null
      ? t('progress.weightTrendWeek', {
          delta: `${convertedWeightDelta > 0 ? '+' : ''}${formatNumber(
            convertedWeightDelta,
            {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            },
          )}`,
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
    (measurementDraft.metric === 'custom' &&
      measurementDraft.customLabel.trim().length === 0);

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
    if (
      measurement.canonicalUnit === 'cm' &&
      measurement.canonicalNumericValue !== null
    ) {
      return `${formatLengthValue(measurement.canonicalNumericValue)} ${lengthUnit}`;
    }
    if (
      measurement.latestUnit === 'percent' &&
      measurement.latestNumericValue !== null
    ) {
      return `${formatNumber(measurement.latestNumericValue, {
        maximumFractionDigits: 1,
      })}%`;
    }
    return measurement.latestValue;
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title={t('tabs.progress')} subtitle={t('progress.subtitle')} />
        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              {t('progress.weight')}
            </Text>
            <Text selectable style={styles.sectionSubtitle}>
              {weightTrendLabel}
            </Text>
          </View>
          <View style={styles.weightHero}>
            <View style={styles.weightHeroCopy}>
              <Text selectable style={styles.weightHeroLabel}>
                {t('progress.currentWeight')}
              </Text>
              <Text selectable style={styles.weightHeroValue}>
                {weightSummaryLabel}
              </Text>
              <Text selectable style={styles.weightHeroDetail}>
                {weightDetailLabel}
              </Text>
            </View>
            <AppButton
              label={t('progress.weightDetails')}
              onPress={() => router.push('/weight-details')}
              variant="secondary"
            />
          </View>
          {hasWeightChart ? (
            <View style={styles.chartWrap}>
              <ProgressTrendChart
                emptyLabel={t('progress.weightChartEmpty')}
                maxLabel={`${formatNumber(
                  Math.max(...weightTrendPoints.map((point) => point.value)),
                  {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  },
                )} ${weightUnit}`}
                minLabel={`${formatNumber(
                  Math.min(...weightTrendPoints.map((point) => point.value)),
                  {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  },
                )} ${weightUnit}`}
                points={weightTrendPoints}
              />
            </View>
          ) : (
            <EmptyProgressState
              description={t('progress.weightBaselineDescription')}
              message={t('progress.weightBaselineMessage')}
              title={t('progress.weightBaselineTitle')}
            />
          )}
          <View style={styles.weightActions}>
            <AppButton
              label={t('progress.addWeight')}
              onPress={() => router.push('/weight-entry')}
            />
            <AppButton
              label={t('progress.trainingDetails')}
              onPress={() => router.push('/weight-details')}
              variant="secondary"
            />
          </View>
        </AppCard>
        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              {t('progress.bodyMeasurements')}
            </Text>
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
            <EmptyProgressState
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
        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              {t('progress.trainingProgress')}
            </Text>
            <Text selectable style={styles.sectionSubtitle}>
              {t('progress.trainingSubtitle')}
            </Text>
          </View>
          <View style={styles.stack}>
            <SectionRow
              detail={
                previousVolumePoint
                  ? t('progress.compareValues', {
                      current: formatWorkoutVolume(latestVolumePoint?.volume ?? 0),
                      previous: formatWorkoutVolume(previousVolumePoint.volume),
                    })
                  : t('progress.recentSessionsOnly')
              }
              label={t('progress.weeklyWorkoutCount')}
              value={formatNumber(analytics.workoutVolumeTrend.length)}
            />
            <SectionRow
              detail={
                latestVolumePoint
                  ? t('progress.latestSession', {
                      date: toDateLabel(latestVolumePoint.createdAt),
                    })
                  : t('progress.noWorkoutTrend')
              }
              label={t('progress.trainingVolume')}
              value={
                latestVolumePoint ? formatWorkoutVolume(latestVolumePoint.volume) : '—'
              }
            />
            <SectionRow
              detail={
                analytics.latestPrs.length > 0
                  ? t('progress.prsOnDeck')
                  : t('progress.noPrs')
              }
              label={t('progress.recentPrs')}
              value={formatNumber(analytics.latestPrs.length)}
            />
          </View>
          <AppButton
            label={t('progress.trainingDetails')}
            onPress={() => router.push('/weight-details')}
            variant="secondary"
          />
        </AppCard>
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
  weightActions: { gap: Spacing.two, marginTop: Spacing.two },
  content: { alignItems: 'center', padding: Spacing.three },
  rowDetail: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  rowLabel: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700' },
  rowValue: { color: Colors.dark.textPrimary, fontSize: 15, fontWeight: '800' },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  sectionHeader: { gap: 2, marginBottom: Spacing.two },
  sectionRow: {
    borderColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingTop: Spacing.two,
  },
  sectionRowCopy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionSubtitle: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 18 },
  sectionTitle: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
  stack: { gap: Spacing.two },
  weightHero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  weightHeroCopy: { flex: 1, gap: 2 },
  weightHeroDetail: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  weightHeroLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  weightHeroValue: {
    color: Colors.dark.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
});
