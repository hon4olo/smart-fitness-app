import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors } from '@/constants/theme';
import {
  buildSafetyRecoveryProgressAnalytics,
  type SafetyRecoveryProgressPeriod,
} from '@/features/progress/safetyRecoveryProgressAnalytics';
import {
  getSafetyLoadDeltaLabel,
  getSafetyLoadLatestLabel,
  getSafetyMovementLabel,
  getSafetyPeriodLabel,
  getSafetyStatusLabel,
  getSafetyWindowLabel,
} from '@/features/progress/progressLocalization';
import { formatPlural, useLocalization } from '@/localization';
import type { WorkoutSafetyReviewStatus, WorkoutSession } from '@/types';

import { safetyRecoveryProgressCardStyles as styles } from './SafetyRecoveryProgressCard.styles';

type SafetyRecoveryProgressCardProps = {
  sessions: WorkoutSession[];
  onOpenHistory(): void;
};

const PERIOD_IDS: SafetyRecoveryProgressPeriod[] = ['30d', '90d', 'all'];

const getStatusColor = (status: WorkoutSafetyReviewStatus): string => {
  if (status === 'ready') return Colors.dark.success;
  if (status === 'modify') return Colors.dark.warning;
  if (status === 'blocked') return Colors.dark.error;
  return Colors.dark.accent;
};

const formatSignedValue = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

