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
import { useLocalization } from '@/localization';
import { getStrengthCoachCopy } from '@/localization/strengthCoachCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import { useUnitPreferences, weightFromKg } from '@/units';

import { StrengthCoachResultCard } from '../components/StrengthCoachResultCard';
import { StrengthStrategyProposalView } from '../components/StrengthStrategyProposalView';
import { buildStrengthCoachViewModel } from '../strengthCoachViewModel';
import { buildStrengthStrategyViewModel } from '../strengthStrategyViewModel';
import { createStrengthCoachScreenStyles } from './strengthCoachScreen.styles';

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

export default function StrengthCoachScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStrengthCoachScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState, workoutSessions } = useAppContext();
  const { syncNow } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const { formatDate, formatNumber, locale } = useLocalization();
  const { weight } = useUnitPreferences();
  const copy = getStrengthCoachCopy(locale);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [capabilitiesUnavailable, setCapabilitiesUnavailable] = useState(false);
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
    if (!ready || !isAuthenticated) {
      setCapabilities(null);
      setCapabilitiesLoading(false);
      setCapabilitiesUnavailable(false);
      return;
    }

    let cancelled = false;
    setCapabilitiesLoading(true);
    setCapabilitiesUnavailable(false);

    void coachApi
      .getCapabilities()
      .then((value) => {
        if (!cancelled) setCapabilities(value);
      })
      .catch(() => {
        if (cancelled) return;
        setCapabilities(null);
        setCapabilitiesUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setCapabilitiesLoading(false);
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
        requestType === 'strength_strategy_proposal'
          ? copy.strategyFailed
          : requestType === 'next_workout_proposal'
            ? copy.proposalFailed
            : copy.reviewFailed,
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
    } catch {
      setError(copy.confirmationFailed);
    } finally {
      setConfirmingStrategy(false);
    }
  };

  const requestStrategyConfirmation = () => {
    if (!strategyViewModel || strategyViewModel.kind !== 'proposal') return;
    const setCount = strategyViewModel.sets.length;
    Alert.alert(
      copy.createTemplateTitle,
      copy.createTemplateBody(
        copy.strategyLabel(strategyViewModel.strategy),
        setCount,
        formatNumber(setCount, { maximumFractionDigits: 0 }),
        formatNumber(weightFromKg(strategyViewModel.proposedTonnage, weight), {
          maximumFractionDigits: 1,
        }),
        weight,
      ),
      [
        { text: copy.cancel, style: 'cancel' },
        {
          text: copy.createTemplate,
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
  const runStatus = run ? copy.runStatus[run.run.status] ?? copy.resultUnavailableTitle : '';
  const latestSessionDate = latestSession
    ? Number.isFinite(new Date(latestSession.finishedAt).getTime())
      ? formatDate(latestSession.finishedAt, { dateStyle: 'medium', timeStyle: 'short' })
      : copy.unknownDate
    : '';
  const capabilityStatus = strengthStrategyAvailable
    ? strengthConfirmationAvailable
      ? copy.providerAndConfirmationAvailable
      : copy.providerAvailable
    : capabilitiesLoading
      ? copy.checkingCapabilities
      : capabilitiesUnavailable
        ? copy.capabilityUnknown
        : copy.providerDisabled;
  const strategyResultCopy = strategyViewModel
    ? strategyViewModel.kind === 'pending'
      ? { title: copy.strategyInProgressTitle, message: copy.strategyInProgressBody }
      : strategyViewModel.kind === 'failed'
        ? { title: copy.resultUnavailableTitle, message: copy.resultUnavailableBody }
        : strategyViewModel.kind === 'rejected'
          ? copy.rejectionCopy(strategyViewModel.reason)
          : strategyViewModel.kind === 'applied'
            ? { title: copy.templateCreatedTitle, message: copy.templateCreatedBody }
            : { title: copy.strategyPreviewTitle, message: copy.strategyPreviewBody }
    : null;

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
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
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
              <Text style={styles.previewBadge}>{copy.preview}</Text>
              <Text style={styles.statusText}>{capabilityStatus}</Text>
            </View>
            <Text style={styles.cardTitle}>{copy.validatedAnalysis}</Text>
            <Text style={styles.bodyText}>{copy.validatedBody}</Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.preparing}</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.signInRequired}</Text>
              <Text style={styles.bodyText}>{copy.signInBody}</Text>
              <PrimaryButton label={copy.signIn} onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.trainingContext}</Text>
              {latestSession ? (
                <View style={styles.sessionSummary}>
                  <Text style={styles.sessionTitle}>{latestSession.workoutTitle}</Text>
                  <Text style={styles.bodyText}>{latestSessionDate}</Text>
                  <Text style={styles.metaText}>
                    {copy.selectedPrimarySession(
                      completedSetCount,
                      formatNumber(completedSetCount, { maximumFractionDigits: 0 }),
                    )}
                  </Text>
                </View>
              ) : (
                <Text style={styles.bodyText}>{copy.noCompletedWorkout}</Text>
              )}

              <PrimaryButton
                disabled={!latestSession || controlsBusy}
                label={copy.reviewLatestWorkout}
                loading={busyAction === 'session_review'}
                onPress={() => void startRun('session_review')}
              />
              <SecondaryButton
                disabled={!latestSession || controlsBusy}
                label={copy.proposeNextWorkout}
                loading={busyAction === 'next_workout_proposal'}
                onPress={() => void startRun('next_workout_proposal')}
              />
              {strengthStrategyAvailable ? (
                <SecondaryButton
                  disabled={!latestSession || controlsBusy}
                  label={copy.generateStrategy}
                  loading={busyAction === 'strength_strategy_proposal'}
                  onPress={() => void startRun('strength_strategy_proposal')}
                />
              ) : (
                <Text style={styles.disclaimer}>
                  {capabilitiesLoading
                    ? copy.capabilityChecking
                    : capabilitiesUnavailable
                      ? copy.capabilityUnavailable
                      : copy.capabilityDisabled}
                </Text>
              )}
              <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
            </AppCard>
          )}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>{copy.requestError}</Text>
              <Text style={styles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? (
            <StrengthCoachResultCard
              copy={copy}
              runStatus={runStatus}
              styles={styles}
              viewModel={viewModel}
            />
          ) : null}

          {strategyViewModel && strategyResultCopy ? (
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>{strategyResultCopy.title}</Text>
                <Text style={styles.resultStatus}>{runStatus}</Text>
              </View>
              <Text style={styles.bodyText}>{strategyResultCopy.message}</Text>
              {strategyViewModel.kind === 'proposal' || strategyViewModel.kind === 'applied' ? (
                <StrengthStrategyProposalView
                  confirmationEnabled={strengthConfirmationAvailable}
                  confirming={confirmingStrategy}
                  copy={copy}
                  onConfirm={requestStrategyConfirmation}
                  viewModel={strategyViewModel}
                />
              ) : null}
              {strategyViewModel.kind === 'rejected' && strategyViewModel.issues.length > 0 ? (
                <View style={styles.issueList}>
                  <Text style={styles.issueText}>
                    • {copy.deterministicIssues(
                      strategyViewModel.issues.length,
                      formatNumber(strategyViewModel.issues.length, {
                        maximumFractionDigits: 0,
                      }),
                    )}
                  </Text>
                </View>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
