import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing } from '@/constants/theme';
import {
  buildSafetyRecoveryProgressAnalytics,
  type SafetyRecoveryProgressPeriod,
} from '@/features/progress/safetyRecoveryProgressAnalytics';
import type { WorkoutSafetyReviewStatus, WorkoutSession } from '@/types';

type SafetyRecoveryProgressCardProps = {
  sessions: WorkoutSession[];
  onOpenHistory(): void;
};

const PERIOD_OPTIONS: Array<{ id: SafetyRecoveryProgressPeriod; label: string }> = [
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All time' },
];

const getStatusColor = (status: WorkoutSafetyReviewStatus): string => {
  if (status === 'ready') return Colors.dark.success;
  if (status === 'modify') return Colors.dark.warning;
  if (status === 'blocked') return Colors.dark.error;
  return Colors.dark.accent;
};

const formatSignedValue = (value: number, suffix = ''): string => {
  if (value > 0) return `+${value}${suffix}`;
  return `${value}${suffix}`;
};

export function SafetyRecoveryProgressCard({
  onOpenHistory,
  sessions,
}: SafetyRecoveryProgressCardProps) {
  const [period, setPeriod] = useState<SafetyRecoveryProgressPeriod>('30d');
  const analytics = useMemo(
    () => buildSafetyRecoveryProgressAnalytics(sessions, period),
    [period, sessions],
  );
  const visibleStatusMetrics = analytics.statusMetrics.filter(
    (metric) => metric.status !== 'needs_input' || metric.count > 0,
  );

  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Safety & Recovery history
        </Text>
        <Text selectable style={styles.subtitle}>
          Historical context from completed workouts. This is not a current readiness result.
        </Text>
      </View>

      <View style={styles.periodSection}>
        <Text selectable style={styles.periodLabel}>
          Period
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
          Showing {analytics.periodLabel.toLowerCase()}.
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {analytics.reviewedWorkouts}/{analytics.totalWorkouts}
          </Text>
          <Text selectable style={styles.summaryLabel}>
            Fresh reviewed workouts
          </Text>
        </View>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {analytics.reviewCoverageLabel}
          </Text>
          <Text selectable style={styles.summaryLabel}>
            Review coverage
          </Text>
        </View>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {analytics.loadTrend.latestLabel}
          </Text>
          <Text selectable style={styles.summaryLabel}>
            Latest reviewed load ceiling
          </Text>
        </View>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {analytics.missingOrStaleWorkouts}
          </Text>
          <Text selectable style={styles.summaryLabel}>
            Missing or stale gates
          </Text>
        </View>
      </View>

      {analytics.comparison ? (
        <View style={styles.section}>
          <Text selectable style={styles.sectionTitle}>
            Period comparison
          </Text>
          <Text selectable style={styles.sectionHelp}>
            {analytics.periodLabel} compared with {analytics.comparison.previousPeriodLabel.toLowerCase()}.
          </Text>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {formatSignedValue(analytics.comparison.workoutCountDelta)}
              </Text>
              <Text selectable style={styles.comparisonLabel}>
                Workouts
              </Text>
              <Text selectable style={styles.comparisonDetail}>
                {analytics.totalWorkouts} vs {analytics.comparison.previousTotalWorkouts}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {formatSignedValue(analytics.comparison.reviewedWorkoutsDelta)}
              </Text>
              <Text selectable style={styles.comparisonLabel}>
                Fresh reviews
              </Text>
              <Text selectable style={styles.comparisonDetail}>
                {analytics.reviewedWorkouts} vs {analytics.comparison.previousReviewedWorkouts}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {analytics.comparison.reviewCoverageDeltaPercentagePoints === null
                  ? '—'
                  : formatSignedValue(
                      analytics.comparison.reviewCoverageDeltaPercentagePoints,
                      ' pp',
                    )}
              </Text>
              <Text selectable style={styles.comparisonLabel}>
                Review coverage
              </Text>
              <Text selectable style={styles.comparisonDetail}>
                {analytics.comparison.reviewCoverageDeltaLabel}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {analytics.comparison.restrictedWorkoutShareDeltaPercentagePoints === null
                  ? '—'
                  : formatSignedValue(
                      analytics.comparison.restrictedWorkoutShareDeltaPercentagePoints,
                      ' pp',
                    )}
              </Text>
              <Text selectable style={styles.comparisonLabel}>
                Restricted reviews
              </Text>
              <Text selectable style={styles.comparisonDetail}>
                {analytics.comparison.restrictedWorkoutShareDeltaLabel}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {analytics.reviewedWorkouts > 0 ? (
        <View style={styles.section}>
          <Text selectable style={styles.sectionTitle}>
            Review status distribution
          </Text>
          <Text selectable style={styles.sectionHelp}>
            Shares use only fresh reviewed workout contexts in the selected period.
          </Text>
          <View style={styles.statusList}>
            {visibleStatusMetrics.map((metric) => (
              <View key={metric.status} style={styles.statusRow}>
                <View style={styles.statusCopy}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(metric.status) },
                    ]}
                  />
                  <Text selectable style={styles.statusLabel}>
                    {metric.label}
                  </Text>
                </View>
                <View style={styles.statusValueCopy}>
                  <Text selectable style={styles.statusValue}>
                    {metric.shareLabel} · {metric.count}
                  </Text>
                  {metric.deltaLabel ? (
                    <Text selectable style={styles.statusDelta}>
                      {metric.deltaLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text selectable style={styles.emptyText}>
          No fresh reviewed workouts were completed in the selected period.
        </Text>
      )}

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Reviewed load ceiling trend
        </Text>
        <Text selectable style={styles.loadTrendValue}>
          {analytics.loadTrend.deltaLabel}
        </Text>
        <Text selectable style={styles.sectionHelp}>
          This compares the two latest fresh reviewed workout ceilings inside the selected period,
          not the weight actually used.
        </Text>
      </View>

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>
          Frequent movement restrictions
        </Text>
        {analytics.topMovementPatterns.length > 0 ? (
          <View style={styles.movementList}>
            {analytics.topMovementPatterns.map((movement) => (
              <View key={movement.movementPattern} style={styles.movementRow}>
                <View style={styles.movementCopy}>
                  <Text selectable style={styles.movementLabel}>
                    {movement.label}
                  </Text>
                  <Text selectable style={styles.sectionHelp}>
                    {movement.count} restricted workout{movement.count === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text selectable style={styles.movementShare}>
                  {movement.shareLabel}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text selectable style={styles.emptyText}>
            No structured movement restrictions were recorded in fresh reviewed workouts for this
            period.
          </Text>
        )}
      </View>

      <Text selectable style={styles.contextNote}>
        {analytics.noContextWorkouts} workout{analytics.noContextWorkouts === 1 ? '' : 's'} had no
        recorded Safety context. {analytics.contextWorkouts} had some recorded context.
      </Text>

      <AppButton label="Open workout history" onPress={onOpenHistory} variant="secondary" />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  comparisonCell: {
    flexBasis: '46%',
    gap: 2,
  },
  comparisonDetail: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  comparisonLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  comparisonValue: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  contextNote: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  header: {
    gap: 2,
  },
  loadTrendValue: {
    color: Colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  movementCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  movementLabel: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  movementList: {
    gap: Spacing.two,
  },
  movementRow: {
    alignItems: 'center',
    borderColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  movementShare: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
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
  section: {
    gap: Spacing.one,
  },
  sectionHelp: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  statusCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusDelta: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusLabel: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  statusValue: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'right',
  },
  statusValueCopy: {
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: 1,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryCell: {
    flexBasis: '46%',
    gap: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  summaryLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
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
});
