import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getWorkoutSafetyGateCopy } from '@/localization/workoutSafetyGateCopy';
import {
  createAsyncStorageAdapter,
  createSafetyRecoveryReviewStore,
} from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { WorkoutSessionDraft } from '@/features/workouts/types';
import {
  buildWorkoutSafetyGateDecision,
  type WorkoutSafetyGateDecision,
} from '../workoutSafetyGateModel';
import { createWorkoutSafetyGateStyles } from './workoutSafetyGateScreen.styles';

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const statusLabel = (decision: WorkoutSafetyGateDecision): string => {
  if (decision.kind === 'review_missing') return 'NO REVIEW';
  if (decision.kind === 'review_stale') return 'STALE';
  return decision.reviewStatus?.toUpperCase() ?? 'REVIEW';
};

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
  const { locale } = useLocalization();
  const copy = useMemo(() => getWorkoutSafetyGateCopy(locale), [locale]);
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
    } catch (error) {
      setSnapshot(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'The saved Safety & Recovery review could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [reviewStore, userId]);

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
          <Text style={styles.title}>Before your workout</Text>
          <Text style={styles.subtitle}>Safety & Recovery acknowledgement</Text>
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
            <Text style={styles.eyebrow}>WORKOUT</Text>
            <Text style={styles.workoutTitle}>{draft.workoutTitle}</Text>
            <Text style={styles.bodyText}>
              This check is attached to the current workout session. Returning to this session will not
              request the same acknowledgement again.
            </Text>
          </AppCard>

          <AppCard style={decision.reviewStatus === 'blocked' ? styles.blockedCard : undefined}>
            <View style={styles.resultHeader}>
              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>{loading ? 'Loading review…' : decision.title}</Text>
                {!loading ? <Text style={styles.bodyText}>{decision.message}</Text> : null}
              </View>
              <Text style={[styles.statusBadge, { color: statusColor }]}>
                {loading ? 'LOADING' : statusLabel(decision)}
              </Text>
            </View>

            {decision.recommendedLoadPercent !== null ? (
              <View style={styles.metricRow}>
                <View>
                  <Text style={styles.metricValue}>{decision.recommendedLoadPercent}%</Text>
                  <Text style={styles.metricLabel}>Reviewed load ceiling</Text>
                </View>
                <View>
                  <Text style={styles.metricValue}>{decision.restrictions.length}</Text>
                  <Text style={styles.metricLabel}>Restrictions</Text>
                </View>
              </View>
            ) : null}

            {decision.restrictions.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Structured restrictions</Text>
                {decision.restrictions.map((restriction) => (
                  <View key={restriction.limitationId} style={styles.listRow}>
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>
                        {formatCode(restriction.bodyRegion)} · {formatCode(restriction.side)}
                      </Text>
                      <Text style={styles.bodyText}>
                        {formatCode(restriction.action)} · affected load up to{' '}
                        {Math.round(restriction.maximumLoadMultiplier * 100)}%
                      </Text>
                      {restriction.movementPatterns.length > 0 ? (
                        <Text style={styles.metaText}>
                          Movements: {restriction.movementPatterns.map(formatCode).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.rowBadge, { color: colors.warning }]}>
                      {restriction.severity.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {decision.issues.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Review findings</Text>
                {decision.issues.map((issue, index) => (
                  <View key={`${issue.code}-${index}`} style={styles.listRow}>
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>{formatCode(issue.code)}</Text>
                      <Text style={styles.bodyText}>{issue.message}</Text>
                    </View>
                    <Text
                      style={[
                        styles.rowBadge,
                        { color: issue.severity === 'hard_block' ? colors.error : colors.warning },
                      ]}>
                      {formatCode(issue.severity)}
                    </Text>
                  </View>
                ))}
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
            <Text style={styles.cardTitle}>Update the review</Text>
            <Text style={styles.bodyText}>
              Add current recovery data or limitations, synchronize them, and run the deterministic
              review again before continuing.
            </Text>
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

          <Text style={styles.disclaimer}>
            Safety & Recovery uses synchronized self-reported product data. It is not a medical
            diagnosis or treatment recommendation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
