import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddBodyMeasurementCard } from '@/components/progress/AddBodyMeasurementCard';
import { AddWeightEntryCard } from '@/components/progress/AddWeightEntryCard';
import { EmptyProgressState } from '@/components/progress/EmptyProgressState';
import { MuscleAnalyticsPanel } from '@/components/progress/MuscleAnalyticsPanel';
import { ProgressIntelligenceCard } from '@/components/progress/ProgressIntelligenceCard';
import { ProgressSectionCard } from '@/components/progress/ProgressSectionCard';
import { ProgressTrendChart, type ProgressTrendPoint } from '@/components/progress/ProgressTrendChart';
import { AppButton } from '@/components/ui/AppButton';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { formatShortDate } from '@/lib';
import { formatProgressDelta, getMuscleAnalytics, getProgressAnalytics } from '@/lib/progress';
import { createDefaultTrainingProgram } from '@/lib/workouts';
import { getProgramAdvisor, getRecoveryAdvisor, getTrainingAdvisor } from '@/lib/intelligence';

const formatTrendLabel = (direction: 'up' | 'down' | 'stable') => {
  if (direction === 'up') {
    return 'Upward';
  }

  if (direction === 'down') {
    return 'Downward';
  }

  return 'Stable';
};

const toDateLabel = (value: string) => formatShortDate(value);

type SectionRowProps = {
  label: string;
  value: string;
  delta?: string;
  emphasis?: 'improved' | 'neutral' | 'warning';
};

function SectionRow({ delta, emphasis = 'neutral', label, value }: SectionRowProps) {
  return (
    <View style={[styles.sectionRow, emphasis === 'improved' && styles.sectionRowImproved, emphasis === 'warning' && styles.sectionRowWarning]}>
      <View style={styles.sectionRowCopy}>
        <Text selectable style={styles.rowLabel}>
          {label}
        </Text>
        <Text selectable style={styles.rowValue}>
          {value}
        </Text>
      </View>
      {delta ? (
        <Text style={[styles.deltaPill, emphasis === 'improved' && styles.deltaPillImproved, emphasis === 'warning' && styles.deltaPillWarning]}>
          {delta}
        </Text>
      ) : null}
    </View>
  );
}

