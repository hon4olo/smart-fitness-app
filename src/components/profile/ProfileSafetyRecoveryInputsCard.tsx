import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  deleteRecoveryCheckInFromState,
  deleteUserLimitationFromState,
  upsertRecoveryCheckInInState,
  upsertUserLimitationInState,
} from '@/context/appContext/safetyRecoveryActions';
import { useWeightSync } from '@/context/SyncContext';
import {
  createRecoveryCheckInFromForm,
  createUserLimitationFromForm,
} from '@/features/coach/safetyRecoveryInputForm';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createUuid } from '@/lib/ids';
import type {
  AppContextType,
  AppState,
  RecoveryScaleOneToFive,
  RecoveryScaleZeroToFive,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationTrainingImpact,
} from '@/types';

type Option<Value extends string | number> = {
  label: string;
  value: Value;
};

type ChoiceGridProps<Value extends string | number> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: readonly Option<Value>[];
  value: Value;
};

const limitationKindOptions = [
  { label: 'Pain', value: 'pain' as const },
  { label: 'Injury', value: 'injury' as const },
  { label: 'Mobility', value: 'mobility' as const },
  { label: 'Restriction', value: 'medical_restriction' as const },
  { label: 'Other', value: 'other' as const },
];

const bodyRegionOptions = [
  { label: 'Shoulder', value: 'shoulder' as const },
  { label: 'Lower back', value: 'lower_back' as const },
  { label: 'Hip', value: 'hip' as const },
  { label: 'Knee', value: 'knee' as const },
  { label: 'Ankle/foot', value: 'ankle_foot' as const },
  { label: 'Elbow', value: 'elbow' as const },
  { label: 'Wrist/hand', value: 'wrist_hand' as const },
  { label: 'Neck', value: 'neck' as const },
  { label: 'Other', value: 'other' as const },
];

const sideOptions = [
  { label: 'Left', value: 'left' as const },
  { label: 'Right', value: 'right' as const },
  { label: 'Both', value: 'bilateral' as const },
  { label: 'Midline', value: 'midline' as const },
  { label: 'N/A', value: 'not_applicable' as const },
];

const severityOptions = [
  { label: 'Mild', value: 'mild' as const },
  { label: 'Moderate', value: 'moderate' as const },
  { label: 'Severe', value: 'severe' as const },
];

const impactOptions = [
  { label: 'Monitor', value: 'monitor' as const },
  { label: 'Reduce load', value: 'reduce_load' as const },
  { label: 'Avoid movement', value: 'avoid_movement' as const },
  { label: 'Pause training', value: 'pause_training' as const },
];

const movementOptions = [
  { label: 'Squat', value: 'squat' as const },
  { label: 'Hinge', value: 'hinge' as const },
  { label: 'Lunge', value: 'lunge' as const },
  { label: 'Horizontal push', value: 'horizontal_push' as const },
  { label: 'Vertical push', value: 'vertical_push' as const },
  { label: 'Horizontal pull', value: 'horizontal_pull' as const },
  { label: 'Vertical pull', value: 'vertical_pull' as const },
  { label: 'Overhead', value: 'overhead' as const },
  { label: 'Carry', value: 'carry' as const },
  { label: 'Rotation', value: 'rotation' as const },
  { label: 'Impact', value: 'impact' as const },
  { label: 'Locomotion', value: 'locomotion' as const },
];

const oneToFiveOptions = [1, 2, 3, 4, 5].map((value) => ({
  label: String(value),
  value: value as RecoveryScaleOneToFive,
}));

