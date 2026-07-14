import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressSectionCard } from '@/components/progress/ProgressSectionCard';
import { EmptyProgressState } from '@/components/progress/EmptyProgressState';
import { Colors, Spacing } from '@/constants/theme';
import {
  formatMuscleTrend,
  getMuscleGroupDetail,
  getMuscleHeatLabel,
  type MuscleAnalytics,
  type MuscleGroupAnalytics,
  type MuscleGroupKey,
} from '@/lib/progress';

type MuscleAnalyticsPanelProps = {
  analytics: MuscleAnalytics;
};

const formatVolume = (value: number) => `${Math.round(value).toLocaleString()} kg`;
const formatSets = (value: number) => `${value} working set${value === 1 ? '' : 's'}`;
const formatShare = (value: number) => `${Math.round(value * 100)}%`;

const getHeatStyle = (heatLevel: MuscleGroupAnalytics['heatLevel']) => {
  if (heatLevel === 'high') {
    return styles.heatHigh;
  }

  if (heatLevel === 'medium') {
    return styles.heatMedium;
  }

  if (heatLevel === 'low') {
    return styles.heatLow;
  }

  return styles.heatNone;
};

const getBalanceStyle = (status: MuscleGroupAnalytics['balanceStatus']) => {
  if (status === 'overtrained') {
    return styles.balanceOvertrained;
  }

  if (status === 'balanced') {
    return styles.balanceBalanced;
  }

  return styles.balanceUndertrained;
};

function MiniStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.miniStat}>
      <Text selectable style={styles.miniStatLabel}>
        {label}
      </Text>
      <Text selectable style={styles.miniStatValue}>
        {value}
      </Text>
      <Text selectable style={styles.miniStatDetail}>
        {detail}
      </Text>
    </View>
  );
}

function StatusCard({
  count,
  label,
  tone,
  groupNames,
}: {
  count: number;
  label: string;
  tone: 'balanced' | 'undertrained' | 'overtrained';
  groupNames: string[];
}) {
  return (
    <View style={[styles.statusCard, tone === 'balanced' && styles.balanceBalanced, tone === 'undertrained' && styles.balanceUndertrained, tone === 'overtrained' && styles.balanceOvertrained]}>
      <Text selectable style={styles.statusCardLabel}>
        {label}
      </Text>
      <Text selectable style={styles.statusCardCount}>
        {count}
      </Text>
      <Text selectable style={styles.statusCardNames}>
        {groupNames.length > 0 ? groupNames.join(' · ') : 'None'}
      </Text>
    </View>
  );
}

