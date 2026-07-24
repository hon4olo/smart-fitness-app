import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors } from '@/constants/theme';
import type { SafetyRecoveryProgressPeriod } from '@/features/progress/safetyRecoveryProgressAnalytics';
import {
  buildSafetyRecoveryWeeklyTrend,
  type SafetyRecoveryWeeklyTrendPoint,
} from '@/features/progress/safetyRecoveryWeeklyTrend';
import type { WorkoutSafetyReviewStatus, WorkoutSession } from '@/types';

import { safetyRecoveryWeeklyTrendStyles as styles } from './SafetyRecoveryWeeklyTrendCard.styles';

export type SafetyRecoveryWeeklyHistoryTarget = {
  startAt: string;
  endAt: string;
  safety?: WorkoutSafetyReviewStatus;
};

type SafetyRecoveryWeeklyTrendCardProps = {
  sessions: WorkoutSession[];
  onOpenHistory?(target: SafetyRecoveryWeeklyHistoryTarget): void;
};

const PERIOD_OPTIONS: Array<{ id: SafetyRecoveryProgressPeriod; label: string }> = [
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: '12 weeks' },
];

const STATUS_ORDER: WorkoutSafetyReviewStatus[] = [
  'blocked',
  'needs_input',
  'modify',
  'ready',
];

const STATUS_LABELS: Record<WorkoutSafetyReviewStatus, string> = {
  ready: 'Ready',
  modify: 'Modify',
  blocked: 'Blocked',
  needs_input: 'Needs input',
};

const getStatusColor = (status: WorkoutSafetyReviewStatus): string => {
  if (status === 'ready') return Colors.dark.success;
  if (status === 'modify') return Colors.dark.warning;
  if (status === 'blocked') return Colors.dark.error;
  return Colors.dark.accent;
};

const buildPointAccessibilityLabel = (point: SafetyRecoveryWeeklyTrendPoint): string => {
  const statuses = STATUS_ORDER.filter((status) => point.statusCounts[status] > 0)
    .map((status) => `${STATUS_LABELS[status]} ${point.statusCounts[status]}`)
    .join(', ');
  const reviewCopy = `${point.reviewedWorkouts} fresh reviewed of ${point.totalWorkouts} workouts`;
  const loadCopy =
    point.latestLoadMultiplier === null
      ? 'no reviewed load ceiling'
      : `latest reviewed load ceiling ${point.latestLoadLabel}`;
  return `${point.label}: ${reviewCopy}; ${statuses || 'no reviewed statuses'}; ${loadCopy}.`;
};

const getEndExclusive = (
  point: SafetyRecoveryWeeklyTrendPoint,
  index: number,
  pointCount: number,
): string => {
  if (index !== pointCount - 1) return point.endAt;
  const end = Date.parse(point.endAt);
  return Number.isFinite(end) ? new Date(end + 1).toISOString() : point.endAt;
};

const formatSelectedRange = (point: SafetyRecoveryWeeklyTrendPoint): string => {
  const start = Date.parse(point.startAt);
  const end = Date.parse(point.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return point.label;
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
};

function WeeklyColumn({
  onPress,
  point,
  selected,
}: {
  onPress(): void;
  point: SafetyRecoveryWeeklyTrendPoint;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`${buildPointAccessibilityLabel(point)} Select this week for history.`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.weekColumn,
        selected && styles.weekColumnSelected,
        pressed && styles.pressed,
      ]}>
      <Text numberOfLines={1} style={styles.weekCount}>
        {point.reviewedWorkouts}/{point.totalWorkouts}
      </Text>

      <View style={styles.chartPair}>
        <View style={styles.statusTrack}>
          {point.reviewedWorkouts > 0 ? (
            STATUS_ORDER.map((status) => {
              const count = point.statusCounts[status];
              if (count === 0) return null;
              return (
                <View
                  key={status}
                  style={[
                    styles.statusSegment,
                    { backgroundColor: getStatusColor(status), flex: count },
                  ]}
                />
              );
            })
          ) : (
            <View style={styles.emptyTrackContent}>
              <Text style={styles.emptyTrackLabel}>—</Text>
            </View>
          )}
        </View>

        <View style={styles.loadTrack}>
          {point.latestLoadMultiplier !== null ? (
            <View
              style={[
                styles.loadBar,
                { height: Math.max(4, Math.round(point.latestLoadMultiplier * 96)) },
              ]}
            />
          ) : null}
        </View>
      </View>

      <Text numberOfLines={1} style={styles.loadLabel}>
        {point.latestLoadLabel}
      </Text>
      <Text numberOfLines={1} style={styles.weekLabel}>
        {point.label}
      </Text>
    </Pressable>
  );
}

