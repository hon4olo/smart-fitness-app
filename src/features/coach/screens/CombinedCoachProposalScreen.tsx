import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import { CombinedCoachProposalResult } from '../components/CombinedCoachProposalResult';
import { buildCombinedCoachProposalViewModel } from '../combinedCoachProposalViewModel';

const createRunIdempotencyKey = (): string =>
  `mobile-combined-proposal-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

const createConfirmationIdempotencyKey = (runId: string): string =>
  `mobile-combined-effective-strength-${runId}`;

const latestSession = (sessions: WorkoutSession[]): WorkoutSession | null =>
  [...sessions].sort(
    (left, right) => Date.parse(right.finishedAt) - Date.parse(left.finishedAt),
  )[0] ?? null;

export default function CombinedCoachProposalScreen() {
  const { colors } = useAppTheme();
  const themed = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { syncNow, status: syncStatus } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const proposalAvailable =
    capabilities !== null &&
    capabilities.schemaVersion >= 7 &&
    capabilities.combined?.deterministicProposalReview === true &&
    capabilities.combined.proposalRequiresExplicitConfirmation === true &&
    capabilities.combined.automaticApplication === false;
  const confirmationAvailable =
    capabilities?.schemaVersion === 8 &&
    capabilities.combined?.effectiveStrengthConfirmation === true &&
    capabilities.combined.automaticApplication === false;
  const primarySession = useMemo(
    () => latestSession(app.workoutSessions),
    [app.workoutSessions],
  );
  const viewModel = useMemo(
    () => (run ? buildCombinedCoachProposalViewModel(run) : null),
    [run],
  );
  const canConfirmEffectiveStrength =
    confirmationAvailable &&
    run !== null &&
    viewModel?.kind === 'review' &&
    !viewModel.rejected &&
    viewModel.effectiveStrengthApplication === null &&
    viewModel.effectiveStrength !== null &&
    (viewModel.effectiveStrength.status === 'ready' ||
      viewModel.effectiveStrength.status === 'modify') &&
    viewModel.effectiveStrength.sets.length > 0 &&
    viewModel.effectiveStrength.unresolvedMovementPatterns.length === 0;
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

  const runProposal = async () => {
    if (!proposalAvailable || busy) return;
    setBusy(true);
    setError(null);
    setRun(null);
    try {
      await syncNow();
      const initial = await coachApi.startCombinedRun({
        requestType: 'combined_proposal_review',
        ...(primarySession ? { requestedSessionId: primarySession.id } : {}),
        strengthHistoryLimit: 8,
        nutritionLookbackDays: 7,
        safetyLookbackDays: 14,
        idempotencyKey: createRunIdempotencyKey(),
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
          : 'Combined Coach could not build the proposals.',
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmEffectiveStrength = async () => {
    if (!canConfirmEffectiveStrength || !run || confirmationBusy) return;
    setConfirmationBusy(true);
    setError(null);
    try {
      const confirmed = await coachApi.confirmCombinedEffectiveStrength(run.run.id, {
        idempotencyKey: createConfirmationIdempotencyKey(run.run.id),
      });
      setRun(confirmed);
      try {
        await syncNow();
      } catch {
        setError('The workout template was created, but local synchronization needs to be retried.');
      }
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : 'The effective Strength template could not be created.',
      );
    } finally {
      setConfirmationBusy(false);
    }
  };

  const requestEffectiveStrengthConfirmation = () => {
    if (!canConfirmEffectiveStrength) return;
    Alert.alert(
      'Create workout template?',
      'This creates a new revisioned template from the effective Strength loads. Completed workout history and Nutrition will not be changed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create template',
          onPress: () => void confirmEffectiveStrength(),
        },
      ],
    );
  };

  return (
    <View style={themed.screen}>
      <View style={[themed.header, { paddingTop: insets.top + Spacing.two }]}> 
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={themed.backButton}> 
          <Text style={themed.backLabel}>‹</Text>
        </Pressable>
        <View style={themed.flexCopy}>
          <Text style={themed.title}>Combined proposal</Text>
          <Text style={themed.subtitle}>Strength · Nutrition · Safety</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[themed.content, { paddingBottom: insets.bottom + Spacing.eight }]}
        showsVerticalScrollIndicator={false}> 
        <View style={themed.container}>
          <AppCard>
            <Text style={themed.cardTitle}>Explicit proposal and application</Text>
            <Text style={themed.body}> 
              Builds Strength and Nutrition proposals, derives effective Strength loads under the
              Safety ceiling, and keeps every mutation as a separate explicit action.
            </Text>
            <Text style={themed.meta}> 
              Capability: {capabilities ? `v${capabilities.schemaVersion}` : 'not enabled'} · Sync:{' '}
              {syncStatus}
            </Text>
            {!ready ? null : !isAuthenticated ? (
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            ) : (
              <PrimaryButton
                disabled={!proposalAvailable || busy}
                label="Build Combined proposal"
                loading={busy}
                onPress={() => void runProposal()}
              />
            )}
            <SecondaryButton
              label="Open regular Combined review"
              onPress={() => router.push('/profile/combined-review')}
            />
          </AppCard>

          {error ? (
            <AppCard style={themed.errorCard}>
              <Text style={themed.errorTitle}>Combined proposal notice</Text>
              <Text style={themed.body}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? (
            <CombinedCoachProposalResult
              canConfirmEffectiveStrength={canConfirmEffectiveStrength}
              confirmationBusy={confirmationBusy}
              onConfirmEffectiveStrength={requestEffectiveStrengthConfirmation}
              viewModel={viewModel}
            />
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
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    backLabel: { color: colors.textPrimary, fontSize: 24, lineHeight: 25 },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
    },
    container: {
      alignSelf: 'center',
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
    errorCard: { borderColor: colors.error },
    errorTitle: {
      color: colors.error,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
    },
    flexCopy: { flex: 1, minWidth: 0 },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    meta: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    screen: { backgroundColor: colors.background, flex: 1 },
    subtitle: { color: colors.textSecondary, fontSize: Typography.caption.fontSize },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
    },
  });
