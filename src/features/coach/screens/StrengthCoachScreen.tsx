import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachRunEnvelope, type StrengthCoachRequestType } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import { buildStrengthCoachViewModel, type StrengthCoachMetricSummary } from '../strengthCoachViewModel';

const getCompletedSetCount = (session: WorkoutSession): number =>
  session.sets.filter((set) => set.completed !== false).length;

const getLatestSession = (sessions: WorkoutSession[]): WorkoutSession | null =>
  [...sessions].sort(
    (left, right) => Date.parse(right.finishedAt) - Date.parse(left.finishedAt),
  )[0] ?? null;

const createIdempotencyKey = (requestType: StrengthCoachRequestType, sessionId: string | null): string =>
  `mobile-${requestType}-${sessionId ?? 'latest'}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const formatSessionDate = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

function MetricGrid({ metrics }: { metrics: StrengthCoachMetricSummary }) {
  const items = [
    { label: 'Completed sets', value: String(metrics.completedSets) },
    { label: 'Total reps', value: String(metrics.totalReps) },
    { label: 'Tonnage', value: `${metrics.totalTonnage.toLocaleString()} kg` },
    { label: 'Average RPE', value: metrics.averageActualRpe === null ? '—' : String(metrics.averageActualRpe) },
  ];

  return (
    <View style={styles.metricGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.metricCell}>
          <Text style={styles.metricValue}>{item.value}</Text>
          <Text style={styles.metricLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StrengthCoachScreen() {
  const { colors } = useAppTheme();
  const themedStyles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState, workoutSessions } = useAppContext();
  const { ready, refresh, session } = useAuthSession();
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [busyAction, setBusyAction] = useState<StrengthCoachRequestType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const latestSession = useMemo(() => getLatestSession(workoutSessions), [workoutSessions]);
  const viewModel = useMemo(() => (run ? buildStrengthCoachViewModel(run) : null), [run]);
  const isAuthenticated = Boolean(session?.tokens.accessToken);

  const coachApi = useMemo(
    () =>
      createCoachApi({
        getAccessToken: async () => session?.tokens.accessToken ?? null,
        refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
      }),
    [refresh, session?.tokens.accessToken],
  );

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const startRun = async (requestType: StrengthCoachRequestType) => {
    if (busyAction) {
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setBusyAction(requestType);
    setError(null);
    setRun(null);

    try {
      const initial = await coachApi.startStrengthRun({
        requestType,
        ...(latestSession ? { requestedSessionId: latestSession.id } : {}),
        historyLimit: 8,
        idempotencyKey: createIdempotencyKey(requestType, latestSession?.id ?? null),
      });
      setRun(initial);
      const terminal = await coachApi.waitForTerminalRun(initial, {
        signal: abortController.signal,
        intervalMs: 750,
        maxPolls: 20,
      });
      setRun(terminal);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') {
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Strength Coach could not complete the request.',
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setBusyAction(null);
      }
    }
  };

  const loading = !ready || isRestoringState;
  const completedSetCount = latestSession ? getCompletedSetCount(latestSession) : 0;

  return (
    <View style={themedStyles.screen}>
      <View style={[themedStyles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [themedStyles.backButton, pressed && themedStyles.pressed]}>
          <Text style={themedStyles.backLabel}>‹</Text>
        </Pressable>
        <View style={themedStyles.headerCopy}>
          <Text style={themedStyles.title}>Strength Coach</Text>
          <Text style={themedStyles.subtitle}>Deterministic preview</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          themedStyles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={themedStyles.container}>
          <AppCard>
            <View style={themedStyles.badgeRow}>
              <Text style={themedStyles.previewBadge}>Preview</Text>
              <Text style={themedStyles.statusText}>No LLM provider connected</Text>
            </View>
            <Text style={themedStyles.cardTitle}>Validated training analysis</Text>
            <Text style={themedStyles.bodyText}>
              This screen uses synchronized workout sets, deterministic metrics and hard guardrails.
              Nothing is applied to your program automatically.
            </Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={themedStyles.cardTitle}>Preparing account and training data…</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={themedStyles.cardTitle}>Sign in required</Text>
              <Text style={themedStyles.bodyText}>
                Strength Coach reads only training data synchronized to your protected backend account.
              </Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={themedStyles.cardTitle}>Training context</Text>
              {latestSession ? (
                <View style={themedStyles.sessionSummary}>
                  <Text style={themedStyles.sessionTitle}>{latestSession.workoutTitle}</Text>
                  <Text style={themedStyles.bodyText}>{formatSessionDate(latestSession.finishedAt)}</Text>
                  <Text style={themedStyles.metaText}>
                    {completedSetCount} completed set{completedSetCount === 1 ? '' : 's'} selected as the primary session
                  </Text>
                </View>
              ) : (
                <Text style={themedStyles.bodyText}>
                  No completed local workout is available. Finish and synchronize a workout first.
                </Text>
              )}

              <PrimaryButton
                disabled={!latestSession || Boolean(busyAction)}
                label="Review latest workout"
                loading={busyAction === 'session_review'}
                onPress={() => void startRun('session_review')}
              />
              <SecondaryButton
                disabled={!latestSession || Boolean(busyAction)}
                label="Propose next workout"
                loading={busyAction === 'next_workout_proposal'}
                onPress={() => void startRun('next_workout_proposal')}
              />
              <Text style={themedStyles.disclaimer}>
                The current proposal mirrors completed sets and adjusts load only from recorded RPE before guardrail validation.
              </Text>
            </AppCard>
          )}

          {error ? (
            <AppCard style={themedStyles.errorCard}>
              <Text style={themedStyles.errorTitle}>Request error</Text>
              <Text style={themedStyles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? (
            <AppCard>
              <View style={themedStyles.resultHeader}>
                <Text style={themedStyles.cardTitle}>{viewModel.title}</Text>
                <Text style={themedStyles.resultStatus}>{run?.run.status.toUpperCase()}</Text>
              </View>
              <Text style={themedStyles.bodyText}>{viewModel.message}</Text>

              {viewModel.kind === 'review' || viewModel.kind === 'proposal' ? (
                <MetricGrid metrics={viewModel.metrics} />
              ) : null}

              {viewModel.kind === 'proposal' ? (
                <View style={themedStyles.proposalList}>
                  <View style={themedStyles.guardrailRow}>
                    <Text style={themedStyles.metaText}>Guardrail</Text>
                    <Text style={themedStyles.guardrailValue}>{viewModel.guardrailStatus}</Text>
                  </View>
                  {viewModel.sets.map((set, index) => (
                    <View key={`${set.sourceSetId}-${index}`} style={themedStyles.proposalRow}>
                      <View style={themedStyles.proposalCopy}>
                        <Text numberOfLines={1} style={themedStyles.sessionTitle}>
                          {set.exerciseName}
                        </Text>
                        <Text style={themedStyles.metaText}>
                          {set.weight} kg × {set.reps} · target RPE {set.targetRpe}
                        </Text>
                      </View>
                      <Text style={themedStyles.adjustmentLabel}>
                        {set.adjustmentPercent > 0 ? '+' : ''}{set.adjustmentPercent}%
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {viewModel.kind === 'rejected' || viewModel.kind === 'proposal' ? (
                viewModel.issues.length > 0 ? (
                  <View style={themedStyles.issueList}>
                    {viewModel.issues.map((issue, index) => (
                      <Text key={`${issue}-${index}`} style={themedStyles.issueText}>
                        • {issue}
                      </Text>
                    ))}
                  </View>
                ) : null
              ) : null}
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  adjustmentLabel: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  metricCell: {
    flexBasis: '47%',
    gap: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  metricLabel: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    adjustmentLabel: {
      ...styles.adjustmentLabel,
      color: colors.accent,
    },
    backButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 42,
      fontWeight: '300',
      lineHeight: 42,
    },
    badgeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    container: {
      gap: Spacing.four,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    disclaimer: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    errorCard: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
    },
    errorTitle: {
      color: colors.error,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
    },
    guardrailRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    guardrailValue: {
      color: colors.success,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      textTransform: 'uppercase',
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    issueList: {
      gap: Spacing.one,
    },
    issueText: {
      color: colors.warning,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    pressed: {
      opacity: 0.65,
    },
    previewBadge: {
      backgroundColor: colors.accentSoft,
      borderRadius: Radii.pill,
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      overflow: 'hidden',
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    proposalCopy: {
      flex: 1,
      minWidth: 0,
    },
    proposalList: {
      gap: Spacing.two,
    },
    proposalRow: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      paddingTop: Spacing.two,
    },
    resultHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    resultStatus: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sessionSummary: {
      gap: Spacing.one,
    },
    sessionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    statusText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
    metricCell: styles.metricCell,
    metricGrid: styles.metricGrid,
    metricLabel: {
      ...styles.metricLabel,
      color: colors.textMuted,
    },
    metricValue: {
      ...styles.metricValue,
      color: colors.textPrimary,
    },
  });