export function SafetyRecoveryWeeklyTrendCard({
  onOpenHistory,
  sessions,
}: SafetyRecoveryWeeklyTrendCardProps) {
  const [period, setPeriod] = useState<SafetyRecoveryProgressPeriod>('90d');
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);
  const trend = useMemo(
    () => buildSafetyRecoveryWeeklyTrend(sessions, period),
    [period, sessions],
  );
  const selectedPointIndex = trend.points.findIndex((point) => point.key === selectedPointKey);
  const selectedPoint = selectedPointIndex >= 0 ? trend.points[selectedPointIndex] : null;

  const openHistory = (safety?: WorkoutSafetyReviewStatus) => {
    if (!onOpenHistory || !selectedPoint) return;
    onOpenHistory({
      startAt: selectedPoint.startAt,
      endAt: getEndExclusive(selectedPoint, selectedPointIndex, trend.points.length),
      ...(safety ? { safety } : {}),
    });
  };

  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Safety & Recovery weekly trend
        </Text>
        <Text selectable style={styles.subtitle}>
          Weekly fresh-review status mix and the latest reviewed load ceiling. Historical data only.
        </Text>
      </View>

      <View style={styles.periodSection}>
        <Text selectable style={styles.periodLabel}>
          Trend window
        </Text>
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((option) => {
            const selected = period === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setPeriod(option.id);
                  setSelectedPointKey(null);
                }}
                style={({ pressed }) => [
                  styles.periodChip,
                  selected && styles.periodChipSelected,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.periodChipLabel, selected && styles.periodChipLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text selectable style={styles.periodHelp}>
          Showing {trend.windowLabel.toLowerCase()} in rolling seven-day buckets.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text selectable style={styles.summaryValue}>
            {trend.reviewedWorkoutCount}
          </Text>
          <Text selectable style={styles.summaryLabel}>
            Fresh reviewed workouts
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text selectable style={styles.summaryValue}>
            {trend.loadCeilingPointCount}
          </Text>
          <Text selectable style={styles.summaryLabel}>
            Weeks with a load ceiling
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        {STATUS_ORDER.slice().reverse().map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={styles.legendLabel}>{STATUS_LABELS[status]}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={styles.loadLegendBar} />
          <Text style={styles.legendLabel}>Load ceiling</Text>
        </View>
      </View>

      {trend.hasStatusData || trend.hasLoadData ? (
        <ScrollView
          contentContainerStyle={styles.chartContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chartViewport}>
          {trend.points.map((point) => (
            <WeeklyColumn
              key={point.key}
              onPress={() => setSelectedPointKey(point.key)}
              point={point}
              selected={point.key === selectedPointKey}
            />
          ))}
        </ScrollView>
      ) : (
        <Text selectable style={styles.emptyText}>
          No fresh reviewed workouts are available in this trend window.
        </Text>
      )}

      {selectedPoint ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text selectable style={styles.detailTitle}>
              {formatSelectedRange(selectedPoint)}
            </Text>
            <Text selectable style={styles.detailLabel}>
              {selectedPoint.reviewedWorkouts} fresh reviewed of {selectedPoint.totalWorkouts} workouts
              {selectedPoint.latestLoadMultiplier === null
                ? ''
                : ` · latest ceiling ${selectedPoint.latestLoadLabel}`}
            </Text>
          </View>
          {onOpenHistory ? (
            <View style={styles.detailActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => openHistory()}
                style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}>
                <Text style={styles.historyButtonLabel}>All workouts</Text>
              </Pressable>
              {STATUS_ORDER.filter((status) => selectedPoint.statusCounts[status] > 0).map(
                (status) => (
                  <Pressable
                    key={status}
                    accessibilityLabel={`Open ${STATUS_LABELS[status]} workouts for selected week`}
                    accessibilityRole="button"
                    onPress={() => openHistory(status)}
                    style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}>
                    <Text style={styles.historyButtonLabel}>
                      {STATUS_LABELS[status]} · {selectedPoint.statusCounts[status]}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      <Text selectable style={styles.chartHelp}>
        Select a week to inspect its counts or open the matching workout history. The wide stack shows
        status composition among fresh reviewed workouts. The narrow blue bar shows the latest reviewed
        load ceiling recorded in that week, not the weight used.
      </Text>
    </AppCard>
  );
}
