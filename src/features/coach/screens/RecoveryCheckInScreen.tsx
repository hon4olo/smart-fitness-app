import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import {
  useAppActions,
  useAppContext,
  useAppInfrastructure,
} from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { RecoveryScorePicker } from '@/features/coach/components/RecoveryScorePicker';
import { createUuid } from '@/lib/ids';
import { useLocalization } from '@/localization';
import {
  getRecoveryCheckInCopy,
  type RecoveryCheckInCopy,
} from '@/localization/recoveryCheckInCopy';
import { getBoundedSyncStatusLabel } from '@/localization/statusPresentation';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { RecoveryScaleOneToFive, RecoveryScaleZeroToFive } from '@/types';

import {
  buildRecoveryCheckIn,
  emptyRecoveryCheckInDraft,
  type RecoveryCheckInDraft,
} from '../recoveryCheckInForm';
import { createRecoveryCheckInScreenStyles } from './recoveryCheckInScreen.styles';

const ONE_TO_FIVE: readonly RecoveryScaleOneToFive[] = [1, 2, 3, 4, 5];
const ZERO_TO_FIVE: readonly RecoveryScaleZeroToFive[] = [0, 1, 2, 3, 4, 5];

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
  return copy.localValidationFailed;
};

export default function RecoveryCheckInScreen() {
  const { colors } = useAppTheme();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getRecoveryCheckInCopy(locale);
  const themedStyles = useMemo(() => createRecoveryCheckInScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { recoveryCheckIns } = useAppContext();
  const { upsertRecoveryCheckIn } = useAppActions();
  const { isRestoringState } = useAppInfrastructure();
  const { error: syncError, pendingOperations, status: syncStatus, syncNow } = useWeightSync();
  const [draft, setDraft] = useState<RecoveryCheckInDraft>(emptyRecoveryCheckInDraft);
  const [pendingSyncId, setPendingSyncId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const latestCheckIn = recoveryCheckIns[0] ?? null;
  const selectedSignalCount = scoreSummary(draft);
  const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return copy.unknownTime;
    return formatDate(parsed, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const syncStatusLabel = getBoundedSyncStatusLabel(locale, String(syncStatus));

  useEffect(() => {
    if (
      !pendingSyncId ||
      !recoveryCheckIns.some((checkIn) => checkIn.id === pendingSyncId)
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
  }, [copy.savedAndSynced, copy.savedLocallyRetry, pendingSyncId, recoveryCheckIns, syncNow]);

  const updateDraft = <Key extends keyof RecoveryCheckInDraft>(
    key: Key,
    value: RecoveryCheckInDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setSaveMessage(null);
  };

  const saveCheckIn = () => {
    if (isRestoringState || pendingSyncId) return;
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

    if (!upsertRecoveryCheckIn(result.checkIn)) {
      setFormError(copy.localValidationFailed);
      return;
    }

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

            <RecoveryScorePicker helperText={copy.veryPoorToVeryGood} label={copy.sleepQuality} onChange={(value) => updateDraft('sleepQuality', value)} options={ONE_TO_FIVE} value={draft.sleepQuality} />
            <RecoveryScorePicker helperText={copy.lowToMaximum} label={copy.fatigue} onChange={(value) => updateDraft('fatigue', value)} options={ONE_TO_FIVE} value={draft.fatigue} />
            <RecoveryScorePicker helperText={copy.noneToMaximum} label={copy.soreness} onChange={(value) => updateDraft('soreness', value)} options={ZERO_TO_FIVE} value={draft.soreness} />
            <RecoveryScorePicker helperText={copy.lowToMaximum} label={copy.stress} onChange={(value) => updateDraft('stress', value)} options={ONE_TO_FIVE} value={draft.stress} />
            <RecoveryScorePicker helperText={copy.noneToMaximum} label={copy.painInterference} onChange={(value) => updateDraft('painInterference', value)} options={ZERO_TO_FIVE} value={draft.painInterference} />
            <RecoveryScorePicker helperText={copy.veryLowToVeryHigh} label={copy.readiness} onChange={(value) => updateDraft('readiness', value)} options={ONE_TO_FIVE} value={draft.readiness} />

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
              disabled={isRestoringState || Boolean(pendingSyncId)}
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
