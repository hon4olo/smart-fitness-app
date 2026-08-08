import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAppActions, useAppInfrastructure } from '@/context/AppContext';
import { useSafetyRecoveryState } from '@/context/SafetyRecoveryStateContext';
import { useWeightSync } from '@/context/SyncContext';
import { createUuid } from '@/lib/ids';
import { useLocalization } from '@/localization';
import { getBoundedSyncStatusLabel } from '@/localization/statusPresentation';
import {
  getUserLimitationsCopy,
  type UserLimitationsCopy,
} from '@/localization/userLimitationsCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { UserLimitation, UserLimitationMovementPattern } from '@/types';
import {
  buildActiveUserLimitation,
  emptyUserLimitationDraft,
  transitionUserLimitationStatus,
  type UserLimitationDraft,
} from '../userLimitationForm';
import {
  ChoiceGrid,
  getLimitationOptions,
  LimitationRow,
  MovementGrid,
} from './UserLimitationFormFields';
import {
  createUserLimitationScreenStyles,
  styles,
} from './userLimitationScreen.styles';

type PendingChange = {
  id: string;
  operation: 'upsert' | 'delete';
};

const localizeValidationMessage = (message: string, copy: UserLimitationsCopy) => {
  const messages: Record<string, string> = {
    'The limitation timestamp is invalid.': copy.validation.timestamp,
    'Onset date must be a valid past or current YYYY-MM-DD date.': copy.validation.onsetDate,
    'Select a limitation type.': copy.validation.type,
    'Select a body region.': copy.validation.bodyRegion,
    'Select the affected side.': copy.validation.side,
    'Select a severity.': copy.validation.severity,
    'Select the training impact.': copy.validation.impact,
    'Select at least one movement pattern to avoid.': copy.validation.movement,
    'Resolved date cannot be before the onset date.': copy.validation.resolvedBeforeOnset,
  };
  return messages[message] ?? copy.localValidationFailed;
};

