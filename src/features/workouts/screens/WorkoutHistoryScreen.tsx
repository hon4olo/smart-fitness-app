import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing } from '@/constants/theme';
import { useWorkoutState } from '@/context/AppContext';
import { useLocalization } from '@/localization';
import { getWorkoutHistoryCopy } from '@/localization/workoutHistoryCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { weightFromKg, useUnitPreferences } from '@/units';
import {
  buildWorkoutHistoryProgramOptions,
  filterWorkoutHistory,
  getWorkoutDurationMinutes,
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
  const { trainingPrograms, workoutSessions } = useWorkoutState();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getWorkoutHistoryCopy(locale);
  const { weight: weightUnit } = useUnitPreferences();
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

  const periodOptions = useMemo<Array<{ id: WorkoutHistoryPeriodFilter; label: string }>>(
    () => [
      { id: 'all', label: copy.allTime },
      { id: '7d', label: copy.last7Days },
      { id: '30d', label: copy.last30Days },
      { id: '90d', label: copy.last90Days },
    ],
    [copy],
  );
  const safetyOptions = useMemo<Array<{ id: WorkoutHistorySafetyFilter; label: string }>>(
    () => [
      { id: 'all', label: copy.allStatuses },
      { id: 'ready', label: copy.safetyLabel('ready') },
      { id: 'modify', label: copy.safetyLabel('modify') },
      { id: 'blocked', label: copy.safetyLabel('blocked') },
      { id: 'needs_input', label: copy.safetyLabel('needs_input') },
      { id: 'missing_or_stale', label: copy.missingOrStale },
      { id: 'no_context', label: copy.noContext },
    ],
    [copy],
  );
  const programOptions = useMemo(
    () =>
      buildWorkoutHistoryProgramOptions(trainingPrograms).map((option) => ({
        ...option,
        label:
          option.id === 'all'
            ? copy.allPrograms
            : option.id === 'unassigned'
              ? copy.unassigned
              : option.label,
      })),
    [copy.allPrograms, copy.unassigned, trainingPrograms],
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
  const dateRangeLabel = dateRange
    ? `${formatDate(dateRange.startAt, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })}–${formatDate(Math.max(dateRange.startAt, dateRange.endAt - 1), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })}`
    : null;

  const clearFilters = () => {
    setDateRange(null);
    setPeriod('all');
    setProgramId('all');
    setSafety('all');
  };
  const formatVolume = (volumeKg: number) =>
    `${formatNumber(weightFromKg(volumeKg, weightUnit), {
      maximumFractionDigits: 0,
    })} ${weightUnit}`;
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return copy.durationMinutes(formatNumber(minutes, { maximumFractionDigits: 0 }));
    }
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return copy.durationHours(
      formatNumber(hours, { maximumFractionDigits: 0 }),
      remainder > 0 ? formatNumber(remainder, { maximumFractionDigits: 0 }) : null,
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
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
                <Text style={styles.summaryValue}>
                  {formatNumber(history.length, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.summaryLabel}>
                  {filtersActive
                    ? copy.showingOf(
                        formatNumber(history.length, { maximumFractionDigits: 0 }),
                        formatNumber(workoutSessions.length, { maximumFractionDigits: 0 }),
                      )
                    : copy.completedWorkouts}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>
                  {formatNumber(reviewedCount, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.summaryLabel}>{copy.withSafetyContext}</Text>
              </View>
            </View>
            <Text style={styles.helperText}>{copy.historicalContextNote}</Text>
          </AppCard>

          <AppCard style={styles.filtersCard}>
            <View style={styles.filtersHeader}>
              <View style={styles.filtersHeaderCopy}>
                <Text style={styles.cardTitle}>{copy.filters}</Text>
                <Text style={styles.helperText}>
                  {dateRangeLabel ? copy.selectedWeeklyRange(dateRangeLabel) : copy.filterHint}
                </Text>
              </View>
              {filtersActive ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <Text style={styles.clearLabel}>{copy.clear}</Text>
                </Pressable>
              ) : null}
            </View>

            <FilterRow label={copy.period}>
              {dateRangeLabel ? (
                <FilterChip
                  label={`${copy.week} · ${dateRangeLabel}`}
                  onPress={() => setDateRange(null)}
                  selected
                />
              ) : null}
              {periodOptions.map((option) => (
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

            <FilterRow label={copy.program}>
              {programOptions.map((option) => (
                <FilterChip
                  key={option.id}
                  label={option.label}
                  onPress={() => setProgramId(option.id)}
                  selected={programId === option.id}
                />
              ))}
            </FilterRow>

            <FilterRow label={copy.safety}>
              {safetyOptions.map((option) => (
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
              <Text style={styles.cardTitle}>{copy.noCompletedTitle}</Text>
              <Text style={styles.bodyText}>{copy.noCompletedBody}</Text>
            </AppCard>
          ) : history.length === 0 ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.noMatches}</Text>
              <Text style={styles.bodyText}>{copy.noMatchesBody}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={clearFilters}
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
                <Text style={styles.resetLabel}>{copy.clearFilters}</Text>
              </Pressable>
            </AppCard>
          ) : (
            <View style={styles.list}>
              {history.map((item) => {
                const safetyMetadata = item.session.safetyRecovery;
                const dateLabel = Number.isFinite(Date.parse(item.session.finishedAt))
                  ? formatDate(item.session.finishedAt, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : copy.unknownDate;
                return (
                  <Pressable
                    key={item.session.id}
                    accessibilityLabel={copy.openSession(item.session.workoutTitle)}
                    accessibilityHint={copy.openSessionHint}
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
                          <Text style={styles.metaText}>{dateLabel}</Text>
                        </View>
                        <Text
                          style={[
                            styles.safetyBadge,
                            { color: getToneColor(item.safetyTone, colors) },
                          ]}>
                          {copy.safetyHistoryLabel(
                            safetyMetadata?.gateKind ?? null,
                            safetyMetadata?.reviewStatus ?? null,
                          )}
                        </Text>
                      </View>

                      <View style={styles.metricsRow}>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricValue}>
                            {formatDuration(getWorkoutDurationMinutes(item.session))}
                          </Text>
                          <Text style={styles.metricLabel}>{copy.duration}</Text>
                        </View>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricValue}>
                            {formatNumber(item.setCount, { maximumFractionDigits: 0 })}
                          </Text>
                          <Text style={styles.metricLabel}>{copy.sets(item.setCount, '')}</Text>
                        </View>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricValue}>
                            {formatNumber(item.exerciseCount, { maximumFractionDigits: 0 })}
                          </Text>
                          <Text style={styles.metricLabel}>{copy.exercises}</Text>
                        </View>
                        <View style={styles.metricCell}>
                          <Text style={styles.metricValue}>{formatVolume(item.volume)}</Text>
                          <Text style={styles.metricLabel}>{copy.volumeLabel}</Text>
                        </View>
                      </View>

                      <View style={styles.openRow}>
                        <Text style={styles.openLabel}>{copy.viewDetails}</Text>
                        <Text style={styles.chevron}>›</Text>
                      </View>
                    </AppCard>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
