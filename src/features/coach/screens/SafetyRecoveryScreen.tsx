import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachCapabilities, type CoachRunEnvelope } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { upsertRecoveryCheckInInState } from '@/context/appContext/safetyRecoveryActions';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createUuid } from '@/lib/ids';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type {
  AppContextType,
  AppState,
  RecoveryCheckIn,
  RecoveryScaleOneToFive,
  RecoveryScaleZeroToFive,
} from '@/types';
import {
  buildSafetyRecoveryViewModel,
  type SafetyRecoveryViewModel,
} from '../safetyRecoveryViewModel';

const ONE_TO_FIVE: RecoveryScaleOneToFive[] = [1, 2, 3, 4, 5];
const ZERO_TO_FIVE: RecoveryScaleZeroToFive[] = [0, 1, 2, 3, 4, 5];

const toAppState = (app: AppContextType): AppState => ({
  workouts: app.workouts,
  trainingPrograms: app.trainingPrograms,
  exercises: app.exercises,
  workoutSessions: app.workoutSessions,
  foodEntries: app.foodEntries,
  mealTemplates: app.mealTemplates,
  nutrition: app.nutrition,
  nutritionTargets: app.nutritionTargets,
  weightHistory: app.weightHistory,
  bodyMeasurements: app.bodyMeasurements,
  userLimitations: app.userLimitations,
  recoveryCheckIns: app.recoveryCheckIns,
  profile: app.profile,
  onboardingCompleted: app.onboardingCompleted,
});

