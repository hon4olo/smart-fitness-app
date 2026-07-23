import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing } from '@/constants/theme';
import type { SafetyRecoveryProgressPeriod } from '@/features/progress/safetyRecoveryProgressAnalytics';
import {
  buildSafetyRecoveryWeeklyTrend,
  type SafetyRecoveryWeeklyTrendPoint,
} from '@/features/progress/safetyRecoveryWeeklyTrend';
import type { WorkoutSafetyReviewStatus, WorkoutSession } from '@/types';

type SafetyRecoveryWeeklyTrendCardProps = {
  sessions: WorkoutSession[];
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

function WeeklyColumn({ point }: { point: SafetyRecoveryWeeklyTrendPoint }) {
  return (
    <View
      accessible
      accessibilityLabel={buildPointAccessibilityLabel(point)}
      style={styles.weekColumn}>
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
    </View>
  );
}

export function SafetyRecoveryWeeklyTrendCard({
  sessions,
}: SafetyRecoveryWeeklyTrendCardProps) {
  const [period, setPeriod] = useState<SafetyRecoveryProgressPeriod>('90d');
  const trend = useMemo(
    () => buildSafetyRecoveryWeeklyTrend(sessions, period),
    [period, sessions],
  );

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
                onPress={() => setPeriod(option.id)}
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
        {(['ready', 'modify', 'blocked', 'needs_input'] as WorkoutSafetyReviewStatus[]).map(
          (status) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getStatusColor(status) }]} />
              <Text style={styles.legendLabel}>{STATUS_LABELS[status]}</Text>
            </View>
          ),
        )}
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
            <WeeklyColumn key={point.key} point={point} />
          ))}
        </ScrollView>
      ) : (
        <Text selectable style={styles.emptyText}>
          No fresh reviewed workouts are available in this trend window.
        </Text>
      )}

      <Text selectable style={styles.chartHelp}>
        The wide stack shows status composition among fresh reviewed workouts. The narrow blue bar
        shows the latest reviewed load ceiling recorded in that week, not the weight used.
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  chartContent: {
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingRight: Spacing.one,
  },
  chartHelp: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  chartPair: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    height: 100,
  },
  chartViewport: {
    marginHorizontal: -Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyTrackContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyTrackLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  header: {
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  legendLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  loadBar: {
    backgroundColor: Colors.dark.chartPrimary,
    borderRadius: Radii.small,
    width: '100%',
  },
  loadLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  loadLegendBar: {
    backgroundColor: Colors.dark.chartPrimary,
    borderRadius: 999,
    height: 9,
    width: 4,
  },
  loadTrack: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: Radii.small,
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 8,
  },
  periodChip: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  periodChipLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  periodChipLabelSelected: {
    color: Colors.dark.accent,
  },
  periodChipSelected: {
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
  },
  periodHelp: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  periodLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  periodSection: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.68,
  },
  statusSegment: {
    minHeight: 2,
    width: '100%',
  },
  statusTrack: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: Radii.small,
    height: 96,
    overflow: 'hidden',
    width: 24,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryItem: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  summaryValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  weekColumn: {
    alignItems: 'center',
    gap: 3,
    width: 44,
  },
  weekCount: {
    color: Colors.dark.textPrimary,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  weekLabel: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
});
