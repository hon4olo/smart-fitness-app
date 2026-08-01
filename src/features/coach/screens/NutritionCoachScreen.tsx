import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createCoachApi,
  type CoachCapabilities,
  type CoachRunEnvelope,
  type NutritionCoachRequestType,
} from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useAppInfrastructure } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import {
  NutritionCoachReviewResultCard,
  NutritionCoachStrategyResultCard,
} from '@/features/coach/components/NutritionCoachResultCards';
import {
  getNutritionRejectionCopy,
  readNutritionDeterministicSummary,
} from '@/features/coach/nutritionDeterministicSummary';
import { buildNutritionCoachViewModel } from '@/features/coach/nutritionCoachViewModel';
import { buildNutritionStrategyViewModel } from '@/features/coach/nutritionStrategyViewModel';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getNutritionCoachCopy } from '@/localization/nutritionCoachCopy';
import { getBoundedCoachRunStatusLabel } from '@/localization/statusPresentation';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { formatEnergyValue, useUnitPreferences } from '@/units';

import { createNutritionCoachScreenStyles } from './nutritionCoachScreen.styles';

const LOOKBACK_OPTIONS = [7, 14, 30] as const;

type ActiveRunType = 'review' | 'strategy';

const createIdempotencyKey = (
  requestType: NutritionCoachRequestType,
  lookbackDays: number,
): string =>
  `mobile-${requestType}-${lookbackDays}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const createConfirmationIdempotencyKey = (runId: string): string =>
  `mobile-strategy-confirm-${runId}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