export function SafetyRecoveryProgressCard({
  onOpenHistory,
  sessions,
}: SafetyRecoveryProgressCardProps) {
  const { formatNumber, locale, t } = useLocalization();
  const [period, setPeriod] = useState<SafetyRecoveryProgressPeriod>('30d');
  const analytics = useMemo(
    () => buildSafetyRecoveryProgressAnalytics(sessions, period),
    [period, sessions],
  );
  const visibleStatusMetrics = analytics.statusMetrics.filter(
    (metric) => metric.status !== 'needs_input' || metric.count > 0,
  );
  const currentPeriodLabel = getSafetyWindowLabel(t, period);
  const previousPeriodLabel = period === 'all'
    ? t('safety.window.all')
    : t('safety.previousDays', { days: period === '30d' ? 30 : 90 });
  const formatDeltaDetail = (
    value: number | null,
    emptyKey: 'safety.noWorkoutsPrevious' | 'safety.noFreshPrevious' | 'safety.noReviewedPrevious',
  ) => {
    if (value === null) return t(emptyKey);
    if (value > 0) return t('safety.loadUp', { value: Math.abs(value) });
    if (value < 0) return t('safety.loadDown', { value: Math.abs(value) });
    return t('safety.noChangePrevious');
  };
  const formatPercentagePoints = (value: number | null) =>
    value === null
      ? '—'
      : t('safety.percentagePoints', { value: formatSignedValue(value) });

  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>{t('safety.historyTitle')}</Text>
        <Text selectable style={styles.subtitle}>{t('safety.historySubtitle')}</Text>
      </View>

      <View style={styles.periodSection}>
        <Text selectable style={styles.periodLabel}>{t('safety.period')}</Text>
        <View style={styles.periodRow}>
          {PERIOD_IDS.map((option) => {
            const selected = period === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPeriod(option)}
                style={({ pressed }) => [
                  styles.periodChip,
                  selected && styles.periodChipSelected,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.periodChipLabel, selected && styles.periodChipLabelSelected]}>
                  {getSafetyPeriodLabel(t, option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text selectable style={styles.periodHelp}>
          {t('safety.showingPeriod', { period: currentPeriodLabel })}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {analytics.reviewedWorkouts}/{analytics.totalWorkouts}
          </Text>
          <Text selectable style={styles.summaryLabel}>{t('safety.freshReviewedWorkouts')}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>{analytics.reviewCoverageLabel}</Text>
          <Text selectable style={styles.summaryLabel}>{t('safety.reviewCoverage')}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {getSafetyLoadLatestLabel(t, analytics.loadTrend.latestMultiplier)}
          </Text>
          <Text selectable style={styles.summaryLabel}>{t('safety.latestLoadCeiling')}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text selectable style={styles.summaryValue}>
            {formatNumber(analytics.missingOrStaleWorkouts)}
          </Text>
          <Text selectable style={styles.summaryLabel}>{t('safety.missingStaleGates')}</Text>
        </View>
      </View>

      {analytics.comparison ? (
        <View style={styles.section}>
          <Text selectable style={styles.sectionTitle}>{t('safety.comparisonTitle')}</Text>
          <Text selectable style={styles.sectionHelp}>
            {t('safety.comparisonHelp', {
              current: currentPeriodLabel,
              previous: previousPeriodLabel,
            })}
          </Text>
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {formatSignedValue(analytics.comparison.workoutCountDelta)}
              </Text>
              <Text selectable style={styles.comparisonLabel}>{t('safety.workouts')}</Text>
              <Text selectable style={styles.comparisonDetail}>
                {t('progress.compareValues', {
                  current: analytics.totalWorkouts,
                  previous: analytics.comparison.previousTotalWorkouts,
                })}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {formatSignedValue(analytics.comparison.reviewedWorkoutsDelta)}
              </Text>
              <Text selectable style={styles.comparisonLabel}>{t('safety.freshReviews')}</Text>
              <Text selectable style={styles.comparisonDetail}>
                {t('progress.compareValues', {
                  current: analytics.reviewedWorkouts,
                  previous: analytics.comparison.previousReviewedWorkouts,
                })}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {formatPercentagePoints(analytics.comparison.reviewCoverageDeltaPercentagePoints)}
              </Text>
              <Text selectable style={styles.comparisonLabel}>{t('safety.reviewCoverage')}</Text>
              <Text selectable style={styles.comparisonDetail}>
                {formatDeltaDetail(
                  analytics.comparison.reviewCoverageDeltaPercentagePoints,
                  'safety.noWorkoutsPrevious',
                )}
              </Text>
            </View>
            <View style={styles.comparisonCell}>
              <Text selectable style={styles.comparisonValue}>
                {formatPercentagePoints(
                  analytics.comparison.restrictedWorkoutShareDeltaPercentagePoints,
                )}
              </Text>
              <Text selectable style={styles.comparisonLabel}>{t('safety.restrictedReviews')}</Text>
              <Text selectable style={styles.comparisonDetail}>
                {formatDeltaDetail(
                  analytics.comparison.restrictedWorkoutShareDeltaPercentagePoints,
                  'safety.noFreshPrevious',
                )}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {analytics.reviewedWorkouts > 0 ? (
        <View style={styles.section}>
          <Text selectable style={styles.sectionTitle}>{t('safety.statusDistribution')}</Text>
          <Text selectable style={styles.sectionHelp}>{t('safety.statusDistributionHelp')}</Text>
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
                    {getSafetyStatusLabel(t, metric.status)}
                  </Text>
                </View>
                <View style={styles.statusValueCopy}>
                  <Text selectable style={styles.statusValue}>
                    {metric.shareLabel} · {formatNumber(metric.count)}
                  </Text>
                  {metric.deltaPercentagePoints !== null ? (
                    <Text selectable style={styles.statusDelta}>
                      {formatDeltaDetail(
                        metric.deltaPercentagePoints,
                        'safety.noReviewedPrevious',
                      )}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text selectable style={styles.emptyText}>{t('safety.noFreshSelectedPeriod')}</Text>
      )}

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>{t('safety.loadTrendTitle')}</Text>
        <Text selectable style={styles.loadTrendValue}>
          {getSafetyLoadDeltaLabel(
            t,
            analytics.loadTrend.direction,
            analytics.loadTrend.deltaPercentagePoints,
            analytics.loadTrend.latestMultiplier,
            analytics.loadTrend.previousMultiplier,
          )}
        </Text>
        <Text selectable style={styles.sectionHelp}>{t('safety.loadTrendHelp')}</Text>
      </View>

      <View style={styles.section}>
        <Text selectable style={styles.sectionTitle}>{t('safety.frequentRestrictions')}</Text>
        {analytics.topMovementPatterns.length > 0 ? (
          <View style={styles.movementList}>
            {analytics.topMovementPatterns.map((movement) => (
              <View key={movement.movementPattern} style={styles.movementRow}>
                <View style={styles.movementCopy}>
                  <Text selectable style={styles.movementLabel}>
                    {getSafetyMovementLabel(t, movement.movementPattern)}
                  </Text>
                  <Text selectable style={styles.sectionHelp}>
                    {formatPlural(locale, movement.count, {
                      one: t('safety.restrictedWorkout.one'),
                      other: t('safety.restrictedWorkout.other'),
                    })}
                  </Text>
                </View>
                <Text selectable style={styles.movementShare}>{movement.shareLabel}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text selectable style={styles.emptyText}>{t('safety.noStructuredRestrictions')}</Text>
        )}
      </View>

      <Text selectable style={styles.contextNote}>
        {t('safety.contextNote', {
          without: formatNumber(analytics.noContextWorkouts),
          withContext: formatNumber(analytics.contextWorkouts),
        })}
      </Text>

      <AppButton
        label={t('safety.openWorkoutHistory')}
        onPress={onOpenHistory}
        variant="secondary"
      />
    </AppCard>
  );
}