const zeroToFiveOptions = [0, 1, 2, 3, 4, 5].map((value) => ({
  label: String(value),
  value: value as RecoveryScaleZeroToFive,
}));

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const appStateFromContext = (app: AppContextType): AppState => ({
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

function ChoiceGrid<Value extends string | number>({
  accessibilityLabel,
  onChange,
  options,
  value,
}: ChoiceGridProps<Value>) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.choiceGrid}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.choice,
              selected && styles.choiceSelected,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MovementGrid({
  onChange,
  value,
}: {
  onChange: (value: UserLimitationMovementPattern[]) => void;
  value: UserLimitationMovementPattern[];
}) {
  return (
    <View accessibilityLabel="Affected movement patterns" style={styles.choiceGrid}>
      {movementOptions.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() =>
              onChange(
                selected
                  ? value.filter((item) => item !== option.value)
                  : [...value, option.value],
              )
            }
            style={({ pressed }) => [
              styles.choice,
              selected && styles.choiceSelected,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProfileSafetyRecoveryInputsCard() {
  const app = useAppContext();
  const { error: syncError, status: syncStatus, syncNow } = useWeightSync();
  const { session } = useAuthSession();
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showLimitationForm, setShowLimitationForm] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  const [fatigue, setFatigue] = useState<RecoveryScaleOneToFive>(3);
  const [soreness, setSoreness] = useState<RecoveryScaleZeroToFive>(2);
  const [readiness, setReadiness] = useState<RecoveryScaleOneToFive>(3);
  const [limitationKind, setLimitationKind] = useState<UserLimitationKind>('pain');
  const [bodyRegion, setBodyRegion] = useState<UserLimitationBodyRegion>('shoulder');
  const [side, setSide] = useState<UserLimitationSide>('not_applicable');
  const [severity, setSeverity] = useState<UserLimitationSeverity>('mild');
  const [trainingImpact, setTrainingImpact] =
    useState<UserLimitationTrainingImpact>('monitor');
  const [movementPatterns, setMovementPatterns] =
    useState<UserLimitationMovementPattern[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const activeLimitations = app.userLimitations.filter((item) => item.status === 'active');
  const latestCheckIn = app.recoveryCheckIns[0] ?? null;
  const authenticated = Boolean(session?.tokens.accessToken);

  const saveCheckIn = () => {
    const result = createRecoveryCheckInFromForm({
      id: createUuid(),
      now: new Date().toISOString(),
      form: {
        sleepDurationHours: sleepHours,
        fatigue,
        soreness,
        readiness,
      },
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    app.replaceState(
      upsertRecoveryCheckInInState(appStateFromContext(app), result.value),
    );
    setSleepHours('');
    setShowCheckInForm(false);
    setFormError(null);
    setNotice('Recovery check-in saved locally. Sync before running the review.');
  };

  const saveLimitation = () => {
    const result = createUserLimitationFromForm({
      id: createUuid(),
      now: new Date().toISOString(),
      form: {
        kind: limitationKind,
        bodyRegion,
        side,
        severity,
        trainingImpact,
        movementPatterns,
      },
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    app.replaceState(
      upsertUserLimitationInState(appStateFromContext(app), result.value),
    );
    setMovementPatterns([]);
    setTrainingImpact('monitor');
    setShowLimitationForm(false);
    setFormError(null);
    setNotice('Limitation saved locally. Only explicit typed fields affect review.');
  };

  const removeLimitation = (limitationId: string) => {
    Alert.alert('Remove limitation?', 'The deletion will be revisioned on the next sync.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          app.replaceState(
            deleteUserLimitationFromState(appStateFromContext(app), limitationId),
          ),
      },
    ]);
  };

  const removeCheckIn = (checkInId: string) => {
    Alert.alert('Remove recovery check-in?', 'The deletion will be revisioned on sync.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          app.replaceState(
            deleteRecoveryCheckInFromState(appStateFromContext(app), checkInId),
          ),
      },
    ]);
  };

  const syncAndOpenReview = async () => {
    if (!authenticated) {
      router.push('/auth/sign-in');
      return;
    }
    if (syncing) return;
    setSyncing(true);
    setFormError(null);
    try {
      await syncNow();
      router.push('/profile/safety-recovery');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Safety inputs could not be synchronized.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppCard>
      <Text style={styles.title}>Safety inputs</Text>
      <Text style={styles.bodyText}>
        Add self-reported recovery signals and explicit training limitations. These records are not a
        diagnosis and are never converted into an automatic workout change.
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{activeLimitations.length}</Text>
          <Text style={styles.metaText}>Active limitations</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{latestCheckIn ? 'Yes' : 'No'}</Text>
          <Text style={styles.metaText}>Recovery check-in</Text>
        </View>
      </View>

      {latestCheckIn ? (
        <View style={styles.listRow}>
          <View style={styles.flexCopy}>
            <Text style={styles.rowTitle}>Latest check-in</Text>
            <Text style={styles.metaText}>
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(latestCheckIn.recordedAt))}
              {' · '}fatigue {latestCheckIn.fatigue ?? '—'} · readiness{' '}
              {latestCheckIn.readiness ?? '—'}
            </Text>
          </View>
          <Pressable onPress={() => removeCheckIn(latestCheckIn.id)} style={styles.removeButton}>
            <Text style={styles.removeLabel}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      {activeLimitations.map((limitation) => (
        <View key={limitation.id} style={styles.listRow}>
          <View style={styles.flexCopy}>
            <Text style={styles.rowTitle}>
              {formatCode(limitation.bodyRegion)} · {formatCode(limitation.severity)}
            </Text>
            <Text style={styles.metaText}>
              {formatCode(limitation.trainingImpact)}
              {limitation.movementPatterns.length > 0
                ? ` · ${limitation.movementPatterns.map(formatCode).join(', ')}`
                : ''}
            </Text>
          </View>
          <Pressable onPress={() => removeLimitation(limitation.id)} style={styles.removeButton}>
            <Text style={styles.removeLabel}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.buttonStack}>
        <SecondaryButton
          label={showCheckInForm ? 'Cancel check-in' : 'Add recovery check-in'}
          onPress={() => {
            setShowCheckInForm((current) => !current);
            setFormError(null);
          }}
        />
        <SecondaryButton
          label={showLimitationForm ? 'Cancel limitation' : 'Add limitation'}
          onPress={() => {
            setShowLimitationForm((current) => !current);
            setFormError(null);
          }}
        />
      </View>

      {showCheckInForm ? (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Recovery check-in</Text>
          <FormField
            helperText="Optional · hours from 0 to 24"
            keyboardType="decimal-pad"
            label="Sleep duration"
            onChangeText={setSleepHours}
            placeholder="7.5"
            value={sleepHours}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Fatigue · 1 low, 5 high</Text>
            <ChoiceGrid
              accessibilityLabel="Fatigue"
              onChange={setFatigue}
              options={oneToFiveOptions}
              value={fatigue}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Soreness · 0 none, 5 high</Text>
            <ChoiceGrid
              accessibilityLabel="Soreness"
              onChange={setSoreness}
              options={zeroToFiveOptions}
              value={soreness}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Readiness · 1 low, 5 high</Text>
            <ChoiceGrid
              accessibilityLabel="Readiness"
              onChange={setReadiness}
              options={oneToFiveOptions}
              value={readiness}
            />
          </View>
          <PrimaryButton label="Save check-in" onPress={saveCheckIn} />
        </View>
      ) : null}

      {showLimitationForm ? (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Self-reported limitation</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type</Text>
            <ChoiceGrid
              accessibilityLabel="Limitation type"
              onChange={setLimitationKind}
              options={limitationKindOptions}
              value={limitationKind}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Body region</Text>
            <ChoiceGrid
              accessibilityLabel="Body region"
              onChange={setBodyRegion}
              options={bodyRegionOptions}
              value={bodyRegion}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Side</Text>
            <ChoiceGrid
              accessibilityLabel="Side"
              onChange={setSide}
              options={sideOptions}
              value={side}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Severity</Text>
            <ChoiceGrid
              accessibilityLabel="Severity"
              onChange={setSeverity}
              options={severityOptions}
              value={severity}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Training impact</Text>
            <ChoiceGrid
              accessibilityLabel="Training impact"
              onChange={setTrainingImpact}
              options={impactOptions}
              value={trainingImpact}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Affected movements</Text>
            <Text style={styles.disclaimer}>
              Required for Avoid movement. Select only patterns you explicitly want restricted.
            </Text>
            <MovementGrid onChange={setMovementPatterns} value={movementPatterns} />
          </View>
          <PrimaryButton label="Save limitation" onPress={saveLimitation} />
        </View>
      ) : null}

      {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}

      <View style={styles.reviewSection}>
        <PrimaryButton
          label={authenticated ? 'Sync inputs & open review' : 'Sign in to review'}
          loading={syncing}
          onPress={() => void syncAndOpenReview()}
        />
        <Text style={styles.disclaimer}>
          {authenticated
            ? `Current sync status: ${syncStatus}. The review reads only server-synchronized typed fields.`
            : 'Local records can be entered offline. Sign in before protected synchronization and review.'}
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  buttonStack: {
    gap: Spacing.two,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  choiceLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'center',
  },
  choiceLabelSelected: {
    color: Colors.dark.textPrimary,
  },
  choiceSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
  },
  disclaimer: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  flexCopy: {
    flex: 1,
    minWidth: 0,
  },
  formSection: {
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  listRow: {
    alignItems: 'center',
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  metaText: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metricCell: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  noticeText: {
    color: Colors.dark.success,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  pressed: {
    opacity: 0.72,
  },
  removeButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  removeLabel: {
    color: Colors.dark.error,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  reviewSection: {
    gap: Spacing.one,
  },
  rowTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
