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
import { useAppContext } from '@/context/AppContext';
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
import { useAppTheme } from '@/theme/AppThemeProvider';

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

const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

export default function NutritionCoachScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNutritionCoachScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppContext();
  const { syncNow } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const [lookbackDays, setLookbackDays] =
    useState<(typeof LOOKBACK_OPTIONS)[number]>(14);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [activeRunType, setActiveRunType] = useState<ActiveRunType | null>(null);
  const [confirmingStrategy, setConfirmingStrategy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [capabilitiesError, setCapabilitiesError] = useState<string | null>(null);
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
      setCapabilitiesError(null);
      setCapabilitiesLoading(false);
      return;
    }

    let cancelled = false;
    setCapabilitiesLoading(true);
    setCapabilitiesError(null);

    void coachApi
      .getCapabilities()
      .then((nextCapabilities) => {
        if (!cancelled) setCapabilities(nextCapabilities);
      })
      .catch((capabilityError: unknown) => {
        if (cancelled) return;
        setCapabilities(null);
        setCapabilitiesError(
          capabilityError instanceof Error
            ? capabilityError.message
            : 'Coach capabilities could not be verified.',
        );
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
      setError('AI strategy is not enabled on this backend.');
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
          : requestType === 'nutrition_strategy_proposal'
            ? 'Nutrition Strategy could not complete the preview.'
            : 'Nutrition Coach could not complete the review.',
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
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : 'The Nutrition Strategy could not be applied.',
      );
    } finally {
      setConfirmingStrategy(false);
    }
  };

  const requestStrategyConfirmation = () => {
    if (strategyViewModel?.kind !== 'proposal') return;
    const { proposal } = strategyViewModel;
    Alert.alert(
      'Apply AI strategy?',
      `Replace the active nutrition target with ${formatNumber(proposal.calorieTarget, 0)} kcal, ${formatNumber(proposal.macros.protein, 0)} g protein, ${formatNumber(proposal.macros.carbs, 0)} g carbs and ${formatNumber(proposal.macros.fats, 0)} g fats?\n\nThe backend will verify the target revision and rerun deterministic guardrails before applying.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply strategy',
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
  const runStatus = run?.run.status.toUpperCase() ?? '';

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
          <Text style={styles.title}>Nutrition Coach</Text>
          <Text style={styles.subtitle}>Deterministic review · gated AI preview</Text>
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
                {strategyAvailable
                  ? 'Structured strategy provider available'
                  : capabilitiesLoading
                    ? 'Checking backend capabilities'
                    : 'Deterministic review available'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>Validated nutrition analysis</Text>
            <Text style={styles.bodyText}>
              Deterministic review is always calculated from synchronized records. AI Strategy is
              shown only when the authenticated backend reports an enabled structured provider.
            </Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>Preparing account and nutrition data…</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>Sign in required</Text>
              <Text style={styles.bodyText}>
                Nutrition Coach reads only data synchronized to your protected backend account.
              </Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>Analysis period</Text>
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
                        {days} days
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.actionStack}>
                <PrimaryButton
                  disabled={controlsBusy}
                  label="Review synchronized nutrition"
                  loading={activeRunType === 'review'}
                  onPress={() => void startNutritionRun('nutrition_review')}
                />

                {strategyAvailable ? (
                  <PrimaryButton
                    disabled={controlsBusy}
                    label="Generate AI strategy preview"
                    loading={activeRunType === 'strategy'}
                    onPress={() => void startNutritionRun('nutrition_strategy_proposal')}
                  />
                ) : (
                  <Text style={styles.capabilityText}>
                    {capabilitiesLoading
                      ? 'Checking whether AI Strategy is enabled…'
                      : capabilitiesError
                        ? 'AI Strategy availability could not be verified. Deterministic review remains available.'
                        : 'AI strategy provider is not enabled on this backend.'}
                  </Text>
                )}
              </View>

              <Text style={styles.disclaimer}>
                At least three tracked days are required. Strategy output is not applied until a
                separate confirmation succeeds.
              </Text>
            </AppCard>
          )}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>Request error</Text>
              <Text style={styles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {reviewViewModel ? (
            <NutritionCoachReviewResultCard
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
