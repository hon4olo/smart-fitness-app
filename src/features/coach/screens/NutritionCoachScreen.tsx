import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createCoachApi,
  type CoachCapabilities,
  type CoachRunEnvelope,
  type NutritionCoachRequestType,
} from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { NutritionDeterministicSummaryView } from '../components/NutritionDeterministicSummaryView';
import { NutritionStrategyProposalView } from '../components/NutritionStrategyProposalView';
import {
  getNutritionRejectionCopy,
  readNutritionDeterministicSummary,
} from '../nutritionDeterministicSummary';
import {
  buildNutritionCoachViewModel,
  type NutritionCoachMetricSummary,
  type NutritionMetricTotals,
} from '../nutritionCoachViewModel';
import { buildNutritionStrategyViewModel } from '../nutritionStrategyViewModel';

const LOOKBACK_OPTIONS = [7, 14, 30] as const;

type ActiveRunType = 'review' | 'strategy';

const createIdempotencyKey = (
  requestType: NutritionCoachRequestType,
  lookbackDays: number,
): string =>
  `mobile-${requestType}-${lookbackDays}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

const formatDate = (value: string): string => {
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
    : value;
};

function MacroGrid({ totals, suffix = '' }: { totals: NutritionMetricTotals; suffix?: string }) {
  const items = [
    { label: 'Calories', value: `${formatNumber(totals.calories, 0)}${suffix}` },
    { label: 'Protein', value: `${formatNumber(totals.protein)} g${suffix}` },
    { label: 'Carbs', value: `${formatNumber(totals.carbs)} g${suffix}` },
    { label: 'Fats', value: `${formatNumber(totals.fats)} g${suffix}` },
  ];

  return (
    <View style={baseStyles.metricGrid}>
      {items.map((item) => (
        <View key={item.label} style={baseStyles.metricCell}>
          <Text style={baseStyles.metricValue}>{item.value}</Text>
          <Text style={baseStyles.metricLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ReviewMetrics({ metrics }: { metrics: NutritionCoachMetricSummary }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const trackedAverage = metrics.averages.perTrackedDay;

  return (
    <View style={styles.resultStack}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>{metrics.completeness.trackedDays}</Text>
          <Text style={styles.metaText}>Tracked days</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>{metrics.completeness.missingDays}</Text>
          <Text style={styles.metaText}>Missing days</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>
            {formatNumber(metrics.completeness.coveragePercent)}%
          </Text>
          <Text style={styles.metaText}>Coverage</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Average per calendar day</Text>
        <MacroGrid totals={metrics.averages.perCalendarDay} />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Average per tracked day</Text>
        {trackedAverage ? (
          <MacroGrid totals={trackedAverage} />
        ) : (
          <Text style={styles.bodyText}>No tracked-day average is available.</Text>
        )}
      </View>

      {metrics.targetComparison ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Current target comparison</Text>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Days within ±10% calories</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.daysWithinCaloriesTenPercent}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Tracked-day adherence</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.trackedDayAdherencePercent === null
                ? '—'
                : `${formatNumber(metrics.targetComparison.trackedDayAdherencePercent)}%`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Tracked calorie delta</Text>
            <Text style={styles.infoValue}>
              {metrics.targetComparison.averageTrackedDayDelta
                ? `${metrics.targetComparison.averageTrackedDayDelta.calories > 0 ? '+' : ''}${formatNumber(
                    metrics.targetComparison.averageTrackedDayDelta.calories,
                    0,
                  )} kcal`
                : '—'}
            </Text>
          </View>
        </View>
      ) : null}

      {metrics.proteinPerKg ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Protein relative to body weight</Text>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Weight baseline</Text>
            <Text style={styles.infoValue}>
              {formatNumber(metrics.proteinPerKg.weightKg)} kg
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Calendar-day average</Text>
            <Text style={styles.infoValue}>
              {formatNumber(metrics.proteinPerKg.averageCalendarDay, 2)} g/kg
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.metaText}>Tracked-day average</Text>
            <Text style={styles.infoValue}>
              {metrics.proteinPerKg.averageTrackedDay === null
                ? '—'
                : `${formatNumber(metrics.proteinPerKg.averageTrackedDay, 2)} g/kg`}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Daily coverage</Text>
        {metrics.days.map((day) => (
          <View key={day.date} style={styles.dayRow}>
            <View style={styles.dayCopy}>
              <Text style={styles.dayTitle}>{formatDate(day.date)}</Text>
              <Text style={styles.metaText}>
                {day.tracked
                  ? `${day.entryCount} entr${day.entryCount === 1 ? 'y' : 'ies'}`
                  : 'No entries'}
              </Text>
            </View>
            <View style={styles.dayValues}>
              <Text style={styles.infoValue}>
                {formatNumber(day.totals.calories, 0)} kcal
              </Text>
              <Text style={styles.metaText}>
                {formatNumber(day.totals.protein)} g protein
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function NutritionCoachScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppContext();
  const { ready, refresh, session } = useAuthSession();
  const [lookbackDays, setLookbackDays] = useState<(typeof LOOKBACK_OPTIONS)[number]>(14);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [activeRunType, setActiveRunType] = useState<ActiveRunType | null>(null);
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
    if (activeRunType) return;
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

  const loading = !ready || isRestoringState;
  const strategyAvailable =
    capabilities?.nutrition.structuredStrategyProposal === true;

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
                      disabled={Boolean(activeRunType)}
                      onPress={() => {
                        setLookbackDays(days);
                        setRun(null);
                        setError(null);
                      }}
                      style={({ pressed }) => [
                        styles.periodButton,
                        selected && styles.periodButtonSelected,
                        pressed && !activeRunType && styles.pressed,
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
                  disabled={Boolean(activeRunType)}
                  label="Review synchronized nutrition"
                  loading={activeRunType === 'review'}
                  onPress={() => void startNutritionRun('nutrition_review')}
                />

                {strategyAvailable ? (
                  <PrimaryButton
                    disabled={Boolean(activeRunType)}
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
                At least three tracked days are required. Strategy output is preview-only and is never
                applied automatically.
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
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>
                  {reviewRejectionCopy?.title ?? reviewViewModel.title}
                </Text>
                <Text style={styles.resultStatus}>{run?.run.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.bodyText}>
                {reviewRejectionCopy?.message ?? reviewViewModel.message}
              </Text>

              {reviewViewModel.kind === 'review' ? (
                <ReviewMetrics metrics={reviewViewModel.metrics} />
              ) : null}

              {deterministicSummary ? (
                <NutritionDeterministicSummaryView summary={deterministicSummary} />
              ) : null}

              {reviewViewModel.kind === 'rejected' ? (
                <View style={styles.resultStack}>
                  <Text style={styles.warningText}>Reason: {reviewViewModel.reason}</Text>
                  {reviewViewModel.metrics ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.metaText}>Tracked days</Text>
                      <Text style={styles.infoValue}>
                        {reviewViewModel.metrics.completeness.trackedDays} /{' '}
                        {reviewViewModel.metrics.period.lookbackDays}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </AppCard>
          ) : null}

          {strategyViewModel ? (
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>{strategyViewModel.title}</Text>
                <Text style={styles.resultStatus}>{run?.run.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.bodyText}>{strategyViewModel.message}</Text>

              {deterministicSummary ? (
                <NutritionDeterministicSummaryView summary={deterministicSummary} />
              ) : null}

              {strategyViewModel.kind === 'proposal' ? (
                <NutritionStrategyProposalView viewModel={strategyViewModel} />
              ) : null}

              {strategyViewModel.kind === 'rejected' ? (
                <View style={styles.resultStack}>
                  <Text style={styles.warningText}>Reason: {strategyViewModel.reason}</Text>
                  {strategyViewModel.issues.map((issue) => (
                    <Text key={`${issue.code}:${issue.path}`} style={styles.issueText}>
                      • {issue.message}
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

const baseStyles = StyleSheet.create({
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
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actionStack: {
      gap: Spacing.two,
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
    capabilityText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      textAlign: 'center',
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
    dayCopy: {
      flex: 1,
      minWidth: 0,
    },
    dayRow: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
      paddingTop: Spacing.two,
    },
    dayTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    dayValues: {
      alignItems: 'flex-end',
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
    infoRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
    },
    infoValue: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    issueText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    periodButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: Spacing.two,
    },
    periodButtonSelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    periodLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    periodLabelSelected: {
      color: colors.textPrimary,
    },
    periodRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
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
    resultHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
    },
    resultStack: {
      gap: Spacing.four,
    },
    resultStatus: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionBlock: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    statusText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    summaryCell: {
      flex: 1,
      gap: 2,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 30,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      letterSpacing: Typography.screenTitle.letterSpacing,
      lineHeight: Typography.screenTitle.lineHeight,
    },
    warningText: {
      color: colors.warning,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
  });
