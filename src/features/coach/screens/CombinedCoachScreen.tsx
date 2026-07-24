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
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import {
  buildCombinedCoachViewModel,
  type CombinedCoachIssue,
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

const formatNumber = (value: number | null, suffix = ''): string =>
  value === null
    ? '—'
    : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)}${suffix}`;

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
  children,
}: {
  title: string;
  status: string;
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
              backgroundColor:
                status === 'ready' ? colors.successSoft : colors.warningSoft,
              color: status === 'ready' ? colors.success : colors.warning,
            },
          ]}>
          {status.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  );
}

function CombinedResult({ viewModel }: { viewModel: CombinedCoachViewModel }) {
  const { colors } = useAppTheme();
  if (viewModel.kind !== 'review') {
    return (
      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {viewModel.title}
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {viewModel.message}
        </Text>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <View style={styles.flexCopy}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {viewModel.title}
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {viewModel.message}
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
          {viewModel.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.domainStack}>
        <DomainCard title="Strength" status={viewModel.strength.status}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {formatNumber(viewModel.strength.completedSets)} completed sets ·{' '}
            {formatNumber(viewModel.strength.totalReps)} reps
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Tonnage {formatNumber(viewModel.strength.totalTonnage, ' kg')} · average RPE{' '}
            {formatNumber(viewModel.strength.averageActualRpe)}
          </Text>
        </DomainCard>

        <DomainCard title="Nutrition" status={viewModel.nutrition.status}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {formatNumber(viewModel.nutrition.trackedDays)} tracked days ·{' '}
            {formatNumber(viewModel.nutrition.coveragePercent, '%')} coverage
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Average {formatNumber(viewModel.nutrition.averageCaloriesPerTrackedDay, ' kcal')} ·{' '}
            {formatNumber(viewModel.nutrition.averageProteinPerTrackedDay, ' g protein')}
          </Text>
        </DomainCard>

        <DomainCard title="Safety & Recovery" status={viewModel.safety.status}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Recommended load {Math.round(viewModel.safety.recommendedLoadMultiplier * 100)}%
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {viewModel.safety.restrictionCount} restrictions · {viewModel.safety.issueCount} findings
          </Text>
        </DomainCard>
      </View>

      {viewModel.issues.length > 0 ? (
        <View style={styles.issueStack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Final guardrail</Text>
          {viewModel.issues.map((issue, index) => (
            <Text
              key={`${issue.code}:${issue.domain}:${index}`}
              style={[styles.bodyText, { color: issueColor(issue, colors) }]}>
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.boundaryBox, { borderColor: colors.borderSubtle }]}>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          Combined Coach is read-only. It cannot confirm or apply Strength, Nutrition, or workout
          changes. Each future proposal keeps its own deterministic validation and explicit
          confirmation boundary.
        </Text>
      </View>
    </AppCard>
  );
}

export default function CombinedCoachScreen() {
  const { colors } = useAppTheme();
  const themedStyles = useMemo(() => createCombinedCoachScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { syncNow, status: syncStatus } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const combinedAvailable =
    capabilities?.schemaVersion === 6 &&
    capabilities.combined?.deterministicReview === true &&
    capabilities.combined.automaticApplication === false;
  const primarySession = useMemo(
    () => latestSession(app.workoutSessions),
    [app.workoutSessions],
  );
  const activeLimitations = app.userLimitations.filter(
    (limitation) => limitation.status === 'active',
  ).length;
  const trackedNutritionDays = new Set(app.foodEntries.map((entry) => entry.date)).size;
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
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Combined Coach could not complete the review.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={themedStyles.screen}>
      <View style={[themedStyles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [themedStyles.backButton, pressed && styles.pressed]}>
          <Text style={themedStyles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.flexCopy}>
          <Text style={themedStyles.title}>Combined Coach</Text>
          <Text style={themedStyles.subtitle}>Strength · Nutrition · Safety</Text>
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
            <Text style={themedStyles.cardTitle}>Local context</Text>
            <Text style={themedStyles.bodyText}>
              Workout: {primarySession?.workoutTitle ?? 'no completed workout'}
            </Text>
            <Text style={themedStyles.bodyText}>
              Nutrition days: {trackedNutritionDays} · recovery check-ins:{' '}
              {app.recoveryCheckIns.length} · active limitations: {activeLimitations}
            </Text>
            <Text style={themedStyles.metaText}>
              Capability: {combinedAvailable ? 'v6 available' : 'not enabled'} · Sync: {syncStatus}
            </Text>
          </AppCard>

          {!ready ? (
            <AppCard>
              <Text style={themedStyles.cardTitle}>Preparing account…</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={themedStyles.cardTitle}>Sign in required</Text>
              <Text style={themedStyles.bodyText}>
                Combined Coach uses account-scoped synchronized records and child Coach runs.
              </Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={themedStyles.cardTitle}>Run deterministic combined review</Text>
              <Text style={themedStyles.bodyText}>
                This starts the existing Strength session review, Nutrition review, and Safety &
                Recovery review in parallel, then applies one final status guardrail.
              </Text>
              <PrimaryButton
                disabled={!combinedAvailable || busy}
                label="Run Combined Coach review"
                loading={busy}
                onPress={() => void runCombinedReview()}
              />
              {!combinedAvailable ? (
                <Text style={themedStyles.metaText}>
                  Combined Coach remains hidden until the backend advertises capability schema v6.
                </Text>
              ) : null}
              <SecondaryButton
                label="Review Safety inputs"
                onPress={() => router.push('/profile/safety-recovery')}
              />
            </AppCard>
          )}

          {error ? (
            <AppCard style={themedStyles.errorCard}>
              <Text style={themedStyles.errorTitle}>Combined Coach error</Text>
              <Text style={themedStyles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? <CombinedResult viewModel={viewModel} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}