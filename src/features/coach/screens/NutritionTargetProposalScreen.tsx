import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachRunEnvelope } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
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
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const styles = useMemo(() => createStyles(colors), [colors]);
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

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    appliedBox: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.accent,
      borderRadius: Radii.medium,
      borderWidth: 1,
      gap: Spacing.one,
      padding: Spacing.three,
    },
    appliedTitle: {
      color: colors.accent,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    backButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
    backLabel: { color: colors.textPrimary, fontSize: 42, fontWeight: '300', lineHeight: 42 },
    badge: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: Radii.pill,
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      paddingHorizontal: Spacing.two,
      paddingVertical: 4,
    },
    badgeRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
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
    container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
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
    errorCard: { backgroundColor: colors.errorSoft, borderColor: colors.error },
    errorTitle: {
      color: colors.error,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '800',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    issueText: {
      color: colors.error,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    mathBox: { gap: Spacing.one },
    metaText: { color: colors.textMuted, fontSize: Typography.caption.fontSize },
    notAppliedBox: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: Radii.medium,
      gap: Spacing.one,
      padding: Spacing.three,
    },
    periodButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: Radii.pill,
      borderWidth: 1,
      flex: 1,
      paddingVertical: Spacing.two,
    },
    periodButtonSelected: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.accent,
    },
    periodLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: '700',
    },
    periodLabelSelected: { color: colors.accent },
    periodRow: { flexDirection: 'row', gap: Spacing.two },
    pressed: { opacity: 0.72 },
    resultHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    resultStack: { gap: Spacing.four },
    resultStatus: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    screen: { backgroundColor: colors.background, flex: 1 },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
    },
    subtitle: { color: colors.textMuted, fontSize: Typography.caption.fontSize },
    targetBox: {
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: 1,
      flex: 1,
      gap: Spacing.one,
      padding: Spacing.three,
    },
    targetCalories: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
    targetsRow: { flexDirection: 'row', gap: Spacing.two },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      lineHeight: Typography.screenTitle.lineHeight,
    },
    verdict: {
      color: colors.accent,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    verdictRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