export default function UserLimitationScreen() {
  const { colors } = useAppTheme();
  const { formatNumber, locale } = useLocalization();
  const copy = getUserLimitationsCopy(locale);
  const options = getLimitationOptions(copy);
  const themedStyles = useMemo(() => createUserLimitationScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { userLimitations } = useSafetyRecoveryState();
  const { deleteUserLimitation, upsertUserLimitation } = useAppActions();
  const { isRestoringState } = useAppInfrastructure();
  const { error: syncError, pendingOperations, status: syncStatus, syncNow } = useWeightSync();
  const [draft, setDraft] = useState<UserLimitationDraft>(emptyUserLimitationDraft);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = userLimitations.filter((item) => item.status === 'active').length;
  const syncStatusLabel = getBoundedSyncStatusLabel(locale, String(syncStatus));

  useEffect(() => {
    if (!pendingChange) return;
    const exists = userLimitations.some((item) => item.id === pendingChange.id);
    if (
      (pendingChange.operation === 'upsert' && !exists) ||
      (pendingChange.operation === 'delete' && exists)
    ) {
      return;
    }

    let cancelled = false;
    void syncNow()
      .then(() => {
        if (!cancelled) setMessage(copy.savedAndSynced);
      })
      .catch(() => {
        if (!cancelled) setMessage(copy.savedLocallyRetry);
      })
      .finally(() => {
        if (!cancelled) setPendingChange(null);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.savedAndSynced, copy.savedLocallyRetry, pendingChange, syncNow, userLimitations]);

  const updateDraft = <Key extends keyof UserLimitationDraft>(
    key: Key,
    value: UserLimitationDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setMessage(null);
  };

  const toggleMovement = (movement: UserLimitationMovementPattern) => {
    setDraft((current) => ({
      ...current,
      movementPatterns: current.movementPatterns.includes(movement)
        ? current.movementPatterns.filter((item) => item !== movement)
        : [...current.movementPatterns, movement],
    }));
    setFormError(null);
    setMessage(null);
  };

  const saveLimitation = () => {
    if (pendingChange || isRestoringState) return;
    const result = buildActiveUserLimitation({
      draft,
      id: createUuid(),
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setFormError(localizeValidationMessage(result.message, copy));
      return;
    }

    if (!upsertUserLimitation(result.limitation)) {
      setFormError(copy.localValidationFailed);
      return;
    }
    setPendingChange({ id: result.limitation.id, operation: 'upsert' });
    setDraft(emptyUserLimitationDraft());
    setFormError(null);
    setMessage(copy.savedLocally);
  };

  const changeStatus = (limitation: UserLimitation) => {
    if (pendingChange) return;
    const result = transitionUserLimitationStatus({
      limitation,
      status: limitation.status === 'active' ? 'resolved' : 'active',
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setFormError(localizeValidationMessage(result.message, copy));
      return;
    }
    if (!upsertUserLimitation(result.limitation)) {
      setFormError(copy.localValidationFailed);
      return;
    }
    setPendingChange({ id: limitation.id, operation: 'upsert' });
    setMessage(copy.statusUpdated);
  };

  const deleteLimitation = (limitation: UserLimitation) => {
    if (pendingChange) return;
    deleteUserLimitation(limitation.id);
    setPendingChange({ id: limitation.id, operation: 'delete' });
    setMessage(copy.deletedLocally);
  };

  return (
    <View style={themedStyles.screen}>
      <View style={[themedStyles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [themedStyles.backButton, pressed && styles.pressed]}>
          <Text style={themedStyles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.rowCopy}>
          <Text style={themedStyles.title}>{copy.title}</Text>
          <Text style={themedStyles.subtitle}>{copy.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          themedStyles.content,
          { flexGrow: 1, paddingBottom: insets.bottom + Spacing.eight },
        ]}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={themedStyles.container}>
          <AppCard>
            <Text style={themedStyles.cardTitle}>{copy.currentRecords}</Text>
            <Text style={themedStyles.bodyText}>
              {copy.recordCounts(
                activeCount,
                formatNumber(activeCount, { maximumFractionDigits: 0 }),
                userLimitations.length,
                formatNumber(userLimitations.length, { maximumFractionDigits: 0 }),
              )}
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
            {userLimitations.length === 0 ? (
              <Text style={themedStyles.bodyText}>{copy.noLimitations}</Text>
            ) : (
              <View style={styles.listStack}>
                {userLimitations.map((limitation) => (
                  <LimitationRow
                    key={limitation.id}
                    disabled={Boolean(pendingChange)}
                    limitation={limitation}
                    onDelete={() => deleteLimitation(limitation)}
                    onStatusChange={() => changeStatus(limitation)}
                  />
                ))}
              </View>
            )}
          </AppCard>

          <AppCard>
            <Text style={themedStyles.cardTitle}>{copy.addLimitation}</Text>
            <Text style={themedStyles.bodyText}>{copy.addExplanation}</Text>

            <ChoiceGrid label={copy.type} onChange={(value) => updateDraft('kind', value)} options={options.kinds} value={draft.kind} />
            <ChoiceGrid columns={3} label={copy.bodyRegion} onChange={(value) => updateDraft('bodyRegion', value)} options={options.bodyRegions} value={draft.bodyRegion} />
            <ChoiceGrid columns={3} label={copy.affectedSide} onChange={(value) => updateDraft('side', value)} options={options.sides} value={draft.side} />
            <ChoiceGrid columns={3} label={copy.severity} onChange={(value) => updateDraft('severity', value)} options={options.severities} value={draft.severity} />
            <ChoiceGrid label={copy.trainingImpact} onChange={(value) => updateDraft('trainingImpact', value)} options={options.impacts} value={draft.trainingImpact} />
            <MovementGrid onToggle={toggleMovement} values={draft.movementPatterns} />

            <View style={styles.fieldGroup}>
              <Text style={themedStyles.fieldLabel}>{copy.onsetDate}</Text>
              <Text style={themedStyles.metaText}>{copy.onsetHelper}</Text>
              <TextInput
                accessibilityLabel={copy.onsetAccessibility}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={(value) => updateDraft('onsetDate', value)}
                placeholder="2026-07-23"
                placeholderTextColor={colors.textMuted}
                style={themedStyles.input}
                value={draft.onsetDate}
              />
            </View>

            {formError ? <Text style={themedStyles.errorText}>{formError}</Text> : null}
            {message ? (
              <Text style={[themedStyles.metaText, { color: colors.success }]}>{message}</Text>
            ) : null}
            <PrimaryButton
              disabled={isRestoringState || Boolean(pendingChange)}
              label={copy.save}
              loading={Boolean(pendingChange)}
              onPress={saveLimitation}
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