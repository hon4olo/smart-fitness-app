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
  UserLimitation,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationTrainingImpact,
} from '@/types';
import {
  buildActiveUserLimitation,
  emptyUserLimitationDraft,
  transitionUserLimitationStatus,
  type UserLimitationDraft,
} from '../userLimitationForm';

type Option<Value extends string> = {
  label: string;
  value: Value;
};

type PendingChange = {
  id: string;
  operation: 'upsert' | 'delete';
};

const KIND_OPTIONS: readonly Option<UserLimitationKind>[] = [
  { label: 'Injury', value: 'injury' },
  { label: 'Pain', value: 'pain' },
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
  { label: 'Both', value: 'bilateral' },
  { label: 'Midline', value: 'midline' },
  { label: 'N/A', value: 'not_applicable' },
];

const SEVERITY_OPTIONS: readonly Option<UserLimitationSeverity>[] = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

const IMPACT_OPTIONS: readonly Option<UserLimitationTrainingImpact>[] = [
  { label: 'Monitor', value: 'monitor' },
  { label: 'Reduce load', value: 'reduce_load' },
  { label: 'Avoid movement', value: 'avoid_movement' },
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

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

function ChoiceGrid<Value extends string>({
  label,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label: string;
  options: readonly Option<Value>[];
  value: Value | null;
  onChange(value: Value): void;
  columns?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View accessibilityLabel={label} style={styles.choiceGrid}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.choice,
                { flexBasis: `${100 / columns - 2}%` },
                {
                  backgroundColor: selected ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.choiceLabel,
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
  onToggle,
}: {
  values: UserLimitationMovementPattern[];
  onToggle(value: UserLimitationMovementPattern): void;
}) {
  const { colors } = useAppTheme();
  const selected = new Set(values);
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Movement patterns</Text>
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        Required for “Avoid movement”. Optional context for other impacts.
      </Text>
      <View style={styles.choiceGrid}>
        {MOVEMENT_OPTIONS.map((option) => {
          const active = selected.has(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [
                styles.movementChoice,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: active ? colors.accent : colors.borderSubtle,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.movementLabel,
                  { color: active ? colors.accent : colors.textSecondary },
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

function LimitationRow({
  limitation,
  disabled,
  onDelete,
  onStatusChange,
}: {
  limitation: UserLimitation;
  disabled: boolean;
  onDelete(): void;
  onStatusChange(): void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.limitationRow, { borderColor: colors.borderSubtle }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {formatCode(limitation.bodyRegion)} · {formatCode(limitation.side)}
          </Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            {formatCode(limitation.kind)} · {formatCode(limitation.severity)} ·{' '}
            {formatCode(limitation.trainingImpact)}
          </Text>
        </View>
        <Text
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                limitation.status === 'active' ? colors.warningSoft : colors.successSoft,
              color: limitation.status === 'active' ? colors.warning : colors.success,
            },
          ]}>
          {limitation.status.toUpperCase()}
        </Text>
      </View>
      {limitation.movementPatterns.length > 0 ? (
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          Movements: {limitation.movementPatterns.map(formatCode).join(', ')}
        </Text>
      ) : null}
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        Onset: {limitation.onsetDate ?? 'not specified'}
        {limitation.resolvedDate ? ` · resolved ${limitation.resolvedDate}` : ''}
      </Text>
      <View style={styles.rowActions}>
        <SecondaryButton
          disabled={disabled}
          label={limitation.status === 'active' ? 'Mark resolved' : 'Reactivate'}
          onPress={onStatusChange}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { borderColor: colors.error },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}>
          <Text style={[styles.deleteLabel, { color: colors.error }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function UserLimitationScreen() {
  const { colors } = useAppTheme();
  const themedStyles = useMemo(() => createStyles(colors), [colors]);
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
    app.replaceState(nextState);
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
    app.replaceState(upsertUserLimitationInState(toAppState(app), result.limitation));
    setPendingChange({ id: limitation.id, operation: 'upsert' });
    setMessage('Limitation status updated locally.');
  };

  const deleteLimitation = (limitation: UserLimitation) => {
    if (pendingChange) return;
    app.replaceState(deleteUserLimitationFromState(toAppState(app), limitation.id));
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

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  choiceLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  deleteLabel: {
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  fieldLabel: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  helperText: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  limitationRow: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  listStack: {
    gap: Spacing.three,
  },
  movementChoice: {
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  movementLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    lineHeight: Typography.caption.lineHeight,
  },
  pressed: {
    opacity: 0.68,
  },
  rowActions: {
    gap: Spacing.two,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowTitle: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
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
    errorText: {
      color: colors.error,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
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
