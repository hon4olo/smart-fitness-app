import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createCoachApi,
  type CoachCapabilities,
  type CoachRunEnvelope,
} from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Spacing } from '@/constants/theme';
import { useNutritionState, useWorkoutState } from '@/context/AppContext';
import { useSafetyRecoveryState } from '@/context/SafetyRecoveryStateContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getCombinedCoachTrustCopy } from '@/localization/combinedCoachTrustCopy';
import { getCombinedReviewCopy, type CombinedReviewCopy } from '@/localization/combinedReviewCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import { formatEnergyValue, useUnitPreferences } from '@/units';
import {
  buildCombinedCoachViewModel,
  type CombinedCoachIssue,
  type CombinedCoachStatus,
  type CombinedCoachViewModel,
} from '../combinedCoachViewModel';
import {
  combinedCoachStyles as styles,
  createCombinedCoachScreenStyles,
} from './combinedCoachScreenStyles';

const createIdempotencyKey = (): string =>
  `mobile-combined-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

const latestSession = (sessions: WorkoutSession[]): WorkoutSession | null =>
  [...sessions].sort(
    (left, right) => Date.parse(right.finishedAt) - Date.parse(left.finishedAt),
  )[0] ?? null;

const issueColor = (
  issue: CombinedCoachIssue,
  colors: typeof Colors.light,
): string =>
  issue.severity === 'hard_block' || issue.severity === 'modify'
    ? colors.warning
    : issue.severity === 'input_required'
      ? colors.error
      : colors.textSecondary;

function DomainCard({
  title,
  status,
  statusLabel,
  children,
}: {
  title: string;
  status: CombinedCoachStatus | 'ready' | 'needs_input';
  statusLabel: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}>
      <View style={styles.domainHeader}>
        <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text
          style={[
            styles.domainBadge,
            {
              backgroundColor: status === 'ready' ? colors.successSoft : colors.warningSoft,
              color: status === 'ready' ? colors.success : colors.warning,
            },
          ]}>
          {statusLabel}
        </Text>
      </View>
      {children}
    </View>
  );
}

function CombinedResult({
  copy,
  viewModel,
}: {
  copy: CombinedReviewCopy;
  viewModel: CombinedCoachViewModel;
}) {
  const { colors } = useAppTheme();
  const { formatNumber } = useLocalization();
  const { energy, formatWeightValue, weight } = useUnitPreferences();
  const presentation = copy.viewModelCopy(viewModel);
  const formatOptional = (value: number | null, fractionDigits = 1): string =>
    value === null
      ? '—'
      : formatNumber(value, { maximumFractionDigits: fractionDigits });

  if (viewModel.kind !== 'review') {
    return (
      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{presentation.title}</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {presentation.message}
        </Text>
      </AppCard>
    );
  }

  const strengthStatus = copy.statusLabels[viewModel.strength.status];
  const nutritionStatus = copy.statusLabels[viewModel.nutrition.status];
  const safetyStatus = copy.statusLabels[viewModel.safety.status];
  const completedSets = viewModel.strength.completedSets ?? 0;
  const trackedDays = viewModel.nutrition.trackedDays ?? 0;

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <View style={styles.flexCopy}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{presentation.title}</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {presentation.message}
          </Text>
        </View>
        <Text
          style={[
            styles.resultBadge,
            {
              backgroundColor:
                viewModel.status === 'ready' ? colors.successSoft : colors.warningSoft,
              color: viewModel.status === 'ready' ? colors.success : colors.warning,
            },
          ]}>
          {copy.statusLabels[viewModel.status]}
        </Text>
      </View>

      <View style={styles.domainStack}>
        <DomainCard
          status={viewModel.strength.status}
          statusLabel={strengthStatus}
          title={copy.strength}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {copy.strengthSummary(
              completedSets,
              formatNumber(completedSets, { maximumFractionDigits: 0 }),
              formatOptional(viewModel.strength.totalReps, 0),
            )}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {copy.tonnageAndRpe(
              viewModel.strength.totalTonnage === null
                ? '—'
                : formatWeightValue(viewModel.strength.totalTonnage),
              weight,
              formatOptional(viewModel.strength.averageActualRpe),
            )}
          </Text>
        </DomainCard>

        <DomainCard
          status={viewModel.nutrition.status}
          statusLabel={nutritionStatus}
          title={copy.nutrition}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {copy.nutritionSummary(
              trackedDays,
              formatNumber(trackedDays, { maximumFractionDigits: 0 }),
              formatOptional(viewModel.nutrition.coveragePercent, 0),
            )}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {copy.nutritionAverages(
              viewModel.nutrition.averageCaloriesPerTrackedDay === null
                ? '—'
                : formatEnergyValue(viewModel.nutrition.averageCaloriesPerTrackedDay, energy),
              energy,
              formatOptional(viewModel.nutrition.averageProteinPerTrackedDay),
            )}
          </Text>
        </DomainCard>

        <DomainCard
          status={viewModel.safety.status}
          statusLabel={safetyStatus}
          title={copy.safetyRecovery}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {copy.recommendedLoad(
              formatNumber(Math.round(viewModel.safety.recommendedLoadMultiplier * 100), {
                maximumFractionDigits: 0,
              }),
            )}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {copy.safetySummary(
              viewModel.safety.restrictionCount,
              formatNumber(viewModel.safety.restrictionCount, { maximumFractionDigits: 0 }),
              viewModel.safety.issueCount,
              formatNumber(viewModel.safety.issueCount, { maximumFractionDigits: 0 }),
            )}
          </Text>
        </DomainCard>
      </View>

      {viewModel.issues.length > 0 ? (
        <View style={styles.issueStack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {copy.finalGuardrail}
          </Text>
          {viewModel.issues.map((issue, index) => (
            <View key={`${issue.code}:${issue.domain}:${index}`}>
              <Text style={[styles.metaText, { color: issueColor(issue, colors) }]}>
                {copy.issueSummary(issue)}
              </Text>
              <Text style={[styles.bodyText, { color: issueColor(issue, colors) }]}>
                {copy.issueMessage}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.boundaryBox, { borderColor: colors.borderSubtle }]}>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>{copy.boundary}</Text>
      </View>
    </AppCard>
  );
}

export default function CombinedCoachScreen() {
  const { colors } = useAppTheme();
  const themedStyles = useMemo(() => createCombinedCoachScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { foodEntries } = useNutritionState();
  const { recoveryCheckIns, userLimitations } = useSafetyRecoveryState();
  const { workoutSessions } = useWorkoutState();
  const { syncNow, status: syncStatus } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const { formatNumber, locale } = useLocalization();
  const copy = getCombinedReviewCopy(locale);
  const trustCopy = getCombinedCoachTrustCopy(locale);
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const combinedAvailable =
    capabilities?.schemaVersion === 6 &&
    capabilities.combined?.deterministicReview === true &&
    capabilities.combined.automaticApplication === false;
  const capabilityPresentation = !ready
    ? 'checking'
    : !isAuthenticated
      ? 'sign_in'
      : combinedAvailable
        ? 'available'
        : 'unavailable';
  const primarySession = useMemo(
    () => latestSession(workoutSessions),
    [workoutSessions],
  );
  const activeLimitations = userLimitations.filter(
    (limitation) => limitation.status === 'active',
  ).length;
  const trackedNutritionDays = new Set(foodEntries.map((entry) => entry.date)).size;
  const viewModel = useMemo(
    () => (run ? buildCombinedCoachViewModel(run) : null),
    [run],
  );

  const coachApi = useMemo(
    () =>
      createCoachApi({
        getAccessToken: async () => session?.tokens.accessToken ?? null,
        refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
      }),
    [refresh, session?.tokens.accessToken],
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

  const runCombinedReview = async () => {
    if (!combinedAvailable || busy) return;
    setBusy(true);
    setError(null);
    setRun(null);
    try {
      await syncNow();
      const initial = await coachApi.startCombinedRun({
        ...(primarySession ? { requestedSessionId: primarySession.id } : {}),
        strengthHistoryLimit: 8,
        nutritionLookbackDays: 7,
        safetyLookbackDays: 14,
        idempotencyKey: createIdempotencyKey(),
      });
      setRun(initial);
      setRun(
        await coachApi.waitForTerminalRun(initial, {
          intervalMs: 500,
          maxPolls: 30,
        }),
      );
    } catch {
      setError(copy.requestErrorBody);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={themedStyles.screen}>
      <View style={[themedStyles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [themedStyles.backButton, pressed && styles.pressed]}>
          <Text style={themedStyles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.flexCopy}>
          <Text style={themedStyles.title}>{copy.title}</Text>
          <Text style={themedStyles.subtitle}>{copy.subtitle}</Text>
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
            <Text style={themedStyles.cardTitle}>{copy.localContext}</Text>
            <Text style={themedStyles.bodyText}>
              {copy.workout}: {primarySession?.workoutTitle ?? copy.noWorkout}
            </Text>
            <Text style={themedStyles.bodyText}>
              {copy.contextCounts(
                formatNumber(trackedNutritionDays, { maximumFractionDigits: 0 }),
                formatNumber(recoveryCheckIns.length, { maximumFractionDigits: 0 }),
                formatNumber(activeLimitations, { maximumFractionDigits: 0 }),
              )}
            </Text>
            <Text style={themedStyles.metaText}>
              {copy.capability}: {trustCopy.capabilityLabel(capabilityPresentation)} ·{' '}
              {copy.sync}: {trustCopy.syncLabel(syncStatus)}
            </Text>
          </AppCard>

          {!ready ? (
            <AppCard>
              <Text style={themedStyles.cardTitle}>{copy.preparing}</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={themedStyles.cardTitle}>{copy.signInRequired}</Text>
              <Text style={themedStyles.bodyText}>{copy.signInBody}</Text>
              <PrimaryButton label={copy.signIn} onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={themedStyles.cardTitle}>{copy.runTitle}</Text>
              <Text style={themedStyles.bodyText}>{copy.runBody}</Text>
              <PrimaryButton
                disabled={!combinedAvailable || busy}
                label={copy.runReview}
                loading={busy}
                onPress={() => void runCombinedReview()}
              />
              {!combinedAvailable ? (
                <Text style={themedStyles.metaText}>{trustCopy.unavailableHint}</Text>
              ) : null}
              <SecondaryButton
                label={copy.reviewSafety}
                onPress={() => router.push('/profile/safety-recovery')}
              />
            </AppCard>
          )}

          {error ? (
            <AppCard style={themedStyles.errorCard}>
              <Text style={themedStyles.errorTitle}>{copy.requestError}</Text>
              <Text style={themedStyles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? <CombinedResult copy={copy} viewModel={viewModel} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}
