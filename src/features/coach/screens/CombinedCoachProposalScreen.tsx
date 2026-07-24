import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSession } from '@/types';
import {
  buildCombinedCoachProposalViewModel,
  type CombinedCoachProposalViewModel,
  type CombinedProposalTargets,
  type CombinedSafetyRestriction,
} from '../combinedCoachProposalViewModel';

const createIdempotencyKey = (): string =>
  `mobile-combined-proposal-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

const latestSession = (sessions: WorkoutSession[]): WorkoutSession | null =>
  [...sessions].sort(
    (left, right) => Date.parse(right.finishedAt) - Date.parse(left.finishedAt),
  )[0] ?? null;

const formatTargets = (targets: CombinedProposalTargets | null): string =>
  targets
    ? `${targets.calories} kcal · P ${targets.protein} · C ${targets.carbs} · F ${targets.fats}`
    : '—';

const formatRestriction = (restriction: CombinedSafetyRestriction): string => {
  const movementCopy =
    restriction.movementPatterns.length > 0
      ? ` · ${restriction.movementPatterns.join(', ')}`
      : '';
  return `${restriction.action.replaceAll('_', ' ')} · max ${Math.round(
    restriction.maximumLoadMultiplier * 100,
  )}%${movementCopy}`;
};

const actionCopy: Record<string, string> = {
  review_strength_proposal: 'Review the Strength proposal separately',
  apply_safety_load_ceiling: 'Apply the Safety load ceiling before confirming Strength',
  resolve_movement_restrictions: 'Resolve restricted movement patterns before using Strength',
  confirm_nutrition_target: 'Confirm the Nutrition target in Nutrition Coach',
};

function ProposalResult({ viewModel }: { viewModel: CombinedCoachProposalViewModel }) {
  const { colors } = useAppTheme();
  if (viewModel.kind !== 'review') {
    return (
      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {viewModel.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {viewModel.message}
        </Text>
      </AppCard>
    );
  }

  const effective = viewModel.effectiveStrength;

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <View style={styles.flexCopy}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {viewModel.title}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {viewModel.message}
          </Text>
        </View>
        <Text
          style={[
            styles.badge,
            {
              backgroundColor:
                viewModel.status === 'ready' ? colors.successSoft : colors.warningSoft,
              color: viewModel.status === 'ready' ? colors.success : colors.warning,
            },
          ]}>
          {viewModel.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.stack}>
        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}>
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Strength proposal</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {viewModel.strength.sets.length} sets · proposed tonnage{' '}
            {viewModel.strength.proposedTonnage ?? '—'} kg
          </Text>
          {viewModel.strength.sets.slice(0, 4).map((set) => (
            <Text key={set.sourceSetId} style={[styles.meta, { color: colors.textMuted }]}> 
              {set.exerciseName}: {set.weight} kg × {set.reps} · RPE {set.targetRpe}
            </Text>
          ))}

          {effective ? (
            <View style={styles.stack}>
              <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Effective plan</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}> 
                Effective tonnage: {effective.effectiveTonnage ?? 'blocked'} kg · load ceiling{' '}
                {Math.round(effective.loadMultiplier * 100)}%
              </Text>
              {effective.sets.slice(0, 4).map((set) => (
                <Text key={set.sourceSetId} style={[styles.meta, { color: colors.textMuted }]}> 
                  {set.exerciseName}: proposed {set.proposedWeight} kg → effective{' '}
                  {set.effectiveWeight} kg · ceiling {set.maximumAllowedWeight} kg
                </Text>
              ))}
              {effective.unresolvedMovementPatterns.length > 0 ? (
                <Text style={[styles.body, { color: colors.warning }]}> 
                  Restricted movements unresolved:{' '}
                  {effective.unresolvedMovementPatterns.join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Nutrition target</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Current</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {formatTargets(viewModel.nutrition.currentTargets)}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Proposed</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {formatTargets(viewModel.nutrition.proposedTargets)}
          </Text>
        </View>

        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Safety ceiling</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            Maximum Strength load: {Math.round(viewModel.maximumStrengthLoadMultiplier * 100)}%
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}> 
            {viewModel.safety.restrictionCount} restrictions · {viewModel.safety.issueCount}{' '}
            findings
          </Text>
          {viewModel.safety.restrictions.slice(0, 4).map((restriction) => (
            <Text
              key={restriction.limitationId}
              style={[styles.meta, { color: colors.textMuted }]}> 
              • {formatRestriction(restriction)}
            </Text>
          ))}
        </View>
      </View>

      {viewModel.pendingActions.length > 0 ? (
        <View style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pending actions</Text>
          {viewModel.pendingActions.map((action) => (
            <Text key={action} style={[styles.body, { color: colors.textSecondary }]}> 
              • {actionCopy[action] ?? action}
            </Text>
          ))}
        </View>
      ) : null}

      {viewModel.issues.length > 0 ? (
        <View style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Guardrail findings</Text>
          {viewModel.issues.map((issue, index) => (
            <Text key={`${issue.code}:${index}`} style={[styles.body, { color: colors.warning }]}> 
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.boundary, { borderColor: colors.borderSubtle }]}> 
        <Text style={[styles.meta, { color: colors.textMuted }]}> 
          Combined Coach does not apply anything. Effective Strength loads are a deterministic
          read-only plan; Strength and Nutrition keep separate explicit confirmation controls.
        </Text>
      </View>
    </AppCard>
  );
}

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
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const available =
    capabilities?.schemaVersion === 7 &&
    capabilities.combined?.deterministicProposalReview === true &&
    capabilities.combined.proposalRequiresExplicitConfirmation === true &&
    capabilities.combined.automaticApplication === false;
  const primarySession = useMemo(
    () => latestSession(app.workoutSessions),
    [app.workoutSessions],
  );
  const viewModel = useMemo(
    () => (run ? buildCombinedCoachProposalViewModel(run) : null),
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

  const runProposal = async () => {
    if (!available || busy) return;
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
          : 'Combined Coach could not build the proposals.',
      );
    } finally {
      setBusy(false);
    }
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
        <View style={styles.flexCopy}>
          <Text style={themed.title}>Combined proposal</Text>
          <Text style={themed.subtitle}>Strength · Nutrition · Safety</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[themed.content, { paddingBottom: insets.bottom + Spacing.eight }]}
        showsVerticalScrollIndicator={false}> 
        <View style={themed.container}>
          <AppCard>
            <Text style={themed.cardTitle}>Read-only proposal review</Text>
            <Text style={themed.body}> 
              Builds the existing Strength and Nutrition proposals, then derives a deterministic
              effective Strength plan under the Safety ceiling. Nothing is applied automatically.
            </Text>
            <Text style={themed.meta}> 
              Capability: {available ? 'v7 available' : 'not enabled'} · Sync: {syncStatus}
            </Text>
            {!ready ? null : !isAuthenticated ? (
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            ) : (
              <PrimaryButton
                disabled={!available || busy}
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
              <Text style={themed.errorTitle}>Combined proposal error</Text>
              <Text style={themed.body}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel ? <ProposalResult viewModel={viewModel} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  body: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  boundary: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
  },
  cardTitle: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  domainCard: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    padding: Spacing.two,
  },
  domainTitle: {
    fontSize: Typography.label.fontSize,
    fontWeight: '900',
  },
  flexCopy: { flex: 1, minWidth: 0 },
  meta: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  resultHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two },
  sectionTitle: { fontSize: Typography.label.fontSize, fontWeight: '900' },
  stack: { gap: Spacing.one },
});

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
