import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeSnapshotCard } from '@/components/home/HomeSnapshotCard';
import { HomeSummaryCard } from '@/components/home/HomeSummaryCard';
import { QuickActionsCard } from '@/components/ui/QuickActionsCard';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  getHomeMotivationLabel,
  getHomeRecoveryStatusLabel,
} from '@/features/home/homeLocalization';
import {
  getCurrentWorkoutStreak,
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
import { formatPlural, useLocalization } from '@/localization';
import {
  formatEnergyValue,
  formatWeightValue,
  useUnitPreferences,
  weightFromKg,
} from '@/units';

export default function HomeScreen() {
  const {
    bodyMeasurements,
    exercises,
    foodEntries,
    isRestoringState,
    nutritionTargets,
    onboardingCompleted,
    profile,
    weightHistory,
    workoutSessions,
    workouts,
  } = useAppContext();
  const { formatNumber, locale, t } = useLocalization();
  const { energy: energyUnit, weight: weightUnit } = useUnitPreferences();
  const safeAreaInsets = useSafeAreaInsets();
  const todayKey = formatLocalDate(new Date());
  const [activeDraftReady, setActiveDraftReady] = useState(false);

  useEffect(() => {
    if (isRestoringState) return;
    if (!onboardingCompleted) router.replace('/auth');
  }, [isRestoringState, onboardingCompleted]);

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
  const caloriesRemainingLabel = t(
    caloriesRemaining < 0 ? 'home.caloriesOver' : 'home.caloriesLeft',
    { unit: energyUnit, value: caloriesRemainingDisplay },
  );

  const activeWorkoutDraft = activeDraftReady ? getActiveWorkoutSessionDraft() : null;
  const activeWorkout = useMemo(() => activeWorkoutDraft, [activeWorkoutDraft]);
  const primaryWorkoutRoute = activeWorkout
    ? {
        pathname: '/workout-session' as const,
        params: { workoutId: activeWorkout.workoutId },
      }
    : '/(tabs)/workouts';
  const primaryWorkoutLabel = t(
    activeWorkout ? 'home.continueWorkout' : 'home.startWorkout',
  );

  const roundedCurrentVolume = Math.round(
    weightFromKg(weeklyVolumeTrend.currentVolume, weightUnit),
  );
  const roundedPreviousVolume = Math.round(
    weightFromKg(weeklyVolumeTrend.previousVolume, weightUnit),
  );
  const roundedVolumeDelta = roundedCurrentVolume - roundedPreviousVolume;
  const volumePercentChange =
    weeklyVolumeTrend.previousVolume > 0
      ? Math.round(
          ((weeklyVolumeTrend.currentVolume - weeklyVolumeTrend.previousVolume) /
            weeklyVolumeTrend.previousVolume) *
            100,
        )
      : null;
  const trainingVolumeValue =
    volumePercentChange !== null
      ? t('home.volumeChangePercent', {
          percent: `${volumePercentChange >= 0 ? '+' : ''}${formatNumber(volumePercentChange)}`,
        })
      : roundedCurrentVolume > 0
        ? t('home.volumeValue', {
            unit: weightUnit,
            volume: formatNumber(roundedCurrentVolume),
          })
        : '—';
  const trainingVolumeDetail =
    roundedPreviousVolume > 0
      ? t('home.volumeChange', {
          delta: `${roundedVolumeDelta >= 0 ? '+' : ''}${formatNumber(roundedVolumeDelta)}`,
          unit: weightUnit,
        })
      : roundedCurrentVolume > 0
        ? t('home.volumeThisWeek', {
            unit: weightUnit,
            volume: formatNumber(roundedCurrentVolume),
          })
        : t('home.volumeNoData');

  const snapshotItems = useMemo<HomeSnapshotItem[]>(
    () => [
      {
        id: 'workouts-this-week',
        label: t('home.workoutsThisWeek'),
        value: formatNumber(workoutsThisWeek),
        detail: t('home.goalDetail', { count: profile.trainingDaysPerWeek }),
        tone: workoutsThisWeek >= profile.trainingDaysPerWeek ? 'positive' : 'neutral',
      },
      {
        id: 'training-volume',
        label: t('home.trainingVolume'),
        value: trainingVolumeValue,
        detail: trainingVolumeDetail,
        tone:
          weeklyVolumeTrend.previousVolume > 0 &&
          weeklyVolumeTrend.currentVolume >= weeklyVolumeTrend.previousVolume
            ? 'positive'
            : 'neutral',
      },
      {
        id: 'recovery-status',
        label: t('home.recovery'),
        value: getHomeRecoveryStatusLabel(t, recoveryAdvisor.status),
        detail: t('home.recoveryDetail'),
        tone: recoveryAdvisor.status === 'Overloaded' ? 'warning' : 'neutral',
      },
    ],
    [
      formatNumber,
      profile.trainingDaysPerWeek,
      recoveryAdvisor.status,
      t,
      trainingVolumeDetail,
      trainingVolumeValue,
      weeklyVolumeTrend.currentVolume,
      weeklyVolumeTrend.previousVolume,
      workoutsThisWeek,
    ],
  );

  if (isRestoringState || !onboardingCompleted) {
    return <View style={styles.screen} />;
  }

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
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t('tabs.home')}</Text>
          <Pressable
            accessibilityLabel={t('home.openProfile')}
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <Text style={styles.profileIcon}>👤</Text>
          </Pressable>
        </View>
        <HomeSummaryCard
          caloriesLabel={t('home.calories')}
          caloriesRemainingLabel={caloriesRemainingLabel}
          currentWeightLabel={currentWeightLabel}
          currentWeightTitle={t('home.currentWeight')}
          isCaloriesOverTarget={caloriesRemaining < 0}
          motivation={getHomeMotivationLabel(t, motivation)}
          streakLabel={
            currentWorkoutStreak
              ? formatPlural(locale, currentWorkoutStreak.days, {
                  one: t('home.streak.one'),
                  few: t('home.streak.few'),
                  many: t('home.streak.many'),
                  other: t('home.streak.other'),
                })
              : undefined
          }
          streakTitle={t('home.streak')}
          title={t('home.mattersNow')}
          todayLabel={t('home.today')}
        />
        <QuickActionsCard
          primaryAction={{
            label: primaryWorkoutLabel,
            onPress: () => router.push(primaryWorkoutRoute),
          }}
          secondaryActions={[
            {
              label: t('home.addFood'),
              onPress: () => router.push('/(tabs)/nutrition'),
            },
            {
              label: t('home.logWeight'),
              onPress: () => router.push('/weight-entry'),
            },
          ]}
          title={t('home.nextAction')}
        />
        <HomeSnapshotCard
          items={snapshotItems}
          subtitle={t('home.weeklySubtitle')}
          title={t('home.weeklySnapshot')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', padding: Spacing.three },
  container: { gap: Spacing.three, maxWidth: MaxContentWidth, width: '100%' },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
  },
  pressed: { opacity: 0.72 },
  profileButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  profileIcon: { fontSize: 22, lineHeight: 26 },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
});
