import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAppTheme } from '@/theme/AppThemeProvider';
import {
  buildWorkoutHistoryProgramOptions,
  filterWorkoutHistory,
  formatWorkoutHistoryDateRange,
  parseWorkoutHistoryRouteFilters,
  type WorkoutHistoryDateRange,
  type WorkoutHistoryPeriodFilter,
  type WorkoutHistoryProgramFilter,
  type WorkoutHistoryRouteParams,
  type WorkoutHistorySafetyFilter,
  type WorkoutHistorySafetyTone,
} from '../workoutHistoryViewModel';
import {
  createFilterChipStyles,
  createFilterRowStyles,
  createWorkoutHistoryScreenStyles,
} from './workoutHistoryScreen.styles';

const PERIOD_OPTIONS: Array<{ id: WorkoutHistoryPeriodFilter; label: string }> = [
  { id: 'all', label: 'All time' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
];

const SAFETY_OPTIONS: Array<{ id: WorkoutHistorySafetyFilter; label: string }> = [
  { id: 'all', label: 'All statuses' },
  { id: 'ready', label: 'Ready' },
  { id: 'modify', label: 'Modify' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'needs_input', label: 'Needs input' },
  { id: 'missing_or_stale', label: 'Missing / stale' },
  { id: 'no_context', label: 'No context' },
];

const getToneColor = (
  tone: WorkoutHistorySafetyTone,
  colors: ReturnType<typeof useAppTheme>['colors'],
): string => {
  if (tone === 'positive') return colors.success;
  if (tone === 'warning') return colors.warning;
  if (tone === 'critical') return colors.error;
  return colors.textMuted;
};

function FilterChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress(): void;
  selected: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFilterChipStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

function FilterRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFilterRowStyles(colors), [colors]);

  return (
    <View style={styles.group}>
      <Text style={styles.title}>{label}</Text>
      <ScrollView
        horizontal
        contentContainerStyle={styles.row}
        showsHorizontalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

export default function WorkoutHistoryScreen() {
  const params = useLocalSearchParams<WorkoutHistoryRouteParams>();
  const routeFilters = useMemo(
    () => parseWorkoutHistoryRouteFilters(params),
    [params.from, params.safety, params.to],
  );
  const { trainingPrograms, workoutSessions } = useAppContext();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createWorkoutHistoryScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<WorkoutHistoryPeriodFilter>('all');
  const [programId, setProgramId] = useState<WorkoutHistoryProgramFilter>('all');
  const [safety, setSafety] = useState<WorkoutHistorySafetyFilter>(routeFilters.safety);
  const [dateRange, setDateRange] = useState<WorkoutHistoryDateRange | null>(
    routeFilters.dateRange,
  );

  useEffect(() => {
    setDateRange(routeFilters.dateRange);
    setSafety(routeFilters.safety);
  }, [routeFilters.dateRange?.endAt, routeFilters.dateRange?.startAt, routeFilters.safety]);

  const programOptions = useMemo(
    () => buildWorkoutHistoryProgramOptions(trainingPrograms),
    [trainingPrograms],
  );
  const history = useMemo(
    () =>
      filterWorkoutHistory(workoutSessions, trainingPrograms, {
        period,
        programId,
        safety,
        dateRange,
      }),
    [dateRange, period, programId, safety, trainingPrograms, workoutSessions],
  );
  const reviewedCount = history.filter((item) => item.hasSafetyContext).length;
  const filtersActive =
    dateRange !== null || period !== 'all' || programId !== 'all' || safety !== 'all';
  const dateRangeLabel = dateRange ? formatWorkoutHistoryDateRange(dateRange) : null;

  const clearFilters = () => {
    setDateRange(null);
    setPeriod('all');
    setProgramId('all');
    setSafety('all');
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Workout history</Text>
          <Text style={styles.subtitle}>Completed sessions and recorded pre-workout context</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AppCard>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{history.length}</Text>
                <Text style={styles.summaryLabel}>
                  {filtersActive ? `Showing of ${workoutSessions.length}` : 'Completed workouts'}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{reviewedCount}</Text>
                <Text style={styles.summaryLabel}>With Safety context</Text>
              </View>
            </View>
            <Text style={styles.helperText}>
              Safety & Recovery data here is a historical record of what was displayed before each
              workout. It is not a current readiness recommendation.
            </Text>
          </AppCard>

          <AppCard style={styles.filtersCard}>
            <View style={styles.filtersHeader}>
              <View style={styles.filtersHeaderCopy}>
                <Text style={styles.cardTitle}>Filters</Text>
                <Text style={styles.helperText}>
                  {dateRangeLabel
                    ? `Selected weekly range · ${dateRangeLabel}`
                    : 'Period, program and recorded Safety status'}
                </Text>
              </View>
              {filtersActive ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <Text style={styles.clearLabel}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <FilterRow label="Period">
              {dateRangeLabel ? (
                <FilterChip
                  label={`Week · ${dateRangeLabel}`}
                  onPress={() => setDateRange(null)}
                  selected
                />
              ) : null}
              {PERIOD_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onPress={() => {
                    setDateRange(null);
                    setPeriod(option.id);
                  }}
                  selected={!dateRange && period === option.id}
                />
              ))}
            </FilterRow>

            <FilterRow label="Program">
              {programOptions.map((option) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onPress={() => setProgramId(option.id)}
                  selected={programId === option.id}
                />
              ))}
            </FilterRow>

            <FilterRow label="Safety status">
              {SAFETY_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onPress={() => setSafety(option.id)}
                  selected={safety === option.id}
                />
              ))}
            </FilterRow>
          </AppCard>

          {workoutSessions.length === 0 ? (
            <AppCard>
              <Text style={styles.cardTitle}>No completed workouts yet</Text>
              <Text style={styles.bodyText}>
                Finish and save a workout to create the first history entry.
              </Text>
            </AppCard>
          ) : history.length === 0 ? (
            <AppCard>
              <Text style={styles.cardTitle}>No workouts match these filters</Text>
              <Text style={styles.bodyText}>
                Change the period, program or Safety status to widen the result set.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={clearFilters}
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
                <Text style={styles.resetLabel}>Clear filters</Text>
              </Pressable>
            </AppCard>
          ) : (
            <View style={styles.list}>
              {history.map((item) => (
                <Pressable
                  key={item.session.id}
                  accessibilityHint="Opens the completed workout details"
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/workout-history/[sessionId]',
                      params: { sessionId: item.session.id },
                    })
                  }
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <AppCard style={styles.historyCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderCopy}>
                        <Text numberOfLines={1} style={styles.cardTitle}>
                          {item.session.workoutTitle}
                        </Text>
                        <Text style={styles.metaText}>{item.dateLabel}</Text>
                      </View>
                      <Text
                        style={[
                          styles.safetyBadge,
                          { color: getToneColor(item.safetyTone, colors) },
                        ]}>
                        {item.safetyLabel}
                      </Text>
                    </View>

                    <View style={styles.metricsRow}>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.durationLabel}</Text>
                        <Text style={styles.metricLabel}>Duration</Text>
                      </View>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.setCount}</Text>
                        <Text style={styles.metricLabel}>Sets</Text>
                      </View>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.exerciseCount}</Text>
                        <Text style={styles.metricLabel}>Exercises</Text>
                      </View>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.volumeLabel}</Text>
                        <Text style={styles.metricLabel}>Volume</Text>
                      </View>
                    </View>

                    <View style={styles.openRow}>
                      <Text style={styles.openLabel}>View workout details</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </AppCard>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
