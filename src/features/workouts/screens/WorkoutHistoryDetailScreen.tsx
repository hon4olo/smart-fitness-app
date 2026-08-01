import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing } from '@/constants/theme';
import { useWorkoutState } from '@/context/AppContext';
import { useLocalization } from '@/localization';
import { getUserLimitationsCopy } from '@/localization/userLimitationsCopy';
import { getWorkoutHistoryCopy } from '@/localization/workoutHistoryCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSafetyMetadata } from '@/types';
import { weightFromKg, useUnitPreferences } from '@/units';
import {
  buildWorkoutHistoryItemView,
  getWorkoutDurationMinutes,
  groupWorkoutSessionSets,
} from '../workoutHistoryViewModel';
import {
  createWorkoutHistoryDetailStyles,
  type WorkoutHistoryDetailStyles,
} from './workoutHistoryDetailScreen.styles';

const safetyColor = (
  metadata: WorkoutSafetyMetadata,
  colors: ReturnType<typeof useAppTheme>['colors'],
): string => {
  if (metadata.reviewStatus === 'ready') return colors.success;
  if (metadata.reviewStatus === 'blocked') return colors.error;
  return colors.warning;
};

export default function WorkoutHistoryDetailScreen() {
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const { workoutSessions } = useWorkoutState();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getWorkoutHistoryCopy(locale);
  const limitationCopy = getUserLimitationsCopy(locale);
  const { formatWeightValue, weight: weightUnit } = useUnitPreferences();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createWorkoutHistoryDetailStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const session = useMemo(
    () => workoutSessions.find((item) => item.id === sessionId) ?? null,
    [sessionId, workoutSessions],
  );
  const summary = useMemo(
    () => (session ? buildWorkoutHistoryItemView(session) : null),
    [session],
  );
  const exerciseGroups = useMemo(
    () => (session ? groupWorkoutSessionSets(session) : []),
    [session],
  );
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
  const formatTimestamp = (value: string | null | undefined): string => {
    if (!value || !Number.isFinite(Date.parse(value))) return copy.unknownDate;
    return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
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
          <Text numberOfLines={1} style={styles.title}>
            {copy.detailsTitle}
          </Text>
          <Text style={styles.subtitle}>{copy.detailsSubtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {!session || !summary ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.notFoundTitle}</Text>
              <Text style={styles.bodyText}>{copy.notFoundBody}</Text>
            </AppCard>
          ) : (
            <>
              <AppCard>
                <Text style={styles.eyebrow}>{copy.completedWorkoutEyebrow}</Text>
                <Text style={styles.workoutTitle}>{session.workoutTitle}</Text>
                <Text style={styles.metaText}>{formatTimestamp(session.finishedAt)}</Text>
                <View style={styles.metricGrid}>
                  <Metric
                    label={copy.duration}
                    value={formatDuration(getWorkoutDurationMinutes(session))}
                    styles={styles}
                  />
                  <Metric
                    label={copy.sets(summary.setCount, '').trim()}
                    value={formatNumber(summary.setCount, { maximumFractionDigits: 0 })}
                    styles={styles}
                  />
                  <Metric
                    label={copy.exercises}
                    value={formatNumber(summary.exerciseCount, { maximumFractionDigits: 0 })}
                    styles={styles}
                  />
                  <Metric label={copy.volumeLabel} value={formatVolume(summary.volume)} styles={styles} />
                </View>
                {session.notes ? (
                  <View style={styles.notesBlock}>
                    <Text style={styles.sectionTitle}>{copy.workoutNotes}</Text>
                    <Text style={styles.bodyText}>{session.notes}</Text>
                  </View>
                ) : null}
              </AppCard>

              <AppCard>
                <View style={styles.sectionHeader}>
                  <Text style={styles.cardTitle}>{copy.loggedExercises}</Text>
                  <Text style={styles.metaText}>
                    {copy.total(
                      formatNumber(exerciseGroups.length, { maximumFractionDigits: 0 }),
                    )}
                  </Text>
                </View>
                {exerciseGroups.map((group) => (
                  <View key={`${group.exerciseId}-${group.exerciseName}`} style={styles.exerciseBlock}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseCopy}>
                        <Text style={styles.sectionTitle}>{group.exerciseName}</Text>
                        <Text style={styles.metaText}>
                          {copy.sets(
                            group.completedSetCount,
                            formatNumber(group.completedSetCount, { maximumFractionDigits: 0 }),
                          )}{' '}
                          · {formatVolume(group.volume)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.setTableHeader}>
                      <Text style={[styles.tableHeaderLabel, styles.setColumn]}>{copy.tableSet}</Text>
                      <Text style={styles.tableHeaderLabel}>{weightUnit.toUpperCase()}</Text>
                      <Text style={styles.tableHeaderLabel}>{copy.tableReps}</Text>
                      <Text style={styles.tableHeaderLabel}>RPE</Text>
                    </View>
                    {group.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={[styles.setValue, styles.setColumn]}>
                          {formatNumber(index + 1, { maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.setValue}>{formatWeightValue(set.weight)}</Text>
                        <Text style={styles.setValue}>
                          {formatNumber(set.reps, { maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.setValue}>
                          {set.actualRpe === undefined
                            ? '—'
                            : formatNumber(set.actualRpe, { maximumFractionDigits: 0 })}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </AppCard>

              <SafetyHistoryCard
                metadata={session.safetyRecovery}
                styles={styles}
                colors={colors}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({
  label,
  styles,
  value,
}: {
  label: string;
  styles: WorkoutHistoryDetailStyles;
  value: string;
}) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SafetyHistoryCard({
  colors,
  metadata,
  styles,
}: {
  colors: ReturnType<typeof useAppTheme>['colors'];
  metadata?: WorkoutSafetyMetadata;
  styles: WorkoutHistoryDetailStyles;
}) {
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getWorkoutHistoryCopy(locale);
  const limitationCopy = getUserLimitationsCopy(locale);
  const formatTimestamp = (value: string | null | undefined): string => {
    if (!value || !Number.isFinite(Date.parse(value))) return copy.unknownDate;
    return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const limitationLabel = (labels: Record<string, string>, value: string) =>
    labels[value] ?? copy.unknownValue;

  if (!metadata) {
    return (
      <AppCard>
        <Text style={styles.cardTitle}>{copy.safetyContext}</Text>
        <Text style={styles.bodyText}>{copy.noSafetyContext}</Text>
        <Text style={styles.disclaimer}>{copy.currentReadinessDisclaimer}</Text>
      </AppCard>
    );
  }

  const accentColor = safetyColor(metadata, colors);
  const status = copy.safetyLabel(metadata.reviewStatus);
  const loadCeiling =
    metadata.recommendedLoadMultiplier === null
      ? copy.notRecorded
      : `${formatNumber(Math.round(metadata.recommendedLoadMultiplier * 100), {
          maximumFractionDigits: 0,
        })}%`;
  const gateLabel =
    metadata.gateKind === 'review_missing'
      ? copy.reviewMissing
      : metadata.gateKind === 'review_stale'
        ? copy.reviewStale
        : metadata.gateKind === 'confirmation_required'
          ? copy.confirmationRequired
          : copy.readyWithoutConfirmation;

  return (
    <AppCard style={metadata.reviewStatus === 'blocked' ? styles.blockedCard : undefined}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.cardTitle}>{copy.safetyContext}</Text>
          <Text style={styles.bodyText}>{copy.immutableContext}</Text>
        </View>
        <Text style={[styles.statusBadge, { color: accentColor }]}>{status}</Text>
      </View>

      <View style={styles.metricGrid}>
        <Metric label={copy.reviewedLoadCeiling} value={loadCeiling} styles={styles} />
        <Metric
          label={copy.restrictionsShown}
          value={formatNumber(metadata.restrictions.length, { maximumFractionDigits: 0 })}
          styles={styles}
        />
      </View>

      <View style={styles.infoStack}>
        <InfoRow label={copy.gateState} value={gateLabel} styles={styles} />
        <InfoRow
          label={copy.acknowledgement}
          value={
            metadata.acknowledgementRequired
              ? metadata.explicitlyAcknowledged
                ? copy.explicitlyConfirmed
                : copy.notConfirmed
              : copy.notRequired
          }
          styles={styles}
        />
        <InfoRow
          label={copy.capturedAt}
          value={formatTimestamp(metadata.acknowledgedAt)}
          styles={styles}
        />
        <InfoRow
          label={copy.reviewRun}
          value={metadata.reviewRunId ? copy.yes : copy.noReviewRun}
          styles={styles}
        />
      </View>

      {metadata.restrictions.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{copy.restrictionsBefore}</Text>
          {metadata.restrictions.map((restriction) => (
            <View key={restriction.limitationId} style={styles.listRow}>
              <View style={styles.listCopy}>
                <Text style={styles.listTitle}>
                  {limitationLabel(
                    limitationCopy.bodyRegionLabels as Record<string, string>,
                    restriction.bodyRegion,
                  )}{' '}
                  ·{' '}
                  {limitationLabel(
                    limitationCopy.sideLabels as Record<string, string>,
                    restriction.side,
                  )}
                </Text>
                <Text style={styles.bodyText}>
                  {copy.actionLabel(restriction.action)} ·{' '}
                  {copy.affectedLoad(
                    formatNumber(Math.round(restriction.maximumLoadMultiplier * 100), {
                      maximumFractionDigits: 0,
                    }),
                  )}
                </Text>
                {restriction.movementPatterns.length > 0 ? (
                  <Text style={styles.metaText}>
                    {copy.movements}:{' '}
                    {restriction.movementPatterns
                      .map((value) =>
                        limitationLabel(
                          limitationCopy.movementLabels as Record<string, string>,
                          value,
                        ),
                      )
                      .join(', ')}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.rowBadge, { color: colors.warning }]}>
                {copy.severityLabel(restriction.severity)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {metadata.issues.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{copy.findingsBefore}</Text>
          {metadata.issues.map((issue, index) => (
            <View key={`${issue.code}-${index}`} style={styles.listRow}>
              <View style={styles.listCopy}>
                <Text style={styles.listTitle}>{copy.findingTitle}</Text>
                <Text style={styles.bodyText}>{copy.findingFallback}</Text>
              </View>
              <Text
                style={[
                  styles.rowBadge,
                  { color: issue.severity === 'hard_block' ? colors.error : colors.warning },
                ]}>
                {copy.severityLabel(issue.severity)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>{copy.historicalDisclaimer}</Text>
    </AppCard>
  );
}

function InfoRow({
  label,
  styles,
  value,
}: {
  label: string;
  styles: WorkoutHistoryDetailStyles;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.metaText}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}
