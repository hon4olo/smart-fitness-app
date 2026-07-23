import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createCoachApi,
  type CoachCapabilities,
  type CoachRunEnvelope,
  type StrengthCoachRequestType,
} from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import { StrengthStrategyProposalView } from '../components/StrengthStrategyProposalView';
import {
  buildStrengthCoachViewModel,
  type StrengthCoachMetricSummary,
} from '../strengthCoachViewModel';
import { buildStrengthStrategyViewModel } from '../strengthStrategyViewModel';
import {
  createStrengthCoachScreenStyles,
  type StrengthCoachScreenStyles,
} from './strengthCoachScreen.styles';

const getCompletedSetCount = (session: WorkoutSession): number =>
  session.sets.filter((set) => set.completed !== false).length;

const getLatestSession = (sessions: WorkoutSession[]): WorkoutSession | null =>
  [...sessions].sort(
    (left, right) => Date.parse(right.finishedAt) - Date.parse(left.finishedAt),
  )[0] ?? null;

const createIdempotencyKey = (
  requestType: StrengthCoachRequestType,
  sessionId: string | null,
): string =>
  `mobile-${requestType}-${sessionId ?? 'latest'}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const createConfirmationKey = (runId: string): string =>
  `mobile-strength-confirm-${runId}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const formatSessionDate = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

