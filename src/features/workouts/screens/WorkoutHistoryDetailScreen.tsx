import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSafetyMetadata } from '@/types';
import {
  buildWorkoutHistoryItemView,
  formatWorkoutSafetyGate,
  formatWorkoutSafetyStatus,
  groupWorkoutSessionSets,
} from '../workoutHistoryViewModel';
import {
  createWorkoutHistoryDetailStyles,
  type WorkoutHistoryDetailStyles,
} from './workoutHistoryDetailScreen.styles';

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

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
  const { workoutSessions } = useAppContext();
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

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.title}>
            Workout details
          </Text>
          <Text style={styles.subtitle}>Completed session record</Text>
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
              <Text style={styles.cardTitle}>Workout not found</Text>
              <Text style={styles.bodyText}>
                This completed workout is no longer available on the current device.
              </Text>
            </AppCard>
          ) : (
            <>
              <AppCard>
                <Text style={styles.eyebrow}>COMPLETED WORKOUT</Text>
                <Text style={styles.workoutTitle}>{session.workoutTitle}</Text>
                <Text style={styles.metaText}>{summary.dateLabel}</Text>
                <View style={styles.metricGrid}>
                  <Metric label="Duration" value={summary.durationLabel} styles={styles} />
                  <Metric label="Sets" value={`${summary.setCount}`} styles={styles} />
                  <Metric label="Exercises" value={`${summary.exerciseCount}`} styles={styles} />
                  <Metric label="Volume" value={summary.volumeLabel} styles={styles} />
                </View>
                {session.notes ? (
                  <View style={styles.notesBlock}>
                    <Text style={styles.sectionTitle}>Workout notes</Text>
                    <Text style={styles.bodyText}>{session.notes}</Text>
                  </View>
                ) : null}
              </AppCard>

              <AppCard>
                <View style={styles.sectionHeader}>
                  <Text style={styles.cardTitle}>Logged exercises</Text>
                  <Text style={styles.metaText}>{exerciseGroups.length} total</Text>
                </View>
                {exerciseGroups.map((group) => (
                  <View key={`${group.exerciseId}-${group.exerciseName}`} style={styles.exerciseBlock}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseCopy}>
                        <Text style={styles.sectionTitle}>{group.exerciseName}</Text>
                        <Text style={styles.metaText}>
                          {group.completedSetCount} sets · {Math.round(group.volume).toLocaleString()} kg
                        </Text>
                      </View>
                    </View>
                    <View style={styles.setTableHeader}>
                      <Text style={[styles.tableHeaderLabel, styles.setColumn]}>SET</Text>
                      <Text style={styles.tableHeaderLabel}>KG</Text>
                      <Text style={styles.tableHeaderLabel}>REPS</Text>
                      <Text style={styles.tableHeaderLabel}>RPE</Text>
                    </View>
                    {group.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={[styles.setValue, styles.setColumn]}>{index + 1}</Text>
                        <Text style={styles.setValue}>{set.weight}</Text>
                        <Text style={styles.setValue}>{set.reps}</Text>
                        <Text style={styles.setValue}>{set.actualRpe ?? '—'}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </AppCard>

              <SafetyHistoryCard metadata={session.safetyRecovery} styles={styles} colors={colors} />
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
  if (!metadata) {
    return (
      <AppCard>
        <Text style={styles.cardTitle}>Safety & Recovery context</Text>
        <Text style={styles.bodyText}>
          No pre-workout Safety & Recovery context was recorded for this historical session.
        </Text>
        <Text style={styles.disclaimer}>
          This does not describe the user&apos;s current readiness state.
        </Text>
      </AppCard>
    );
  }

  const accentColor = safetyColor(metadata, colors);
  const status = formatWorkoutSafetyStatus(metadata.reviewStatus);
  const loadCeiling =
    metadata.recommendedLoadMultiplier === null
      ? 'Not recorded'
      : `${Math.round(metadata.recommendedLoadMultiplier * 100)}%`;

  return (
    <AppCard style={metadata.reviewStatus === 'blocked' ? styles.blockedCard : undefined}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.cardTitle}>Safety & Recovery context</Text>
          <Text style={styles.bodyText}>
            Immutable record captured before this workout started.
          </Text>
        </View>
        <Text style={[styles.statusBadge, { color: accentColor }]}>{status.toUpperCase()}</Text>
      </View>

      <View style={styles.metricGrid}>
        <Metric label="Reviewed load ceiling" value={loadCeiling} styles={styles} />
        <Metric label="Restrictions shown" value={`${metadata.restrictions.length}`} styles={styles} />
      </View>

      <View style={styles.infoStack}>
        <InfoRow label="Gate state" value={formatWorkoutSafetyGate(metadata)} styles={styles} />
        <InfoRow
          label="Acknowledgement"
          value={
            metadata.acknowledgementRequired
              ? metadata.explicitlyAcknowledged
                ? 'Explicitly confirmed'
                : 'Not confirmed'
              : 'Not required'
          }
          styles={styles}
        />
        <InfoRow
          label="Captured at"
          value={formatTimestamp(metadata.acknowledgedAt)}
          styles={styles}
        />
        <InfoRow
          label="Review run"
          value={metadata.reviewRunId ?? 'No review run'}
          styles={styles}
        />
      </View>

      {metadata.restrictions.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Restrictions shown before the workout</Text>
          {metadata.restrictions.map((restriction) => (
            <View key={restriction.limitationId} style={styles.listRow}>
              <View style={styles.listCopy}>
                <Text style={styles.listTitle}>
                  {formatCode(restriction.bodyRegion)} · {formatCode(restriction.side)}
                </Text>
                <Text style={styles.bodyText}>
                  {formatCode(restriction.action)} · affected load up to{' '}
                  {Math.round(restriction.maximumLoadMultiplier * 100)}%
                </Text>
                {restriction.movementPatterns.length > 0 ? (
                  <Text style={styles.metaText}>
                    Movements: {restriction.movementPatterns.map(formatCode).join(', ')}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.rowBadge, { color: colors.warning }]}>
                {restriction.severity.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {metadata.issues.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Findings shown before the workout</Text>
          {metadata.issues.map((issue, index) => (
            <View key={`${issue.code}-${index}`} style={styles.listRow}>
              <View style={styles.listCopy}>
                <Text style={styles.listTitle}>{formatCode(issue.code)}</Text>
                <Text style={styles.bodyText}>{issue.message}</Text>
              </View>
              <Text
                style={[
                  styles.rowBadge,
                  { color: issue.severity === 'hard_block' ? colors.error : colors.warning },
                ]}>
                {formatCode(issue.severity)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        This is historical product metadata. It is not a current medical assessment, diagnosis, or
        training recommendation.
      </Text>
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
