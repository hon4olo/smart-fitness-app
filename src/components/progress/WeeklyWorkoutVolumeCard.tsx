import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing } from '@/constants/theme';
import { getWeeklyWorkoutVolume } from '@/lib/progress';
import { useLocalization } from '@/localization';
import type { WorkoutSession } from '@/types';
import { weightFromKg, useUnitPreferences } from '@/units';

import { ProgressTrendChart, type ProgressTrendPoint } from './ProgressTrendChart';

type Props = {
  sessions: WorkoutSession[];
};

export function WeeklyWorkoutVolumeCard({ sessions }: Props) {
  const { formatDate, formatNumber, t } = useLocalization();
  const { weight: weightUnit } = useUnitPreferences();
  const timezoneOffsetMinutes = -new Date().getTimezoneOffset();
  const weeklyVolume = useMemo(
    () => getWeeklyWorkoutVolume(sessions, { timezoneOffsetMinutes, weeks: 10 }),
    [sessions, timezoneOffsetMinutes],
  );
  const points = useMemo<ProgressTrendPoint[]>(
    () =>
      weeklyVolume.map((week) => ({
        key: week.key,
        label: formatDate(week.startAt, { day: 'numeric', month: 'short' }),
        value: weightFromKg(week.volume, weightUnit),
        displayValue: `${formatNumber(weightFromKg(week.volume, weightUnit), {
          maximumFractionDigits: 0,
        })} ${weightUnit}`,
      })),
    [formatDate, formatNumber, weeklyVolume, weightUnit],
  );
  const latest = weeklyVolume.at(-1) ?? null;
  const previous = weeklyVolume.at(-2) ?? null;
  const maxValue = points.length > 0 ? Math.max(...points.map((point) => point.value)) : 0;
  const formatVolume = (volume: number) =>
    `${formatNumber(weightFromKg(volume, weightUnit), { maximumFractionDigits: 0 })} ${weightUnit}`;

  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>{t('progress.trainingProgress')}</Text>
        <Text selectable style={styles.subtitle}>{t('progress.trainingSubtitle')}</Text>
      </View>
      {weeklyVolume.length > 0 ? (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text selectable style={styles.summaryLabel}>{t('progress.trainingVolume')}</Text>
              <Text selectable style={styles.summaryValue}>
                {latest ? formatVolume(latest.volume) : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text selectable style={styles.summaryLabel}>{t('progress.weeklyWorkoutCount')}</Text>
              <Text selectable style={styles.summaryValue}>
                {formatNumber(latest?.workoutCount ?? 0)}
              </Text>
            </View>
          </View>
          <Text selectable style={styles.comparison}>
            {previous && latest
              ? t('progress.compareValues', {
                  current: formatVolume(latest.volume),
                  previous: formatVolume(previous.volume),
                })
              : t('progress.recentSessionsOnly')}
          </Text>
          <ProgressTrendChart
            emptyLabel={t('progress.noWorkoutTrend')}
            maxLabel={`${formatNumber(maxValue, { maximumFractionDigits: 0 })} ${weightUnit}`}
            minLabel={`0 ${weightUnit}`}
            points={points}
          />
        </>
      ) : (
        <EmptyState
          compact
          description={t('progress.recentSessionsOnly')}
          message={t('progress.noWorkoutTrend')}
          title={t('progress.trainingProgress')}
        />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  comparison: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  header: { gap: 2, marginBottom: Spacing.two },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 18 },
  summaryItem: { flex: 1, gap: 2 },
  summaryLabel: { color: Colors.dark.textSecondary, fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.one },
  summaryValue: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
  title: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
});
