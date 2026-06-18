import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddBodyMeasurementCard } from '@/components/progress/AddBodyMeasurementCard';
import { AddWeightEntryCard } from '@/components/progress/AddWeightEntryCard';
import { EmptyProgressState } from '@/components/progress/EmptyProgressState';
import { ProgressSummaryCard } from '@/components/progress/ProgressSummaryCard';
import { WeightTrendCard } from '@/components/progress/WeightTrendCard';
import { WorkoutVolumeTrendCard } from '@/components/progress/WorkoutVolumeTrendCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { formatShortDate, formatShortDateTime } from '@/lib';
import { calculateEstimated1RM } from '@/lib/workouts';
import { formatWeightDelta, calculateWeightDelta } from '@/lib/progress';


type TrendPoint = {
  key: string;
  label: string;
  value: number;
  displayValue: string;
};

type TrendChartProps = {
  emptyLabel: string;
  maxLabel: string;
  minLabel: string;
  points: TrendPoint[];
  barColor?: string;
};

function TrendChart({
  barColor = Colors.dark.accent,
  emptyLabel,
  maxLabel,
  minLabel,
  points,
}: TrendChartProps) {
  if (points.length < 2) {
    return <Text style={styles.emptyText}>{emptyLabel}</Text>;
  }

  const minValue = points.reduce((min, point) => Math.min(min, point.value), points[0].value);
  const maxValue = points.reduce((max, point) => Math.max(max, point.value), points[0].value);
  const range = maxValue - minValue;
  const scaledRange = Math.max(range, Math.max(Math.abs(maxValue), 1) * 0.12);
  const getBarHeight = (value: number) => {
    if (range === 0) {
      return 60;
    }

    const normalized = (value - minValue) / scaledRange;

    return 24 + Math.min(1, Math.max(0, normalized)) * 76;
  };


  return (
    <View style={styles.chartShell}>
      <View style={styles.chartRangeRow}>
        <Text style={styles.chartRangeLabel}>{maxLabel}</Text>
        <Text style={styles.chartRangeLabel}>{minLabel}</Text>
      </View>

      <View style={styles.chartContent}>
        <View style={styles.chartBaseline} />
        <View style={styles.chartBars}>
          {points.map((point) => (
            <View key={point.key} style={styles.chartBarColumn}>
              <Text numberOfLines={1} style={styles.chartValueLabel}>
                {point.displayValue}
              </Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBar, { backgroundColor: barColor, height: getBarHeight(point.value) }]} />
              </View>
              <Text numberOfLines={1} style={styles.chartBarLabel}>
                {point.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const {
    addBodyMeasurement,
    addWeightEntry,
    exercises,
    deleteBodyMeasurement,
    deleteWeightEntry,
    workoutSessions,
    weightHistory,
    bodyMeasurements,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [measurementLabel, setMeasurementLabel] = useState('');
  const [measurementValue, setMeasurementValue] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [isBodyWeightTrendExpanded, setIsBodyWeightTrendExpanded] = useState(true);
  const [isBodyMeasurementsExpanded, setIsBodyMeasurementsExpanded] = useState(false);
  const [isExerciseProgressExpanded, setIsExerciseProgressExpanded] = useState(false);
  const [isEstimated1RMExpanded, setIsEstimated1RMExpanded] = useState(false);
  const [isWorkoutVolumeExpanded, setIsWorkoutVolumeExpanded] = useState(false);
  const selectedExerciseLabel = selectedExercise || 'No exercise selected';
  const getSectionTitle = (title: string, isExpanded: boolean) => `${title} ${isExpanded ? '−' : '+'}`;
  const parsedWeight = Number(weight);
  const isWeightDisabled = !Number.isFinite(parsedWeight) || parsedWeight <= 0;
  const isMeasurementDisabled =
    measurementLabel.trim().length === 0 || measurementValue.trim().length === 0;
  const weightTrendEntries = [...weightHistory]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 14)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const availableExercises = Array.from(
    new Set(
      (exercises.length > 0
        ? exercises.map((exercise) => exercise.name)
        : workoutSessions.flatMap((session) => session.sets.map((set) => set.exerciseName))
      ).filter((name): name is string => Boolean(name))
    )
  ).sort((a, b) => a.localeCompare(b));

  const normalizeExerciseLabel = (value: string | undefined | null) => value?.trim().toLowerCase() ?? '';
  const getExerciseSetLabel = (set: { exercise?: unknown; exerciseName?: unknown; name?: unknown }) => {
    const label = set.exerciseName ?? set.exercise ?? set.name;

    return typeof label === 'string' ? label : '';
  };
  const getNumericSetValue = (value: unknown) => {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  };

  const exerciseHistory = selectedExercise
    ? workoutSessions
        .flatMap((session, sessionIndex) =>
          session.sets
            .map((set, setIndex) => {
              const exerciseName = getExerciseSetLabel(
                set as { exercise?: unknown; exerciseName?: unknown; name?: unknown }
              );
              const weight = getNumericSetValue((set as { weight?: unknown }).weight);
              const reps = getNumericSetValue((set as { reps?: unknown }).reps);

              if (
                normalizeExerciseLabel(exerciseName) !== normalizeExerciseLabel(selectedExercise) ||
                weight === null ||
                reps === null ||
                weight <= 0 ||
                reps <= 0
              ) {
                return null;
              }

              return {
                exerciseName,
                finishedAt: session.finishedAt,
                reps,
                sessionIndex,
                setIndex,
                weight,
              };
            })
            .filter(
              (
                set
              ): set is {
                exerciseName: string;
                finishedAt: string;
                reps: number;
                sessionIndex: number;
                setIndex: number;
                weight: number;
              } => Boolean(set)
            )
        )
        .sort((a, b) => {
          const dateDiff = new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime();

          if (dateDiff !== 0) {
            return dateDiff;
          }

          if (b.sessionIndex !== a.sessionIndex) {
            return b.sessionIndex - a.sessionIndex;
          }

          return b.setIndex - a.setIndex;
        })
    : [];

  const exerciseTrendData = selectedExercise
    ? Array.from(
        workoutSessions.reduce((sessionMap, session) => {
          const matchingSets = session.sets
            .map((set) => {
              const exerciseName = getExerciseSetLabel(
                set as { exercise?: unknown; exerciseName?: unknown; name?: unknown }
              );
              const weight = getNumericSetValue((set as { weight?: unknown }).weight);
              const reps = getNumericSetValue((set as { reps?: unknown }).reps);

              if (
                normalizeExerciseLabel(exerciseName) !== normalizeExerciseLabel(selectedExercise) ||
                weight === null ||
                reps === null ||
                weight <= 0 ||
                reps <= 0
              ) {
                return null;
              }

              return {
                estimated1RM: calculateEstimated1RM(weight, reps),
                finishedAt: session.finishedAt,
                weight,
                reps,
              };
            })
            .filter(
              (
                set
              ): set is {
                estimated1RM: number;
                finishedAt: string;
                weight: number;
                reps: number;
              } => Boolean(set)
            );

          if (matchingSets.length === 0) {
            return sessionMap;
          }

          const sessionKey = session.id || session.finishedAt || session.startedAt;
          const bestSet = matchingSets.reduce((best, current) =>
            current.estimated1RM > best.estimated1RM ? current : best
          );
          const existingPoint = sessionMap.get(sessionKey);

          if (!existingPoint || bestSet.estimated1RM > existingPoint.estimated1RM) {
            sessionMap.set(sessionKey, {
              date: session.finishedAt || session.startedAt,
              finishedAt: session.finishedAt || session.startedAt,
              estimated1RM: bestSet.estimated1RM,
            });
          }

          return sessionMap;
        }, new Map<string, { date: string; finishedAt: string; estimated1RM: number }>())
          .values()
      )
        .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())
        .slice(0, 10)
        .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime())
    : [];

  const exerciseTrendDateCounts = exerciseTrendData.reduce<Record<string, number>>((counts, entry) => {
    const dateKey = entry.finishedAt.slice(0, 10);

    counts[dateKey] = (counts[dateKey] ?? 0) + 1;

    return counts;
  }, {});
  const getExerciseTrendLabel = (entry: (typeof exerciseTrendData)[number]) => {
    const dateKey = entry.finishedAt.slice(0, 10);

    return exerciseTrendDateCounts[dateKey] > 1
      ? formatShortDateTime(entry.finishedAt)
      : formatShortDate(entry.finishedAt);
  };

  const workoutVolumeData = workoutSessions
    .map((session, sessionIndex) => {
      const sessionVolume = session.sets.reduce((total, set) => {
        const exerciseName = getExerciseSetLabel(
          set as { exercise?: unknown; exerciseName?: unknown; name?: unknown }
        );
        const weight = getNumericSetValue((set as { weight?: unknown }).weight);
        const reps = getNumericSetValue((set as { reps?: unknown }).reps);

        if (weight === null || reps === null || weight <= 0 || reps <= 0 || !exerciseName) {
          return total;
        }

        return total + weight * reps;
      }, 0);

      if (sessionVolume <= 0) {
        return null;
      }

      return {
        finishedAt: session.finishedAt || session.startedAt,
        sessionId: session.id ?? `${session.finishedAt || session.startedAt}-${sessionIndex}`,
        sessionIndex,
        sessionVolume,
      };
    })
    .filter(
      (
        session
      ): session is {
        finishedAt: string;
        sessionId: string;
        sessionIndex: number;
        sessionVolume: number;
      } => Boolean(session)
    )
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())
    .slice(0, 10)
    .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime());

  const workoutVolumeDateCounts = workoutVolumeData.reduce<Record<string, number>>((counts, entry) => {
    const dateKey = entry.finishedAt.slice(0, 10);

    counts[dateKey] = (counts[dateKey] ?? 0) + 1;

    return counts;
  }, {});
  const getWorkoutVolumeLabel = (entry: (typeof workoutVolumeData)[number]) => {
    const dateKey = entry.finishedAt.slice(0, 10);

    return workoutVolumeDateCounts[dateKey] > 1
      ? formatShortDateTime(entry.finishedAt)
      : formatShortDate(entry.finishedAt);
  };

  const weightTrendPoints = weightTrendEntries.map((entry) => ({
    displayValue: entry.weight.toFixed(1),
    key: entry.id,
    label: entry.date,
    value: entry.weight,
  }));
  const latestTrendEntry = weightTrendEntries.at(-1);
  const previousTrendEntry = weightTrendEntries.at(-2);
  const firstTrendEntry = weightTrendEntries[0];
  const weightTrendAxisMaxLabel = `${weightTrendEntries
    .reduce((max, entry) => Math.max(max, entry.weight), weightTrendEntries[0]?.weight ?? 0)
    .toFixed(1)} kg`;
  const weightTrendAxisMinLabel = `${weightTrendEntries
    .reduce((min, entry) => Math.min(min, entry.weight), weightTrendEntries[0]?.weight ?? 0)
    .toFixed(1)} kg`;
  const workoutVolumePoints = workoutVolumeData.map((entry) => ({
    displayValue: entry.sessionVolume.toLocaleString(),
    key: entry.sessionId,
    label: getWorkoutVolumeLabel(entry),
    value: entry.sessionVolume,
  }));
  const latestWorkoutVolumeEntry = workoutVolumeData.at(-1);
  const previousWorkoutVolumeEntry = workoutVolumeData.at(-2);
  const firstWorkoutVolumeEntry = workoutVolumeData[0];
  const workoutVolumeAxisMaxLabel = `${workoutVolumeData
    .reduce((max, entry) => Math.max(max, entry.sessionVolume), workoutVolumeData[0]?.sessionVolume ?? 0)
    .toLocaleString()} kg`;
  const workoutVolumeAxisMinLabel = `${workoutVolumeData
    .reduce((min, entry) => Math.min(min, entry.sessionVolume), workoutVolumeData[0]?.sessionVolume ?? 0)
    .toLocaleString()} kg`;
  const exerciseTrendPoints = exerciseTrendData.map((entry) => ({
    displayValue: entry.estimated1RM.toFixed(1),
    key: `${entry.finishedAt}-${entry.estimated1RM}`,
    label: getExerciseTrendLabel(entry),
    value: entry.estimated1RM,
  }));
  const latestExerciseTrendEntry = exerciseTrendData.at(-1);
  const previousExerciseTrendEntry = exerciseTrendData.at(-2);
  const firstExerciseTrendEntry = exerciseTrendData[0];
  const exerciseTrendAxisMaxLabel = `${exerciseTrendData
    .reduce((max, entry) => Math.max(max, entry.estimated1RM), exerciseTrendData[0]?.estimated1RM ?? 0)
    .toFixed(1)} kg`;
  const exerciseTrendAxisMinLabel = `${exerciseTrendData
    .reduce((min, entry) => Math.min(min, entry.estimated1RM), exerciseTrendData[0]?.estimated1RM ?? 0)
    .toFixed(1)} kg`;

  const coachInsight = (() => {
    if (weightTrendEntries.length === 0) {
      return {
        title: 'Start with a baseline weigh-in',
        detail: 'One weight entry unlocks trend coaching and makes progress easier to read.',
        weightLine: 'No weight logged yet',
        trainingLine: workoutVolumeData.length > 0 ? `${workoutVolumeData.length} workouts logged` : 'No workouts yet',
      };
    }

    const safeLatestTrendEntry = latestTrendEntry ?? weightTrendEntries[weightTrendEntries.length - 1]!;
    const safeLatestWorkoutEntry =
      latestWorkoutVolumeEntry ?? workoutVolumeData[workoutVolumeData.length - 1]!;
    const latestWeightDelta = previousTrendEntry ? safeLatestTrendEntry.weight - previousTrendEntry.weight : null;
    const latestWorkoutDelta = previousWorkoutVolumeEntry
      ? safeLatestWorkoutEntry.sessionVolume - previousWorkoutVolumeEntry.sessionVolume
      : null;
    const signedWeightDelta =
      latestWeightDelta === null
        ? null
        : `${latestWeightDelta >= 0 ? '+' : ''}${latestWeightDelta.toFixed(1)} kg`;
    const signedWorkoutDelta =
      latestWorkoutDelta === null
        ? null
        : `${latestWorkoutDelta >= 0 ? '+' : ''}${latestWorkoutDelta.toFixed(1)} kg`;

    return {
      title: latestWeightDelta !== null && latestWeightDelta <= 0 ? 'Weight is moving the right way' : 'Keep the trend moving',
      detail:
        signedWeightDelta !== null
          ? `Latest weight ${signedWeightDelta} since the previous check-in.`
          : 'Add another weigh-in to compare direction.',
      weightLine: `${safeLatestTrendEntry.weight.toFixed(1)} kg`,
      trainingLine:
        signedWorkoutDelta !== null
          ? `${safeLatestWorkoutEntry.sessionVolume.toLocaleString()} kg ${signedWorkoutDelta} vs previous`
          : `${safeLatestWorkoutEntry.sessionVolume.toLocaleString()} kg on latest session`,
    };
  })();


  const selectedExerciseStats = exerciseHistory.length > 0
    ? exerciseHistory.reduce(
        (best, current) => {
          const volume = current.weight * current.reps;
          const estimated1RM = current.weight * (1 + current.reps / 30);
          const bestVolume = best.bestVolumeSet.weight * best.bestVolumeSet.reps;
          const bestEstimated1RM = best.best1RMSet.weight * (1 + best.best1RMSet.reps / 30);

          return {
            maxWeightSet: current.weight > best.maxWeightSet.weight ? current : best.maxWeightSet,
            bestVolumeSet: volume > bestVolume ? current : best.bestVolumeSet,
            best1RMSet: estimated1RM > bestEstimated1RM ? current : best.best1RMSet,
          };
        },
        {
          maxWeightSet: exerciseHistory[0],
          bestVolumeSet: exerciseHistory[0],
          best1RMSet: exerciseHistory[0],
        }
      )
    : null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const handleSaveWeight = () => {
    if (isWeightDisabled) {
      return;
    }

    const now = new Date();
    addWeightEntry({
      id: `${Date.now()}`,
      date: formatDate(now),
      weight: parsedWeight,
      createdAt: now.toISOString(),
    });
    setWeight('');
  };

  const handleSaveMeasurement = () => {
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

  const confirmDeleteWeight = (entryId: string) => {
    Alert.alert(
      'Delete weight entry?',
      'This weight entry will be removed from progress history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWeightEntry(entryId),
        },
      ],
    );
  };

  const confirmDeleteMeasurement = (entryId: string) => {
    Alert.alert(
      'Delete measurement?',
      'This body measurement will be removed from progress history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBodyMeasurement(entryId),
        },
      ],
    );
  };


  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}>\n      <View style={styles.container}>\n        <SectionHeader title="Labs" subtitle="Analysis, progress, and body measurements" />\n\n        <ProgressSummaryCard\n          title="Coach insight"\n          rows={[\n            { label: coachInsight.title, value: coachInsight.weightLine },\n            { label: 'Direction', value: coachInsight.detail },\n            { label: 'Training', value: coachInsight.trainingLine },\n          ]}\n        />\n\n        <AddWeightEntryCard\n          isDisabled={isWeightDisabled}\n          onChangeWeight={setWeight}\n          onSave={handleSaveWeight}\n          weight={weight}\n        />\n\n        <ProgressSummaryCard\n          emptyMessage="Add a weight entry to see your latest summary."\n          title="Latest Weight Summary"\n          rows={\n            latestTrendEntry\n              ? [\n                  { label: 'Latest weight', value: `${latestTrendEntry.weight.toFixed(1)} kg` },\n                  {\n                    label: 'Change from previous',\n                    value: previousTrendEntry\n                      ? formatWeightDelta(\n                          calculateWeightDelta(latestTrendEntry.weight, previousTrendEntry.weight) ?? 0\n                        )\n                      : 'N/A',\n                  },\n                  {\n                    label: 'Change from first',\n                    value: firstTrendEntry\n                      ? formatWeightDelta(\n                          calculateWeightDelta(latestTrendEntry.weight, firstTrendEntry.weight) ?? 0\n                        )\n                      : 'N/A',\n                  },\n                ]\n              : []\n          }\n        />\n\n        <WeightTrendCard\n          isExpanded={isBodyWeightTrendExpanded}\n          onToggle={() => setIsBodyWeightTrendExpanded((current) => !current)}\n          title="Body Weight Trend">\n          <TrendChart\n            emptyLabel="Add at least two weight entries to see a trend."\n            maxLabel={weightTrendAxisMaxLabel}\n            minLabel={weightTrendAxisMinLabel}\n            points={weightTrendPoints}\n          />\n        </WeightTrendCard>\n\n        <WorkoutVolumeTrendCard\n          isExpanded={isWorkoutVolumeExpanded}\n          onToggle={() => setIsWorkoutVolumeExpanded((current) => !current)}\n          title="Workout Volume Trend"\n          summary={\n            latestWorkoutVolumeEntry ? (\n              <>\n                <View style={styles.trendSummaryRow}>\n                  <Text style={styles.label}>Latest workout volume</Text>\n                  <Text style={styles.value}>\n                    {latestWorkoutVolumeEntry.sessionVolume.toLocaleString()} kg\n                  </Text>\n                </View>\n                <View style={styles.trendSummaryRow}>\n                  <Text style={styles.label}>Change from previous</Text>\n                  <Text style={styles.value}>\n                    {previousWorkoutVolumeEntry\n                      ? formatWeightDelta(\n                          latestWorkoutVolumeEntry.sessionVolume -\n                            previousWorkoutVolumeEntry.sessionVolume\n                        )\n                      : 'N/A'}\n                  </Text>\n                </View>\n                <View style={styles.trendSummaryRow}>\n                  <Text style={styles.label}>Change from first</Text>\n                  <Text style={styles.value}>\n                    {firstWorkoutVolumeEntry\n                      ? formatWeightDelta(\n                          latestWorkoutVolumeEntry.sessionVolume - firstWorkoutVolumeEntry.sessionVolume\n                        )\n                      : 'N/A'}\n                  </Text>\n                </View>\n              </>\n            ) : null\n          }>\n          <TrendChart\n            emptyLabel="Complete at least two workouts to see volume trend."\n            maxLabel={workoutVolumeAxisMaxLabel}\n            minLabel={workoutVolumeAxisMinLabel}\n            points={workoutVolumePoints}\n          />\n        </WorkoutVolumeTrendCard>\n\n        <AddBodyMeasurementCard\n          isDisabled={isMeasurementDisabled}\n          measurementLabel={measurementLabel}\n          measurementValue={measurementValue}\n          onChangeLabel={setMeasurementLabel}\n          onChangeValue={setMeasurementValue}\n          onSave={handleSaveMeasurement}\n        />\n\n        <AppCard>\n          <Text style={styles.sectionTitle}>Weight history</Text>\n          {weightHistory.map((entry) => (\n            <View key={entry.id} style={styles.row}>\n              <View style={styles.rowText}>\n                <Text style={styles.label}>{entry.date}</Text>\n                <Text style={styles.value}>{entry.weight.toFixed(1)} kg</Text>\n              </View>\n              <AppButton\n                label="Delete"\n                onPress={() => confirmDeleteWeight(entry.id)}\n                variant="secondary"\n              />\n            </View>\n          ))}\n        </AppCard>\n\n        <AppCard>\n          <Pressable\n            onPress={() => setIsBodyMeasurementsExpanded((current) => !current)}\n            style={styles.collapsibleHeader}>\n            <Text style={styles.sectionTitle}>\n              {getSectionTitle('Body Measurements', isBodyMeasurementsExpanded)}\n            </Text>\n          </Pressable>\n\n          {isBodyMeasurementsExpanded ? (\n            bodyMeasurements.map((measurement) => (\n              <View key={measurement.id} style={styles.row}>\n                <View style={styles.rowText}>\n                  <Text style={styles.label}>{measurement.label}</Text>\n                  <Text style={styles.value}>{measurement.value}</Text>\n                </View>\n                <AppButton\n                  label="Delete"\n                  onPress={() => confirmDeleteMeasurement(measurement.id)}\n                  variant="secondary"\n                />\n              </View>\n            ))\n          ) : null}\n        </AppCard>\n\n        <AppCard>\n          <Pressable\n            onPress={() => setIsExerciseProgressExpanded((current) => !current)}\n            style={styles.collapsibleHeader}>\n            <Text style={styles.sectionTitle}>\n              {getSectionTitle('Exercise Progress', isExerciseProgressExpanded)}\n            </Text>\n          </Pressable>\n\n          {isExerciseProgressExpanded ? (\n            <>\n              <View style={styles.exercisePicker}>\n                {availableExercises.length > 0 ? (\n                  availableExercises.map((exerciseName) => {\n                    const isActive = selectedExercise === exerciseName;\n\n                    return (\n                      <AppButton\n                        key={exerciseName}\n                        label={exerciseName}\n                        onPress={() => setSelectedExercise(exerciseName)}\n                        variant={isActive ? 'secondary' : 'secondary'}\n                      />\n                    );\n                  })\n                ) : (\n                  <EmptyProgressState message="No exercises available yet." />\n                )}\n              </View>\n\n              {selectedExercise ? (\n                <>\n                  <Text style={styles.selectedExerciseTitle}>{selectedExerciseLabel}</Text>\n\n                  {exerciseHistory.length > 0 && selectedExerciseStats ? (\n                    <View style={styles.exerciseStats}>\n                      <View style={styles.exerciseStatRow}>\n                        <Text style={styles.label}>Max weight</Text>\n                        <Text style={styles.value}>\n                          {selectedExerciseStats.maxWeightSet.weight.toFixed(1)} kg\n                        </Text>\n                      </View>\n                      <View style={styles.exerciseStatRow}>\n                        <Text style={styles.label}>Best volume set</Text>\n                        <Text style={styles.value}>\n                          {selectedExerciseStats.bestVolumeSet.weight.toFixed(1)} kg x{' '}\n                          {selectedExerciseStats.bestVolumeSet.reps}\n                        </Text>\n                      </View>\n                      <View style={styles.exerciseStatRow}>\n                        <Text style={styles.label}>Total sets</Text>\n                        <Text style={styles.value}>{exerciseHistory.length}</Text>\n                      </View>\n                      <View style={styles.exerciseStatRow}>\n                        <Text style={styles.label}>Total volume</Text>\n                        <Text style={styles.value}>\n                          {exerciseHistory\n                            .reduce((total, set) => total + set.weight * set.reps, 0)\n                            .toLocaleString()}{' '}\n                          kg\n                        </Text>\n                      </View>\n                    </View>\n                  ) : (\n                    <EmptyProgressState message="No history for this exercise yet" />\n                  )}\n\n                  <Pressable\n                    onPress={() => setIsEstimated1RMExpanded((current) => !current)}\n                    style={styles.collapsibleHeader}>\n                    <Text style={styles.sectionTitle}>\n                      {getSectionTitle('Estimated 1RM Trend', isEstimated1RMExpanded)}\n                    </Text>\n                  </Pressable>\n\n                  {isEstimated1RMExpanded ? (\n                    <>\n                      <TrendChart\n                        emptyLabel="Add at least two workouts for this exercise to see a strength trend."\n                        maxLabel={exerciseTrendAxisMaxLabel}\n                        minLabel={exerciseTrendAxisMinLabel}\n                        points={exerciseTrendPoints}\n                      />\n\n                      {latestExerciseTrendEntry ? (\n                        <View style={styles.exerciseTrendSummary}>\n                          <View style={styles.exerciseTrendSummaryRow}>\n                            <Text style={styles.label}>Latest estimated 1RM</Text>\n                            <Text style={styles.value}>\n                              {latestExerciseTrendEntry.estimated1RM.toFixed(1)} kg\n                            </Text>\n                          </View>\n                          <View style={styles.exerciseTrendSummaryRow}>\n                            <Text style={styles.label}>Change from previous</Text>\n                            <Text style={styles.value}>\n                              {previousExerciseTrendEntry\n                                ? formatWeightDelta(\n                                    latestExerciseTrendEntry.estimated1RM -\n                                      previousExerciseTrendEntry.estimated1RM\n                                  )\n                                : 'N/A'}\n                            </Text>\n                          </View>\n                          <View style={styles.exerciseTrendSummaryRow}>\n                            <Text style={styles.label}>Change from first</Text>\n                            <Text style={styles.value}>\n                              {firstExerciseTrendEntry\n                                ? formatWeightDelta(\n                                    latestExerciseTrendEntry.estimated1RM -\n                                      firstExerciseTrendEntry.estimated1RM\n                                  )\n                                : 'N/A'}\n                            </Text>\n                          </View>\n                        </View>\n                      ) : null}\n                    </>\n                  ) : null}\n\n                  {exerciseHistory.length > 0 ? (\n                    <View style={styles.exerciseHistory}>\n                      {exerciseHistory.slice(0, 10).map((set, index) => (\n                        <View\n                          key={`${set.exerciseName}-${set.finishedAt}-${set.sessionIndex}-${set.setIndex}`}\n                          style={styles.historyRow}>\n                          <View style={styles.rowText}>\n                            <Text style={styles.label}>{formatShortDate(set.finishedAt)}</Text>\n                            <Text style={styles.value}>\n                              {set.weight.toFixed(1)} kg x {set.reps}\n                            </Text>\n                          </View>\n                        </View>\n                      ))}\n                    </View>\n                  ) : null}\n                </>\n              ) : null}\n            </>\n          ) : null}\n        </AppCard>\n      </View>\n    </ScrollView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    gap: Spacing.three,\n    maxWidth: MaxContentWidth,\n    width: '100%',\n  },\n  content: {\n    alignItems: 'center',\n    padding: Spacing.three,\n  },\n  collapsibleHeader: {\n    paddingBottom: Spacing.two,\n  },\n  emptyText: {\n    color: Colors.dark.textSecondary,\n    fontSize: 14,\n  },\n  exerciseHistory: {\n    gap: Spacing.two,\n  },\n  chartBar: {\n    borderRadius: 6,\n    minHeight: 24,\n    width: '100%',\n  },\n  chartBarColumn: {\n    alignItems: 'center',\n    flex: 1,\n    gap: 4,\n    minWidth: 0,\n  },\n  chartBarLabel: {\n    color: Colors.dark.textSecondary,\n    fontSize: 11,\n    textAlign: 'center',\n  },\n  chartBarTrack: {\n    backgroundColor: Colors.dark.border,\n    borderRadius: 8,\n    height: 96,\n    justifyContent: 'flex-end',\n    overflow: 'hidden',\n    padding: 2,\n    width: '100%',\n  },\n  chartBaseline: {\n    backgroundColor: Colors.dark.border,\n    bottom: 34,\n    height: 1,\n    left: 0,\n    opacity: 0.7,\n    position: 'absolute',\n    right: 0,\n  },\n  chartBars: {\n    flexDirection: 'row',\n    gap: 8,\n  },\n  chartContent: {\n    flex: 1,\n    position: 'relative',\n  },\n  chartRangeLabel: {\n    color: Colors.dark.textSecondary,\n    fontSize: 12,\n    fontVariant: ['tabular-nums'],\n    fontWeight: '700',\n  },\n  chartRangeRow: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    marginBottom: 6,\n  },\n  chartShell: {\n    marginTop: Spacing.one,\n  },\n  chartValueLabel: {\n    color: Colors.dark.text,\n    fontSize: 11,\n    fontVariant: ['tabular-nums'],\n    fontWeight: '800',\n  },\n  exerciseTrendBar: {\n    backgroundColor: Colors.dark.accent,\n    borderRadius: 6,\n    minHeight: 24,\n    width: '100%',\n  },\n  exerciseTrendBarColumn: {\n    alignItems: 'center',\n    flex: 1,\n    gap: Spacing.one,\n    minWidth: 0,\n  },\n  exerciseTrendBarLabel: {\n    color: Colors.dark.textSecondary,\n    fontSize: 11,\n    textAlign: 'center',\n  },\n  exerciseTrendBarTrack: {\n    backgroundColor: Colors.dark.border,\n    borderRadius: 8,\n    height: 100,\n    justifyContent: 'flex-end',\n    overflow: 'hidden',\n    padding: 2,\n    width: '100%',\n  },\n  exerciseTrendChart: {\n    flexDirection: 'row',\n    gap: 6,\n    marginTop: Spacing.one,\n  },\n  exerciseTrendSummary: {\n    gap: Spacing.two,\n    marginTop: Spacing.two,\n  },\n  exerciseTrendSummaryRow: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    gap: Spacing.two,\n  },\n  exercisePicker: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    gap: Spacing.two,\n  },\n  exerciseStatRow: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    gap: Spacing.two,\n  },\n  exerciseStats: {\n    gap: Spacing.two,\n  },\n  historyRow: {\n    borderColor: Colors.dark.border,\n    borderTopWidth: 1,\n    paddingTop: Spacing.two,\n  },\n  trendBar: {\n    backgroundColor: Colors.dark.accent,\n    borderRadius: 6,\n    minHeight: 24,\n    width: '100%',\n  },\n  trendBarColumn: {\n    alignItems: 'center',\n    flex: 1,\n    gap: Spacing.one,\n    minWidth: 0,\n  },\n  trendBarLabel: {\n    color: Colors.dark.textSecondary,\n    fontSize: 11,\n    textAlign: 'center',\n  },\n  trendBarTrack: {\n    backgroundColor: Colors.dark.border,\n    borderRadius: 8,\n    height: 100,\n    justifyContent: 'flex-end',\n    overflow: 'hidden',\n    padding: 2,\n    width: '100%',\n  },\n  trendChart: {\n    flexDirection: 'row',\n    gap: 6,\n  },\n  trendSummary: {\n    gap: Spacing.two,\n    marginTop: Spacing.two,\n  },\n  trendSummaryRow: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    gap: Spacing.two,\n  },\n  input: {\n    backgroundColor: Colors.dark.background,\n    borderColor: Colors.dark.border,\n    borderCurve: 'continuous',\n    borderRadius: 8,\n    borderWidth: 1,\n    color: Colors.dark.text,\n    fontSize: 16,\n    minHeight: 48,\n    paddingHorizontal: Spacing.two,\n  },\n  inputGrid: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    gap: Spacing.two,\n  },\n  inputGroup: {\n    flex: 1,\n    gap: Spacing.one,\n    minWidth: 130,\n  },\n  inputLabel: {\n    color: Colors.dark.textSecondary,\n    fontSize: 13,\n    fontWeight: '700',\n  },\n  label: {\n    color: Colors.dark.textSecondary,\n    fontSize: 15,\n  },\n  row: {\n    borderColor: Colors.dark.border,\n    borderTopWidth: 1,\n    gap: Spacing.two,\n    paddingTop: Spacing.two,\n  },\n  rowText: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    gap: Spacing.two,\n  },\n  selectedExerciseTitle: {\n    color: Colors.dark.text,\n    fontSize: 16,\n    fontWeight: '800',\n    marginBottom: Spacing.one,\n  },\n  screen: {\n    backgroundColor: Colors.dark.background,\n    flex: 1,\n  },\n  sectionTitle: {\n    color: Colors.dark.text,\n    fontSize: 18,\n    fontWeight: '800',\n  },\n  value: {\n    color: Colors.dark.text,\n    fontSize: 16,\n    fontVariant: ['tabular-nums'],\n    fontWeight: '800',\n  },\n});