const createIdempotencyKey = (): string =>
  `mobile-safety-review-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

const formatTimestamp = (value: string | null): string => {
  if (!value) return 'No current check-in';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

function ScorePicker<T extends number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly T[];
  onChange(value: T | null): void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldStack}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(null)}
          disabled={value === null}>
          <Text
            style={[
              styles.clearLabel,
              { color: value === null ? colors.textMuted : colors.accent },
            ]}>
            Clear
          </Text>
        </Pressable>
      </View>
      <View style={styles.scoreRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityLabel={`${label} ${option}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.scoreButton,
                {
                  backgroundColor: selected ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.scoreLabel,
                  { color: selected ? colors.accent : colors.textPrimary },
                ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ReviewResult({ viewModel }: { viewModel: SafetyRecoveryViewModel }) {
  const { colors } = useAppTheme();
  if (viewModel.kind !== 'review') {
    return (
      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{viewModel.title}</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{viewModel.message}</Text>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <View style={styles.flexCopy}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{viewModel.title}</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{viewModel.message}</Text>
        </View>
        <Text
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                viewModel.status === 'ready' ? colors.successSoft : colors.warningSoft,
              color: viewModel.status === 'ready' ? colors.success : colors.warning,
            },
          ]}>
          {viewModel.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCell}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {Math.round(viewModel.recommendedLoadMultiplier * 100)}%
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Recommended load</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
            {viewModel.signalCount}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Signals checked</Text>
        </View>
      </View>

      <Text style={[styles.metaText, { color: colors.textMuted }]}>
        Latest check-in: {formatTimestamp(viewModel.latestCheckInAt)}
        {viewModel.latestCheckInAgeHours === null
          ? ''
          : ` · ${viewModel.latestCheckInAgeHours}h old`}
      </Text>

      {viewModel.restrictions.length > 0 ? (
        <View style={styles.sectionStack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Restrictions</Text>
          {viewModel.restrictions.map((restriction) => (
            <View key={restriction.limitationId} style={styles.restrictionRow}>
              <View style={styles.flexCopy}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  {formatCode(restriction.bodyRegion)} · {formatCode(restriction.side)}
                </Text>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {formatCode(restriction.action)}
                  {restriction.movementPatterns.length > 0
                    ? ` · ${restriction.movementPatterns.map(formatCode).join(', ')}`
                    : ''}
                </Text>
              </View>
              <Text style={[styles.restrictionValue, { color: colors.warning }]}>
                {Math.round(restriction.maximumLoadMultiplier * 100)}%
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {viewModel.issues.length > 0 ? (
        <View style={styles.sectionStack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Policy findings</Text>
          {viewModel.issues.map((issue, index) => (
            <Text
              key={`${issue.code}:${issue.path}:${index}`}
              style={[
                styles.bodyText,
                {
                  color:
                    issue.severity === 'hard_block' || issue.severity === 'modify'
                      ? colors.warning
                      : colors.textSecondary,
                },
              ]}>
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.noApplyBox, { borderColor: colors.borderSubtle }]}>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          This review cannot change a workout automatically. Any future training proposal must pass
          its own deterministic guardrails and explicit confirmation.
        </Text>
      </View>
    </AppCard>
  );
}

export default function SafetyRecoveryScreen() {
  const { colors } = useAppTheme();
  const themedStyles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { syncNow, status: syncStatus } = useWeightSync();
  const { ready, refresh, session } = useAuthSession();
  const [capabilities, setCapabilities] = useState<CoachCapabilities | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<RecoveryScaleOneToFive | null>(null);
  const [fatigue, setFatigue] = useState<RecoveryScaleOneToFive | null>(null);
  const [soreness, setSoreness] = useState<RecoveryScaleZeroToFive | null>(null);
  const [stress, setStress] = useState<RecoveryScaleOneToFive | null>(null);
  const [painInterference, setPainInterference] =
    useState<RecoveryScaleZeroToFive | null>(null);
  const [readiness, setReadiness] = useState<RecoveryScaleOneToFive | null>(null);
  const [pendingSyncId, setPendingSyncId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const safetyAvailable =
    capabilities?.schemaVersion === 5 &&
    capabilities.safety?.deterministicRecoveryReview === true &&
    capabilities.safety.automaticApplication === false;
  const latestCheckIn = app.recoveryCheckIns[0] ?? null;
  const activeLimitations = app.userLimitations.filter((item) => item.status === 'active');
  const reviewViewModel = useMemo(
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

  useEffect(() => {
    if (!pendingSyncId || !app.recoveryCheckIns.some((item) => item.id === pendingSyncId)) {
      return;
    }
    let cancelled = false;
    void syncNow().finally(() => {
      if (!cancelled) {
        setPendingSyncId(null);
        setSaveMessage('Check-in saved and queued for account sync.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [app.recoveryCheckIns, pendingSyncId, syncNow]);

  const saveCheckIn = () => {
    setError(null);
    setSaveMessage(null);
    const trimmedSleep = sleepHours.trim().replace(',', '.');
    const parsedSleep = trimmedSleep ? Number(trimmedSleep) : null;
    if (
      parsedSleep !== null &&
      (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24)
    ) {
      setError('Sleep duration must be between 0 and 24 hours.');
      return;
    }
    const signalCount = [
      parsedSleep,
      sleepQuality,
      fatigue,
      soreness,
      stress,
      painInterference,
      readiness,
    ].filter((value) => value !== null).length;
    if (signalCount < 2) {
      setError('Add at least two recovery signals before saving.');
      return;
    }

    const now = new Date().toISOString();
    const checkIn: RecoveryCheckIn = {
      id: createUuid(),
      recordedAt: now,
      sleepDurationHours:
        parsedSleep === null ? null : Math.round(parsedSleep * 100) / 100,
      sleepQuality,
      fatigue,
      soreness,
      stress,
      painInterference,
      readiness,
      createdAt: now,
      updatedAt: now,
    };
    const nextState = upsertRecoveryCheckInInState(toAppState(app), checkIn);
    if (!nextState.recoveryCheckIns.some((item) => item.id === checkIn.id)) {
      setError('The recovery check-in did not pass local validation.');
      return;
    }
    app.replaceState(nextState);
    setPendingSyncId(checkIn.id);
    setSleepHours('');
    setSleepQuality(null);
    setFatigue(null);
    setSoreness(null);
    setStress(null);
    setPainInterference(null);
    setReadiness(null);
  };

  const runReview = async () => {
    if (!safetyAvailable || reviewBusy) return;
    setReviewBusy(true);
    setError(null);
    setRun(null);
    try {
      await syncNow();
      const initial = await coachApi.startSafetyRecoveryRun({
        lookbackDays: 14,
        idempotencyKey: createIdempotencyKey(),
      });
      setRun(initial);
      setRun(
        await coachApi.waitForTerminalRun(initial, {
          intervalMs: 500,
          maxPolls: 20,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Safety & Recovery could not complete the review.',
      );
    } finally {
      setReviewBusy(false);
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
          <Text style={themedStyles.title}>Safety & Recovery</Text>
          <Text style={themedStyles.subtitle}>Self-reported deterministic readiness</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          themedStyles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={themedStyles.container}>
          <AppCard>
            <Text style={themedStyles.cardTitle}>Product boundary</Text>
            <Text style={themedStyles.bodyText}>
              This is not a diagnosis or treatment recommendation. The backend uses only explicit
              self-reported signals and restrictions. Free-text notes never enter the Coach context.
            </Text>
            <Text style={themedStyles.metaText}>
              Capability: {safetyAvailable ? 'v5 available' : 'unavailable'} · Sync: {syncStatus}
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
                Safety & Recovery reviews use account-scoped synchronized records.
              </Text>
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : (
            <>
              <AppCard>
                <Text style={themedStyles.cardTitle}>Current context</Text>
                <Text style={themedStyles.bodyText}>
                  Latest check-in: {formatTimestamp(latestCheckIn?.recordedAt ?? null)}
                </Text>
                <Text style={themedStyles.bodyText}>
                  Active limitations: {activeLimitations.length}
                </Text>
                {activeLimitations.slice(0, 4).map((limitation) => (
                  <Text key={limitation.id} style={themedStyles.metaText}>
                    • {formatCode(limitation.bodyRegion)} · {formatCode(limitation.side)} ·{' '}
                    {formatCode(limitation.trainingImpact)}
                  </Text>
                ))}
              </AppCard>

              <AppCard>
                <Text style={themedStyles.cardTitle}>New recovery check-in</Text>
                <Text style={themedStyles.metaText}>
                  Add at least two signals. Higher fatigue, soreness, stress and pain scores indicate
                  more interference; higher readiness and sleep quality indicate better recovery.
                </Text>

                <View style={styles.fieldStack}>
                  <Text style={themedStyles.fieldLabel}>Sleep duration (hours)</Text>
                  <TextInput
                    accessibilityLabel="Sleep duration in hours"
                    keyboardType="decimal-pad"
                    onChangeText={setSleepHours}
                    placeholder="7.5"
                    placeholderTextColor={colors.textMuted}
                    style={themedStyles.input}
                    value={sleepHours}
                  />
                </View>
                <ScorePicker
                  label="Sleep quality"
                  onChange={setSleepQuality}
                  options={ONE_TO_FIVE}
                  value={sleepQuality}
                />
                <ScorePicker
                  label="Fatigue"
                  onChange={setFatigue}
                  options={ONE_TO_FIVE}
                  value={fatigue}
                />
                <ScorePicker
                  label="Soreness"
                  onChange={setSoreness}
                  options={ZERO_TO_FIVE}
                  value={soreness}
                />
                <ScorePicker
                  label="Stress"
                  onChange={setStress}
                  options={ONE_TO_FIVE}
                  value={stress}
                />
                <ScorePicker
                  label="Pain interference"
                  onChange={setPainInterference}
                  options={ZERO_TO_FIVE}
                  value={painInterference}
                />
                <ScorePicker
                  label="Readiness"
                  onChange={setReadiness}
                  options={ONE_TO_FIVE}
                  value={readiness}
                />

                <PrimaryButton
                  disabled={Boolean(pendingSyncId)}
                  label="Save recovery check-in"
                  loading={Boolean(pendingSyncId)}
                  onPress={saveCheckIn}
                />
                {saveMessage ? (
                  <Text style={[themedStyles.metaText, { color: colors.success }]}>{saveMessage}</Text>
                ) : null}
              </AppCard>

              <AppCard>
                <Text style={themedStyles.cardTitle}>Deterministic review</Text>
                <Text style={themedStyles.bodyText}>
                  Synchronizes the latest inputs, then evaluates freshness, signal coverage, explicit
                  limitations and bounded load-reduction rules.
                </Text>
                <SecondaryButton
                  disabled={!safetyAvailable || reviewBusy || Boolean(pendingSyncId)}
                  label="Run Safety & Recovery review"
                  loading={reviewBusy}
                  onPress={() => void runReview()}
                />
              </AppCard>
            </>
          )}

          {error ? (
            <AppCard style={themedStyles.errorCard}>
              <Text style={themedStyles.errorTitle}>Safety & Recovery error</Text>
              <Text style={themedStyles.bodyText}>{error}</Text>
            </AppCard>
          ) : null}

          {reviewViewModel ? <ReviewResult viewModel={reviewViewModel} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  clearLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  fieldHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  fieldStack: {
    gap: Spacing.two,
  },
  flexCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricCell: {
    flex: 1,
    gap: 2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  noApplyBox: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.65,
  },
  restrictionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  restrictionValue: {
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  resultHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowTitle: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  scoreButton: {
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  scoreLabel: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  sectionStack: {
    gap: Spacing.two,
  },
  statusBadge: {
    borderRadius: Radii.pill,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});

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
    errorCard: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
    },
    errorTitle: {
      color: colors.error,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
    },
    fieldLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      minHeight: 46,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
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
  });
