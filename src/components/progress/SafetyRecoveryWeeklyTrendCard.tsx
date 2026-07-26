import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors } from '@/constants/theme';
import type { SafetyRecoveryProgressPeriod } from '@/features/progress/safetyRecoveryProgressAnalytics';
import {
  getSafetyPeriodLabel,
  getSafetyStatusLabel,
  getSafetyWindowLabel,
} from '@/features/progress/progressLocalization';
import {
  buildSafetyRecoveryWeeklyTrend,
  type SafetyRecoveryWeeklyTrendPoint,
} from '@/features/progress/safetyRecoveryWeeklyTrend';
import { useLocalization } from '@/localization';
import type { Translate } from '@/localization';
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

const PERIOD_IDS: SafetyRecoveryProgressPeriod[] = ['30d', '90d', 'all'];

const STATUS_ORDER: WorkoutSafetyReviewStatus[] = [
  'blocked',
  'needs_input',
  'modify',
  'ready',
];

const getStatusColor = (status: WorkoutSafetyReviewStatus): string => {
  if (status === 'ready') return Colors.dark.success;
  if (status === 'modify') return Colors.dark.warning;
  if (status === 'blocked') return Colors.dark.error;
  return Colors.dark.accent;
};

const buildPointAccessibilityLabel = (
  point: SafetyRecoveryWeeklyTrendPoint,
  label: string,
  t: Translate,
): string => {
  const statuses = STATUS_ORDER.filter((status) => point.statusCounts[status] > 0)
    .map((status) => `${getSafetyStatusLabel(t, status)} ${point.statusCounts[status]}`)
    .join(', ');
  const reviewCopy = t('safety.selectedSummary', {
    reviewed: point.reviewedWorkouts,
    total: point.totalWorkouts,
  });
  const loadCopy = point.latestLoadMultiplier === null
    ? t('safety.pointNoCeiling')
    : t('safety.pointLatestCeiling', { value: point.latestLoadLabel });
  return `${label}: ${reviewCopy}; ${statuses || t('safety.pointNoStatuses')}; ${loadCopy}.`;
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

function WeeklyColumn({
  onPress,
  point,
  selected,
}: {
  onPress(): void;
  point: SafetyRecoveryWeeklyTrendPoint;
  selected: boolean;
}) {
  const { formatDate, t } = useLocalization();
  const pointLabel = formatDate(point.startAt, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  return (
    <Pressable
      accessibilityLabel={`${buildPointAccessibilityLabel(point, pointLabel, t)} ${t('safety.selectWeekHint')}`}
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

      <Text numberOfLines={1} style={styles.loadLabel}>{point.latestLoadLabel}</Text>
      <Text numberOfLines={1} style={styles.weekLabel}>{pointLabel}</Text>
    </Pressable>
  );
}

export function SafetyRecoveryWeeklyTrendCard({
  onOpenHistory,
  sessions,
}: SafetyRecoveryWeeklyTrendCardProps) {
  const { formatDate, formatNumber, t } = useLocalization();
  const [period, setPeriod] = useState<SafetyRecoveryProgressPeriod>('90d');
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);
  const trend = useMemo(
    () => buildSafetyRecoveryWeeklyTrend(sessions, period),
    [period, sessions],
  );
  const selectedPointIndex = trend.points.findIndex((point) => point.key === selectedPointKey);
  const selectedPoint = selectedPointIndex >= 0 ? trend.points[selectedPointIndex] : null;
  const windowLabel = getSafetyWindowLabel(t, period, true);

  const openHistory = (safety?: WorkoutSafetyReviewStatus) => {
    if (!onOpenHistory || !selectedPoint) return;
    onOpenHistory({
      startAt: selectedPoint.startAt,
      endAt: getEndExclusive(selectedPoint, selectedPointIndex, trend.points.length),
      ...(safety ? { safety } : {}),
    });
  };

  const selectedRange = selectedPoint
    ? `${formatDate(selectedPoint.startAt, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })}–${formatDate(selectedPoint.endAt, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })}`
    : '';

  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>{t('safety.weeklyTitle')}</Text>
        <Text selectable style={styles.subtitle}>{t('safety.weeklySubtitle')}</Text>
      </View>

      <View style={styles.periodSection}>
        <Text selectable style={styles.periodLabel}>{t('safety.trendWindow')}</Text>
        <View style={styles.periodRow}>
          {PERIOD_IDS.map((option) => {
            const selected = period === option;
            const optionLabel = option === 'all'
              ? t('safety.period.12w')
              : getSafetyPeriodLabel(t, option);
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setPeriod(option);
                  setSelectedPointKey(null);
                }}
                style={({ pressed }) => [
                  styles.periodChip,
                  selected && styles.periodChipSelected,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.periodChipLabel, selected && styles.periodChipLabelSelected]}>
                  {optionLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text selectable style={styles.periodHelp}>
          {t('safety.showingBuckets', { period: windowLabel })}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text selectable style={styles.summaryValue}>
            {formatNumber(trend.reviewedWorkoutCount)}
          </Text>
          <Text selectable style={styles.summaryLabel}>{t('safety.freshReviewedWorkouts')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text selectable style={styles.summaryValue}>
            {formatNumber(trend.loadCeilingPointCount)}
          </Text>
          <Text selectable style={styles.summaryLabel}>{t('safety.weeksWithCeiling')}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {STATUS_ORDER.slice().reverse().map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={styles.legendLabel}>{getSafetyStatusLabel(t, status)}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={styles.loadLegendBar} />
          <Text style={styles.legendLabel}>{t('safety.loadCeiling')}</Text>
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
        <Text selectable style={styles.emptyText}>{t('safety.weeklyEmpty')}</Text>
      )}

      {selectedPoint ? (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text selectable style={styles.detailTitle}>{selectedRange}</Text>
            <Text selectable style={styles.detailLabel}>
              {t('safety.selectedSummary', {
                reviewed: selectedPoint.reviewedWorkouts,
                total: selectedPoint.totalWorkouts,
              })}
              {selectedPoint.latestLoadMultiplier === null
                ? ''
                : ` · ${t('safety.latestCeiling', { value: selectedPoint.latestLoadLabel })}`}
            </Text>
          </View>
          {onOpenHistory ? (
            <View style={styles.detailActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => openHistory()}
                style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}>
                <Text style={styles.historyButtonLabel}>{t('safety.allWorkouts')}</Text>
              </Pressable>
              {STATUS_ORDER.filter((status) => selectedPoint.statusCounts[status] > 0).map(
                (status) => {
                  const statusLabel = getSafetyStatusLabel(t, status);
                  return (
                    <Pressable
                      key={status}
                      accessibilityLabel={t('safety.openStatusWorkouts', { status: statusLabel })}
                      accessibilityRole="button"
                      onPress={() => openHistory(status)}
                      style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}>
                      <Text style={styles.historyButtonLabel}>
                        {statusLabel} · {formatNumber(selectedPoint.statusCounts[status])}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      <Text selectable style={styles.chartHelp}>{t('safety.chartHelp')}</Text>
    </AppCard>
  );
}
