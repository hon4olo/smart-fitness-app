import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatWorkoutDate = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const getWorkoutTimestamp = (session: { finishedAt?: string; startedAt?: string }) => {
  const source = session.finishedAt ?? session.startedAt;

  if (!source) {
    return 0;
  }

  const parsed = new Date(source);

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

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

export default function HomeScreen() {
  const {
    completeOnboarding,
    foodEntries,
    nutritionTargets,
    onboardingCompleted,
    profile,
    updateNutritionTargets,
    weightHistory,
    workoutSessions,
  } = useAppContext();
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(`${profile.targetWeight}`);
  const [goalType, setGoalType] = useState(profile.goalType);
  const [trainingDaysPerWeekInput, setTrainingDaysPerWeekInput] = useState(
    `${profile.trainingDaysPerWeek}`
  );
  const safeAreaInsets = useSafeAreaInsets();
  const latestWeight = weightHistory[0];
  const today = formatLocalDate(new Date());
  const todaysFoodEntries = foodEntries.filter((entry) => entry.date === today);
  const todaysNutrition = todaysFoodEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
  const latestWorkoutSession = [...workoutSessions].sort((a, b) => getWorkoutTimestamp(a) - getWorkoutTimestamp(b)).at(-1);
  const latestWorkoutVolume = latestWorkoutSession
    ? latestWorkoutSession.sets.reduce((total, set) => total + set.weight * set.reps, 0)
    : 0;
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workoutsThisWeek = workoutSessions.filter((session) => getWorkoutTimestamp(session) >= weekStart).length;
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
        <SectionHeader title="AI Coach" subtitle="Today at a glance" />

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
                    ? `${formatWorkoutDate(latestWorkoutSession.finishedAt)} • ${latestWorkoutSession.sets.length} sets • ${latestWorkoutVolume.toFixed(0)} kg`
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

