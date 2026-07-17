import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeSnapshotCard } from '@/components/home/HomeSnapshotCard';
import { HomeSummaryCard } from '@/components/home/HomeSummaryCard';
import { QuickActionsCard } from '@/components/ui/QuickActionsCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { formatLocalDate } from '@/lib';
import { getClampedProgress, sumNutritionTotals } from '@/lib/nutrition';
import { getProgressAnalytics } from '@/lib/progress';
import { getActiveWorkoutSessionDraft, getWorkoutPrograms, hydrateActiveWorkoutSessionDraft } from '@/lib/workouts';
import { getCurrentWorkoutStreak, getHomePrimaryWorkoutActionLabel, getWeeklyWorkoutCount, getWeeklyWorkoutVolumeTrend, type HomeSnapshotItem } from '@/lib/home';
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

  const currentProgram = useMemo(() => getWorkoutPrograms(workouts)[0], [workouts]);
  const currentWorkoutStreak = useMemo(() => getCurrentWorkoutStreak(workoutSessions), [workoutSessions]);
  const progressAnalytics = useMemo(() => getProgressAnalytics({ bodyMeasurements, exercises, weightHistory, workoutSessions }), [bodyMeasurements, exercises, weightHistory, workoutSessions]);
  const todaysFoodEntries = useMemo(() => foodEntries.filter((entry) => entry.date === todayKey), [foodEntries, todayKey]);
  const todaysNutrition = useMemo(() => sumNutritionTotals(todaysFoodEntries), [todaysFoodEntries]);
  const workoutsThisWeek = useMemo(() => getWeeklyWorkoutCount(workoutSessions, todayKey), [todayKey, workoutSessions]);
  const weeklyVolumeTrend = useMemo(() => getWeeklyWorkoutVolumeTrend(workoutSessions, todayKey), [todayKey, workoutSessions]);
  const recoveryAdvisor = useMemo(() => getRecoveryAdvisor({ exercises, workoutSessions, workouts }), [exercises, workoutSessions, workouts]);
  const trainingAdvisor = useMemo(() => getTrainingAdvisor({ exercises, program: currentProgram, workoutSessions, workouts }), [currentProgram, exercises, workoutSessions, workouts]);
  const programAdvisor = useMemo(() => getProgramAdvisor({ exercises, program: currentProgram, workouts }), [currentProgram, exercises, workouts]);
  const nutritionAdvisor = useMemo(() => getNutritionAdvisor({ entries: todaysFoodEntries, goalType: profile.goalType, targets: nutritionTargets }), [nutritionTargets, profile.goalType, todaysFoodEntries]);
  const motivation = getMotivationInsight({
    nutrition: nutritionAdvisor,
    recovery: recoveryAdvisor,
    training: trainingAdvisor,
    weeklyVolumeChangePercent: weeklyVolumeTrend.previousVolume > 0 ? ((weeklyVolumeTrend.currentVolume - weeklyVolumeTrend.previousVolume) / weeklyVolumeTrend.previousVolume) * 100 : null,
    weeklyWorkoutCount: workoutsThisWeek,
  });

  const latestWeightEntry = progressAnalytics.weight.currentWeightEntry;
  const currentWeightLabel = latestWeightEntry ? `${latestWeightEntry.weight.toFixed(1)} kg` : profile.weight || '—';
  const caloriesRemaining = nutritionTargets.calories - todaysNutrition.calories;
  const caloriesRemainingLabel = caloriesRemaining < 0 ? `Over by ${Math.abs(caloriesRemaining).toFixed(0)} kcal` : `${caloriesRemaining.toFixed(0)} kcal left`;

  const [currentWeightInput, setCurrentWeightInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(`${profile.targetWeight}`);
  const [goalType, setGoalType] = useState(profile.goalType);
  const [trainingDaysPerWeekInput, setTrainingDaysPerWeekInput] = useState(`${profile.trainingDaysPerWeek}`);
  const [activeDraftReady, setActiveDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveWorkoutSessionDraft().then(() => {
      if (!cancelled) {
        setActiveDraftReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeWorkoutDraft = activeDraftReady ? getActiveWorkoutSessionDraft() : null;
  const activeWorkout = useMemo(() => activeWorkoutDraft, [activeWorkoutDraft]);
  const primaryWorkoutRoute = activeWorkout
    ? { pathname: '/workout-session' as const, params: { workoutId: activeWorkout.workoutId } }
    : '/track';

  const handleOpenPrimaryWorkout = () => {
    router.push(primaryWorkoutRoute);
  };

  const parsedCurrentWeight = Number(currentWeightInput);
  const parsedTargetWeight = Number(targetWeightInput);
  const parsedTrainingDaysPerWeek = Number(trainingDaysPerWeekInput);
  const isSetupValid = Number.isFinite(parsedCurrentWeight) && parsedCurrentWeight > 0 && Number.isFinite(parsedTargetWeight) && parsedTargetWeight > 0 && Number.isFinite(parsedTrainingDaysPerWeek) && parsedTrainingDaysPerWeek >= 1 && parsedTrainingDaysPerWeek <= 7;

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
    const suggestedCalories = goalType === 'lose_fat' ? maintenanceCalories - 300 : goalType === 'gain_muscle' ? maintenanceCalories + 250 : maintenanceCalories;
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

  const snapshotItems = useMemo<HomeSnapshotItem[]>(
    () => [
      {
        id: 'workouts-this-week',
        label: 'Workouts this week',
        value: `${workoutsThisWeek}`,
        detail: `Goal ${profile.trainingDaysPerWeek}`,
        tone: workoutsThisWeek >= profile.trainingDaysPerWeek ? 'positive' : 'neutral',
      },
      {
        id: 'training-volume',
        label: 'Training volume',
        value: weeklyVolumeTrend.label,
        detail: weeklyVolumeTrend.detail,
        tone: weeklyVolumeTrend.previousVolume > 0 && weeklyVolumeTrend.currentVolume >= weeklyVolumeTrend.previousVolume ? 'positive' : 'neutral',
      },
      {
        id: 'recovery-status',
        label: 'Recovery',
        value: recoveryAdvisor.status,
        detail: recoveryAdvisor.recoveryExplanation,
        tone: recoveryAdvisor.status === 'Overloaded' ? 'warning' : 'neutral',
      },
    ],
    [profile.trainingDaysPerWeek, recoveryAdvisor.recoveryExplanation, recoveryAdvisor.status, weeklyVolumeTrend.currentVolume, weeklyVolumeTrend.detail, weeklyVolumeTrend.label, weeklyVolumeTrend.previousVolume, workoutsThisWeek],
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Home" />

        {!onboardingCompleted ? (
          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Welcome
            </Text>
            <Text selectable style={styles.setupHelp}>
              Set a baseline once and the app will personalize the essentials.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Starting weight</Text>
              <TextInput keyboardType="decimal-pad" onChangeText={setCurrentWeightInput} placeholder="82.7" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} value={currentWeightInput} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target weight</Text>
              <TextInput keyboardType="decimal-pad" onChangeText={setTargetWeightInput} placeholder="75" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} value={targetWeightInput} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Training days per week</Text>
              <TextInput keyboardType="number-pad" onChangeText={setTrainingDaysPerWeekInput} placeholder="3" placeholderTextColor={Colors.dark.textSecondary} style={styles.input} value={trainingDaysPerWeekInput} />
            </View>

            <Text style={styles.inputLabel}>Goal type</Text>
            <View style={styles.goalTypeRow}>
              <AppButton label="Lose fat" onPress={() => setGoalType('lose_fat')} variant={goalType === 'lose_fat' ? 'primary' : 'secondary'} />
              <AppButton label="Maintain" onPress={() => setGoalType('maintain')} variant={goalType === 'maintain' ? 'primary' : 'secondary'} />
              <AppButton label="Gain muscle" onPress={() => setGoalType('gain_muscle')} variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'} />
            </View>

            <AppButton disabled={!isSetupValid} label="Complete setup" onPress={handleCompleteSetup} />
          </AppCard>
        ) : (
          <>
            <HomeSummaryCard
              caloriesRemainingLabel={caloriesRemainingLabel}
              currentWeightLabel={currentWeightLabel}
              isCaloriesOverTarget={caloriesRemaining < 0}
              motivation={motivation}
              streakLabel={currentWorkoutStreak ? `${currentWorkoutStreak.days}-day streak` : undefined}
            />

            <QuickActionsCard
              primaryAction={{
                label: getHomePrimaryWorkoutActionLabel(activeWorkout),
                onPress: handleOpenPrimaryWorkout,
              }}
              secondaryActions={[
                { label: 'Add food', onPress: () => router.push('/track') },
                { label: 'Log weight', onPress: () => router.push('/weight-entry') },
              ]}
              title="Next action"
            />

            <HomeSnapshotCard items={snapshotItems} />
          </>
        )}
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
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.textPrimary,
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
    color: Colors.dark.textPrimary,
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
