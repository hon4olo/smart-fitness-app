import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAppTheme } from '@/theme/AppThemeProvider';
import {
  buildWorkoutHistoryProgramOptions,
  filterWorkoutHistory,
  type WorkoutHistoryPeriodFilter,
  type WorkoutHistoryProgramFilter,
  type WorkoutHistorySafetyFilter,
  type WorkoutHistorySafetyTone,
} from '../workoutHistoryViewModel';

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
  colors: typeof Colors.light,
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
  const { trainingPrograms, workoutSessions } = useAppContext();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<WorkoutHistoryPeriodFilter>('all');
  const [programId, setProgramId] = useState<WorkoutHistoryProgramFilter>('all');
  const [safety, setSafety] = useState<WorkoutHistorySafetyFilter>('all');

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
      }),
    [period, programId, safety, trainingPrograms, workoutSessions],
  );
  const reviewedCount = history.filter((item) => item.hasSafetyContext).length;
  const filtersActive = period !== 'all' || programId !== 'all' || safety !== 'all';

  const clearFilters = () => {
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
                <Text style={styles.helperText}>Period, program and recorded Safety status</Text>
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
              {PERIOD_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onPress={() => setPeriod(option.id)}
                  selected={period === option.id}
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

const createFilterChipStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    chip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: Spacing.three,
    },
    chipSelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    label: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    labelSelected: {
      color: colors.accent,
    },
    pressed: {
      opacity: 0.68,
    },
  });

const createFilterRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    group: {
      gap: Spacing.one,
    },
    row: {
      gap: Spacing.one,
      paddingRight: Spacing.two,
    },
    title: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
  });

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 42,
      fontWeight: '300',
      lineHeight: 42,
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    cardHeaderCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    chevron: {
      color: colors.textMuted,
      fontSize: 24,
      lineHeight: 24,
    },
    clearLabel: {
      color: colors.accent,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
      lineHeight: Typography.label.lineHeight,
    },
    container: {
      gap: Spacing.four,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    filtersCard: {
      gap: Spacing.three,
    },
    filtersHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    filtersHeaderCopy: {
      flex: 1,
      gap: 2,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    helperText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    historyCard: {
      gap: Spacing.three,
    },
    list: {
      gap: Spacing.three,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricCell: {
      flexBasis: '46%',
      gap: 2,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
    },
    openLabel: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontWeight: Typography.callout.fontWeight,
      lineHeight: Typography.callout.lineHeight,
    },
    openRow: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: Spacing.two,
    },
    pressed: {
      opacity: 0.68,
    },
    resetButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 42,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    resetLabel: {
      color: colors.accent,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
      lineHeight: Typography.label.lineHeight,
    },
    safetyBadge: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radii.pill,
      flexShrink: 1,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      overflow: 'hidden',
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
      textAlign: 'right',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    summaryCell: {
      flex: 1,
      gap: 2,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.four,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 34,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });
