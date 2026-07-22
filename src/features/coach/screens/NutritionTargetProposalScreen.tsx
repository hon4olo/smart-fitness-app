import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachRunEnvelope } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import {
  buildNutritionCoachViewModel,
  type NutritionMetricTotals,
} from '../nutritionCoachViewModel';

const LOOKBACK_OPTIONS = [7, 14, 30] as const;

const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

const createIdempotencyKey = (lookbackDays: number): string =>
  `mobile-nutrition-target-proposal-${lookbackDays}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

function TargetColumn({ title, totals }: { title: string; totals: NutritionMetricTotals }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const items = [
    ['Calories', `${formatNumber(totals.calories, 0)} kcal`],
    ['Protein', `${formatNumber(totals.protein)} g`],
    ['Carbs', `${formatNumber(totals.carbs)} g`],
    ['Fats', `${formatNumber(totals.fats)} g`],
  ];

  return (
    <View style={styles.targetColumn}>
      <Text style={styles.targetColumnTitle}>{title}</Text>
      {items.map(([label, value]) => (
        <View key={label} style={styles.targetRow}>
          <Text style={styles.metaText}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function DeltaGrid({ changes }: { changes: NutritionMetricTotals }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const items = [
    ['Calories', changes.calories, 'kcal'],
    ['Protein', changes.protein, 'g'],
    ['Carbs', changes.carbs, 'g'],
    ['Fats', changes.fats, 'g'],
  ] as const;

  return (
    <View style={styles.deltaGrid}>
      {items.map(([label, value, unit]) => (
        <View key={label} style={styles.deltaCell}>
          <Text style={styles.deltaValue}>
            {value > 0 ? '+' : ''}
            {formatNumber(value)} {unit}
          </Text>
          <Text style={styles.metaText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function NutritionTargetProposalScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppContext();
  const { ready, refresh, session } = useAuthSession();
  const [lookbackDays, setLookbackDays] = useState<(typeof LOOKBACK_OPTIONS)[number]>(14);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const viewModel = useMemo(() => (run ? buildNutritionCoachViewModel(run) : null), [run]);
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

  const startProposal = async () => {
    if (busy) return;

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setBusy(true);
    setError(null);
    setRun(null);

    try {
      const initial = await coachApi.startNutritionRun({
        requestType: 'nutrition_target_proposal',
        lookbackDays,
        idempotencyKey: createIdempotencyKey(lookbackDays),
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
          : 'Nutrition Coach could not complete the proposal.',
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setBusy(false);
      }
    }
  };

  const loading = !ready || isRestoringState;

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
              <Text style={styles.previewBadge}>Preview</Text>
              <Text style={styles.statusText}>Never auto-applied</Text>
            </View>
            <Text style={styles.cardTitle}>Calorie-neutral macro reconciliation</Text>
            <Text style={styles.bodyText}>
              The worker checks whether 4P + 4C + 9F matches the current calorie target and proposes the smallest macro correction. It does not infer a new calorie goal from eating behaviour.
            </Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>Preparing synchronized nutrition data…</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>Sign in required</Text>
              <Text style={styles.bodyText}>
                Target proposals use only data synchronized to your protected backend account.
              </Text>
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
                      disabled={busy}
                      onPress={() => {
                        setLookbackDays(days);
                        setRun(null);
                        setError(null);
                      }}
                      style={({ pressed }) => [
                        styles.periodButton,
                        selected && styles.periodButtonSelected,
                        pressed && !busy && styles.pressed,
                      ]}>
                      <Text style={[styles.periodLabel, selected && styles.periodLabelSelected]}>
                        {days} days
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <PrimaryButton
                disabled={busy}
                label="Generate guarded proposal"
                loading={busy}
                onPress={() => void startProposal()}
              />
              <Text style={styles.disclaimer}>
                At least three tracked days and one synchronized active target are required. This preview has no apply action.
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
                  <View style={styles.guardrailRow}>
                    <Text style={styles.metaText}>Guardrail verdict</Text>
                    <Text style={styles.guardrailValue}>{viewModel.guardrailStatus}</Text>
                  </View>
                  <View style={styles.targetsRow}>
                    <TargetColumn title="Current" totals={viewModel.currentTargets} />
                    <TargetColumn title="Proposed" totals={viewModel.proposedTargets} />
                  </View>
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Change</Text>
                    <DeltaGrid changes={viewModel.changes} />
                  </View>
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Math validation</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.metaText}>Before</Text>
                      <Text style={styles.infoValue}>
                        {formatNumber(viewModel.currentMacroCalories, 0)} kcal · mismatch {formatNumber(viewModel.calorieMathMismatchBefore, 0)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.metaText}>After</Text>
                      <Text style={styles.infoValue}>
                        {formatNumber(viewModel.proposedMacroCalories, 0)} kcal · mismatch {formatNumber(viewModel.calorieMathMismatchAfter, 0)}
                      </Text>
                    </View>
                  </View>
                  {viewModel.issues.length > 0 ? (
                    <View style={styles.issueList}>
                      {viewModel.issues.map((issue) => (
                        <Text key={issue.code} style={styles.issueText}>
                          • {issue.message}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.notAppliedBox}>
                    <Text style={styles.notAppliedTitle}>Not applied</Text>
                    <Text style={styles.disclaimer}>
                      A future confirmation endpoint must revalidate the proposal against the latest target revision before any write.
                    </Text>
                  </View>
                </View>
              ) : null}

              {viewModel.kind === 'rejected' ? (
                <View style={styles.issueList}>
                  <Text style={styles.issueText}>• {viewModel.reason}</Text>
                </View>
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
    deltaCell: {
      flexBasis: '47%',
      gap: 2,
    },
    deltaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
    },
    deltaValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
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
      color: colors.accent,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: {
      flex: 1,
    },
    infoRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
    },
    infoValue: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: Typography.body.fontSize,
      fontWeight: '700',
      textAlign: 'right',
    },
    issueList: {
      gap: Spacing.one,
    },
    issueText: {
      color: colors.error,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    notAppliedBox: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: Radii.medium,
      gap: Spacing.one,
      padding: Spacing.three,
    },
    notAppliedTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    periodButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: Radii.full,
      borderWidth: 1,
      flex: 1,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
    },
    periodButtonSelected: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.accent,
    },
    periodLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    periodLabelSelected: {
      color: colors.accent,
    },
    periodRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
    },
    previewBadge: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: Radii.full,
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      paddingHorizontal: Spacing.two,
      paddingVertical: 4,
    },
    resultHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    resultStack: {
      gap: Spacing.four,
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
    sectionBlock: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
    },
    statusText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
    },
    targetColumn: {
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: 1,
      flex: 1,
      gap: Spacing.two,
      padding: Spacing.three,
    },
    targetColumnTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: '800',
    },
    targetRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    targetsRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      lineHeight: Typography.screenTitle.lineHeight,
    },
  });
