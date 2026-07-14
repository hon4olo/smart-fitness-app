import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeActivityCard } from '@/components/home/HomeActivityCard';
import { HomeIntelligenceCard } from '@/components/home/HomeIntelligenceCard';
import { HomeSnapshotCard } from '@/components/home/HomeSnapshotCard';
import { HomeSummaryCard } from '@/components/home/HomeSummaryCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { QuickActionsCard } from '@/components/ui/QuickActionsCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { formatLocalDate } from '@/lib';
import { getClampedProgress, sumNutritionTotals } from '@/lib/nutrition';
import { getProgressAnalytics, formatProgressDelta } from '@/lib/progress';
import {
  getCurrentWorkoutStreak,
  getRecentActivityItems,
  getWeeklyCaloriesAverage,
  getWeeklyWorkoutCount,
  getWeeklyWorkoutVolumeTrend,
  type HomeSnapshotItem,
} from '@/lib/home';
import { getLatestWorkoutSession, createDefaultTrainingProgram } from '@/lib/workouts';
import { getMotivationInsight, getNutritionAdvisor, getProgramAdvisor, getRecoveryAdvisor, getTrainingAdvisor } from '@/lib/intelligence';

export default function HomeScreen() {
  const {
    bodyMeasurements,
    completeOnboarding,
    exercises,
    foodEntries,
    nutritionTargets,
    onboardingCompleted,
    profile,
    updateNutritionTargets,
    weightHistory,
    workoutSessions,
    workouts,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const todayKey = formatLocalDate(new Date());
  const currentWorkout = useMemo(() => getLatestWorkoutSession(workoutSessions), [workoutSessions]);
  const currentWorkoutStreak = useMemo(() => getCurrentWorkoutStreak(workoutSessions), [workoutSessions]);
  const currentProgram = useMemo(() => createDefaultTrainingProgram(workouts), [workouts]);
  const progressAnalytics = useMemo(
    () =>
      getProgressAnalytics({
        bodyMeasurements,
        exercises,
        weightHistory,
        workoutSessions,
      }),
    [bodyMeasurements, exercises, weightHistory, workoutSessions]
  );
  const latestWeightEntry = progressAnalytics.weight.currentWeightEntry;
  const todaysFoodEntries = useMemo(() => foodEntries.filter((entry) => entry.date === todayKey), [foodEntries, todayKey]);
  const todaysNutrition = useMemo(() => sumNutritionTotals(todaysFoodEntries), [todaysFoodEntries]);
  const workoutsThisWeek = useMemo(() => getWeeklyWorkoutCount(workoutSessions, todayKey), [todayKey, workoutSessions]);
  const weeklyCaloriesAverage = useMemo(() => getWeeklyCaloriesAverage(foodEntries, todayKey), [foodEntries, todayKey]);
  const weeklyVolumeTrend = useMemo(() => getWeeklyWorkoutVolumeTrend(workoutSessions, todayKey), [todayKey, workoutSessions]);
  const recoveryAdvisor = useMemo(() => getRecoveryAdvisor({ exercises, workoutSessions, workouts }), [exercises, workoutSessions, workouts]);
  const trainingAdvisor = useMemo(() => getTrainingAdvisor({ exercises, program: currentProgram, workoutSessions, workouts }), [currentProgram, exercises, workoutSessions, workouts]);
  const programAdvisor = useMemo(() => getProgramAdvisor({ exercises, program: currentProgram, workouts }), [currentProgram, exercises, workouts]);
  const nutritionAdvisor = useMemo(() => getNutritionAdvisor({ entries: todaysFoodEntries, goalType: profile.goalType, targets: nutritionTargets }), [nutritionTargets, profile.goalType, todaysFoodEntries]);
  const recentActivityItems = useMemo(
    () =>
      getRecentActivityItems({
        foodEntries,
        latestPrs: progressAnalytics.latestPrs,
        weightHistory,
        workoutSessions,
      }),
    [foodEntries, progressAnalytics.latestPrs, weightHistory, workoutSessions]
  );
  const currentWeightLabel = latestWeightEntry ? `${latestWeightEntry.weight.toFixed(1)} kg` : profile.weight || '—';
  const latestWorkoutLabel = currentWorkout ? currentWorkout.workoutTitle : 'No workouts yet';
  const streakLabel = currentWorkoutStreak ? `${currentWorkoutStreak.days}-day streak` : undefined;
  const caloriesRemaining = nutritionTargets.calories - todaysNutrition.calories;
  const caloriesRemainingLabel = caloriesRemaining < 0 ? `Over by ${Math.abs(caloriesRemaining).toFixed(0)} kcal` : `${caloriesRemaining.toFixed(0)} kcal remaining`;
  const caloriesOverTarget = caloriesRemaining < 0;
  const nutritionCompletionLabel = `${Math.round(getClampedProgress(todaysNutrition.calories, nutritionTargets.calories) * 100)}% today`;
  const workoutCompletionLabel = workoutSessions.some((session) => formatLocalDate(new Date(session.finishedAt)) === todayKey)
    ? 'Completed today'
    : 'Pending today';
  const weeklyVolumeChangePercent =
    weeklyVolumeTrend.previousVolume > 0 ? ((weeklyVolumeTrend.currentVolume - weeklyVolumeTrend.previousVolume) / weeklyVolumeTrend.previousVolume) * 100 : null;
  const motivation = getMotivationInsight({
    nutrition: nutritionAdvisor,
    recovery: recoveryAdvisor,
    training: trainingAdvisor,
    weeklyVolumeChangePercent,
    weeklyWorkoutCount: workoutsThisWeek,
  });
  const primaryIntelligenceRecommendation =
    nutritionAdvisor.primaryRecommendation !== 'Macro balance looks good'
      ? nutritionAdvisor.primaryRecommendation
      : recoveryAdvisor.status === 'Overloaded'
        ? `${recoveryAdvisor.recommendedWaitTime} before your next hard workout`
        : trainingAdvisor.primaryRecommendation !== 'Maintain current program'
          ? trainingAdvisor.primaryRecommendation
          : programAdvisor.primaryRecommendation;

  const snapshotItems = useMemo<HomeSnapshotItem[]>(
    () => [
      {
        id: 'workouts',
        label: 'Workouts this week',
        value: `${workoutsThisWeek}`,
        detail: `Goal ${profile.trainingDaysPerWeek}`,
        tone: workoutsThisWeek >= profile.trainingDaysPerWeek ? 'positive' : 'neutral',
      },
      {
        id: 'average-calories',
        label: 'Average calories',
        value: weeklyCaloriesAverage !== null ? `${weeklyCaloriesAverage.toFixed(0)} kcal` : '—',
        detail: 'Last 7 days',
        tone: weeklyCaloriesAverage !== null && weeklyCaloriesAverage <= nutritionTargets.calories ? 'positive' : 'neutral',
      },
      {
        id: 'weight-trend',
        label: 'Weight trend',
        value: progressAnalytics.weight.delta30Days !== null ? formatProgressDelta(progressAnalytics.weight.delta30Days, 'kg') : '—',
        detail: progressAnalytics.weight.currentWeightEntry ? 'Compared with 30 days ago' : 'No weight trend yet',
        tone: progressAnalytics.weight.delta30Days !== null && progressAnalytics.weight.delta30Days < 0 ? 'positive' : 'warning',
      },
      {
        id: 'volume-trend',
        label: 'Training volume',
        value: weeklyVolumeTrend.label,
        detail: weeklyVolumeTrend.detail,
        tone: weeklyVolumeTrend.previousVolume > 0 && weeklyVolumeTrend.currentVolume >= weeklyVolumeTrend.previousVolume ? 'positive' : 'neutral',
      },
    ],
    [nutritionTargets.calories, profile.trainingDaysPerWeek, progressAnalytics.weight.currentWeightEntry, progressAnalytics.weight.delta30Days, weeklyCaloriesAverage, weeklyVolumeTrend.currentVolume, weeklyVolumeTrend.detail, weeklyVolumeTrend.previousVolume, workoutsThisWeek]
  );

  const primaryWorkoutRoute = currentWorkout
    ? {
        pathname: '/workout-session' as const,
        params: { workoutId: currentWorkout.workoutId },
      }
    : '/track';

  const handleOpenPrimaryWorkout = () => {
    if (currentWorkout) {
      router.push(primaryWorkoutRoute);
      return;
    }

    router.push('/track');
  };

  const [currentWeightInput, setCurrentWeightInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(`${profile.targetWeight}`);
  const [goalType, setGoalType] = useState(profile.goalType);
  const [trainingDaysPerWeekInput, setTrainingDaysPerWeekInput] = useState(`${profile.trainingDaysPerWeek}`);

  const parsedCurrentWeight = Number(currentWeightInput);
  const parsedTargetWeight = Number(targetWeightInput);
  const parsedTrainingDaysPerWeek = Number(trainingDaysPerWeekInput);
  const isSetupValid =
    Number.isFinite(parsedCurrentWeight) &&
    parsedCurrentWeight > 0 &&
    Number.isFinite(parsedTargetWeight) &&
    parsedTargetWeight > 0 &&
    Number.isFinite(parsedTrainingDaysPerWeek) &&
    parsedTrainingDaysPerWeek >= 1 &&
    parsedTrainingDaysPerWeek <= 7;

  const handleCompleteSetup = () => {
    if (!Number.isFinite(parsedCurrentWeight) || parsedCurrentWeight <= 0) {
      Alert.alert('Invalid input', 'Enter a valid current weight.');
      return;
    }

    if (!Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0) {
      Alert.alert('Invalid input', 'Enter a valid target weight.');
      return;
    }

    if (!Number.isFinite(parsedTrainingDaysPerWeek) || parsedTrainingDaysPerWeek < 1 || parsedTrainingDaysPerWeek > 7) {
      Alert.alert('Invalid input', 'Enter training days per week between 1 and 7.');
      return;
    }

    completeOnboarding({
      currentWeight: parsedCurrentWeight,
      goalType,
      targetWeight: parsedTargetWeight,
      trainingDaysPerWeek: parsedTrainingDaysPerWeek,
    });

    const maintenanceCalories = parsedCurrentWeight * 33;
    const suggestedCalories =
      goalType === 'lose_fat' ? maintenanceCalories - 300 : goalType === 'gain_muscle' ? maintenanceCalories + 250 : maintenanceCalories;
    const suggestedProtein = Math.round(parsedCurrentWeight * 2.0);
    const suggestedFats = Math.round(parsedCurrentWeight * 0.8);
    const suggestedCaloriesRounded = Math.round(suggestedCalories / 10) * 10;
    const suggestedCarbs = Math.max(0, Math.round((suggestedCaloriesRounded - suggestedProtein * 4 - suggestedFats * 9) / 4));

    updateNutritionTargets({
      calories: suggestedCaloriesRounded,
      protein: suggestedProtein,
      carbs: suggestedCarbs,
      fats: suggestedFats,
    });

    Alert.alert('Setup complete', 'Your dashboard is ready.');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Home" subtitle="Today’s fitness dashboard" />

        <HomeSummaryCard
          caloriesRemainingLabel={caloriesRemainingLabel}
          currentWeightLabel={currentWeightLabel}
          isCaloriesOverTarget={caloriesOverTarget}
          latestWorkoutLabel={latestWorkoutLabel}
          motivation={motivation}
          nutritionCompletionLabel={nutritionCompletionLabel}
          streakLabel={streakLabel}
          workoutCompletionLabel={workoutCompletionLabel}
        />

        <HomeIntelligenceCard
          motivation={motivation}
          nutritionDetail={`${Math.round(nutritionAdvisor.caloriesRemaining)} kcal remaining · ${nutritionAdvisor.macroBalance}`}
          nutritionStatus={nutritionAdvisor.status}
          primaryRecommendation={primaryIntelligenceRecommendation}
          recoveryDetail={recoveryAdvisor.recoveryExplanation}
          recoveryStatus={recoveryAdvisor.status}
          trainingFocus={trainingAdvisor.primaryRecommendation}
        />

        <QuickActionsCard
          primaryAction={{
            label: currentWorkout ? 'Continue Workout' : 'Start Workout',
            onPress: handleOpenPrimaryWorkout,
          }}
          secondaryActions={[
            { label: 'Add Food', onPress: () => router.push('/eat') },
            { label: 'Log Weight', onPress: () => router.push('/progress') },
          ]}
          subtitle="One primary action, then quick logging shortcuts."
          title="Quick actions"
        />

        <HomeActivityCard items={recentActivityItems} />

        <HomeSnapshotCard items={snapshotItems} />

        {!onboardingCompleted ? (
          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Quick setup
            </Text>
            <Text selectable style={styles.setupHelp}>
              Set your baseline once so the dashboard can personalize calories and streak goals.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current weight</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setCurrentWeightInput}
                placeholder="82.7"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={currentWeightInput}
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
              <AppButton label="Lose fat" onPress={() => setGoalType('lose_fat')} variant={goalType === 'lose_fat' ? 'primary' : 'secondary'} />
              <AppButton label="Maintain" onPress={() => setGoalType('maintain')} variant={goalType === 'maintain' ? 'primary' : 'secondary'} />
              <AppButton label="Gain muscle" onPress={() => setGoalType('gain_muscle')} variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'} />
            </View>

            <AppButton disabled={!isSetupValid} label="Complete Setup" onPress={handleCompleteSetup} />
          </AppCard>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
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
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  setupHelp: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
  },
});
