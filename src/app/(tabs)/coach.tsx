import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

const getWorkoutTimestamp = (session: { finishedAt?: string; startedAt?: string }) => {
  const source = session.finishedAt ?? session.startedAt;

  if (!source) {
    return 0;
  }

  const parsed = new Date(source);

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
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

const formatDelta = (value: number, unit: string) => `${value >= 0 ? '+' : ''}${value.toFixed(1)} ${unit}`;

const pluralize = (count: number, singular: string) => `${count} ${count === 1 ? singular : `${singular}s`}`;

type CoachSignal = {
  label: string;
  title: string;
  detail: string;
};

export default function CoachScreen() {
  const {
    bodyMeasurements,
    foodEntries,
    nutritionTargets,
    profile,
    weightHistory,
    workoutSessions,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();

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
  const caloriesRemaining = nutritionTargets.calories - todaysNutrition.calories;
  const proteinRemaining = nutritionTargets.protein - todaysNutrition.protein;
  const latestWeight = weightHistory[0];
  const previousWeight = weightHistory[1];
  const weightToTarget = latestWeight ? profile.targetWeight - latestWeight.weight : null;
  const weightTrend = latestWeight && previousWeight ? latestWeight.weight - previousWeight.weight : null;
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workoutsThisWeek = workoutSessions.filter((session) => getWorkoutTimestamp(session) >= weekStart).length;
  const trainingGap = Math.max(0, profile.trainingDaysPerWeek - workoutsThisWeek);
  const latestWorkout = [...workoutSessions].sort((a, b) => getWorkoutTimestamp(a) - getWorkoutTimestamp(b)).at(-1);
  const latestWorkoutVolume = latestWorkout
    ? latestWorkout.sets.reduce((total, set) => total + set.weight * set.reps, 0)
    : 0;
  const latestWorkoutSummary = latestWorkout
    ? `${formatWorkoutDate(latestWorkout.finishedAt)} • ${pluralize(latestWorkout.sets.length, 'set')} • ${latestWorkoutVolume.toLocaleString()} kg`
    : 'No tracked workouts yet';

  const coachPriority = (() => {
    if (workoutSessions.length === 0 && foodEntries.length === 0 && weightHistory.length === 0) {
      return {
        title: 'Collect baseline data',
        detail: 'Track one workout, one meal, and one weigh-in so the coach can start reading trends.',
        action: 'Start with Track, then add Eat and Labs data.',
      };
    }

    if (trainingGap > 0) {
      return {
        title: 'Training is behind plan',
        detail: `You still need ${pluralize(trainingGap, 'session')} this week to hit the goal of ${profile.trainingDaysPerWeek}.`,
        action: 'Complete the remaining sessions before changing calories.',
      };
    }

    if (caloriesRemaining > 0 && todaysFoodEntries.length === 0) {
      return {
        title: 'Nutrition has no signal today',
        detail: 'The coach cannot estimate intake quality without a meal log.',
        action: 'Log the first meal of the day.',
      };
    }

    if (!latestWeight) {
      return {
        title: 'Missing body trend',
        detail: 'A weight check-in unlocks target comparison and trend direction.',
        action: 'Add weight in Labs.',
      };
    }

    if (weightTrend !== null && profile.goalType === 'lose_fat' && weightTrend > 0) {
      return {
        title: 'Fat-loss goal is drifting the wrong way',
        detail: `Weight is up by ${weightTrend.toFixed(1)} kg since the previous check-in.`,
        action: 'Tighten calories or add activity this week.',
      };
    }

    if (weightTrend !== null && profile.goalType === 'gain_muscle' && weightTrend < 0) {
      return {
        title: 'Muscle-gain goal needs more fuel',
        detail: `Weight is down by ${Math.abs(weightTrend).toFixed(1)} kg since the previous check-in.`,
        action: 'Increase intake and keep training volume stable.',
      };
    }

    return {
      title: 'Current plan is on track',
      detail: 'Training, nutrition, and body data are aligned enough to keep the current direction.',
      action: 'Maintain logging and re-evaluate in a few sessions.',
    };
  })();

  const coachSummary = coachPriority.detail;

  const signals: CoachSignal[] = [
    {
      label: 'Training',
      title:
        trainingGap > 0
          ? `${pluralize(trainingGap, 'session')} missing this week`
          : `${workoutsThisWeek} / ${profile.trainingDaysPerWeek} workouts on plan`,
      detail: latestWorkout ? `Latest workout: ${latestWorkoutSummary}` : 'Start with Track to create training history.',
    },
    {
      label: 'Nutrition',
      title:
        todaysFoodEntries.length === 0
          ? 'No meals logged today'
          : `${caloriesRemaining < 0 ? 'Over' : 'Under'} calorie target by ${Math.abs(caloriesRemaining).toFixed(0)} kcal`,
      detail:
        todaysFoodEntries.length === 0
          ? 'Log your first meal to unlock calorie and protein guidance.'
          : `${Math.max(0, proteinRemaining).toFixed(0)} g protein remaining today.`,
    },
    {
      label: 'Body data',
      title: latestWeight
        ? `${formatDelta(weightTrend ?? 0, 'kg')} vs previous check-in`
        : 'No weight check-ins yet',
      detail:
        latestWeight && weightToTarget !== null
          ? `${Math.abs(weightToTarget).toFixed(1)} kg ${weightToTarget < 0 ? 'over' : 'to'} target. ${pluralize(bodyMeasurements.length, 'measurement')} saved.`
          : `Save weight and ${bodyMeasurements.length > 0 ? 'keep measurements coming' : 'add a body measurement'} for better trend analysis.`,
    },
  ];

  const actionItems = [
    {
      label: 'Open Track',
      detail: 'Add or complete a workout so training guidance can update.',
      href: '/track',
    },
    {
      label: 'Open Eat',
      detail: 'Log food for today to make calorie and protein feedback current.',
      href: '/eat',
    },
    {
      label: 'Open Labs',
      detail: 'Check body weight, measurements, and progress trends.',
      href: '/labs',
    },
  ] as const;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 160 }]}>
      <View style={styles.container}>
        <SectionHeader title="Coach" subtitle="Explainable guidance from your latest data" />

        <AppCard>
          <Text style={styles.sectionTitle}>Today’s coach summary</Text>
          <Text selectable style={styles.summaryText}>
            {coachSummary}
          </Text>
          <View style={styles.priorityBox}>
            <Text style={styles.priorityLabel}>Next best move</Text>
            <Text selectable style={styles.priorityTitle}>
              {coachPriority.title}
            </Text>
            <Text selectable style={styles.priorityDetail}>
              {coachPriority.action}
            </Text>
          </View>
        </AppCard>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Training"
            value={
              trainingGap > 0
                ? `${trainingGap} workouts behind`
                : `${workoutsThisWeek} workouts this week`
            }
            detail={`goal ${profile.trainingDaysPerWeek} / week`}
          />
          <MetricCard
            label="Calories"
            value={`${Math.max(0, caloriesRemaining).toFixed(0)} kcal ${caloriesRemaining < 0 ? 'over' : 'left'}`}
            detail="today"
          />
          <MetricCard
            label="Protein"
            value={`${Math.max(0, proteinRemaining).toFixed(0)} g remaining`}
            detail="today"
          />
          <MetricCard
            label="Body data"
            value={latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : 'No weight yet'}
            detail={weightToTarget !== null ? `${Math.abs(weightToTarget).toFixed(1)} kg to target` : 'add a check-in'}
          />
        </View>

        <AppCard>
          <Text style={styles.sectionTitle}>Signal stack</Text>
          <View style={styles.signalList}>
            {signals.map((signal) => (
              <View key={signal.label} style={styles.signalRow}>
                <Text style={styles.signalLabel}>{signal.label}</Text>
                <View style={styles.signalContent}>
                  <Text selectable style={styles.signalTitle}>
                    {signal.title}
                  </Text>
                  <Text selectable style={styles.signalDetail}>
                    {signal.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Recommended next move</Text>
          <View style={styles.actionList}>
            {actionItems.map((item) => (
              <View key={item.label} style={styles.actionRow}>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{item.label}</Text>
                  <Text style={styles.actionDetail}>{item.detail}</Text>
                </View>
                <AppButton label="Open" onPress={() => router.push(item.href)} variant="secondary" />
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActions}>
            <AppButton label="Open Track" onPress={() => router.push('/track')} />
            <AppButton label="Open Eat" onPress={() => router.push('/eat')} variant="secondary" />
            <AppButton label="Open Labs" onPress={() => router.push('/labs')} variant="secondary" />
          </View>
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionContent: {
    flex: 1,
    gap: 4,
  },
  priorityBox: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: Spacing.two,
    padding: Spacing.two,
  },
  priorityDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  priorityLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  priorityTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  actionDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actionList: {
    gap: Spacing.two,
  },
  actionRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  actionTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
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
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickActions: {
    gap: Spacing.two,
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
  signalContent: {
    flex: 1,
    gap: 4,
  },
  signalDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  signalLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    width: 72,
  },
  signalList: {
    gap: Spacing.two,
  },
  signalRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  signalTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  summaryText: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.one,
  },
});
