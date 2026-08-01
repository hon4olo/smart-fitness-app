import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createCoachApi,
  type CoachCapabilities,
  type CoachRunEnvelope,
} from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useAppInfrastructure } from '@/context/AppContext';
import { useSafetyRecoveryState } from '@/context/SafetyRecoveryStateContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getSafetyRecoveryReviewCopy } from '@/localization/safetyRecoveryReviewCopy';
import { getUserLimitationsCopy } from '@/localization/userLimitationsCopy';
import {
  createAsyncStorageAdapter,
  createSafetyRecoveryReviewStore,
} from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { buildSafetyRecoveryReviewSnapshot } from '../safetyRecoveryReviewSnapshot';
import { buildSafetyRecoveryViewModel } from '../safetyRecoveryViewModel';
import { createSafetyRecoveryCoachStyles } from './safetyRecoveryCoachScreen.styles';

const LOOKBACK_OPTIONS = [7, 14, 30] as const;

const createIdempotencyKey = (lookbackDays: number): string =>
  `mobile-safety-recovery-review-${lookbackDays}-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2)}`;

const lookupLabel = (
  labels: Record<string, string>,
  value: string,
  fallback: string,
): string => labels[value] ?? fallback;

export default function SafetyRecoveryCoachScreen() {
  const { colors } = useAppTheme();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getSafetyRecoveryReviewCopy(locale);
  const limitationCopy = getUserLimitationsCopy(locale);
  const styles = useMemo(() => createSafetyRecoveryCoachStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState } = useAppInfrastructure();
  const { recoveryCheckIns, userLimitations } = useSafetyRecoveryState();
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
  const presentation = viewModel ? copy.viewModelCopy(viewModel) : null;

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
      .catch(() => {
        if (cancelled) return;
        setCapabilities(null);
        setError(copy.requestErrorBody);
      })
      .finally(() => {
        if (!cancelled) setCapabilitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coachApi, copy.requestErrorBody, isAuthenticated, ready]);

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
        recoveryCheckIns,
        userLimitations,
      });
      if (snapshot && session?.user.id === snapshot.userId) {
        try {
          await reviewStore.set(snapshot);
          setSnapshotMessage(copy.snapshotSaved);
        } catch {
          setSnapshotMessage(copy.snapshotFailed);
        }
      }
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === 'AbortError') return;
      setError(copy.requestErrorBody);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setBusy(false);
      }
    }
  };

  const loading = !ready || isRestoringState;
  const formatCheckIn = (value: string | null, ageHours: number | null): string => {
    if (!value) return copy.notAvailable;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return copy.notAvailable;
    const dateLabel = formatDate(date, { dateStyle: 'medium', timeStyle: 'short' });
    return ageHours === null
      ? dateLabel
      : `${dateLabel} · ${copy.hoursAgo(
          ageHours,
          formatNumber(ageHours, { maximumFractionDigits: 0 }),
        )}`;
  };

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
            <View style={styles.badgeRow}>
              <Text style={styles.previewBadge}>{copy.deterministic}</Text>
              <Text style={styles.statusText}>
                {capabilitiesLoading
                  ? copy.checkingCapability
                  : safetyAvailable
                    ? copy.available
                    : copy.unavailable}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{copy.readinessReview}</Text>
            <Text style={styles.bodyText}>{copy.introduction}</Text>
          </AppCard>

          {loading ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.preparing}</Text>
            </AppCard>
          ) : !isAuthenticated ? (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.signInRequired}</Text>
              <Text style={styles.bodyText}>{copy.signInBody}</Text>
              <PrimaryButton label={copy.signIn} onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <AppCard>
              <Text style={styles.cardTitle}>{copy.reviewPeriod}</Text>
              <View style={styles.periodRow}>
                {LOOKBACK_OPTIONS.map((days) => {
                  const selected = days === lookbackDays;
                  return (
                    <Pressable
                      key={days}
                      accessibilityLabel={copy.days(
                        days,
                        formatNumber(days, { maximumFractionDigits: 0 }),
                      )}
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
                        {copy.days(days, formatNumber(days, { maximumFractionDigits: 0 }))}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <PrimaryButton
                disabled={!safetyAvailable || busy || capabilitiesLoading}
                label={copy.runReview}
                loading={busy}
                onPress={() => void startReview()}
              />
              {!capabilitiesLoading && !safetyAvailable ? (
                <Text style={styles.disclaimer}>{copy.capabilityHint}</Text>
              ) : null}
            </AppCard>
          )}

          {error ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>{copy.requestError}</Text>
              <Text style={styles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {viewModel && presentation ? (
            <AppCard>
              <View style={styles.resultHeader}>
                <Text style={styles.cardTitle}>{presentation.title}</Text>
                <Text style={styles.resultStatus}>
                  {run ? copy.runStatusLabel(run.run.status) : ''}
                </Text>
              </View>
              <Text style={styles.bodyText}>{presentation.message}</Text>

              {viewModel.kind === 'result' ? (
                <View style={styles.resultStack}>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>
                        {formatNumber(
                          Math.round(viewModel.readiness.recommendedLoadMultiplier * 100),
                          { maximumFractionDigits: 0 },
                        )}%
                      </Text>
                      <Text style={styles.metricLabel}>{copy.recommendedLoad}</Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>
                        {formatNumber(viewModel.readiness.signalCount, {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      <Text style={styles.metricLabel}>{copy.recoverySignals}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>{copy.readinessStatus}</Text>
                    <Text style={styles.infoValue}>
                      {copy.readinessStatusLabels[viewModel.readiness.status]}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>{copy.latestCheckIn}</Text>
                    <Text style={styles.infoValue}>
                      {formatCheckIn(
                        viewModel.readiness.latestCheckInAt,
                        viewModel.readiness.latestCheckInAgeHours,
                      )}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>{copy.explicitConfirmation}</Text>
                    <Text style={styles.infoValue}>
                      {viewModel.readiness.requiresExplicitConfirmation
                        ? copy.required
                        : copy.notRequired}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.metaText}>{copy.automaticApplication}</Text>
                    <Text style={styles.infoValue}>{copy.neverApproved}</Text>
                  </View>

                  {viewModel.readiness.restrictions.length > 0 ? (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionTitle}>{copy.activeRestrictions}</Text>
                      {viewModel.readiness.restrictions.map((restriction) => (
                        <View key={restriction.limitationId} style={styles.listRow}>
                          <View style={styles.listCopy}>
                            <Text style={styles.listTitle}>
                              {lookupLabel(
                                limitationCopy.bodyRegionLabels as Record<string, string>,
                                restriction.bodyRegion,
                                copy.unknownValue,
                              )}{' '}
                              ·{' '}
                              {lookupLabel(
                                limitationCopy.sideLabels as Record<string, string>,
                                restriction.side,
                                copy.unknownValue,
                              )}
                            </Text>
                            <Text style={styles.bodyText}>
                              {copy.actionLabels[restriction.action]} ·{' '}
                              {copy.maximumAffectedLoad(
                                formatNumber(
                                  Math.round(restriction.maximumLoadMultiplier * 100),
                                  { maximumFractionDigits: 0 },
                                ),
                              )}
                            </Text>
                            {restriction.movementPatterns.length > 0 ? (
                              <Text style={styles.metaText}>
                                {copy.movements}:{' '}
                                {restriction.movementPatterns
                                  .map((value) =>
                                    lookupLabel(
                                      limitationCopy.movementLabels as Record<string, string>,
                                      value,
                                      copy.unknownValue,
                                    ),
                                  )
                                  .join(', ')}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.restrictionSeverity}>
                            {lookupLabel(
                              limitationCopy.severityLabels as Record<string, string>,
                              restriction.severity,
                              copy.unknownValue,
                            )}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {viewModel.readiness.issues.length > 0 ? (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionTitle}>{copy.reviewFindings}</Text>
                      {viewModel.readiness.issues.map((issue, index) => {
                        const issuePresentation = copy.issueCopy(issue.code);
                        return (
                          <View key={`${issue.code}-${index}`} style={styles.issueRow}>
                            <Text style={styles.issueBadge}>
                              {copy.issueSeverityLabels[issue.severity]}
                            </Text>
                            <View style={styles.listCopy}>
                              <Text style={styles.listTitle}>{issuePresentation.title}</Text>
                              <Text style={styles.bodyText}>{issuePresentation.message}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.successText}>{copy.noFindings}</Text>
                  )}

                  {snapshotMessage ? <Text style={styles.metaText}>{snapshotMessage}</Text> : null}
                  <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
                </View>
              ) : null}
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