function MetricGrid({
  metrics,
  styles,
}: {
  metrics: StrengthCoachMetricSummary;
  styles: StrengthCoachScreenStyles;
}) {
  const items = [
    { label: 'Completed sets', value: String(metrics.completedSets) },
    { label: 'Total reps', value: String(metrics.totalReps) },
    { label: 'Tonnage', value: `${metrics.totalTonnage.toLocaleString()} kg` },
    {
      label: 'Average RPE',
      value: metrics.averageActualRpe === null ? '—' : String(metrics.averageActualRpe),
    },
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
  const styles = useMemo(() => createStrengthCoachScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState, workoutSessions } = useAppContext();
  const { syncNow } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [busyAction, setBusyAction] = useState<StrengthCoachRequestType | null>(null);
  const [confirmingStrategy, setConfirmingStrategy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const latestSession = useMemo(() => getLatestSession(workoutSessions), [workoutSessions]);
  const viewModel = useMemo(
    () =>
      run && run.run.requestType !== 'strength_strategy_proposal'
        ? buildStrengthCoachViewModel(run)
        : null,
    [run],
  );
  const strategyViewModel = useMemo(
    () =>
      run?.run.requestType === 'strength_strategy_proposal'
        ? buildStrengthStrategyViewModel(run)
        : null,
    [run],
  );
  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const strengthStrategyAvailable =
    capabilities?.strength?.structuredStrategyProposal === true;
  const strengthConfirmationAvailable =
    capabilities?.strength?.structuredStrategyConfirmation === true;

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

  useEffect(() => {
    let cancelled = false;
    if (!ready || !isAuthenticated) {
      setCapabilities(null);
      return () => {
        cancelled = true;
      };
    }

    void coachApi
      .getCapabilities()
      .then((value) => {
        if (!cancelled) setCapabilities(value);
      })
      .catch(() => {
        if (!cancelled) setCapabilities(null);
      });

    return () => {
      cancelled = true;
    };
  }, [coachApi, isAuthenticated, ready]);

  const startRun = async (requestType: StrengthCoachRequestType) => {
    if (
      busyAction ||
      confirmingStrategy ||
      (requestType === 'strength_strategy_proposal' && !strengthStrategyAvailable)
    ) {
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
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
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

  const confirmStrategy = async () => {
    if (
      confirmingStrategy ||
      !strengthConfirmationAvailable ||
      !strategyViewModel ||
      strategyViewModel.kind !== 'proposal'
    ) {
      return;
    }

    setConfirmingStrategy(true);
    setError(null);
    try {
      const confirmed = await coachApi.confirmRun(strategyViewModel.runId, {
        idempotencyKey: createConfirmationKey(strategyViewModel.runId),
      });
      setRun(confirmed);
      await syncNow();
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : 'The Strength Strategy template could not be created.',
      );
    } finally {
      setConfirmingStrategy(false);
    }
  };

  const requestStrategyConfirmation = () => {
    if (!strategyViewModel || strategyViewModel.kind !== 'proposal') return;
    Alert.alert(
      'Create workout template?',
      `Create a new ${strategyViewModel.strategy} template with ${strategyViewModel.sets.length} mapped set${strategyViewModel.sets.length === 1 ? '' : 's'} and ${strategyViewModel.proposedTonnage.toLocaleString()} kg proposed volume?\n\nThe completed source workout will not be changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create template',
          onPress: () => {
            void confirmStrategy();
          },
        },
      ],
    );
  };

  const loading = !ready || isRestoringState;
  const completedSetCount = latestSession ? getCompletedSetCount(latestSession) : 0;
  const controlsBusy = Boolean(busyAction) || confirmingStrategy;

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
          <Text style={styles.title}>Strength Coach</Text>
          <Text style={styles.subtitle}>Deterministic and guarded preview</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AppCard>
            <View style={styles.badgeRow}>
              <Text style={styles.previewBadge}>Preview</Text>
              <Text style={styles.statusText}>
                {strengthStrategyAvailable
                  ? strengthConfirmationAvailable
                    ? 'Structured Strength provider and confirmation available'
                    : 'Structured Strength preview available'
                  : 'Structured Strength provider disabled'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>Validated training analysis</Text>
            <Text style={styles.bodyText}>
              This screen uses synchronized workout sets, deterministic metrics and hard guardrails.
              A confirmed strategy creates a new template and never edits completed workout history.
            </Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>Preparing account and training data…</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>Sign in required</Text>
              <Text style={styles.bodyText}>
                Strength Coach reads only training data synchronized to your protected backend account.
              </Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>Training context</Text>
              {latestSession ? (
                <View style={styles.sessionSummary}>
                  <Text style={styles.sessionTitle}>{latestSession.workoutTitle}</Text>
                  <Text style={styles.bodyText}>
                    {formatSessionDate(latestSession.finishedAt)}
                  </Text>
                  <Text style={styles.metaText}>
                    {completedSetCount} completed set{completedSetCount === 1 ? '' : 's'} selected
                    as the primary session
                  </Text>
                </View>
              ) : (
                <Text style={styles.bodyText}>
                  No completed local workout is available. Finish and synchronize a workout first.
                </Text>
              )}

              <PrimaryButton
                disabled={!latestSession || controlsBusy}
                label="Review latest workout"
                loading={busyAction === 'session_review'}
                onPress={() => void startRun('session_review')}
              />
              <SecondaryButton
                disabled={!latestSession || controlsBusy}
                label="Propose next workout"
                loading={busyAction === 'next_workout_proposal'}
                onPress={() => void startRun('next_workout_proposal')}
              />
              {strengthStrategyAvailable ? (
                <SecondaryButton
                  disabled={!latestSession || controlsBusy}
                  label="Generate AI Strength Strategy"
                  loading={busyAction === 'strength_strategy_proposal'}
                  onPress={() => void startRun('strength_strategy_proposal')}
                />
              ) : null}
              <Text style={styles.disclaimer}>
                The deterministic proposal mirrors completed sets. The optional AI strategy must map
                every source set exactly once and pass load, repetition, RPE and volume policies.
              </Text>
            </AppCard>
          )}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>Request error</Text>
              <Text style={styles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? (
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>{viewModel.title}</Text>
                <Text style={styles.resultStatus}>{run?.run.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.bodyText}>{viewModel.message}</Text>

              {viewModel.kind === 'review' || viewModel.kind === 'proposal' ? (
                <MetricGrid metrics={viewModel.metrics} styles={styles} />
              ) : null}

              {viewModel.kind === 'proposal' ? (
                <View style={styles.proposalList}>
                  <View style={styles.guardrailRow}>
                    <Text style={styles.metaText}>Guardrail</Text>
                    <Text style={styles.guardrailValue}>{viewModel.guardrailStatus}</Text>
                  </View>
                  {viewModel.sets.map((set, index) => (
                    <View key={`${set.sourceSetId}-${index}`} style={styles.proposalRow}>
                      <View style={styles.proposalCopy}>
                        <Text numberOfLines={1} style={styles.sessionTitle}>
                          {set.exerciseName}
                        </Text>
                        <Text style={styles.metaText}>
                          {set.weight} kg × {set.reps} · target RPE {set.targetRpe}
                        </Text>
                      </View>
                      <Text style={styles.adjustmentLabel}>
                        {set.adjustmentPercent > 0 ? '+' : ''}{set.adjustmentPercent}%
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {viewModel.kind === 'rejected' || viewModel.kind === 'proposal'
                ? viewModel.issues.length > 0
                  ? (
                      <View style={styles.issueList}>
                        {viewModel.issues.map((issue, index) => (
                          <Text key={`${issue}-${index}`} style={styles.issueText}>
                            • {issue}
                          </Text>
                        ))}
                      </View>
                    )
                  : null
                : null}
            </AppCard>
          ) : null}

          {strategyViewModel ? (
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>{strategyViewModel.title}</Text>
                <Text style={styles.resultStatus}>{run?.run.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.bodyText}>{strategyViewModel.message}</Text>
              {strategyViewModel.kind === 'proposal' || strategyViewModel.kind === 'applied' ? (
                <StrengthStrategyProposalView
                  confirmationEnabled={strengthConfirmationAvailable}
                  confirming={confirmingStrategy}
                  onConfirm={requestStrategyConfirmation}
                  viewModel={strategyViewModel}
                />
              ) : null}
              {strategyViewModel.kind === 'rejected' && strategyViewModel.issues.length > 0 ? (
                <View style={styles.issueList}>
                  {strategyViewModel.issues.map((issue, index) => (
                    <Text key={`${issue}-${index}`} style={styles.issueText}>
                      • {issue}
                    </Text>
                  ))}
                </View>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
