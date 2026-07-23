import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  createAsyncStorageAdapter,
  createSafetyRecoveryReviewStore,
} from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { buildSafetyRecoveryReviewSnapshot } from '../safetyRecoveryReviewSnapshot';
import {
  buildSafetyRecoveryViewModel,
  type SafetyRecoveryIssueSeverity,
  type SafetyRecoveryRestrictionAction,
} from '../safetyRecoveryViewModel';

const LOOKBACK_OPTIONS = [7, 14, 30] as const;

const ACTION_LABELS: Record<SafetyRecoveryRestrictionAction, string> = {
  monitor: 'Monitor',
  reduce_load: 'Reduce load',
  avoid_movement: 'Avoid movement',
  pause_training: 'Pause training',
};

const SEVERITY_LABELS: Record<SafetyRecoveryIssueSeverity, string> = {
  input_required: 'Input required',
  warning: 'Warning',
  modify: 'Modify',
  hard_block: 'Hard block',
};

const createIdempotencyKey = (lookbackDays: number): string =>
  `mobile-safety-recovery-review-${lookbackDays}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatCheckIn = (value: string | null, ageHours: number | null): string => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not available';
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
  return ageHours === null ? dateLabel : `${dateLabel} · ${ageHours} h ago`;
};

export default function SafetyRecoveryCoachScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { isRestoringState } = app;
  const { ready, refresh, session } = useAuthSession();
  const storage = useMemo(() => createAsyncStorageAdapter(), []);
  const reviewStore = useMemo(() => createSafetyRecoveryReviewStore(storage), [storage]);
  const [lookbackDays, setLookbackDays] = useState<(typeof LOOKBACK_OPTIONS)[number]>(7);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const safetyAvailable = capabilities?.safety?.deterministicRecoveryReview === true;
  const viewModel = useMemo(
    () => (run ? buildSafetyRecoveryViewModel(run) : null),
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

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!ready || !isAuthenticated) {
      setCapabilities(null);
      setCapabilitiesLoading(false);
      return;
    }

    let cancelled = false;
    setCapabilitiesLoading(true);
    void coachApi
      .getCapabilities()
      .then((nextCapabilities) => {
        if (!cancelled) setCapabilities(nextCapabilities);
      })
      .catch((capabilityError: unknown) => {
        if (cancelled) return;
        setCapabilities(null);
        setError(
          capabilityError instanceof Error
            ? capabilityError.message
            : 'Safety & Recovery capabilities could not be verified.',
        );
      })
      .finally(() => {
        if (!cancelled) setCapabilitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coachApi, isAuthenticated, ready]);

  const startReview = async () => {
    if (busy || !safetyAvailable) return;

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setBusy(true);
    setError(null);
    setSnapshotMessage(null);
    setRun(null);

    try {
      const initial = await coachApi.startSafetyRecoveryRun({
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

      const terminalViewModel = buildSafetyRecoveryViewModel(terminal);
      const snapshot = buildSafetyRecoveryReviewSnapshot({
        run: terminal,
        viewModel: terminalViewModel,
        recoveryCheckIns: app.recoveryCheckIns,
        userLimitations: app.userLimitations,
      });
      if (snapshot && session?.user.id === snapshot.userId) {
        try {
          await reviewStore.set(snapshot);
          setSnapshotMessage('Saved for the pre-workout Safety & Recovery check.');
        } catch {
          setSnapshotMessage(
            'Review completed, but the local pre-workout snapshot could not be saved.',
          );
        }
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Safety & Recovery could not complete the review.',
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
          <Text style={styles.title}>Safety & Recovery</Text>
          <Text style={styles.subtitle}>Deterministic self-reported readiness</Text>
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
              <Text style={styles.previewBadge}>Deterministic</Text>
              <Text style={styles.statusText}>
                {capabilitiesLoading
                  ? 'Checking backend capability'
                  : safetyAvailable
                    ? 'Safety Recovery v5 available'
                    : 'Safety Recovery unavailable'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>Readiness review</Text>
            <Text style={styles.bodyText}>
              The backend evaluates synchronized self-reported limitations and recovery check-ins.
              It does not diagnose a condition, read free-text notes, or apply changes automatically.
            </Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>Preparing account and recovery data…</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>Sign in required</Text>
              <Text style={styles.bodyText}>
                Safety & Recovery reads only records synchronized to your protected backend account.
              </Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>Review period</Text>
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
                        setSnapshotMessage(null);
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
                disabled={!safetyAvailable || busy || capabilitiesLoading}
                label="Run readiness review"
                loading={busy}
                onPress={() => void startReview()}
              />
              {!capabilitiesLoading && !safetyAvailable ? (
                <Text style={styles.disclaimer}>
                  This control remains disabled until the authenticated backend returns the exact
                  capability v5 safety contract.
                </Text>
              ) : null}
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

              {viewModel.kind === 'result' ? (
                <View style={styles.resultStack}>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>
                        {Math.round(viewModel.readiness.recommendedLoadMultiplier * 100)}%
                      </Text>
                      <Text style={styles.metricLabel}>Recommended load</Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>{viewModel.readiness.signalCount}</Text>
                      <Text style={styles.metricLabel}>Recovery signals</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>Readiness status</Text>
                    <Text style={styles.infoValue}>
                      {formatCode(viewModel.readiness.status)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>Latest check-in</Text>
                    <Text style={styles.infoValue}>
                      {formatCheckIn(
                        viewModel.readiness.latestCheckInAt,
                        viewModel.readiness.latestCheckInAgeHours,
                      )}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>Explicit confirmation</Text>
                    <Text style={styles.infoValue}>
                      {viewModel.readiness.requiresExplicitConfirmation ? 'Required' : 'Not required'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>Automatic application</Text>
                    <Text style={styles.infoValue}>Never approved</Text>
                  </View>

                  {viewModel.readiness.restrictions.length > 0 ? (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionTitle}>Active restrictions</Text>
                      {viewModel.readiness.restrictions.map((restriction) => (
                        <View key={restriction.limitationId} style={styles.listRow}>
                          <View style={styles.listCopy}>
                            <Text style={styles.listTitle}>
                              {formatCode(restriction.bodyRegion)} · {formatCode(restriction.side)}
                            </Text>
                            <Text style={styles.bodyText}>
                              {ACTION_LABELS[restriction.action]} · maximum affected load{' '}
                              {Math.round(restriction.maximumLoadMultiplier * 100)}%
                            </Text>
                            {restriction.movementPatterns.length > 0 ? (
                              <Text style={styles.metaText}>
                                Movements: {restriction.movementPatterns.map(formatCode).join(', ')}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.restrictionSeverity}>
                            {restriction.severity.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {viewModel.readiness.issues.length > 0 ? (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionTitle}>Review findings</Text>
                      {viewModel.readiness.issues.map((issue, index) => (
                        <View key={`${issue.code}-${index}`} style={styles.issueRow}>
                          <Text style={styles.issueBadge}>{SEVERITY_LABELS[issue.severity]}</Text>
                          <View style={styles.listCopy}>
                            <Text style={styles.listTitle}>{formatCode(issue.code)}</Text>
                            <Text style={styles.bodyText}>{issue.message}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.successText}>
                      No deterministic recovery or limitation findings were returned.
                    </Text>
                  )}

                  {snapshotMessage ? <Text style={styles.metaText}>{snapshotMessage}</Text> : null}
                  <Text style={styles.disclaimer}>
                    This product result is based on self-reported data and is not a medical diagnosis
                    or treatment recommendation.
                  </Text>
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
      alignItems: 'flex-start',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
      paddingTop: Spacing.two,
    },
    infoValue: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: Typography.callout.fontSize,
      fontWeight: Typography.callout.fontWeight,
      lineHeight: Typography.callout.lineHeight,
      textAlign: 'right',
    },
    issueBadge: {
      color: colors.warning,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      minWidth: 88,
      textTransform: 'uppercase',
    },
    issueRow: {
      alignItems: 'flex-start',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    listCopy: {
      flex: 1,
      gap: 2,
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
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
    },
    periodButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      minHeight: 42,
      justifyContent: 'center',
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
      color: colors.accent,
    },
    periodRow: {
      flexDirection: 'row',
      gap: Spacing.one,
    },
    pressed: {
      opacity: 0.65,
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
    restrictionSeverity: {
      color: colors.warning,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    resultHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    resultStack: {
      gap: Spacing.three,
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
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    statusText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    successText: {
      color: colors.success,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });
