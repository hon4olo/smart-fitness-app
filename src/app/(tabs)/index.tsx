import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { QuickActionsCard } from '@/components/ui/QuickActionsCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { formatLocalDate, formatShortDate } from '@/lib';
import { getLatestWeightEntry } from '@/lib/progress';
import {
  getLatestWorkoutSession,
  getSessionVolume,
  getWeeklyWorkoutCount,
} from '@/lib/workouts';
import { sumNutritionTotals } from '@/lib/nutrition';

type PlanItem = {
  label: string;
  title: string;
  detail: string;
};

const projectPlan: PlanItem[] = [
  {
    label: 'Now',
    title: 'Track and Eat data entry',
    detail: 'Keep workout logging, meals, and progress capture stable.',
  },
  {
    label: 'Next',
    title: 'AI Coach guidance',
    detail: 'Add explainable feedback for training, nutrition, and recovery.',
  },
  {
    label: 'Then',
    title: 'Labs and body measurements',
    detail: 'Surface progress insights before adding deeper learning modes.',
  },
  {
    label: 'Later',
    title: 'Learn-on-demand, customization, premium coaching',
    detail: 'Keep learning secondary while the coach and analytics mature.',
  },
];

export default function AICoachScreen() {
  const {
    completeOnboarding,
    foodEntries,
    nutritionTargets,
    onboardingCompleted,
    profile,
    updateNutritionTargets,
    weightHistory,
    bodyMeasurements,
    workoutSessions,
  } = useAppContext();
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(`${profile.targetWeight}`);
  const [goalType, setGoalType] = useState(profile.goalType);
  const [trainingDaysPerWeekInput, setTrainingDaysPerWeekInput] = useState(
    `${profile.trainingDaysPerWeek}`
  );
  const safeAreaInsets = useSafeAreaInsets();
  const latestWeight = getLatestWeightEntry(weightHistory);
  const today = formatLocalDate(new Date());
  const todaysFoodEntries = foodEntries.filter((entry) => entry.date === today);
  const todaysNutrition = sumNutritionTotals(todaysFoodEntries);
  const latestWorkoutSession = getLatestWorkoutSession(workoutSessions);
  const latestWorkoutVolume = latestWorkoutSession ? getSessionVolume(latestWorkoutSession) : 0;
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workoutsThisWeek = getWeeklyWorkoutCount(workoutSessions, weekStart);
  const trainingGoal = profile.trainingDaysPerWeek;
  const latestWeightLabel = latestWeight
    ? `${latestWeight.weight.toFixed(1)} kg`
    : 'No weight yet';
  const targetWeightLabel = `${profile.targetWeight.toFixed(1)} kg`;
  const caloriesRemaining = nutritionTargets.calories - todaysNutrition.calories;
  const proteinRemaining = nutritionTargets.protein - todaysNutrition.protein;
  const weightDistance = latestWeight ? profile.targetWeight - latestWeight.weight : null;
  const weeklyTrainingDelta = trainingGoal - workoutsThisWeek;
  const caloriesStatus =
    caloriesRemaining < 0
      ? `${Math.abs(caloriesRemaining).toFixed(0)} kcal over target`
      : `${caloriesRemaining.toFixed(0)} kcal remaining today`;
  const proteinStatus =
    proteinRemaining <= 0
      ? 'Protein target reached'
      : `${proteinRemaining.toFixed(0)} g protein remaining today`;
  const trainingStatus =
    weeklyTrainingDelta < 0
      ? `Weekly training goal exceeded by ${Math.abs(weeklyTrainingDelta)} workouts`
      : `${workoutsThisWeek} / ${trainingGoal} workouts this week`;
  const nextBestMove = (() => {
    if (!onboardingCompleted) {
      return {
        title: 'Complete setup first',
        detail: 'Add your baseline weight and goals so AI Coach can calibrate targets.',
        action: 'Finish Quick Setup',
        route: null as string | null,
      };
    }

    if (weightHistory.length === 0) {
      return {
        title: 'Log your baseline weight',
        detail: 'A first weigh-in lets Coach compare progress against your target.',
        action: 'Open Labs',
        route: '/labs',
      };
    }

    if (todaysFoodEntries.length === 0) {
      return {
        title: 'Log today’s meals',
        detail: 'Nutrition guidance is strongest when the app sees a full day of food data.',
        action: 'Open Eat',
        route: '/eat',
      };
    }

    if (workoutsThisWeek < trainingGoal) {
      return {
        title: 'Schedule one more workout',
        detail: `You’re at ${workoutsThisWeek} of ${trainingGoal} weekly sessions.`,
        action: 'Open Track',
        route: '/track',
      };
    }

    if (bodyMeasurements.length === 0) {
      return {
        title: 'Capture body measurements',
        detail: 'Waist, chest, and hips help Labs show change even when scale weight stalls.',
        action: 'Open Labs',
        route: '/labs',
      };
    }

    return {
      title: 'Maintain the current rhythm',
      detail: 'You’ve logged the core data. Keep the streak alive and refine targets from Labs.',
      action: 'Open Labs',
      route: '/labs',
    };
  })();
  const secondaryCoachNotes = [
    `Calories: ${caloriesStatus}`,
    `Protein: ${proteinStatus}`,
    `Training: ${trainingStatus}`,
  ];
  const weightStatus =
    weightDistance === null
      ? 'No weight logged yet'
      : weightDistance < 0
        ? `${Math.abs(weightDistance).toFixed(1)} kg over target weight`
        : `${weightDistance.toFixed(1)} kg to target weight`;
  const parsedCurrentWeight = Number(currentWeight);
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

    if (
      !Number.isFinite(parsedTrainingDaysPerWeek) ||
      parsedTrainingDaysPerWeek < 1 ||
      parsedTrainingDaysPerWeek > 7
    ) {
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
      goalType === 'lose_fat'
        ? maintenanceCalories - 300
        : goalType === 'gain_muscle'
          ? maintenanceCalories + 250
          : maintenanceCalories;
    const suggestedProtein = Math.round(parsedCurrentWeight * 2.0);
    const suggestedFats = Math.round(parsedCurrentWeight * 0.8);
    const suggestedCaloriesRounded = Math.round(suggestedCalories / 10) * 10;
    const suggestedCarbs = Math.max(
      0,
      Math.round((suggestedCaloriesRounded - suggestedProtein * 4 - suggestedFats * 9) / 4)
    );

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
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 160 },
      ]}>
      <View style={styles.container}>
        <SectionHeader title="AI Coach" subtitle="Home dashboard for today’s training, nutrition, and progress" />

        <AppCard>
          <Text style={styles.sectionTitle}>Today at a glance</Text>
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
            <Text style={styles.setupHelp}>Set your starting point once so Coach can personalize targets.</Text>

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
                label="Today’s calories"
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

            <QuickActionsCard
              title="Today actions"
              subtitle="Start training, then log food or update progress in one tap."
              primaryAction={{ label: 'Start Workout', onPress: () => router.push('/track') }}
              secondaryActions={[
                { label: 'Log food', onPress: () => router.push('/eat') },
                { label: 'Add weight', onPress: () => router.push('/progress') },
                { label: 'View progress', onPress: () => router.push('/progress') },
              ]}
            />
          </>
        )}

        <AppCard>
          <Text style={styles.sectionTitle}>Roadmap</Text>
          <Text style={styles.roadmapHelp}>Reference only — not part of today’s main flow.</Text>
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
  roadmapHelp: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
  },
  setupHelp: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
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