export default function ProgressScreen() {
  const {
    addBodyMeasurement,
    addWeightEntry,
    bodyMeasurements,
    deleteBodyMeasurement,
    deleteWeightEntry,
    exercises,
    weightHistory,
    workoutSessions,
    workouts,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [measurementLabel, setMeasurementLabel] = useState('');
  const [measurementValue, setMeasurementValue] = useState('');

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
  const weightChange30d = analytics.weight.delta30Days;
  const weeklyAverage = analytics.weight.weeklyAverage;
  const trendLabel = formatTrendLabel(analytics.weight.direction);
  const trendTone = analytics.weight.direction === 'down' ? 'improved' : analytics.weight.direction === 'up' ? 'warning' : 'neutral';

  const weightTrendPoints: ProgressTrendPoint[] = analytics.weight.recentEntries.map((entry) => ({
    key: entry.id,
    label: toDateLabel(entry.createdAt),
    value: entry.weight,
    displayValue: entry.weight.toFixed(1),
  }));

  const workoutTrendPoints: ProgressTrendPoint[] = analytics.workoutVolumeTrend.map((entry) => ({
    key: entry.id,
    label: toDateLabel(entry.createdAt),
    value: entry.volume,
    displayValue: entry.volume.toLocaleString(),
  }));

  const isWeightDisabled = !Number.isFinite(Number(weight)) || Number(weight) <= 0;
  const isMeasurementDisabled = measurementLabel.trim().length === 0 || measurementValue.trim().length === 0;
  const hasWorkoutHistory = workoutSessions.length > 0;
  const workoutTrendLatest = analytics.workoutVolumeTrend.at(-1) ?? null;
  const workoutTrendPrevious = analytics.workoutVolumeTrend.at(-2) ?? null;
  const workoutTrendChange = workoutTrendLatest && workoutTrendPrevious ? workoutTrendLatest.volume - workoutTrendPrevious.volume : null;

  const latestMeasurements = analytics.measurements;
  const improvingExercises = analytics.improvingExercises.slice(0, 4);
  const inactiveExercises = analytics.inactiveExercises.slice(0, 4);
  const muscleAnalytics = useMemo(
    () =>
      getMuscleAnalytics({
        exercises,
        workoutSessions,
      }),
    [exercises, workoutSessions],
  );
  const currentProgram = useMemo(() => createDefaultTrainingProgram(workouts), [workouts]);
  const trainingAdvisor = useMemo(() => getTrainingAdvisor({ exercises, program: currentProgram, workoutSessions, workouts }), [currentProgram, exercises, workoutSessions, workouts]);
  const recoveryAdvisor = useMemo(() => getRecoveryAdvisor({ exercises, workoutSessions, workouts }), [exercises, workoutSessions, workouts]);
  const programAdvisor = useMemo(() => getProgramAdvisor({ exercises, program: currentProgram, workouts }), [currentProgram, exercises, workouts]);
  const progressIntelligence = useMemo(
    () => ({
      actionableRecommendations: [
        ...trainingAdvisor.recommendations.slice(0, 2).map((recommendation) => recommendation.detail),
        ...programAdvisor.recommendations.slice(0, 1).map((recommendation) => recommendation.detail),
      ],
      improvementOpportunities: [...trainingAdvisor.improvementOpportunities, ...programAdvisor.improvementOpportunities],
      recoverySummary: `${recoveryAdvisor.status} · wait ${recoveryAdvisor.recommendedWaitTime} · ${recoveryAdvisor.recoveryExplanation}`,
      trainingWarnings: [...trainingAdvisor.warnings, ...programAdvisor.warnings],
    }),
    [programAdvisor, recoveryAdvisor, trainingAdvisor],
  );
  const latestPrs = analytics.latestPrs.slice(0, 6);
  const estimatedNewPrs = analytics.estimatedNewPrs.slice(0, 4);

  const saveWeight = () => {
    if (isWeightDisabled) {
      return;
    }

    const now = new Date();
    addWeightEntry({
      id: `${Date.now()}`,
      date: formatShortDate(now.toISOString()),
      weight: Number(weight),
      createdAt: now.toISOString(),
    });
    setWeight('');
  };

  const saveMeasurement = () => {
    if (isMeasurementDisabled) {
      return;
    }

    addBodyMeasurement({
      id: `${Date.now()}`,
      label: measurementLabel.trim(),
      value: measurementValue.trim(),
      createdAt: new Date().toISOString(),
    });
    setMeasurementLabel('');
    setMeasurementValue('');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Progress" subtitle="Analytics that show trends, not just history." />

        <View style={styles.metricGrid}>
          <MetricCard
            label="Current weight"
            value={latestWeight !== null ? `${latestWeight.toFixed(1)} kg` : '—'}
            detail={analytics.weight.currentWeightEntry ? `Latest check-in · ${toDateLabel(analytics.weight.currentWeightEntry.createdAt)}` : 'No weight history yet'}
          />
          <MetricCard label="7-day change" value={formatProgressDelta(weightChange7d, 'kg')} detail={trendLabel} />
          <MetricCard label="30-day change" value={formatProgressDelta(weightChange30d, 'kg')} detail={analytics.weight.currentWeightEntry ? 'Compared with your earlier baseline' : 'No comparison yet'} />
          <MetricCard label="Weekly average" value={weeklyAverage !== null ? `${weeklyAverage.toFixed(1)} kg` : '—'} detail={weightHistory.length > 0 ? 'Recent rolling average' : 'No history yet'} />
        </View>

        <ProgressSectionCard subtitle="Last 14 weigh-ins and the current direction of travel." title="Weight analytics">
          {weightTrendPoints.length === 0 ? (
            <EmptyProgressState
              description="Add a couple of weigh-ins and a trend line will appear here."
              message="No weight history yet."
              title="Start with a baseline"
            />
          ) : (
            <>
              <SectionRow
                delta={formatProgressDelta(weightChange7d, 'kg')}
                emphasis={trendTone}
                label="Trend"
                value={trendLabel}
              />
              <ProgressTrendChart
                emptyLabel="Add at least two weigh-ins to see a chart."
                maxLabel={weightTrendPoints.reduce((max, point) => Math.max(max, point.value), weightTrendPoints[0]?.value ?? 0).toFixed(1) + ' kg'}
                minLabel={weightTrendPoints.reduce((min, point) => Math.min(min, point.value), weightTrendPoints[0]?.value ?? 0).toFixed(1) + ' kg'}
                points={weightTrendPoints}
              />
            </>
          )}
        </ProgressSectionCard>

        <AddWeightEntryCard isDisabled={isWeightDisabled} onChangeWeight={setWeight} onSave={saveWeight} weight={weight} />

        <ProgressSectionCard subtitle="Latest measurements with change from the previous reading." title="Measurements">
          {latestMeasurements.length === 0 ? (
            <EmptyProgressState
              description="Add a measurement to start tracking body changes over time."
              message="No measurements yet."
              title="Nothing to compare"
            />
          ) : (
            <View style={styles.stack}>
              {latestMeasurements.map((measurement) => (
                <View key={measurement.id} style={[styles.measurementCard, measurement.improved && styles.measurementCardImproved]}>
                  <View style={styles.measurementHeader}>
                    <View style={styles.measurementCopy}>
                      <Text selectable style={styles.measurementLabel}>{measurement.label}</Text>
                      <Text selectable style={styles.measurementValue}>{measurement.latestValue}</Text>
                      <Text selectable style={styles.measurementDate}>{toDateLabel(measurement.createdAt)}</Text>
                    </View>
                    <View style={styles.measurementDeltaWrap}>
                      <Text style={[styles.measurementDelta, measurement.improved && styles.measurementDeltaImproved, measurement.direction === 'up' && styles.measurementDeltaWarning]}>
                        {measurement.deltaLabel ?? '—'}
                      </Text>
                      {measurement.previousValue ? <Text style={styles.measurementPrevious}>Prev {measurement.previousValue}</Text> : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ProgressSectionCard>

        <AddBodyMeasurementCard
          isDisabled={isMeasurementDisabled}
          measurementLabel={measurementLabel}
          measurementValue={measurementValue}
          onChangeLabel={setMeasurementLabel}
          onChangeValue={setMeasurementValue}
          onSave={saveMeasurement}
        />

        <ProgressSectionCard
          subtitle="Recent workout volume, improving exercises, and exercises that have gone quiet."
          title="Workout progress">
          {!hasWorkoutHistory ? (
            <EmptyProgressState
              description="Finish a workout and this dashboard will start showing volume and strength trends."
              message="No workout history yet."
              title="Ready when you are"
            />
          ) : (
            <View style={styles.stack}>
              <SectionRow
                delta={workoutTrendChange !== null ? formatProgressDelta(workoutTrendChange, 'kg') : undefined}
                emphasis={workoutTrendChange !== null && workoutTrendChange >= 0 ? 'improved' : 'warning'}
                label="Latest volume"
                value={workoutTrendLatest ? `${workoutTrendLatest.volume.toLocaleString()} kg` : '—'}
              />

              <ProgressTrendChart
                emptyLabel="Finish at least two workouts to see a trend."
                maxLabel={workoutTrendPoints.reduce((max, point) => Math.max(max, point.value), workoutTrendPoints[0]?.value ?? 0).toLocaleString() + ' kg'}
                minLabel={workoutTrendPoints.reduce((min, point) => Math.min(min, point.value), workoutTrendPoints[0]?.value ?? 0).toLocaleString() + ' kg'}
                points={workoutTrendPoints}
              />

              <View style={styles.dualColumn}>
                <View style={styles.dualColumnItem}>
                  <Text selectable style={styles.subsectionTitle}>Strongest improvers</Text>
                  {improvingExercises.length === 0 ? (
                    <Text style={styles.emptyInline}>No improving exercises yet.</Text>
                  ) : (
                    improvingExercises.map((exercise) => (
                      <View key={`${exercise.exerciseName}-${exercise.lastPerformedAt}`} style={styles.exerciseCard}>
                        <View style={styles.exerciseCardHeader}>
                          <Text selectable style={styles.exerciseName}>{exercise.exerciseName}</Text>
                          <Text style={styles.exercisePill}>{formatProgressDelta(exercise.trendDelta, 'kg')}</Text>
                        </View>
                        <Text selectable style={styles.exerciseMeta}>
                          Latest {exercise.latestEstimated1RM.toFixed(1)} kg 1RM · {exercise.latestWeight.toFixed(1)} kg x {exercise.latestReps}
                        </Text>
                        <Text selectable style={styles.exerciseMeta}>Recent volume {exercise.recentVolume.toLocaleString()} kg · Last used {toDateLabel(exercise.lastPerformedAt)}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.dualColumnItem}>
                  <Text selectable style={styles.subsectionTitle}>Recently inactive</Text>
                  {inactiveExercises.length === 0 ? (
                    <Text style={styles.emptyInline}>All tracked exercises have recent work.</Text>
                  ) : (
                    inactiveExercises.map((exercise) => (
                      <View key={`${exercise.exerciseName}-${exercise.lastPerformedAt}`} style={styles.exerciseCard}>
                        <View style={styles.exerciseCardHeader}>
                          <Text selectable style={styles.exerciseName}>{exercise.exerciseName}</Text>
                          <Text style={styles.exercisePill}>{exercise.daysInactive}d idle</Text>
                        </View>
                        <Text selectable style={styles.exerciseMeta}>
                          Last set {exercise.latestWeight.toFixed(1)} kg x {exercise.latestReps} · {exercise.latestEstimated1RM.toFixed(1)} kg 1RM
                        </Text>
                        <Text selectable style={styles.exerciseMeta}>Recent volume {exercise.recentVolume.toLocaleString()} kg</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          )}
        </ProgressSectionCard>

        <ProgressIntelligenceCard
          actionableRecommendations={progressIntelligence.actionableRecommendations}
          improvementOpportunities={progressIntelligence.improvementOpportunities}
          recoverySummary={progressIntelligence.recoverySummary}
          trainingWarnings={progressIntelligence.trainingWarnings}
        />

        <MuscleAnalyticsPanel analytics={muscleAnalytics} />

        <ProgressSectionCard subtitle="Recent achievements and projected next wins." title="Personal records">
          {!hasWorkoutHistory ? (
            <EmptyProgressState
              description="Once you log workouts, new PRs and likely next PRs will show up here."
              message="No personal records yet."
              title="Nothing recorded yet"
            />
          ) : (
            <View style={styles.dualColumn}>
              <View style={styles.dualColumnItem}>
                <Text selectable style={styles.subsectionTitle}>Latest PRs</Text>
                {latestPrs.length === 0 ? (
                  <Text style={styles.emptyInline}>No PRs detected yet.</Text>
                ) : (
                  latestPrs.map((record) => (
                    <View key={record.id} style={[styles.recordCard, record.kind === 'estimated' && styles.recordCardEstimated]}>
                      <View style={styles.recordCardHeader}>
                        <View style={styles.recordCopy}>
                          <Text selectable style={styles.recordLabel}>{record.label}</Text>
                          <Text selectable style={styles.recordExercise}>{record.exerciseName}</Text>
                        </View>
                        <Text style={styles.recordBadge}>New</Text>
                      </View>
                      <Text selectable style={styles.recordValue}>{record.value}</Text>
                      <Text selectable style={styles.recordDate}>{toDateLabel(record.createdAt)}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.dualColumnItem}>
                <Text selectable style={styles.subsectionTitle}>Estimated new PRs</Text>
                {estimatedNewPrs.length === 0 ? (
                  <Text style={styles.emptyInline}>No near-term PR projections yet.</Text>
                ) : (
                  estimatedNewPrs.map((record) => (
                    <View key={record.id} style={styles.recordCard}>
                      <View style={styles.recordCardHeader}>
                        <View style={styles.recordCopy}>
                          <Text selectable style={styles.recordLabel}>{record.label}</Text>
                          <Text selectable style={styles.recordExercise}>{record.exerciseName}</Text>
                        </View>
                        <Text style={styles.recordBadge}>Soon</Text>
                      </View>
                      <Text selectable style={styles.recordValue}>{record.value}</Text>
                      {record.deltaLabel ? <Text style={styles.recordDate}>{record.deltaLabel}</Text> : null}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ProgressSectionCard>

        <ProgressSectionCard subtitle="Keep history intact and delete entries only when needed." title="Weight history">
          {weightHistory.length === 0 ? (
            <EmptyProgressState message="No weight entries yet." title="Empty history" />
          ) : (
            <View style={styles.stack}>
              {weightHistory.map((entry) => (
                <View key={entry.id} style={styles.historyCard}>
                  <View style={styles.historyCopy}>
                    <Text selectable style={styles.historyLabel}>{entry.date}</Text>
                    <Text selectable style={styles.historyValue}>{entry.weight.toFixed(1)} kg</Text>
                  </View>
                  <AppButton label="Delete" onPress={() => deleteWeightEntry(entry.id)} variant="secondary" />
                </View>
              ))}
            </View>
          )}
        </ProgressSectionCard>

        <ProgressSectionCard subtitle="Stored measurements stay editable and removable here." title="Measurement history">
          {bodyMeasurements.length === 0 ? (
            <EmptyProgressState message="No body measurements yet." title="Empty history" />
          ) : (
            <View style={styles.stack}>
              {bodyMeasurements.map((measurement) => (
                <View key={measurement.id} style={styles.historyCard}>
                  <View style={styles.historyCopy}>
                    <Text selectable style={styles.historyLabel}>{measurement.label}</Text>
                    <Text selectable style={styles.historyValue}>{measurement.value}</Text>
                    <Text selectable style={styles.historyDate}>{toDateLabel(measurement.createdAt)}</Text>
                  </View>
                  <AppButton label="Delete" onPress={() => deleteBodyMeasurement(measurement.id)} variant="secondary" />
                </View>
              ))}
            </View>
          )}
        </ProgressSectionCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  deltaPill: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  deltaPillImproved: {
    color: Colors.dark.accent,
  },
  deltaPillWarning: {
    color: Colors.dark.textSecondary,
  },
  dualColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  dualColumnItem: {
    flex: 1,
    gap: Spacing.two,
    minWidth: 220,
  },
  emptyInline: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  exerciseCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  exerciseName: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  exercisePill: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  historyCard: {
    alignItems: 'flex-start',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  historyLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  historyValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  measurementCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
  },
  measurementCardImproved: {
    borderColor: Colors.dark.accent,
  },
  measurementCopy: {
    flex: 1,
    gap: 2,
  },
  measurementDate: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  measurementDelta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  measurementDeltaImproved: {
    color: Colors.dark.accent,
  },
  measurementDeltaWarning: {
    color: Colors.dark.textSecondary,
  },
  measurementDeltaWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  measurementHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  measurementLabel: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  measurementPrevious: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  measurementValue: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  recordBadge: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  recordCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  recordCardEstimated: {
    borderColor: Colors.dark.accentMuted,
  },
  recordCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  recordCopy: {
    flex: 1,
    gap: 2,
  },
  recordDate: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  recordExercise: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  recordLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  recordValue: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  rowLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionRow: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  sectionRowImproved: {
    borderColor: Colors.dark.accent,
  },
  sectionRowWarning: {
    borderColor: Colors.dark.textSecondary,
  },
  sectionRowCopy: {
    flex: 1,
    gap: 2,
  },
  stack: {
    gap: Spacing.two,
  },
  subsectionTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryBadge: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  summaryBadgeImproved: {
    color: Colors.dark.accent,
  },
  summaryBadgeWarning: {
    color: Colors.dark.textSecondary,
  },
  summaryLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  summaryLineCopy: {
    flex: 1,
    gap: 2,
  },
  summaryValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
