import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressTrendChart, type ProgressTrendPoint } from '@/components/progress/ProgressTrendChart';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { formatProgressDelta, getProgressAnalytics } from '@/lib/progress';
import { formatShortDate } from '@/lib';

const toDateLabel = (value: string) => formatShortDate(value);

export default function WeightDetailsScreen() {
  const { bodyMeasurements, exercises, weightHistory, workoutSessions } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();

  const analytics = useMemo(
    () =>
      getProgressAnalytics({
        bodyMeasurements,
        exercises,
        weightHistory,
        workoutSessions,
      }),
    [bodyMeasurements, exercises, weightHistory, workoutSessions],
  );

  const points = useMemo<ProgressTrendPoint[]>(
    () =>
      analytics.weight.recentEntries.map((entry) => ({
        key: entry.id,
        label: toDateLabel(entry.createdAt),
        value: entry.weight,
        displayValue: entry.weight.toFixed(1),
      })),
    [analytics.weight.recentEntries],
  );

  const latestWeight = analytics.weight.currentWeight !== null ? `${analytics.weight.currentWeight.toFixed(1)} kg` : '—';
  const trend = analytics.weight.delta30Days !== null ? formatProgressDelta(analytics.weight.delta30Days, 'kg') : 'No 30-day comparison yet';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]} style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Weight details" subtitle="Detailed trend view." />

        <AppCard>
          <Text selectable style={styles.title}>
            Current weight
          </Text>
          <Text selectable style={styles.value}>
            {latestWeight}
          </Text>
          <Text selectable style={styles.detail}>
            {trend}
          </Text>
        </AppCard>

        <AppCard>
          <Text selectable style={styles.title}>
            Trend
          </Text>
          {points.length > 1 ? (
            <ProgressTrendChart
              emptyLabel="Add a few weigh-ins to see the trend."
              maxLabel={points.reduce((max, point) => Math.max(max, point.value), points[0]?.value ?? 0).toFixed(1) + ' kg'}
              minLabel={points.reduce((min, point) => Math.min(min, point.value), points[0]?.value ?? 0).toFixed(1) + ' kg'}
              points={points}
            />
          ) : (
            <Text selectable style={styles.detail}>
              Add another weigh-in to reveal the chart.
            </Text>
          )}
        </AppCard>

        <AppCard>
          <Text selectable style={styles.title}>
            Training history
          </Text>
          <Text selectable style={styles.detail}>
            Open completed workouts, logged sets, RPE values and the Safety & Recovery context recorded before each session.
          </Text>
          <AppButton label="Open workout history" onPress={() => router.push('/workout-history')} />
        </AppCard>

        <AppButton label="Back" onPress={() => router.back()} variant="secondary" />
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
    padding: Spacing.three,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  value: {
    color: Colors.dark.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
});
