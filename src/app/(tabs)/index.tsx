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
  const getSectionTitle = (title: string, isExpanded: boolean) => `${title} ${isExpanded ? '-' : '+'}`;
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
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 160 },
      ]}>
      <View style={styles.container}>
        <SectionHeader title="AI Coach" subtitle="Training, nutrition, and recovery at a glance" />

        <AppCard>
          <Text style={styles.sectionTitle}>Next best move</Text>
          <View style={styles.coachSummary}>
            <Text style={styles.coachTitle}>{nextBestMove.title}</Text>
            <Text style={styles.coachDetail}>{nextBestMove.detail}</Text>
            <View style={styles.coachNotes}>
              {secondaryCoachNotes.map((note) => (
                <Text key={note} style={styles.coachNote}>
                  {note}
                </Text>
              ))}
            </View>
            {nextBestMove.route ? (
              <AppButton
                label={nextBestMove.action}
                onPress={() => router.push(nextBestMove.route ?? '/labs')}
              />
            ) : null}
          </View>
        </AppCard>

        {!onboardingCompleted ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Quick Setup</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current weight</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setCurrentWeight}
                placeholder="82.7"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={currentWeight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target weight</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setTargetWeightInput}
                placeholder="75"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={targetWeightInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Training days per week</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setTrainingDaysPerWeekInput}
                placeholder="3"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={trainingDaysPerWeekInput}
              />
            </View>

            <Text style={styles.inputLabel}>Goal type</Text>
            <View style={styles.goalTypeRow}>
              <AppButton
                label="Lose fat"
                onPress={() => setGoalType('lose_fat')}
                variant={goalType === 'lose_fat' ? 'primary' : 'secondary'}
              />
              <AppButton
                label="Maintain"
                onPress={() => setGoalType('maintain')}
                variant={goalType === 'maintain' ? 'primary' : 'secondary'}
              />
              <AppButton
                label="Gain muscle"
                onPress={() => setGoalType('gain_muscle')}
                variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'}
              />
            </View>

            <AppButton disabled={!isSetupValid} label="Complete Setup" onPress={handleCompleteSetup} />
          </AppCard>
        ) : (
          <>
            <View style={styles.grid}>
              <MetricCard
                label="Today's calories"
                value={`${todaysNutrition.calories.toFixed(0)} / ${nutritionTargets.calories} kcal`}
                detail={`${Math.max(0, caloriesRemaining).toFixed(0)} kcal remaining`}
              />
              <MetricCard
                label="Protein"
                value={`${todaysNutrition.protein.toFixed(0)} / ${nutritionTargets.protein} g`}
                detail="today"
              />
              <MetricCard
                label="Carbs"
                value={`${todaysNutrition.carbs.toFixed(0)} / ${nutritionTargets.carbs} g`}
                detail="today"
              />
              <MetricCard
                label="Fats"
                value={`${todaysNutrition.fats.toFixed(0)} / ${nutritionTargets.fats} g`}
                detail="today"
              />
              <MetricCard
                label="Body weight"
                value={latestWeightLabel}
                detail={`Target ${targetWeightLabel}`}
              />
              <MetricCard
                label="Last workout"
                value={latestWorkoutSession?.workoutTitle ?? 'No sessions yet'}
                detail={
                  latestWorkoutSession
                    ? `${formatShortDate(latestWorkoutSession.finishedAt)} • ${latestWorkoutSession.sets.length} sets • ${latestWorkoutVolume.toFixed(0)} kg`
                    : 'Finish a workout to see history'
                }
              />
              <MetricCard
                label="Weekly training"
                value={`${workoutsThisWeek} / ${trainingGoal} workouts`}
                detail="last 7 days"
              />
            </View>

            <AppCard>
              <Text style={styles.sectionTitle}>Today Status</Text>
              <View style={styles.statusList}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Calories</Text>
                  <Text style={styles.statusValue}>{caloriesStatus}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Protein</Text>
                  <Text style={styles.statusValue}>{proteinStatus}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Training</Text>
                  <Text style={styles.statusValue}>{trainingStatus}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Weight</Text>
                  <Text style={styles.statusValue}>{weightStatus}</Text>
                </View>
              </View>
            </AppCard>

            <View style={styles.quickActions}>
              <AppButton label="Open Labs" onPress={() => router.push('/labs')} />
              <AppButton label="Open Track" onPress={() => router.push('/track')} variant="secondary" />
              <AppButton label="Open Eat" onPress={() => router.push('/eat')} variant="secondary" />
              <AppButton label="Open Profile" onPress={() => router.push('/profile')} variant="secondary" />
            </View>
          </>
        )}

        <AppCard>
          <Text style={styles.sectionTitle}>Product roadmap</Text>
          <View style={styles.planList}>
            {projectPlan.map((item) => (
              <View key={item.label} style={styles.planRow}>
                <Text style={styles.planLabel}>{item.label}</Text>
                <View style={styles.planContent}>
                  <Text style={styles.planTitle}>{item.title}</Text>
                  <Text style={styles.planDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </AppCard>
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
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  coachDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  coachNote: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coachNotes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  coachSummary: {
    gap: Spacing.two,
  },
  coachTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  quickActions: {
    gap: Spacing.two,
  },
  planContent: {
    flex: 1,
    gap: 4,
  },
  planDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  planLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    width: 48,
  },
  planList: {
    gap: Spacing.two,
  },
  planRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  planTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  goalTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  statusLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  statusList: {
    gap: Spacing.two,
  },
  statusRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  statusValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});