import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import type { WorkoutSessionDraft } from '@/features/workouts/types';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getSafetyRecoveryReviewCopy } from '@/localization/safetyRecoveryReviewCopy';
import { getUserLimitationsCopy } from '@/localization/userLimitationsCopy';
import { getWorkoutSafetyGateCopy } from '@/localization/workoutSafetyGateCopy';
import {
  createAsyncStorageAdapter,
  createSafetyRecoveryReviewStore,
} from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';

import {
  buildWorkoutSafetyGateDecision,
  type WorkoutSafetyGateDecision,
} from '../workoutSafetyGateModel';
import { createWorkoutSafetyGateStyles } from './workoutSafetyGateScreen.styles';

const boundedLabel = (
  labels: Record<string, string>,
  value: string,
  fallback: string,
): string => labels[value] ?? fallback;

export default function WorkoutSafetyGateScreen({
  draft,
  onContinue,
}: {
  draft: WorkoutSessionDraft;
  onContinue(
    decision: WorkoutSafetyGateDecision,
    explicitlyAcknowledged: boolean,
  ): Promise<void> | void;
}) {
  const { colors } = useAppTheme();
  const { formatNumber, locale } = useLocalization();
  const copy = useMemo(() => getWorkoutSafetyGateCopy(locale), [locale]);
  const reviewCopy = useMemo(() => getSafetyRecoveryReviewCopy(locale), [locale]);
  const limitationCopy = useMemo(() => getUserLimitationsCopy(locale), [locale]);
  const styles = useMemo(() => createWorkoutSafetyGateStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { session } = useAuthSession();
  const storage = useMemo(() => createAsyncStorageAdapter(), []);
  const reviewStore = useMemo(() => createSafetyRecoveryReviewStore(storage), [storage]);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof reviewStore.get>>>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userId = session?.user.id ?? null;

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSnapshot(userId ? await reviewStore.get(userId) : null);
    } catch {
      setSnapshot(null);
      setLoadError(copy.snapshotLoadError);
    } finally {
      setLoading(false);
    }
  }, [copy.snapshotLoadError, reviewStore, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadSnapshot();
    }, [loadSnapshot]),
  );

  const decision = useMemo(
    () =>
      buildWorkoutSafetyGateDecision({
        snapshot,
        currentUserId: userId,
        recoveryCheckIns: app.recoveryCheckIns,
        userLimitations: app.userLimitations,
      }),
    [app.recoveryCheckIns, app.userLimitations, snapshot, userId],
  );

  useEffect(() => {
    setAcknowledged(false);
  }, [decision.kind, decision.reviewRunId, decision.sourceFingerprint]);

  const continueToWorkout = async () => {
    if (loading || continuing || (decision.requiresAcknowledgement && !acknowledged)) return;
    setContinuing(true);
    try {
      await onContinue(
        decision,
        decision.requiresAcknowledgement ? acknowledged : false,
      );
    } finally {
      setContinuing(false);
    }
  };

  const decisionPresentation = useMemo(() => {
    if (loading) {
      return {
        title: copy.loadingReview,
        message: null,
        statusLabel: copy.loadingStatus,
      };
    }
    if (decision.kind === 'review_missing') {
      return { ...copy.reviewMissing, statusLabel: copy.noReviewStatus };
    }
    if (decision.kind === 'review_stale') {
      return { ...copy.reviewStale, statusLabel: copy.staleStatus };
    }
    if (decision.reviewStatus) {
      return {
        ...reviewCopy.resultCopy[decision.reviewStatus],
        statusLabel: reviewCopy.readinessStatusLabels[decision.reviewStatus],
      };
    }
    return { ...copy.reviewUnavailable, statusLabel: copy.reviewUnavailableStatus };
  }, [copy, decision.kind, decision.reviewStatus, loading, reviewCopy]);

  const statusColor =
    decision.reviewStatus === 'ready'
      ? colors.success
      : decision.reviewStatus === 'blocked'
        ? colors.error
        : colors.warning;

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
            <Text style={styles.eyebrow}>{copy.workout}</Text>
            <Text style={styles.workoutTitle}>{draft.workoutTitle}</Text>
            <Text style={styles.bodyText}>{copy.sessionContext}</Text>
          </AppCard>

          <AppCard style={decision.reviewStatus === 'blocked' ? styles.blockedCard : undefined}>
            <View style={styles.resultHeader}>
              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>{decisionPresentation.title}</Text>
                {decisionPresentation.message ? (
                  <Text style={styles.bodyText}>{decisionPresentation.message}</Text>
                ) : null}
              </View>
              <Text style={[styles.statusBadge, { color: statusColor }]}>
                {decisionPresentation.statusLabel}
              </Text>
            </View>

            {decision.recommendedLoadPercent !== null ? (
              <View style={styles.metricRow}>
                <View>
                  <Text style={styles.metricValue}>
                    {formatNumber(decision.recommendedLoadPercent, {
                      maximumFractionDigits: 0,
                    })}%
                  </Text>
                  <Text style={styles.metricLabel}>{copy.reviewedLoadCeiling}</Text>
                </View>
                <View>
                  <Text style={styles.metricValue}>
                    {formatNumber(decision.restrictions.length, {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  <Text style={styles.metricLabel}>{copy.restrictions}</Text>
                </View>
              </View>
            ) : null}

            {decision.restrictions.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.structuredRestrictions}</Text>
                {decision.restrictions.map((restriction) => {
                  const percent = formatNumber(
                    Math.round(restriction.maximumLoadMultiplier * 100),
                    { maximumFractionDigits: 0 },
                  );
                  return (
                    <View key={restriction.limitationId} style={styles.listRow}>
                      <View style={styles.listCopy}>
                        <Text style={styles.listTitle}>
                          {boundedLabel(
                            limitationCopy.bodyRegionLabels as Record<string, string>,
                            restriction.bodyRegion,
                            copy.notSpecified,
                          )}{' '}
                          ·{' '}
                          {boundedLabel(
                            limitationCopy.sideLabels as Record<string, string>,
                            restriction.side,
                            copy.notSpecified,
                          )}
                        </Text>
                        <Text style={styles.bodyText}>
                          {reviewCopy.actionLabels[restriction.action]} ·{' '}
                          {copy.affectedLoadUpTo(percent)}
                        </Text>
                        {restriction.movementPatterns.length > 0 ? (
                          <Text style={styles.metaText}>
                            {reviewCopy.movements}:{' '}
                            {restriction.movementPatterns
                              .map((movement) =>
                                boundedLabel(
                                  limitationCopy.movementLabels as Record<string, string>,
                                  movement,
                                  copy.notSpecified,
                                ),
                              )
                              .join(', ')}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.rowBadge, { color: colors.warning }]}>
                        {limitationCopy.severityLabels[restriction.severity]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {decision.issues.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.reviewFindings}</Text>
                {decision.issues.map((issue, index) => {
                  const issuePresentation = reviewCopy.issueCopy(issue.code);
                  return (
                    <View key={`${issue.code}-${index}`} style={styles.listRow}>
                      <View style={styles.listCopy}>
                        <Text style={styles.listTitle}>{issuePresentation.title}</Text>
                        <Text style={styles.bodyText}>{issuePresentation.message}</Text>
                      </View>
                      <Text
                        style={[
                          styles.rowBadge,
                          { color: issue.severity === 'hard_block' ? colors.error : colors.warning },
                        ]}>
                        {reviewCopy.issueSeverityLabels[issue.severity]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

            {decision.requiresAcknowledgement && !loading ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acknowledged }}
                onPress={() => setAcknowledged((current) => !current)}
                style={({ pressed }) => [styles.acknowledgement, pressed && styles.pressed]}>
                <View style={[styles.checkbox, acknowledged && styles.checkboxSelected]}>
                  <Text style={styles.checkboxLabel}>{acknowledged ? '✓' : ''}</Text>
                </View>
                <Text style={styles.acknowledgementText}>{copy.acknowledgement}</Text>
              </Pressable>
            ) : null}

            <PrimaryButton
              disabled={loading || (decision.requiresAcknowledgement && !acknowledged)}
              label={
                decision.reviewStatus === 'blocked'
                  ? copy.continueDespiteHardBlock
                  : copy.enterWorkout
              }
              loading={continuing}
              onPress={() => void continueToWorkout()}
            />
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>{copy.updateReview}</Text>
            <Text style={styles.bodyText}>{copy.updateReviewBody}</Text>
            <SecondaryButton
              label={copy.openSafetyRecovery}
              onPress={() => router.push('/profile/safety-recovery')}
            />
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push('/profile/recovery-check-in')}
                style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
                <Text style={styles.smallActionLabel}>{copy.recoveryCheckIn}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/profile/limitations')}
                style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
                <Text style={styles.smallActionLabel}>{copy.limitations}</Text>
              </Pressable>
            </View>
          </AppCard>

          <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