export default function NutritionCoachScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNutritionCoachScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppInfrastructure();
  const { syncNow } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const { formatNumber, locale } = useLocalization();
  const { energy } = useUnitPreferences();
  const copy = getNutritionCoachCopy(locale);
  const [lookbackDays, setLookbackDays] =
    useState<(typeof LOOKBACK_OPTIONS)[number]>(14);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [activeRunType, setActiveRunType] = useState<ActiveRunType | null>(null);
  const [confirmingStrategy, setConfirmingStrategy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [capabilitiesUnavailable, setCapabilitiesUnavailable] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const isStrategyRun = run?.run.requestType === 'nutrition_strategy_proposal';
  const reviewViewModel = useMemo(
    () => (run && !isStrategyRun ? buildNutritionCoachViewModel(run) : null),
    [isStrategyRun, run],
  );
  const strategyViewModel = useMemo(
    () => (run && isStrategyRun ? buildNutritionStrategyViewModel(run) : null),
    [isStrategyRun, run],
  );
  const deterministicSummary = useMemo(
    () => (run ? readNutritionDeterministicSummary(run) : null),
    [run],
  );
  const reviewRejectionCopy = useMemo(
    () =>
      reviewViewModel?.kind === 'rejected'
        ? getNutritionRejectionCopy(reviewViewModel.reason)
        : null,
    [reviewViewModel],
  );
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
      setCapabilitiesUnavailable(false);
      setCapabilitiesLoading(false);
      return;
    }

    let cancelled = false;
    setCapabilitiesLoading(true);
    setCapabilitiesUnavailable(false);

    void coachApi
      .getCapabilities()
      .then((nextCapabilities) => {
        if (!cancelled) setCapabilities(nextCapabilities);
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

  const startNutritionRun = async (
    requestType: 'nutrition_review' | 'nutrition_strategy_proposal',
  ) => {
    if (activeRunType || confirmingStrategy) return;
    if (
      requestType === 'nutrition_strategy_proposal' &&
      capabilities?.nutrition.structuredStrategyProposal !== true
    ) {
      setError(copy.strategyNotEnabled);
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setActiveRunType(requestType === 'nutrition_review' ? 'review' : 'strategy');
    setError(null);
    setRun(null);

    try {
      const initial = await coachApi.startNutritionRun({
        requestType,
        lookbackDays,
        idempotencyKey: createIdempotencyKey(requestType, lookbackDays),
      });
      setRun(initial);
      setRun(
        await coachApi.waitForTerminalRun(initial, {
          signal: abortController.signal,
          intervalMs: 750,
          maxPolls: 20,
        }),
      );
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(
        requestType === 'nutrition_strategy_proposal'
          ? copy.strategyFailed
          : copy.reviewFailed,
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setActiveRunType(null);
      }
    }
  };

  const confirmStrategy = async () => {
    if (
      confirmingStrategy ||
      !run ||
      strategyViewModel?.kind !== 'proposal' ||
      capabilities?.nutrition.structuredStrategyConfirmation !== true
    ) {
      return;
    }

    setConfirmingStrategy(true);
    setError(null);
    try {
      const confirmed = await coachApi.confirmRun(run.run.id, {
        idempotencyKey: createConfirmationIdempotencyKey(run.run.id),
      });
      setRun(confirmed);
      await syncNow();
    } catch {
      setError(copy.strategyApplyFailed);
    } finally {
      setConfirmingStrategy(false);
    }
  };

  const requestStrategyConfirmation = () => {
    if (strategyViewModel?.kind !== 'proposal') return;
    const { proposal } = strategyViewModel;
    Alert.alert(
      copy.applyTitle,
      copy.applyBody(
        formatEnergyValue(proposal.calorieTarget, energy),
        energy,
        formatNumber(proposal.macros.protein, { maximumFractionDigits: 0 }),
        formatNumber(proposal.macros.carbs, { maximumFractionDigits: 0 }),
        formatNumber(proposal.macros.fats, { maximumFractionDigits: 0 }),
      ),
      [
        { text: copy.cancel, style: 'cancel' },
        {
          text: copy.applyStrategy,
          style: 'destructive',
          onPress: () => void confirmStrategy(),
        },
      ],
    );
  };

  const loading = !ready || isRestoringState;
  const strategyAvailable = capabilities?.nutrition.structuredStrategyProposal === true;
  const strategyConfirmationSupported =
    capabilities?.nutrition.structuredStrategyConfirmation === true;
  const controlsBusy = Boolean(activeRunType) || confirmingStrategy;
  const runStatus = run ? getBoundedCoachRunStatusLabel(locale, run.run.status) : '';

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
              <Text style={styles.statusText}>
                {strategyAvailable
                  ? copy.providerAvailable
                  : capabilitiesLoading
                    ? copy.checkingCapabilities
                    : copy.deterministicAvailable}
              </Text>
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
              <Text style={styles.cardTitle}>{copy.period}</Text>
              <View style={styles.periodRow}>
                {LOOKBACK_OPTIONS.map((days) => {
                  const selected = days === lookbackDays;
                  return (
                    <Pressable
                      key={days}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={controlsBusy}
                      onPress={() => {
                        setLookbackDays(days);
                        setRun(null);
                        setError(null);
                      }}
                      style={({ pressed }) => [
                        styles.periodButton,
                        selected && styles.periodButtonSelected,
                        pressed && !controlsBusy && styles.pressed,
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

              <View style={styles.actionStack}>
                <PrimaryButton
                  disabled={controlsBusy}
                  label={copy.reviewNutrition}
                  loading={activeRunType === 'review'}
                  onPress={() => void startNutritionRun('nutrition_review')}
                />

                {strategyAvailable ? (
                  <PrimaryButton
                    disabled={controlsBusy}
                    label={copy.generateStrategy}
                    loading={activeRunType === 'strategy'}
                    onPress={() => void startNutritionRun('nutrition_strategy_proposal')}
                  />
                ) : (
                  <Text style={styles.capabilityText}>
                    {capabilitiesLoading
                      ? copy.strategyChecking
                      : capabilitiesUnavailable
                        ? copy.strategyUnknown
                        : copy.strategyDisabled}
                  </Text>
                )}
              </View>

              <Text style={styles.disclaimer}>{copy.minimumTracking}</Text>
            </AppCard>
          )}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>{copy.requestError}</Text>
              <Text style={styles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {reviewViewModel ? (
            <NutritionCoachReviewResultCard
              copy={copy}
              deterministicSummary={deterministicSummary}
              rejectionCopy={reviewRejectionCopy}
              runStatus={runStatus}
              styles={styles}
              viewModel={reviewViewModel}
            />
          ) : null}

          {strategyViewModel ? (
            <NutritionCoachStrategyResultCard
              confirmationSupported={strategyConfirmationSupported}
              confirming={confirmingStrategy}
              copy={copy}
              deterministicSummary={deterministicSummary}
              onConfirm={requestStrategyConfirmation}
              runStatus={runStatus}
              styles={styles}
              viewModel={strategyViewModel}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
