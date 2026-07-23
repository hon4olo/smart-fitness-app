import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
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
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationStatus,
  UserLimitationTrainingImpact,
} from '@/types';
import {
  buildUserLimitation,
  draftFromUserLimitation,
  emptyUserLimitationDraft,
  type UserLimitationDraft,
} from '../userLimitationForm';

type Option<Value extends string> = {
  label: string;
  value: Value;
};

type PendingSync = {
  action: 'save' | 'delete';
  id: string;
};

const KIND_OPTIONS: readonly Option<UserLimitationKind>[] = [
  { label: 'Pain', value: 'pain' },
  { label: 'Injury', value: 'injury' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Medical restriction', value: 'medical_restriction' },
  { label: 'Other', value: 'other' },
];

const BODY_REGION_OPTIONS: readonly Option<UserLimitationBodyRegion>[] = [
  { label: 'Neck', value: 'neck' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Elbow', value: 'elbow' },
  { label: 'Wrist / hand', value: 'wrist_hand' },
  { label: 'Upper back', value: 'upper_back' },
  { label: 'Lower back', value: 'lower_back' },
  { label: 'Hip', value: 'hip' },
  { label: 'Knee', value: 'knee' },
  { label: 'Ankle / foot', value: 'ankle_foot' },
  { label: 'Chest', value: 'chest' },
  { label: 'Abdomen', value: 'abdomen' },
  { label: 'Systemic', value: 'systemic' },
  { label: 'Other', value: 'other' },
];

const SIDE_OPTIONS: readonly Option<UserLimitationSide>[] = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Both sides', value: 'bilateral' },
  { label: 'Midline', value: 'midline' },
  { label: 'Not applicable', value: 'not_applicable' },
];

const SEVERITY_OPTIONS: readonly Option<UserLimitationSeverity>[] = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

const STATUS_OPTIONS: readonly Option<UserLimitationStatus>[] = [
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
];

const IMPACT_OPTIONS: readonly Option<UserLimitationTrainingImpact>[] = [
  { label: 'Monitor only', value: 'monitor' },
  { label: 'Reduce load', value: 'reduce_load' },
  { label: 'Avoid movements', value: 'avoid_movement' },
  { label: 'Pause training', value: 'pause_training' },
];

const MOVEMENT_OPTIONS: readonly Option<UserLimitationMovementPattern>[] = [
  { label: 'Squat', value: 'squat' },
  { label: 'Hinge', value: 'hinge' },
  { label: 'Lunge', value: 'lunge' },
  { label: 'Horizontal push', value: 'horizontal_push' },
  { label: 'Vertical push', value: 'vertical_push' },
  { label: 'Horizontal pull', value: 'horizontal_pull' },
  { label: 'Vertical pull', value: 'vertical_pull' },
  { label: 'Carry', value: 'carry' },
  { label: 'Rotation', value: 'rotation' },
  { label: 'Locomotion', value: 'locomotion' },
  { label: 'Impact', value: 'impact' },
  { label: 'Overhead', value: 'overhead' },
  { label: 'Spinal flexion', value: 'spinal_flexion' },
  { label: 'Spinal extension', value: 'spinal_extension' },
  { label: 'Other', value: 'other' },
];

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

function ChoiceGrid<Value extends string>({
  label,
  helperText,
  options,
  value,
  onChange,
}: {
  label: string;
  helperText?: string;
  options: readonly Option<Value>[];
  value: Value | null;
  onChange(value: Value): void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={baseStyles.fieldGroup}>
      <Text style={[baseStyles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      {helperText ? (
        <Text style={[baseStyles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
      <View style={baseStyles.choiceGrid}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                baseStyles.choice,
                {
                  backgroundColor: selected ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
                pressed && baseStyles.pressed,
              ]}>
              <Text
                style={[
                  baseStyles.choiceLabel,
                  { color: selected ? colors.accent : colors.textPrimary },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MovementGrid({
  values,
  onChange,
}: {
  values: UserLimitationMovementPattern[];
  onChange(values: UserLimitationMovementPattern[]): void;
}) {
  const { colors } = useAppTheme();
  const selected = new Set(values);
  return (
    <View style={baseStyles.fieldGroup}>
      <Text style={[baseStyles.fieldLabel, { color: colors.textPrimary }]}>Movement patterns</Text>
      <Text style={[baseStyles.helperText, { color: colors.textMuted }]}>
        Required when “Avoid movements” is selected. Choose only patterns you explicitly want excluded.
      </Text>
      <View style={baseStyles.choiceGrid}>
        {MOVEMENT_OPTIONS.map((option) => {
          const checked = selected.has(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => {
                const next = new Set(selected);
                if (checked) next.delete(option.value);
                else next.add(option.value);
                onChange([...next]);
              }}
              style={({ pressed }) => [
                baseStyles.choice,
                {
                  backgroundColor: checked ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: checked ? colors.accent : colors.borderSubtle,
                },
                pressed && baseStyles.pressed,
              ]}>
              <Text
                style={[
                  baseStyles.choiceLabel,
                  { color: checked ? colors.accent : colors.textPrimary },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function UserLimitationScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ limitationId?: string }>();
  const app = useAppContext();
  const { error: syncError, pendingOperations, status: syncStatus, syncNow } = useWeightSync();
  const requestedId = typeof params.limitationId === 'string' ? params.limitationId : null;
  const existing = requestedId
    ? app.userLimitations.find((limitation) => limitation.id === requestedId) ?? null
    : null;
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserLimitationDraft>(emptyUserLimitationDraft);
  const [pendingSync, setPendingSync] = useState<PendingSync | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextLoadedId = requestedId ?? 'new';
    if (loadedId === nextLoadedId) return;
    if (requestedId && existing) {
      setDraft(draftFromUserLimitation(existing));
      setLoadedId(nextLoadedId);
    } else if (!requestedId) {
      setDraft(emptyUserLimitationDraft());
      setLoadedId(nextLoadedId);
    }
  }, [existing, loadedId, requestedId]);

  useEffect(() => {
    if (!pendingSync) return;
    const recordExists = app.userLimitations.some(
      (limitation) => limitation.id === pendingSync.id,
    );
    if (pendingSync.action === 'save' ? !recordExists : recordExists) return;

    let cancelled = false;
    void syncNow()
      .then(() => {
        if (!cancelled) {
          setSaveMessage(
            pendingSync.action === 'save'
              ? 'Limitation saved and synchronized.'
              : 'Limitation removed and synchronized.',
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaveMessage(
            pendingSync.action === 'save'
              ? 'Limitation saved locally. Sync will retry when available.'
              : 'Limitation removed locally. Sync will retry when available.',
          );
        }
      })
      .finally(() => {
        if (cancelled) return;
        const action = pendingSync.action;
        setPendingSync(null);
        if (action === 'delete') router.back();
      });

    return () => {
      cancelled = true;
    };
  }, [app.userLimitations, pendingSync, syncNow]);

  const updateDraft = <Key extends keyof UserLimitationDraft>(
    key: Key,
    value: UserLimitationDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setSaveMessage(null);
  };

  const saveLimitation = () => {
    if (app.isRestoringState || pendingSync) return;
    const id = existing?.id ?? createUuid();
    const result = buildUserLimitation({
      draft,
      id,
      now: new Date().toISOString(),
      existing,
    });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const nextState = upsertUserLimitationInState(toAppState(app), result.limitation);
    if (!nextState.userLimitations.some((limitation) => limitation.id === id)) {
      setFormError('The limitation did not pass local validation.');
      return;
    }

    app.replaceState(nextState);
    setPendingSync({ action: 'save', id });
    setDraft(draftFromUserLimitation(result.limitation));
    setLoadedId(id);
    setSaveMessage('Limitation saved locally.');
    if (!existing) {
      router.replace({
        pathname: '/profile/limitation',
        params: { limitationId: id },
      });
    }
  };

  const requestDelete = () => {
    if (!existing || pendingSync) return;
    Alert.alert(
      'Delete limitation?',
      'This removes the self-reported limitation from synchronized Safety & Recovery records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const nextState = deleteUserLimitationFromState(toAppState(app), existing.id);
            app.replaceState(nextState);
            setPendingSync({ action: 'delete', id: existing.id });
          },
        },
      ],
    );
  };

  if (requestedId && !existing && !app.isRestoringState) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && baseStyles.pressed]}>
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Limitation not found</Text>
        </View>
        <View style={styles.missingContent}>
          <AppCard>
            <Text style={styles.cardTitle}>This record is no longer available</Text>
            <Text style={styles.bodyText}>It may have been deleted or replaced during synchronization.</Text>
            <PrimaryButton label="Go back" onPress={() => router.back()} />
          </AppCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && baseStyles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={baseStyles.headerCopy}>
          <Text style={styles.title}>{existing ? 'Edit limitation' : 'Add limitation'}</Text>
          <Text style={styles.subtitle}>Explicit self-reported training restriction</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AppCard>
            <Text style={styles.cardTitle}>Current status</Text>
            <Text style={styles.bodyText}>
              {existing ? 'Editing a synchronized limitation.' : 'Creating a new limitation.'}
            </Text>
            <Text style={styles.metaText}>
              Sync: {syncStatus} · pending operations: {pendingOperations}
            </Text>
            {syncError ? <Text style={styles.warningText}>{syncError}</Text> : null}
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>Limitation details</Text>
            <Text style={styles.bodyText}>
              Select every field explicitly. The app does not infer restrictions from notes or diagnose
              the underlying cause.
            </Text>

            <ChoiceGrid
              label="Type"
              options={KIND_OPTIONS}
              value={draft.kind}
              onChange={(value) => updateDraft('kind', value)}
            />
            <ChoiceGrid
              label="Body region"
              options={BODY_REGION_OPTIONS}
              value={draft.bodyRegion}
              onChange={(value) => updateDraft('bodyRegion', value)}
            />
            <ChoiceGrid
              label="Side"
              options={SIDE_OPTIONS}
              value={draft.side}
              onChange={(value) => updateDraft('side', value)}
            />
            <ChoiceGrid
              label="Self-reported severity"
              helperText="This is a user label, not a clinical severity assessment."
              options={SEVERITY_OPTIONS}
              value={draft.severity}
              onChange={(value) => updateDraft('severity', value)}
            />
            <ChoiceGrid
              label="Status"
              options={STATUS_OPTIONS}
              value={draft.status}
              onChange={(value) => {
                updateDraft('status', value);
                if (value === 'active') updateDraft('resolvedDate', '');
              }}
            />
            <ChoiceGrid
              label="Training impact"
              helperText="This explicit choice is used by deterministic guardrails."
              options={IMPACT_OPTIONS}
              value={draft.trainingImpact}
              onChange={(value) => updateDraft('trainingImpact', value)}
            />

            <MovementGrid
              values={draft.movementPatterns}
              onChange={(values) => updateDraft('movementPatterns', values)}
            />

            <View style={baseStyles.fieldGroup}>
              <Text style={styles.fieldLabel}>Onset date</Text>
              <Text style={styles.metaText}>Optional · YYYY-MM-DD</Text>
              <TextInput
                accessibilityLabel="Onset date"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={(value) => updateDraft('onsetDate', value)}
                placeholder="2026-07-20"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={draft.onsetDate}
              />
            </View>

            {draft.status === 'resolved' ? (
              <View style={baseStyles.fieldGroup}>
                <Text style={styles.fieldLabel}>Resolved date</Text>
                <Text style={styles.metaText}>Required · YYYY-MM-DD</Text>
                <TextInput
                  accessibilityLabel="Resolved date"
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  onChangeText={(value) => updateDraft('resolvedDate', value)}
                  placeholder="2026-07-23"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={draft.resolvedDate}
                />
              </View>
            ) : null}

            <View style={baseStyles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <Text style={styles.metaText}>
                Optional · synchronized for your reference, but excluded from deterministic Coach
                interpretation.
              </Text>
              <TextInput
                accessibilityLabel="Limitation notes"
                maxLength={2_000}
                multiline
                onChangeText={(value) => updateDraft('notes', value)}
                placeholder="Optional self-reported context"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.notesInput]}
                textAlignVertical="top"
                value={draft.notes}
              />
              <Text style={styles.metaText}>{draft.notes.length} / 2,000</Text>
            </View>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            {saveMessage ? <Text style={styles.successText}>{saveMessage}</Text> : null}

            <PrimaryButton
              disabled={app.isRestoringState || Boolean(pendingSync)}
              label={existing ? 'Save limitation' : 'Add limitation'}
              loading={pendingSync?.action === 'save'}
              onPress={saveLimitation}
            />
            {existing ? (
              <SecondaryButton
                disabled={Boolean(pendingSync)}
                label="Delete limitation"
                onPress={requestDelete}
              />
            ) : null}
            <SecondaryButton
              label="Open Safety & Recovery review"
              onPress={() => router.push('/profile/safety-recovery')}
            />
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>Boundary</Text>
            <Text style={styles.bodyText}>
              This record is self-reported and is not a medical diagnosis or treatment instruction.
              Severe, sudden, or worsening symptoms require appropriate professional assessment.
            </Text>
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  choiceLabel: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
    textAlign: 'center',
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  fieldLabel: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  helperText: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  pressed: {
    opacity: 0.65,
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
    errorText: {
      color: colors.error,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    fieldLabel: {
      ...baseStyles.fieldLabel,
      color: colors.textPrimary,
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
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      minHeight: 46,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    missingContent: {
      padding: Spacing.three,
    },
    notesInput: {
      minHeight: 112,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
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
      flexShrink: 1,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
    warningText: {
      color: colors.warning,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
  });
