import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { upsertRecoveryCheckInInState } from '@/context/appContext/safetyRecoveryActions';
import { RecoveryScorePicker } from '@/features/coach/components/RecoveryScorePicker';
import { createUuid } from '@/lib/ids';
import { useLocalization } from '@/localization';
import {
  getRecoveryCheckInCopy,
  type RecoveryCheckInCopy,
} from '@/localization/recoveryCheckInCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type {
  AppContextType,
  AppState,
  RecoveryScaleOneToFive,
  RecoveryScaleZeroToFive,
} from '@/types';

import {
  buildRecoveryCheckIn,
  emptyRecoveryCheckInDraft,
  type RecoveryCheckInDraft,
} from '../recoveryCheckInForm';

const ONE_TO_FIVE: readonly RecoveryScaleOneToFive[] = [1, 2, 3, 4, 5];
const ZERO_TO_FIVE: readonly RecoveryScaleZeroToFive[] = [0, 1, 2, 3, 4, 5];

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

const scoreSummary = (draft: RecoveryCheckInDraft): number =>
  [
    draft.sleepDurationHours.trim() ? draft.sleepDurationHours : null,
    draft.sleepQuality,
    draft.fatigue,
    draft.soreness,
    draft.stress,
    draft.painInterference,
    draft.readiness,
  ].filter((value) => value !== null).length;

const localizeValidationMessage = (message: string, copy: RecoveryCheckInCopy) => {
  if (message === 'Sleep duration must be between 0 and 24 hours.') {
    return copy.validation.sleepRange;
  }
  if (message === 'Add at least two recovery signals before saving.') {
    return copy.validation.minimumSignals;
  }
  if (message === 'The check-in timestamp is invalid.') {
    return copy.validation.timestamp;
  }
  return message;
};