export function MuscleAnalyticsPanel({ analytics }: MuscleAnalyticsPanelProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState<MuscleGroupKey | null>(null);

  useEffect(() => {
    if (analytics.groups.length === 0) {
      setSelectedGroupKey(null);
      return;
    }

    const currentSelected = analytics.groups.find((group) => group.key === selectedGroupKey);
    if (currentSelected) {
      return;
    }

    const defaultGroup = analytics.dominantGroup?.key ?? analytics.groups.find((group) => group.volume > 0)?.key ?? analytics.groups[0]?.key ?? null;
    setSelectedGroupKey(defaultGroup);
  }, [analytics.dominantGroup?.key, analytics.groups, selectedGroupKey]);

  const selectedGroup = useMemo(() => {
    return analytics.groups.find((group) => group.key === selectedGroupKey) ?? analytics.dominantGroup ?? analytics.groups[0] ?? null;
  }, [analytics.dominantGroup, analytics.groups, selectedGroupKey]);

  const selectedGroupDetail = getMuscleGroupDetail(selectedGroup);
  const balancedGroups = analytics.groups.filter((group) => group.balanceStatus === 'balanced');
  const undertrainedGroups = analytics.groups.filter((group) => group.balanceStatus === 'undertrained');
  const overtrainedGroups = analytics.groups.filter((group) => group.balanceStatus === 'overtrained');

  return (
    <View style={styles.wrapper}>
      <ProgressSectionCard
        subtitle="Last 7 days vs the previous 7 days. Working sets and volume come straight from the Exercise Database metadata."
        title="Muscle volume">
        <View style={styles.summaryGrid}>
          <MiniStat
            detail={analytics.previousVolume > 0 ? `Prev week ${formatVolume(analytics.previousVolume)}` : 'No previous week comparison'}
            label="Total volume"
            value={formatVolume(analytics.totalVolume)}
          />
          <MiniStat
            detail={analytics.previousWorkingSets > 0 ? `${analytics.totalWorkingSets - analytics.previousWorkingSets >= 0 ? '+' : ''}${analytics.totalWorkingSets - analytics.previousWorkingSets} sets vs prior week` : 'First tracked week'}
            label="Working sets"
            value={formatSets(analytics.totalWorkingSets)}
          />
          <MiniStat
            detail={analytics.dominantGroup ? `${analytics.dominantGroup.label} is leading` : 'No muscle data yet'}
            label="Top group"
            value={analytics.dominantGroup ? analytics.dominantGroup.label : '—'}
          />
        </View>

        <View style={styles.heatmapGrid}>
          {analytics.groups.map((group) => {
            const isSelected = group.key === selectedGroupKey;
            const detail = `${group.workingSets} sets · ${formatShare(group.volumeShare)} of weekly volume`;

            return (
              <Pressable
                accessibilityLabel={`${group.label}, ${getMuscleHeatLabel(group.heatLevel)}, ${detail}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={group.key}
                onPress={() => setSelectedGroupKey(group.key)}
                style={({ pressed }) => [
                  styles.heatmapChip,
                  getHeatStyle(group.heatLevel),
                  isSelected && styles.heatmapChipSelected,
                  pressed && styles.heatmapChipPressed,
                ]}>
                <Text numberOfLines={1} style={styles.heatmapChipLabel}>
                  {group.label}
                </Text>
                <Text style={styles.heatmapChipMeta}>{getMuscleHeatLabel(group.heatLevel)}</Text>
                <Text style={styles.heatmapChipMeta}>{detail}</Text>
              </Pressable>
            );
          })}
        </View>
      </ProgressSectionCard>

      <ProgressSectionCard
        subtitle="Rule: 0–3 sets or <7% share = undertrained; 7–15% = balanced; >15% or 8+ sets = overtrained."
        title="Muscle balance">
        <View style={styles.statusGrid}>
          <StatusCard
            count={balancedGroups.length}
            groupNames={balancedGroups.slice(0, 3).map((group) => group.label)}
            label="Balanced"
            tone="balanced"
          />
          <StatusCard
            count={undertrainedGroups.length}
            groupNames={undertrainedGroups.slice(0, 3).map((group) => group.label)}
            label="Undertrained"
            tone="undertrained"
          />
          <StatusCard
            count={overtrainedGroups.length}
            groupNames={overtrainedGroups.slice(0, 3).map((group) => group.label)}
            label="Overtrained"
            tone="overtrained"
          />
        </View>
      </ProgressSectionCard>

      <ProgressSectionCard subtitle="Deterministic local insights from the last two weeks of logged workouts." title="Insights">
        {analytics.insights.length === 0 ? (
          <EmptyProgressState message="No muscle insights yet." title="Nothing to report" />
        ) : (
          <View style={styles.insightList}>
            {analytics.insights.map((insight) => (
              <View key={insight} style={styles.insightRow}>
                <Text style={styles.insightBullet}>•</Text>
                <Text selectable style={styles.insightText}>
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ProgressSectionCard>

      <ProgressSectionCard
        subtitle={selectedGroupDetail ? `${selectedGroupDetail.label} · ${selectedGroupDetail.balanceLabel} · ${selectedGroupDetail.trendSentence}` : 'Select a muscle group to inspect the top contributing exercises.'}
        title="Exercise contribution">
        {selectedGroupDetail ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderCopy}>
                <Text selectable style={styles.detailTitle}>
                  {selectedGroupDetail.label}
                </Text>
                <Text selectable style={styles.detailMeta}>
                  {formatSets(selectedGroupDetail.workingSets)} · {formatVolume(selectedGroupDetail.volume)} · {formatShare(selectedGroupDetail.volumeShare)} of weekly volume
                </Text>
              </View>
              <View style={styles.detailPills}>
                <Text style={[styles.detailPill, getBalanceStyle(selectedGroupDetail.balanceStatus)]}>{selectedGroupDetail.balanceLabel}</Text>
                <Text style={[styles.detailPill, getHeatStyle(selectedGroupDetail.heatLevel)]}>{selectedGroupDetail.heatLabel}</Text>
                <Text style={styles.detailTrend}>{selectedGroupDetail.trendLabel}</Text>
              </View>
            </View>

            {selectedGroupDetail.topExercises.length === 0 ? (
              <Text style={styles.detailEmpty}>No tracked exercises mapped to this group in the selected window.</Text>
            ) : (
              <View style={styles.exerciseList}>
                {selectedGroupDetail.topExercises.map((exercise) => (
                  <View key={exercise.exerciseName} style={styles.exerciseRow}>
                    <View style={styles.exerciseCopy}>
                      <Text selectable style={styles.exerciseName}>
                        {exercise.exerciseName}
                      </Text>
                      <Text selectable style={styles.exerciseMeta}>
                        {formatSets(exercise.workingSets)}
                      </Text>
                    </View>
                    <Text selectable style={styles.exerciseShare}>
                      {Math.round(exercise.percentageContribution)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <EmptyProgressState message="No muscle volume tracked yet." title="No group selected" />
        )}
      </ProgressSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceBalanced: {
    borderColor: Colors.dark.accent,
  },
  balanceOvertrained: {
    borderColor: '#7C3AED',
  },
  balanceUndertrained: {
    borderColor: Colors.dark.border,
  },
  detailCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  detailEmpty: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  detailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  detailHeaderCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  detailMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  detailPill: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  detailPills: {
    alignItems: 'flex-end',
    gap: 4,
  },
  detailTitle: {
    color: Colors.dark.text,
    fontSize: 17,
    fontWeight: '900',
  },
  detailTrend: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseCopy: {
    flex: 1,
    gap: 2,
  },
  exerciseList: {
    gap: Spacing.one,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  exerciseShare: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  heatHigh: {
    backgroundColor: Colors.dark.accentMuted,
    borderColor: Colors.dark.accent,
  },
  heatMedium: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accentMuted,
  },
  heatNone: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
  },
  heatLow: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
  },
  heatmapChip: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
    minHeight: 72,
    padding: Spacing.two,
    width: '48%',
  },
  heatmapChipLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '900',
  },
  heatmapChipMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  heatmapChipPressed: {
    opacity: 0.88,
  },
  heatmapChipSelected: {
    borderColor: Colors.dark.accent,
    shadowColor: Colors.dark.accent,
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  insightBullet: {
    color: Colors.dark.accent,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    width: 14,
  },
  insightList: {
    gap: Spacing.two,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  insightText: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  miniStat: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    flex: 1,
    minWidth: 150,
    padding: Spacing.two,
  },
  miniStatDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  miniStatLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  miniStatValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '900',
  },
  statusCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 150,
    padding: Spacing.two,
  },
  statusCardCount: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statusCardLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusCardNames: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  wrapper: {
    gap: Spacing.three,
  },
});
