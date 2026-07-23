import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import {
  deleteUserLimitationFromState,
  upsertUserLimitationInState,
} from '@/context/appContext/safetyRecoveryActions';
import { createUuid } from '@/lib/ids';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type {
  AppContextType,
  AppState,
  UserLimitation,
  UserLimitationMovementPattern,
} from '@/types';
import {
  buildActiveUserLimitation,
  emptyUserLimitationDraft,
  transitionUserLimitationStatus,
  type UserLimitationDraft,
} from '../userLimitationForm';
import {
  BODY_REGION_OPTIONS,
  ChoiceGrid,
  IMPACT_OPTIONS,
  KIND_OPTIONS,
  LimitationRow,
  MovementGrid,
  SEVERITY_OPTIONS,
  SIDE_OPTIONS,
} from './UserLimitationFormFields';
import {
  createUserLimitationScreenStyles,
  styles,
} from './userLimitationScreen.styles';

type PendingChange = {
  id: string;
  operation: 'upsert' | 'delete';
};

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

export default function UserLimitationScreen() {
  const { colors } = useAppTheme();
  const themedStyles = useMemo(() => createUserLimitationScreenStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { error: syncError, pendingOperations, status: syncStatus, syncNow } = useWeightSync();
  const [draft, setDraft] = useState<UserLimitationDraft>(emptyUserLimitationDraft);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = app.userLimitations.filter((item) => item.status === 'active').length;

  useEffect(() => {
    if (!pendingChange) return;
    const exists = app.userLimitations.some((item) => item.id === pendingChange.id);
    if (
      (pendingChange.operation === 'upsert' && !exists) ||
      (pendingChange.operation === 'delete' && exists)
    ) {
      return;
    }

    let cancelled = false;
    void syncNow()
      .then(() => {
        if (!cancelled) setMessage('Limitation change saved and synchronized.');
      })
      .catch(() => {
        if (!cancelled) {
          setMessage('Limitation change saved locally. Sync will retry when available.');
        }
      })
      .finally(() => {
        if (!cancelled) setPendingChange(null);
      });

    return () => {
      cancelled = true;
    };
  }, [app.userLimitations, pendingChange, syncNow]);

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
    if (pendingChange || app.isRestoringState) return;
    const result = buildActiveUserLimitation({
      draft,
      id: createUuid(),
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const nextState = upsertUserLimitationInState(toAppState(app), result.limitation);
    if (!nextState.userLimitations.some((item) => item.id === result.limitation.id)) {
      setFormError('The limitation did not pass local validation.');
      return;
    }
    void app.replaceState(nextState);
    setPendingChange({ id: result.limitation.id, operation: 'upsert' });
    setDraft(emptyUserLimitationDraft());
    setFormError(null);
    setMessage('Limitation saved locally.');
  };

  const changeStatus = (limitation: UserLimitation) => {
    if (pendingChange) return;
    const result = transitionUserLimitationStatus({
      limitation,
      status: limitation.status === 'active' ? 'resolved' : 'active',
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    void app.replaceState(upsertUserLimitationInState(toAppState(app), result.limitation));
    setPendingChange({ id: limitation.id, operation: 'upsert' });
    setMessage('Limitation status updated locally.');
  };

  const deleteLimitation = (limitation: UserLimitation) => {
    if (pendingChange) return;
    void app.replaceState(deleteUserLimitationFromState(toAppState(app), limitation.id));
    setPendingChange({ id: limitation.id, operation: 'delete' });
    setMessage('Limitation deleted locally.');
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
        <View style={styles.rowCopy}>
          <Text style={themedStyles.title}>Training limitations</Text>
          <Text style={themedStyles.subtitle}>Explicit self-reported restrictions</Text>
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
            <Text style={themedStyles.cardTitle}>Current records</Text>
            <Text style={themedStyles.bodyText}>
              Active: {activeCount} · total: {app.userLimitations.length}
            </Text>
            <Text style={themedStyles.metaText}>
              Sync: {syncStatus} · pending operations: {pendingOperations}
            </Text>
            {syncError ? (
              <Text style={[themedStyles.metaText, { color: colors.warning }]}>
                {syncError}
              </Text>
            ) : null}
            {app.userLimitations.length === 0 ? (
              <Text style={themedStyles.bodyText}>No limitations have been added.</Text>
            ) : (
              <View style={styles.listStack}>
                {app.userLimitations.map((limitation) => (
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
            <Text style={themedStyles.cardTitle}>Add limitation</Text>
            <Text style={themedStyles.bodyText}>
              Record only what you explicitly know. The app does not infer a diagnosis or select an
              impact for you.
            </Text>

            <ChoiceGrid
              label="Type"
              onChange={(value) => updateDraft('kind', value)}
              options={KIND_OPTIONS}
              value={draft.kind}
            />
            <ChoiceGrid
              columns={3}
              label="Body region"
              onChange={(value) => updateDraft('bodyRegion', value)}
              options={BODY_REGION_OPTIONS}
              value={draft.bodyRegion}
            />
            <ChoiceGrid
              columns={3}
              label="Affected side"
              onChange={(value) => updateDraft('side', value)}
              options={SIDE_OPTIONS}
              value={draft.side}
            />
            <ChoiceGrid
              columns={3}
              label="Severity"
              onChange={(value) => updateDraft('severity', value)}
              options={SEVERITY_OPTIONS}
              value={draft.severity}
            />
            <ChoiceGrid
              label="Training impact"
              onChange={(value) => updateDraft('trainingImpact', value)}
              options={IMPACT_OPTIONS}
              value={draft.trainingImpact}
            />
            <MovementGrid onToggle={toggleMovement} values={draft.movementPatterns} />

            <View style={styles.fieldGroup}>
              <Text style={themedStyles.fieldLabel}>Onset date</Text>
              <Text style={themedStyles.metaText}>Optional · YYYY-MM-DD · no future dates</Text>
              <TextInput
                accessibilityLabel="Limitation onset date"
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
              disabled={app.isRestoringState || Boolean(pendingChange)}
              label="Save limitation"
              loading={Boolean(pendingChange)}
              onPress={saveLimitation}
            />
            <SecondaryButton
              accessibilityHint="Opens the deterministic Safety and Recovery readiness review"
              label="Open Safety & Recovery review"
              onPress={() => router.push('/profile/safety-recovery')}
            />
          </AppCard>

          <AppCard>
            <Text style={themedStyles.cardTitle}>Boundary</Text>
            <Text style={themedStyles.bodyText}>
              This list is self-reported and is not medical advice. Free-text medical notes are not
              collected here. The Coach context receives only the typed restriction fields and cannot
              apply a workout change automatically.
            </Text>
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
}
