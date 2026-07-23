import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { buildSafetyRecoveryProgressAnalytics } from '@/features/progress/safetyRecoveryProgressAnalytics';
import type { WorkoutSafetyReviewStatus, WorkoutSession } from '@/types';

type SafetyRecoveryProgressCardProps = {
  sessions: WorkoutSession[];
  onOpenHistory(): void;
};

const getStatusColor = (status: WorkoutSafetyReviewStatus): string => {
  if (status === 'ready') return Colors.dark.success;
  if (status === 'modify') return Colors.dark.warning;
  if (status === 'blocked') return Colors.dark.error;
  return Colors.dark.accent;
};

export function SafetyRecoveryProgressCard({
  onOpenHistory,
  sessions,
}: SafetyRecoveryProgressCardProps) {
  const analytics = useMemo(
    () => buildSafetyRecoveryProgressAnalytics(sessions),
    [sessions],
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

      {analytics.reviewedWorkouts > 0 ? (
        <View style={styles.section}>
          <Text selectable style={styles.sectionTitle}>
            Review status distribution
          </Text>
          <Text selectable style={styles.sectionHelp}>
            Shares use only fresh reviewed workout contexts.
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
                <Text selectable style={styles.statusValue}>
                  {metric.shareLabel} · {metric.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text selectable style={styles.emptyText}>
          Complete a workout after a fresh Safety & Recovery review to populate status analytics.
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
          This compares the two latest fresh reviewed workout ceilings, not the weight actually used.
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
            No structured movement restrictions have been recorded in fresh reviewed workouts.
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
