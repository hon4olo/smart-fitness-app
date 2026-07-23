import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddBodyMeasurementCard } from '@/components/progress/AddBodyMeasurementCard';
import { EmptyProgressState } from '@/components/progress/EmptyProgressState';
import { ProgressTrendChart, type ProgressTrendPoint } from '@/components/progress/ProgressTrendChart';
import { SafetyRecoveryProgressCard } from '@/components/progress/SafetyRecoveryProgressCard';
import { SafetyRecoveryWeeklyTrendCard } from '@/components/progress/SafetyRecoveryWeeklyTrendCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  createBodyMeasurement,
  getDefaultBodyMeasurementUnit,
} from '@/features/progress/bodyMeasurementModel';
import { formatShortDate } from '@/lib';
import { formatProgressDelta, getProgressAnalytics } from '@/lib/progress';
import type { BodyMeasurementKind, BodyMeasurementUnit } from '@/types';

const toDateLabel = (value: string) => formatShortDate(value);

const SectionRow = memo(function SectionRow({ label, value, detail }: { detail?: string; label: string; value: string }) {
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
  const { addBodyMeasurement, bodyMeasurements, exercises, weightHistory, workoutSessions } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const [measurementKind, setMeasurementKind] = useState<BodyMeasurementKind>('waist');
  const [measurementUnit, setMeasurementUnit] = useState<BodyMeasurementUnit>('cm');
  const [measurementValue, setMeasurementValue] = useState('');
  const [customMeasurementLabel, setCustomMeasurementLabel] = useState('');

  const analytics = useMemo(
    () => getProgressAnalytics({ bodyMeasurements, exercises, weightHistory, workoutSessions }),
    [bodyMeasurements, exercises, weightHistory, workoutSessions],
  );

  const latestWeight = analytics.weight.currentWeight;
  const weightChange7d = analytics.weight.delta7Days;
  const hasWeightChart = analytics.weight.recentEntries.length >= 2;
  const weightTrendPoints = useMemo<ProgressTrendPoint[]>(
    () => analytics.weight.recentEntries.map((entry) => ({
      key: entry.id,
      label: toDateLabel(entry.createdAt),
      value: entry.weight,
      displayValue: entry.weight.toFixed(1),
    })),
    [analytics.weight.recentEntries],
  );

  const latestVolumePoint = analytics.workoutVolumeTrend.at(-1) ?? null;
  const previousVolumePoint = analytics.workoutVolumeTrend.at(-2) ?? null;
  const weightSummaryLabel = latestWeight !== null ? `${latestWeight.toFixed(1)} kg` : '—';
  const weightTrendLabel = weightChange7d !== null ? `${formatProgressDelta(weightChange7d, 'kg')} this week` : 'No recent trend yet';
  const weightDetailLabel = analytics.weight.currentWeightEntry ? `Latest check-in · ${toDateLabel(analytics.weight.currentWeightEntry.createdAt)}` : 'Add a weight check-in to start tracking';
  const numericMeasurementValue = Number(measurementValue.trim().replace(',', '.'));
  const isMeasurementDisabled =
    !Number.isFinite(numericMeasurementValue) ||
    numericMeasurementValue <= 0 ||
    (measurementKind === 'custom' && customMeasurementLabel.trim().length === 0);

  const saveMeasurement = () => {
    if (isMeasurementDisabled) return;
    const measurement = createBodyMeasurement({
      kind: measurementKind,
      customLabel: customMeasurementLabel,
      value: numericMeasurementValue,
      unit: measurementUnit,
    });
    if (!measurement) return;

    addBodyMeasurement(measurement);
    setMeasurementValue('');
    if (measurementKind === 'custom') setCustomMeasurementLabel('');
  };

  const selectMeasurementKind = (kind: BodyMeasurementKind) => {
    setMeasurementKind(kind);
    setMeasurementUnit(getDefaultBodyMeasurementUnit(kind));
  };

  const bodyMeasurementPreview = analytics.measurements.slice(0, 3);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Progress" subtitle="Keep the useful trends, hide the noise." />

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>Weight</Text>
            <Text selectable style={styles.sectionSubtitle}>{weightTrendLabel}</Text>
          </View>

          <View style={styles.weightHero}>
            <View style={styles.weightHeroCopy}>
              <Text selectable style={styles.weightHeroLabel}>Current weight</Text>
              <Text selectable style={styles.weightHeroValue}>{weightSummaryLabel}</Text>
              <Text selectable style={styles.weightHeroDetail}>{weightDetailLabel}</Text>
            </View>
            <AppButton label="Weight details" onPress={() => router.push('/weight-details')} variant="secondary" />
          </View>

          {hasWeightChart ? (
            <View style={styles.chartWrap}>
              <ProgressTrendChart
                emptyLabel="Add at least two weigh-ins to see a chart."
                maxLabel={`${weightTrendPoints.reduce((max, point) => Math.max(max, point.value), weightTrendPoints[0]?.value ?? 0).toFixed(1)} kg`}
                minLabel={`${weightTrendPoints.reduce((min, point) => Math.min(min, point.value), weightTrendPoints[0]?.value ?? 0).toFixed(1)} kg`}
                points={weightTrendPoints}
              />
            </View>
          ) : (
            <EmptyProgressState description="Add a couple of weigh-ins and the chart will appear here." message="No weight chart yet." title="Track a baseline" />
          )}

          <View style={styles.weightActions}>
            <AppButton label="Add weight" onPress={() => router.push('/weight-entry')} />
            <AppButton label="Training details" onPress={() => router.push('/weight-details')} variant="secondary" />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>Body measurements</Text>
          </View>

          {bodyMeasurementPreview.length > 0 ? (
            <View style={styles.stack}>
              {bodyMeasurementPreview.map((measurement) => (
                <SectionRow
                  key={measurement.id}
                  detail={measurement.deltaLabel ? `${toDateLabel(measurement.createdAt)} · ${measurement.deltaLabel}` : toDateLabel(measurement.createdAt)}
                  label={measurement.label}
                  value={measurement.latestValue}
                />
              ))}
            </View>
          ) : (
            <EmptyProgressState description="Add a measurement when it matters. Keep the rest out of the way." message="No measurements yet." title="Nothing to show" />
          )}

          <AddBodyMeasurementCard
            customLabel={customMeasurementLabel}
            isDisabled={isMeasurementDisabled}
            kind={measurementKind}
            measurementValue={measurementValue}
            onChangeCustomLabel={setCustomMeasurementLabel}
            onChangeKind={selectMeasurementKind}
            onChangeUnit={setMeasurementUnit}
            onChangeValue={setMeasurementValue}
            onSave={saveMeasurement}
            unit={measurementUnit}
          />
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>Training progress</Text>
            <Text selectable style={styles.sectionSubtitle}>One compact view of workload.</Text>
          </View>

          <View style={styles.stack}>
            <SectionRow detail={previousVolumePoint ? `${latestVolumePoint?.volume.toLocaleString() ?? '0'} vs ${previousVolumePoint.volume.toLocaleString()}` : 'Recent sessions only'} label="Weekly workout count" value={`${analytics.workoutVolumeTrend.length}`} />
            <SectionRow detail={latestVolumePoint ? `Latest session · ${toDateLabel(latestVolumePoint.createdAt)}` : 'No workout trend yet'} label="Training volume" value={latestVolumePoint ? latestVolumePoint.volume.toLocaleString() : '—'} />
            <SectionRow detail={analytics.latestPrs.length > 0 ? 'Personal records on deck' : 'No PRs yet'} label="Recent PRs" value={`${analytics.latestPrs.length}`} />
          </View>

          <AppButton label="Training details" onPress={() => router.push('/weight-details')} variant="secondary" />
        </AppCard>

        <SafetyRecoveryProgressCard onOpenHistory={() => router.push('/workout-history')} sessions={workoutSessions} />
        <SafetyRecoveryWeeklyTrendCard sessions={workoutSessions} />
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
  sectionRow: { borderColor: Colors.dark.divider, borderTopWidth: StyleSheet.hairlineWidth, gap: 2, paddingTop: Spacing.two },
  sectionRowCopy: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  sectionSubtitle: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 18 },
  sectionTitle: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
  stack: { gap: Spacing.two },
  weightHero: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two, justifyContent: 'space-between', marginBottom: Spacing.two },
  weightHeroCopy: { flex: 1, gap: 2 },
  weightHeroDetail: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18 },
  weightHeroLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  weightHeroValue: { color: Colors.dark.textPrimary, fontSize: 34, fontWeight: '900', lineHeight: 40 },
});