export default function RecoveryCheckInScreen() {
  const { colors } = useAppTheme();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getRecoveryCheckInCopy(locale);
  const themedStyles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { error: syncError, pendingOperations, status: syncStatus, syncNow } = useWeightSync();
  const [draft, setDraft] = useState<RecoveryCheckInDraft>(emptyRecoveryCheckInDraft);
  const [pendingSyncId, setPendingSyncId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const latestCheckIn = app.recoveryCheckIns[0] ?? null;
  const selectedSignalCount = scoreSummary(draft);
  const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return copy.unknownTime;
    return formatDate(parsed, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const syncStatusLabel = copy.syncLabels[String(syncStatus)] ?? String(syncStatus);

  useEffect(() => {
    if (
      !pendingSyncId ||
      !app.recoveryCheckIns.some((checkIn) => checkIn.id === pendingSyncId)
    ) {
      return;
    }

    let cancelled = false;
    void syncNow()
      .then(() => {
        if (!cancelled) setSaveMessage(copy.savedAndSynced);
      })
      .catch(() => {
        if (!cancelled) setSaveMessage(copy.savedLocallyRetry);
      })
      .finally(() => {
        if (!cancelled) setPendingSyncId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [app.recoveryCheckIns, copy.savedAndSynced, copy.savedLocallyRetry, pendingSyncId, syncNow]);

  const updateDraft = <Key extends keyof RecoveryCheckInDraft>(
    key: Key,
    value: RecoveryCheckInDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setSaveMessage(null);
  };

  const saveCheckIn = () => {
    if (app.isRestoringState || pendingSyncId) return;
    setFormError(null);
    setSaveMessage(null);

    const result = buildRecoveryCheckIn({
      draft,
      id: createUuid(),
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setFormError(localizeValidationMessage(result.message, copy));
      return;
    }

    const nextState = upsertRecoveryCheckInInState(toAppState(app), result.checkIn);
    if (!nextState.recoveryCheckIns.some((checkIn) => checkIn.id === result.checkIn.id)) {
      setFormError(copy.localValidationFailed);
      return;
    }

    app.replaceState(nextState);
    setPendingSyncId(result.checkIn.id);
    setDraft(emptyRecoveryCheckInDraft());
    setSaveMessage(
      copy.savedSignals(
        result.signalCount,
        formatNumber(result.signalCount, { maximumFractionDigits: 0 }),
      ),
    );
  };

  return (
    <View style={themedStyles.screen}>
      <View style={[themedStyles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [themedStyles.backButton, pressed && themedStyles.pressed]}>
          <Text style={themedStyles.backLabel}>‹</Text>
        </Pressable>
        <View style={themedStyles.headerCopy}>
          <Text style={themedStyles.title}>{copy.title}</Text>
          <Text style={themedStyles.subtitle}>{copy.subtitle}</Text>
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
            <Text style={themedStyles.cardTitle}>{copy.currentStatus}</Text>
            <Text style={themedStyles.bodyText}>
              {copy.latestSaved}: {latestCheckIn ? formatTimestamp(latestCheckIn.recordedAt) : copy.none}
            </Text>
            <Text style={themedStyles.metaText}>
              {copy.syncStatus(
                syncStatusLabel,
                formatNumber(pendingOperations, { maximumFractionDigits: 0 }),
              )}
            </Text>
            {syncError ? (
              <Text style={[themedStyles.metaText, { color: colors.warning }]}>
                {copy.syncIssue}
              </Text>
            ) : null}
          </AppCard>

          <AppCard>
            <Text style={themedStyles.cardTitle}>{copy.todaySignals}</Text>
            <Text style={themedStyles.bodyText}>{copy.signalsExplanation}</Text>

            <View style={themedStyles.fieldGroup}>
              <Text style={themedStyles.fieldLabel}>{copy.sleepDuration}</Text>
              <Text style={themedStyles.metaText}>{copy.sleepDurationHelper}</Text>
              <TextInput
                accessibilityLabel={copy.sleepDurationAccessibility}
                keyboardType="decimal-pad"
                onChangeText={(value) => updateDraft('sleepDurationHours', value)}
                placeholder="7.5"
                placeholderTextColor={colors.textMuted}
                style={themedStyles.input}
                value={draft.sleepDurationHours}
              />
            </View>

            <RecoveryScorePicker
              helperText={copy.veryPoorToVeryGood}
              label={copy.sleepQuality}
              onChange={(value) => updateDraft('sleepQuality', value)}
              options={ONE_TO_FIVE}
              value={draft.sleepQuality}
            />
            <RecoveryScorePicker
              helperText={copy.lowToMaximum}
              label={copy.fatigue}
              onChange={(value) => updateDraft('fatigue', value)}
              options={ONE_TO_FIVE}
              value={draft.fatigue}
            />
            <RecoveryScorePicker
              helperText={copy.noneToMaximum}
              label={copy.soreness}
              onChange={(value) => updateDraft('soreness', value)}
              options={ZERO_TO_FIVE}
              value={draft.soreness}
            />
            <RecoveryScorePicker
              helperText={copy.lowToMaximum}
              label={copy.stress}
              onChange={(value) => updateDraft('stress', value)}
              options={ONE_TO_FIVE}
              value={draft.stress}
            />
            <RecoveryScorePicker
              helperText={copy.noneToMaximum}
              label={copy.painInterference}
              onChange={(value) => updateDraft('painInterference', value)}
              options={ZERO_TO_FIVE}
              value={draft.painInterference}
            />
            <RecoveryScorePicker
              helperText={copy.veryLowToVeryHigh}
              label={copy.readiness}
              onChange={(value) => updateDraft('readiness', value)}
              options={ONE_TO_FIVE}
              value={draft.readiness}
            />

            <Text style={themedStyles.metaText}>
              {copy.selectedSignals(
                selectedSignalCount,
                formatNumber(selectedSignalCount, { maximumFractionDigits: 0 }),
              )}
            </Text>
            {formError ? <Text style={themedStyles.errorText}>{formError}</Text> : null}
            {saveMessage ? (
              <Text style={[themedStyles.metaText, { color: colors.success }]}>{saveMessage}</Text>
            ) : null}

            <PrimaryButton
              disabled={app.isRestoringState || Boolean(pendingSyncId)}
              label={copy.save}
              loading={Boolean(pendingSyncId)}
              onPress={saveCheckIn}
            />
            <SecondaryButton
              accessibilityHint={copy.openReviewHint}
              label={copy.openReview}
              onPress={() => router.push('/profile/safety-recovery')}
            />
          </AppCard>

          <AppCard>
            <Text style={themedStyles.cardTitle}>{copy.boundary}</Text>
            <Text style={themedStyles.bodyText}>{copy.boundaryBody}</Text>
          </AppCard>
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
    errorText: {
      color: colors.error,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    fieldGroup: { gap: Spacing.one },
    fieldLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: { flex: 1, minWidth: 0 },
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
    pressed: { opacity: 0.68 },
    screen: { backgroundColor: colors.background, flex: 1 },
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
