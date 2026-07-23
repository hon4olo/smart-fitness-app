import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
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
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          accessibilityLabel="Back"
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
                <Text style={styles.acknowledgementText}>
                  I reviewed this result and understand that the app will not automatically change the
                  exercises, sets, reps, or load.
                </Text>
              </Pressable>
            ) : null}

            <PrimaryButton
              disabled={loading || (decision.requiresAcknowledgement && !acknowledged)}
              label={
                decision.reviewStatus === 'blocked'
                  ? 'Continue despite hard block'
                  : 'Enter workout'
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
              label="Open Safety & Recovery"
              onPress={() => router.push('/profile/safety-recovery')}
            />
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push('/profile/recovery-check-in')}
                style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
                <Text style={styles.smallActionLabel}>Recovery check-in</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/profile/limitations')}
                style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
                <Text style={styles.smallActionLabel}>Limitations</Text>
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

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    acknowledgement: {
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    acknowledgementText: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    actionRow: {
      flexDirection: 'row',
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
    blockedCard: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
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
    checkbox: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 6,
      borderWidth: 1,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    checkboxLabel: {
      color: colors.textOnAccent,
      fontSize: 16,
      fontWeight: '900',
    },
    checkboxSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
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
    disclaimer: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      textAlign: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    eyebrow: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      letterSpacing: 1,
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
      gap: 3,
      minWidth: 0,
    },
    listCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    listRow: {
      alignItems: 'flex-start',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    listTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricRow: {
      flexDirection: 'row',
      gap: Spacing.six,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
    pressed: {
      opacity: 0.68,
    },
    resultHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    rowBadge: {
      flexShrink: 0,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      maxWidth: 104,
      textAlign: 'right',
      textTransform: 'uppercase',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    section: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    smallAction: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
    },
    smallActionLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    statusBadge: {
      flexShrink: 0,
      fontSize: Typography.caption.fontSize,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
    workoutTitle: {
      color: colors.textPrimary,
      fontSize: 25,
      fontWeight: '900',
      lineHeight: 31,
    },
  });
