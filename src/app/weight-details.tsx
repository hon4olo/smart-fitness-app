import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ProgressTrendChart,
  type ProgressTrendPoint,
} from '@/components/progress/ProgressTrendChart';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWorkoutState } from '@/context/AppContext';
import { useProgressState } from '@/context/ProgressStateContext';
import { getProgressAnalytics } from '@/lib/progress';
import { useLocalization } from '@/localization';
import { getWeightDetailsCopy } from '@/localization/weightDetailsCopy';
import { useUnitPreferences, weightFromKg } from '@/units';

export default function WeightDetailsScreen() {
  const { bodyMeasurements, weightHistory } = useProgressState();
  const { exercises, workoutSessions } = useWorkoutState();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getWeightDetailsCopy(locale);
  const { formatWeightValue, weight: weightUnit } = useUnitPreferences();
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

  const toDateLabel = (value: string) =>
    formatDate(value, { day: 'numeric', month: 'short' });
  const points = useMemo<ProgressTrendPoint[]>(
    () =>
      analytics.weight.recentEntries.map((entry) => ({
        key: entry.id,
        label: formatDate(entry.createdAt, { day: 'numeric', month: 'short' }),
        value: weightFromKg(entry.weight, weightUnit),
        displayValue: `${formatWeightValue(entry.weight)} ${weightUnit}`,
      })),
    [analytics.weight.recentEntries, formatDate, formatWeightValue, weightUnit],
  );
  const recentEntries = useMemo(
    () => [...analytics.weight.recentEntries].reverse().slice(0, 10),
    [analytics.weight.recentEntries],
  );

  const latestWeight =
    analytics.weight.currentWeight !== null
      ? `${formatWeightValue(analytics.weight.currentWeight)} ${weightUnit}`
      : '—';
  const convertedDelta30Days =
    analytics.weight.delta30Days !== null
      ? weightFromKg(analytics.weight.delta30Days, weightUnit)
      : null;
  const trend =
    convertedDelta30Days !== null
      ? copy.trend30Days(
          `${convertedDelta30Days > 0 ? '+' : ''}${formatNumber(
            convertedDelta30Days,
            {
              maximumFractionDigits: 1,
            },
          )}`,
          weightUnit,
        )
      : copy.noComparison;
  const chartValues = points.map((point) => point.value);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />

        <AppCard>
          <Text selectable style={styles.title}>
            {copy.currentWeight}
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
            {copy.trend}
          </Text>
          {points.length > 1 ? (
            <ProgressTrendChart
              emptyLabel={copy.chartEmpty}
              maxLabel={`${formatNumber(Math.max(...chartValues), {
                maximumFractionDigits: 1,
              })} ${weightUnit}`}
              minLabel={`${formatNumber(Math.min(...chartValues), {
                maximumFractionDigits: 1,
              })} ${weightUnit}`}
              points={points}
            />
          ) : (
            <Text selectable style={styles.detail}>
              {copy.addAnother}
            </Text>
          )}
        </AppCard>

        <AppCard>
          <Text selectable style={styles.title}>
            {copy.recentWeighIns}
          </Text>
          {recentEntries.length > 0 ? (
            <View style={styles.historyList}>
              {recentEntries.map((entry, index) => (
                <View
                  key={entry.id}
                  style={[styles.historyRow, index > 0 && styles.historyRowWithBorder]}>
                  <Text selectable style={styles.historyDate}>
                    {toDateLabel(entry.createdAt)}
                  </Text>
                  <Text selectable style={styles.historyValue}>
                    {formatWeightValue(entry.weight)} {weightUnit}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text selectable style={styles.detail}>
              {copy.noWeighIns}
            </Text>
          )}
        </AppCard>

        <AppCard>
          <Text selectable style={styles.title}>
            {copy.trainingHistory}
          </Text>
          <Text selectable style={styles.detail}>
            {copy.trainingHistoryBody}
          </Text>
          <AppButton
            label={copy.openWorkoutHistory}
            onPress={() => router.push('/workout-history')}
          />
        </AppCard>

        <AppButton label={copy.back} onPress={() => router.back()} variant="secondary" />
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
  historyDate: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  historyList: {
    marginTop: Spacing.one,
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: Spacing.one,
  },
  historyRowWithBorder: {
    borderColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  historyValue: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '800',
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
