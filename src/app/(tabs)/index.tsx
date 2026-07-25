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

const getRussianRecoveryStatus = (status: string): string => {
  if (status === 'Overloaded') return 'Нужен отдых';
  if (status === 'Ready') return 'Готов';
  if (status === 'Recovering') return 'Восстановление';
  return 'Без критичных сигналов';
};

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
  const nutritionAdvisor = useMemo(
    () =>
      getNutritionAdvisor({
        entries: todaysFoodEntries,
        goalType: profile.goalType,
        targets: nutritionTargets,
      }),
    [nutritionTargets, profile.goalType, todaysFoodEntries],
  );
  const englishMotivation = getMotivationInsight({
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
  const motivation =
    locale === 'ru'
      ? recoveryAdvisor.status === 'Overloaded'
        ? 'Сегодня лучше снизить нагрузку и дать организму восстановиться.'
        : workoutsThisWeek >= profile.trainingDaysPerWeek
          ? 'Недельный план тренировок выполнен. Сосредоточьтесь на восстановлении.'
          : 'Выберите одно следующее действие и продолжайте двигаться по плану.'
      : englishMotivation;

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
    locale === 'ru'
      ? caloriesRemaining < 0
        ? `Превышение на ${caloriesRemainingDisplay} ${energyUnit}`
        : `Осталось ${caloriesRemainingDisplay} ${energyUnit}`
      : caloriesRemaining < 0
        ? `Over by ${caloriesRemainingDisplay} ${energyUnit}`
        : `${caloriesRemainingDisplay} ${energyUnit} left`;

  const activeWorkoutDraft = activeDraftReady ? getActiveWorkoutSessionDraft() : null;
  const activeWorkout = useMemo(() => activeWorkoutDraft, [activeWorkoutDraft]);
  const primaryWorkoutRoute = activeWorkout
    ? {
        pathname: '/workout-session' as const,
        params: { workoutId: activeWorkout.workoutId },
      }
    : '/track';
  const primaryWorkoutLabel =
    locale === 'ru'
      ? activeWorkout
        ? 'Продолжить тренировку'
        : 'Начать тренировку'
      : getHomePrimaryWorkoutActionLabel(activeWorkout);
  const volumePercent =
    weeklyVolumeTrend.previousVolume > 0
      ? Math.round(
          ((weeklyVolumeTrend.currentVolume - weeklyVolumeTrend.previousVolume) /
            weeklyVolumeTrend.previousVolume) *
            100,
        )
      : null;

  const snapshotItems = useMemo<HomeSnapshotItem[]>(
    () => [
      {
        id: 'workouts-this-week',
        label: locale === 'ru' ? 'Тренировки за неделю' : 'Workouts this week',
        value: `${workoutsThisWeek}`,
        detail:
          locale === 'ru'
            ? `Цель: ${profile.trainingDaysPerWeek}`
            : `Goal ${profile.trainingDaysPerWeek}`,
        tone:
          workoutsThisWeek >= profile.trainingDaysPerWeek ? 'positive' : 'neutral',
      },
      {
        id: 'training-volume',
        label: locale === 'ru' ? 'Тренировочный объём' : 'Training volume',
        value:
          locale === 'ru'
            ? volumePercent === null
              ? '—'
              : `${volumePercent > 0 ? '+' : ''}${volumePercent}%`
            : weeklyVolumeTrend.label,
        detail:
          locale === 'ru'
            ? volumePercent === null
              ? 'Недостаточно данных для сравнения'
              : 'По сравнению с прошлой неделей'
            : weeklyVolumeTrend.detail,
        tone:
          weeklyVolumeTrend.previousVolume > 0 &&
          weeklyVolumeTrend.currentVolume >= weeklyVolumeTrend.previousVolume
            ? 'positive'
            : 'neutral',
      },
      {
        id: 'recovery-status',
        label: locale === 'ru' ? 'Восстановление' : 'Recovery',
        value:
          locale === 'ru'
            ? getRussianRecoveryStatus(recoveryAdvisor.status)
            : recoveryAdvisor.status,
        detail:
          locale === 'ru'
            ? recoveryAdvisor.status === 'Overloaded'
              ? 'Снизьте нагрузку перед следующей тяжёлой тренировкой'
              : 'Критичных ограничений на сегодня нет'
            : recoveryAdvisor.recoveryExplanation,
        tone: recoveryAdvisor.status === 'Overloaded' ? 'warning' : 'neutral',
      },
    ],
    [
      locale,
      profile.trainingDaysPerWeek,
      recoveryAdvisor.recoveryExplanation,
      recoveryAdvisor.status,
      volumePercent,
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
          caloriesLabel={locale === 'ru' ? 'Калории' : 'Calories'}
          caloriesRemainingLabel={caloriesRemainingLabel}
          currentWeightLabel={currentWeightLabel}
          currentWeightTitle={locale === 'ru' ? 'Текущий вес' : 'Current weight'}
          isCaloriesOverTarget={caloriesRemaining < 0}
          kicker={locale === 'ru' ? 'Сегодня' : 'Today'}
          motivation={motivation}
          streakLabel={
            currentWorkoutStreak
              ? locale === 'ru'
                ? `${currentWorkoutStreak.days} дн.`
                : `${currentWorkoutStreak.days}-day streak`
              : undefined
          }
          streakTitle={locale === 'ru' ? 'Серия' : 'Streak'}
          title={locale === 'ru' ? 'Что важно сейчас' : 'What matters now'}
        />
        <QuickActionsCard
          primaryAction={{
            label: primaryWorkoutLabel,
            onPress: () => router.push(primaryWorkoutRoute),
          }}
          secondaryActions={[
            {
              label: locale === 'ru' ? 'Добавить еду' : 'Add food',
              onPress: () => router.push('/track'),
            },
            {
              label: locale === 'ru' ? 'Записать вес' : 'Log weight',
              onPress: () => router.push('/weight-entry'),
            },
          ]}
          title={locale === 'ru' ? 'Следующее действие' : 'Next action'}
        />
        <HomeSnapshotCard
          items={snapshotItems}
          subtitle={
            locale === 'ru'
              ? 'Тренировки, объём и восстановление.'
              : 'Workouts, training volume, and recovery.'
          }
          title={locale === 'ru' ? 'Сводка за неделю' : 'Weekly snapshot'}
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
