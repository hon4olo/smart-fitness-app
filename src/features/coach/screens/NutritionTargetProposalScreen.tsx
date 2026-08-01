import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachRunEnvelope } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useAppInfrastructure } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getNutritionTargetProposalCopy } from '@/localization/nutritionTargetProposalCopy';
import { getBoundedCoachRunStatusLabel } from '@/localization/statusPresentation';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { useUnitPreferences } from '@/units';
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

const createIdempotencyKey = (scope: string): string =>
  `mobile-${scope}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

function TargetSummary({ label, totals }: { label: string; totals: NutritionMetricTotals }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNutritionTargetProposalStyles(colors), [colors]);
  const { formatNumber, locale } = useLocalization();
  const { energy, formatEnergyValue } = useUnitPreferences();
  const copy = getNutritionTargetProposalCopy(locale);

  return (
    <View style={styles.targetBox}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.targetCalories}>
        {formatEnergyValue(totals.calories)} {energy}
      </Text>
      <Text style={styles.metaText}>
        {copy.proteinShort} {formatNumber(totals.protein, { maximumFractionDigits: 1 })} ·{' '}
        {copy.carbsShort} {formatNumber(totals.carbs, { maximumFractionDigits: 1 })} ·{' '}
        {copy.fatsShort} {formatNumber(totals.fats, { maximumFractionDigits: 1 })}
      </Text>
    </View>
  );
}

export default function NutritionTargetProposalScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNutritionTargetProposalStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppInfrastructure();
  const { syncNow } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const { formatDate, formatNumber, locale } = useLocalization();
  const { energy, formatEnergyValue } = useUnitPreferences();
  const copy = getNutritionTargetProposalCopy(locale);
  const [lookbackDays, setLookbackDays] =
    useState<(typeof LOOKBACK_OPTIONS)[number]>(14);
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
      setError(copy.requestFailed);
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
    } catch {
      setError(copy.applyFailed);
    } finally {
      setApplying(false);
    }
  };

  const requestApplyConfirmation = () => {
    if (viewModel?.kind !== 'proposal') return;

    Alert.alert(
      copy.applyTitle,
      copy.applyBody(
        `${formatEnergyValue(viewModel.proposedTargets.calories)} ${energy}`,
        formatNumber(viewModel.proposedTargets.protein, { maximumFractionDigits: 1 }),
        formatNumber(viewModel.proposedTargets.carbs, { maximumFractionDigits: 1 }),
        formatNumber(viewModel.proposedTargets.fats, { maximumFractionDigits: 1 }),
      ),
      [
        { text: copy.cancel, style: 'cancel' },
        { text: copy.apply, onPress: () => void applyProposal() },
      ],
    );
  };

  const loading = !ready || isRestoringState;
  const canApply =
    viewModel?.kind === 'proposal' &&
    viewModel.guardrailStatus === 'valid' &&
    viewModel.changed &&
    !applied;
  const runStatus = run
    ? getBoundedCoachRunStatusLabel(locale, run.run.status)
    : '';
  const resultPresentation = !viewModel
    ? null
    : viewModel.kind === 'pending'
      ? { title: copy.pendingTitle, message: copy.pendingMessage }
      : viewModel.kind === 'failed'
        ? { title: copy.failedTitle, message: copy.failedMessage }
        : viewModel.kind === 'rejected'
          ? { title: copy.rejectedTitle, message: copy.rejectedMessage }
          : viewModel.kind === 'proposal'
            ? { title: copy.proposalTitle, message: copy.proposalMessage }
            : { title: copy.failedTitle, message: copy.failedMessage };

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
        <View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.eight }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AppCard>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{copy.preview}</Text>
              <Text style={styles.metaText}>{copy.explicitConfirmation}</Text>
            </View>
            <Text style={styles.cardTitle}>{copy.reconciliationTitle}</Text>
            <Text style={styles.bodyText}>{copy.reconciliationBody}</Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.preparing}</Text>
            </AppCard>
          ) : !authenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.signInRequired}</Text>
              <PrimaryButton label={copy.signIn} onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.validationPeriod}</Text>
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
                        {copy.days(
                          days,
                          formatNumber(days, { maximumFractionDigits: 0 }),
                        )}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <PrimaryButton
                disabled={busy || applying}
                label={copy.generate}
                loading={busy}
                onPress={() => void startProposal()}
              />
              <Text style={styles.disclaimer}>{copy.requirements}</Text>
            </AppCard>
          )}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>{copy.requestError}</Text>
              <Text style={styles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel && resultPresentation ? (
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>{resultPresentation.title}</Text>
                <Text style={styles.resultStatus}>{runStatus}</Text>
              </View>
              <Text style={styles.bodyText}>{resultPresentation.message}</Text>

              {viewModel.kind === 'proposal' ? (
                <View style={styles.resultStack}>
                  <View style={styles.verdictRow}>
                    <Text style={styles.metaText}>{copy.guardrail}</Text>
                    <Text style={styles.verdict}>
                      {copy.guardrailLabel(viewModel.guardrailStatus)}
                    </Text>
                  </View>
                  <View style={styles.targetsRow}>
                    <TargetSummary label={copy.current} totals={viewModel.currentTargets} />
                    <TargetSummary label={copy.proposed} totals={viewModel.proposedTargets} />
                  </View>
                  <View style={styles.mathBox}>
                    <Text style={styles.sectionTitle}>{copy.mathValidation}</Text>
                    <Text style={styles.bodyText}>
                      {copy.before}: {formatEnergyValue(viewModel.currentMacroCalories)} {energy} ·{' '}
                      {copy.mismatch}{' '}
                      {formatNumber(viewModel.calorieMathMismatchBefore, { maximumFractionDigits: 1 })}
                    </Text>
                    <Text style={styles.bodyText}>
                      {copy.after}: {formatEnergyValue(viewModel.proposedMacroCalories)} {energy} ·{' '}
                      {copy.mismatch}{' '}
                      {formatNumber(viewModel.calorieMathMismatchAfter, { maximumFractionDigits: 1 })}
                    </Text>
                  </View>
                  {viewModel.issues.map((issue) => (
                    <Text key={`${issue.code}:${issue.field}`} style={styles.issueText}>
                      • {copy.issueMessage}
                    </Text>
                  ))}

                  {applied ? (
                    <View style={styles.appliedBox}>
                      <Text style={styles.appliedTitle}>{copy.applied}</Text>
                      <Text style={styles.disclaimer}>
                        {copy.appliedBody(
                          applied.revision,
                          formatDate(applied.appliedAt, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }),
                        )}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.notAppliedBox}>
                      <Text style={styles.sectionTitle}>{copy.notApplied}</Text>
                      <Text style={styles.disclaimer}>{copy.notAppliedBody}</Text>
                    </View>
                  )}

                  {canApply ? (
                    <PrimaryButton
                      disabled={applying}
                      label={copy.applyValidated}
                      loading={applying}
                      onPress={requestApplyConfirmation}
                    />
                  ) : null}
                </View>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
