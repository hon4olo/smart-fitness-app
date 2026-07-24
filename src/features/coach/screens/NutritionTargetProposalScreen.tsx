import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachRunEnvelope } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import {
  buildNutritionCoachViewModel,
  type NutritionMetricTotals,
} from '../nutritionCoachViewModel';
import {
  readAppliedNutritionProposal,
  type AppliedNutritionProposal,
} from '../nutritionProposalConfirmation';
import { createNutritionTargetProposalStyles } from './nutritionTargetProposalStyles';

const LOOKBACK_OPTIONS = [7, 14, 30] as const;

const formatNumber = (value: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : value;
};

const createIdempotencyKey = (scope: string): string =>
  `mobile-${scope}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

function TargetSummary({ label, totals }: { label: string; totals: NutritionMetricTotals }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNutritionTargetProposalStyles(colors), [colors]);

  return (
    <View style={styles.targetBox}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.targetCalories}>{formatNumber(totals.calories)} kcal</Text>
      <Text style={styles.metaText}>
        P {formatNumber(totals.protein)} · C {formatNumber(totals.carbs)} · F{' '}
        {formatNumber(totals.fats)}
      </Text>
    </View>
  );
}

export default function NutritionTargetProposalScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNutritionTargetProposalStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppContext();
  const { syncNow } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const [lookbackDays, setLookbackDays] = useState<(typeof LOOKBACK_OPTIONS)[number]>(14);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<AppliedNutritionProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const confirmationKeyRef = useRef<string | null>(null);

  const viewModel = useMemo(() => (run ? buildNutritionCoachViewModel(run) : null), [run]);
  const authenticated = Boolean(session?.tokens.accessToken);
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

  const clearProposalState = () => {
    setRun(null);
    setApplied(null);
    setError(null);
    confirmationKeyRef.current = null;
  };

  const startProposal = async () => {
    if (busy || applying) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setBusy(true);
    clearProposalState();

    try {
      const initial = await coachApi.startNutritionRun({
        requestType: 'nutrition_target_proposal',
        lookbackDays,
        idempotencyKey: createIdempotencyKey(`nutrition-target-proposal-${lookbackDays}`),
      });
      setRun(initial);
      setRun(
        await coachApi.waitForTerminalRun(initial, {
          signal: controller.signal,
          intervalMs: 750,
          maxPolls: 20,
        }),
      );
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nutrition Coach could not generate the proposal.',
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setBusy(false);
      }
    }
  };

  const applyProposal = async () => {
    if (
      applying ||
      !run ||
      viewModel?.kind !== 'proposal' ||
      viewModel.guardrailStatus !== 'valid' ||
      !viewModel.changed ||
      applied
    ) {
      return;
    }

    const confirmationKey =
      confirmationKeyRef.current ?? createIdempotencyKey(`confirm-${run.run.id}`);
    confirmationKeyRef.current = confirmationKey;
    setApplying(true);
    setError(null);

    try {
      const confirmed = await coachApi.confirmRun(run.run.id, {
        idempotencyKey: confirmationKey,
      });
      setApplied(readAppliedNutritionProposal(confirmed));
      await syncNow();
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : 'The proposal could not be applied. Generate a new proposal and try again.',
      );
    } finally {
      setApplying(false);
    }
  };

  const requestApplyConfirmation = () => {
    if (viewModel?.kind !== 'proposal') return;

    Alert.alert(
      'Apply nutrition target changes?',
      `Calories stay at ${formatNumber(viewModel.proposedTargets.calories)} kcal. Macros will change to P ${formatNumber(viewModel.proposedTargets.protein)}, C ${formatNumber(viewModel.proposedTargets.carbs)}, F ${formatNumber(viewModel.proposedTargets.fats)}. The backend will reject the change if the target is stale.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            void applyProposal();
          },
        },
      ],
    );
  };

  const loading = !ready || isRestoringState;
  const canApply =
    viewModel?.kind === 'proposal' &&
    viewModel.guardrailStatus === 'valid' &&
    viewModel.changed &&
    !applied;

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
        <View>
          <Text style={styles.title}>Target Proposal</Text>
          <Text style={styles.subtitle}>Deterministic guardrails</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.eight }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AppCard>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Preview</Text>
              <Text style={styles.metaText}>Explicit confirmation required</Text>
            </View>
            <Text style={styles.cardTitle}>Calorie-neutral macro reconciliation</Text>
            <Text style={styles.bodyText}>
              Checks 4P + 4C + 9F against the current calorie target and proposes the smallest
              macro correction. It never raises or lowers calories from observed eating behaviour.
            </Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>Preparing synchronized data…</Text>
            </AppCard>
          ) : !authenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>Sign in required</Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>Validation period</Text>
              <View style={styles.periodRow}>
                {LOOKBACK_OPTIONS.map((days) => {
                  const selected = days === lookbackDays;
                  return (
                    <Pressable
                      key={days}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={busy || applying}
                      onPress={() => {
                        setLookbackDays(days);
                        clearProposalState();
                      }}
                      style={({ pressed }) => [
                        styles.periodButton,
                        selected && styles.periodButtonSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.periodLabel, selected && styles.periodLabelSelected]}>
                        {days} days
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <PrimaryButton
                disabled={busy || applying}
                label="Generate guarded proposal"
                loading={busy}
                onPress={() => void startProposal()}
              />
              <Text style={styles.disclaimer}>
                Requires at least three tracked days and an active synchronized target. Applying a
                valid result triggers backend revision checks and then normal sync pull.
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

              {viewModel.kind === 'proposal' ? (
                <View style={styles.resultStack}>
                  <View style={styles.verdictRow}>
                    <Text style={styles.metaText}>Guardrail</Text>
                    <Text style={styles.verdict}>{viewModel.guardrailStatus}</Text>
                  </View>
                  <View style={styles.targetsRow}>
                    <TargetSummary label="Current" totals={viewModel.currentTargets} />
                    <TargetSummary label="Proposed" totals={viewModel.proposedTargets} />
                  </View>
                  <View style={styles.mathBox}>
                    <Text style={styles.sectionTitle}>Math validation</Text>
                    <Text style={styles.bodyText}>
                      Before: {formatNumber(viewModel.currentMacroCalories)} kcal · mismatch{' '}
                      {formatNumber(viewModel.calorieMathMismatchBefore)}
                    </Text>
                    <Text style={styles.bodyText}>
                      After: {formatNumber(viewModel.proposedMacroCalories)} kcal · mismatch{' '}
                      {formatNumber(viewModel.calorieMathMismatchAfter)}
                    </Text>
                  </View>
                  {viewModel.issues.map((issue) => (
                    <Text key={issue.code} style={styles.issueText}>
                      • {issue.message}
                    </Text>
                  ))}

                  {applied ? (
                    <View style={styles.appliedBox}>
                      <Text style={styles.appliedTitle}>Applied</Text>
                      <Text style={styles.disclaimer}>
                        Backend revision {applied.revision} was created at{' '}
                        {formatDateTime(applied.appliedAt)}. A normal sync pull was requested.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.notAppliedBox}>
                      <Text style={styles.sectionTitle}>Not applied</Text>
                      <Text style={styles.disclaimer}>
                        The backend will reload the current target, compare its revision with this
                        proposal and rerun guardrails before writing.
                      </Text>
                    </View>
                  )}

                  {canApply ? (
                    <PrimaryButton
                      disabled={applying}
                      label="Apply validated target"
                      loading={applying}
                      onPress={requestApplyConfirmation}
                    />
                  ) : null}
                </View>
              ) : null}

              {viewModel.kind === 'rejected' ? (
                <Text style={styles.issueText}>• {viewModel.reason}</Text>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}