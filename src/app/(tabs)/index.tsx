import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeSnapshotCard } from '@/components/home/HomeSnapshotCard';
import { HomeSummaryCard } from '@/components/home/HomeSummaryCard';
import { QuickActionsCard } from '@/components/ui/QuickActionsCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  getCurrentWorkoutStreak,
  getHomePrimaryWorkoutActionLabel,
  getWeeklyWorkoutCount,
  getWeeklyWorkoutVolumeTrend,
  type HomeSnapshotItem,
} from '@/lib/home';
import {
  getMotivationInsight,
  getNutritionAdvisor,
  getProgramAdvisor,
  getRecoveryAdvisor,
  getTrainingAdvisor,
} from '@/lib/intelligence';
import { formatLocalDate } from '@/lib';
import { sumNutritionTotals } from '@/lib/nutrition';
import { getProgressAnalytics } from '@/lib/progress';
import {
  getActiveWorkoutSessionDraft,
  getWorkoutPrograms,
  hydrateActiveWorkoutSessionDraft,
} from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { formatEnergyValue, formatWeightValue, useUnitPreferences } from '@/units';

export default function HomeScreen() {
  const {
    bodyMeasurements,
    exercises,
    foodEntries,
    nutritionTargets,
    onboardingCompleted,
    profile,
    weightHistory,
    workoutSessions,
    workouts,
  } = useAppContext();
  const { locale, t } = useLocalization();
  const { energy: energyUnit, weight: weightUnit } = useUnitPreferences();
  const safeAreaInsets = useSafeAreaInsets();
  const todayKey = formatLocalDate(new Date());
  const [activeDraftReady, setActiveDraftReady] = useState(false);
  const isRussian = locale === 'ru';

  useEffect(() => {
    if (!onboardingCompleted) router.replace('/onboarding');
  }, [onboardingCompleted]);

  useEffect(() => {
    let cancelled = false;
    void hydrateActiveWorkoutSessionDraft().then(() => {
      if (!cancelled) setActiveDraftReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentProgram = useMemo(() => getWorkoutPrograms(workouts)[0], [workouts]);
  const currentWorkoutStreak = useMemo(
    () => getCurrentWorkoutStreak(workoutSessions),
    [workoutSessions],
  );
  const progressAnalytics = useMemo(
    () =>
      getProgressAnalytics({
        bodyMeasurements,
        exercises,
        weightHistory,
        workoutSessions,
      }),
    [bodyMeasurements, exercises, weightHistory, workoutSessions],
  );
  const todaysFoodEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === todayKey),
    [foodEntries, todayKey],
  );
  const todaysNutrition = useMemo(
    () => sumNutritionTotals(todaysFoodEntries),
    [todaysFoodEntries],
  );
  const workoutsThisWeek = useMemo(
    () => getWeeklyWorkoutCount(workoutSessions, todayKey),
    [todayKey, workoutSessions],
  );
  const weeklyVolumeTrend = useMemo(
    () => getWeeklyWorkoutVolumeTrend(workoutSessions, todayKey),
    [todayKey, workoutSessions],
  );
  const recoveryAdvisor = useMemo(
    () => getRecoveryAdvisor({ exercises, workoutSessions, workouts }),
    [exercises, workoutSessions, workouts],
  );
  const trainingAdvisor = useMemo(
    () =>
      getTrainingAdvisor({
        exercises,
        program: currentProgram,
        workoutSessions,
        workouts,
      }),
    [currentProgram, exercises, workoutSessions, workouts],
  );
  const programAdvisor = useMemo(
    () => getProgramAdvisor({ exercises, program: currentProgram, workouts }),
    [currentProgram, exercises, workouts],
  );
  const nutritionAdvisor = useMemo(
    () =>
      getNutritionAdvisor({
        entries: todaysFoodEntries,
        goalType: profile.goalType,
        targets: nutritionTargets,
      }),
    [nutritionTargets, profile.goalType, todaysFoodEntries],
  );
  const motivation = getMotivationInsight({
    nutrition: nutritionAdvisor,
    recovery: recoveryAdvisor,
    training: trainingAdvisor,
    weeklyVolumeChangePercent:
      weeklyVolumeTrend.previousVolume > 0
        ? ((weeklyVolumeTrend.currentVolume - weeklyVolumeTrend.previousVolume) /
            weeklyVolumeTrend.previousVolume) *
          100
        : null,
    weeklyWorkoutCount: workoutsThisWeek,
  });

  const latestWeightEntry = progressAnalytics.weight.currentWeightEntry;
  const currentWeightLabel = latestWeightEntry
    ? `${formatWeightValue(latestWeightEntry.weight, weightUnit)} ${weightUnit}`
    : profile.weight
      ? `${formatWeightValue(Number(profile.weight), weightUnit)} ${weightUnit}`
      : '—';
  const caloriesRemaining = nutritionTargets.calories - todaysNutrition.calories;
  const caloriesRemainingDisplay = formatEnergyValue(
    Math.abs(caloriesRemaining),
    energyUnit,
  );
  const caloriesRemainingLabel =
    caloriesRemaining < 0
      ? isRussian
        ? `Превышение: ${caloriesRemainingDisplay} ${energyUnit}`
        : `Over by ${caloriesRemainingDisplay} ${energyUnit}`
      : isRussian
        ? `Осталось ${caloriesRemainingDisplay} ${energyUnit}`
        : `${caloriesRemainingDisplay} ${energyUnit} left`;

  const activeWorkoutDraft = activeDraftReady ? getActiveWorkoutSessionDraft() : null;
  const activeWorkout = useMemo(() => activeWorkoutDraft, [activeWorkoutDraft]);
  const primaryWorkoutRoute = activeWorkout
    ? {
        pathname: '/workout-session' as const,
        params: { workoutId: activeWorkout.workoutId },
      }
    : '/track';
  const primaryWorkoutLabel = isRussian
    ? activeWorkout
      ? 'Продолжить тренировку'
      : 'Начать тренировку'
    : getHomePrimaryWorkoutActionLabel(activeWorkout);

  const snapshotItems = useMemo<HomeSnapshotItem[]>(
    () => [
      {
        id: 'workouts-this-week',
        label: isRussian ? 'Тренировки за неделю' : 'Workouts this week',
        value: `${workoutsThisWeek}`,
        detail: isRussian
          ? `Цель: ${profile.trainingDaysPerWeek}`
          : `Goal ${profile.trainingDaysPerWeek}`,
        tone: workoutsThisWeek >= profile.trainingDaysPerWeek ? 'positive' : 'neutral',
      },
      {
        id: 'training-volume',
        label: isRussian ? 'Объём тренинга' : 'Training volume',
        value: weeklyVolumeTrend.label,
        detail: isRussian ? 'Сравнение с прошлой неделей' : weeklyVolumeTrend.detail,
        tone:
          weeklyVolumeTrend.previousVolume > 0 &&
          weeklyVolumeTrend.currentVolume >= weeklyVolumeTrend.previousVolume
            ? 'positive'
            : 'neutral',
      },
      {
        id: 'recovery-status',
        label: isRussian ? 'Восстановление' : 'Recovery',
        value: isRussian
          ? recoveryAdvisor.status === 'Overloaded'
            ? 'Перегрузка'
            : 'Готов'
          : recoveryAdvisor.status,
        detail: isRussian ? 'По последним тренировкам' : recoveryAdvisor.recoveryExplanation,
        tone: recoveryAdvisor.status === 'Overloaded' ? 'warning' : 'neutral',
      },
    ],
    [
      isRussian,
      profile.trainingDaysPerWeek,
      recoveryAdvisor.recoveryExplanation,
      recoveryAdvisor.status,
      weeklyVolumeTrend.currentVolume,
      weeklyVolumeTrend.detail,
      weeklyVolumeTrend.label,
      weeklyVolumeTrend.previousVolume,
      workoutsThisWeek,
    ],
  );

  if (!onboardingCompleted) return <View style={styles.screen} />;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title={t('tabs.home')} />
        <HomeSummaryCard
          caloriesLabel={isRussian ? 'Калории' : 'Calories'}
          caloriesRemainingLabel={caloriesRemainingLabel}
          currentWeightLabel={currentWeightLabel}
          currentWeightTitle={isRussian ? 'Текущий вес' : 'Current weight'}
          isCaloriesOverTarget={caloriesRemaining < 0}
          motivation={
            isRussian ? 'Выберите одно действие и продолжайте по плану.' : motivation
          }
          streakLabel={
            currentWorkoutStreak
              ? isRussian
                ? `${currentWorkoutStreak.days} дн.`
                : `${currentWorkoutStreak.days}-day streak`
              : undefined
          }
          streakTitle={isRussian ? 'Серия' : 'Streak'}
          title={isRussian ? 'Главное на сегодня' : 'What matters now'}
          todayLabel={isRussian ? 'Сегодня' : 'Today'}
        />
        <QuickActionsCard
          primaryAction={{
            label: primaryWorkoutLabel,
            onPress: () => router.push(primaryWorkoutRoute),
          }}
          secondaryActions={[
            {
              label: isRussian ? 'Добавить еду' : 'Add food',
              onPress: () => router.push('/track'),
            },
            {
              label: isRussian ? 'Записать вес' : 'Log weight',
              onPress: () => router.push('/weight-entry'),
            },
          ]}
          title={isRussian ? 'Следующее действие' : 'Next action'}
        />
        <HomeSnapshotCard
          items={snapshotItems}
          subtitle={
            isRussian
              ? 'Тренировки, восстановление и недельный объём.'
              : 'Workouts, recovery, and weekly volume.'
          }
          title={isRussian ? 'Сводка за неделю' : 'Weekly snapshot'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', padding: Spacing.three },
  container: { gap: Spacing.three, maxWidth: MaxContentWidth, width: '100%' },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
});
