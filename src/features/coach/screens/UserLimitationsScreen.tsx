import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  deleteUserLimitationFromState,
  upsertUserLimitationInState,
} from '@/context/appContext/safetyRecoveryActions';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
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
  UserLimitationTrainingImpact,
} from '@/types';
import {
  buildUserLimitation,
  emptyUserLimitationDraft,
  type UserLimitationDraft,
} from '../userLimitationForm';

type Option<Value extends string> = {
  label: string;
  value: Value;
};

type PendingSyncAction =
  | { kind: 'upsert'; id: string }
  | { kind: 'delete'; id: string };

const kindOptions: readonly Option<UserLimitationKind>[] = [
  { label: 'Pain', value: 'pain' },
  { label: 'Injury', value: 'injury' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Restriction', value: 'medical_restriction' },
  { label: 'Other', value: 'other' },
];

const bodyRegionOptions: readonly Option<UserLimitationBodyRegion>[] = [
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

const sideOptions: readonly Option<UserLimitationSide>[] = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Both', value: 'bilateral' },
  { label: 'Midline', value: 'midline' },
  { label: 'N/A', value: 'not_applicable' },
];

const severityOptions: readonly Option<UserLimitationSeverity>[] = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

const impactOptions: readonly Option<UserLimitationTrainingImpact>[] = [
  { label: 'Monitor', value: 'monitor' },
  { label: 'Reduce load', value: 'reduce_load' },
  { label: 'Avoid movement', value: 'avoid_movement' },
  { label: 'Pause training', value: 'pause_training' },
];

const movementOptions: readonly Option<UserLimitationMovementPattern>[] = [
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

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

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
  accessibilityLabel,
  onChange,
  options,
  value,
}: {
  accessibilityLabel: string;
  onChange(value: Value): void;
  options: readonly Option<Value>[];
  value: Value;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.choiceGrid}>
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
  onChange(value: UserLimitationMovementPattern[]): void;
  value: UserLimitationMovementPattern[];
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

export default function UserLimitationsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const app = useAppContext();
  const { session } = useAuthSession();
  const { error: syncError, pendingOperations, status: syncStatus, syncNow } = useWeightSync();
  const [draft, setDraft] = useState<UserLimitationDraft>(emptyUserLimitationDraft);
  const [formVisible, setFormVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingSyncAction, setPendingSyncAction] = useState<PendingSyncAction | null>(null);
  const [openingReview, setOpeningReview] = useState(false);

  const activeLimitations = app.userLimitations.filter((item) => item.status === 'active');
  const authenticated = Boolean(session?.tokens.accessToken);

  useEffect(() => {
    if (!pendingSyncAction) return;
    const present = app.userLimitations.some((item) => item.id === pendingSyncAction.id);
    const stateReady = pendingSyncAction.kind === 'upsert' ? present : !present;
    if (!stateReady) return;

    let cancelled = false;
    void syncNow()
      .then(() => {
        if (!cancelled) {
          setMessage(
            authenticated
              ? 'Limitation saved and synchronized.'
              : 'Limitation saved locally. Sign in to synchronize it.',
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessage('Limitation saved locally. Synchronization will retry when available.');
        }
      })
      .finally(() => {
        if (!cancelled) setPendingSyncAction(null);
      });

    return () => {
      cancelled = true;
    };
  }, [app.userLimitations, authenticated, pendingSyncAction, syncNow]);

  const updateDraft = <Key extends keyof UserLimitationDraft>(
    key: Key,
    value: UserLimitationDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setMessage(null);
  };

  const saveLimitation = () => {
    if (app.isRestoringState || pendingSyncAction) return;
    const result = buildUserLimitation({
      draft,
      id: createUuid(),
      now: new Date().toISOString(),
    });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    app.replaceState(upsertUserLimitationInState(toAppState(app), result.limitation));
    setPendingSyncAction({ kind: 'upsert', id: result.limitation.id });
    setDraft(emptyUserLimitationDraft());
    setFormVisible(false);
    setFormError(null);
    setMessage('Limitation saved locally.');
  };

  const removeLimitation = (limitationId: string) => {
    Alert.alert(
      'Remove limitation?',
      'This removes the self-reported record and queues a revisioned deletion.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            app.replaceState(deleteUserLimitationFromState(toAppState(app), limitationId));
            setPendingSyncAction({ kind: 'delete', id: limitationId });
            setMessage('Limitation removed locally.');
          },
        },
      ],
    );
  };

  const syncAndOpenReview = async () => {
    if (openingReview) return;
    setOpeningReview(true);
    setFormError(null);
    try {
      await syncNow();
      router.push('/profile/safety-recovery');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Limitations could not be synchronized before review.',
      );
    } finally {
      setOpeningReview(false);
    }
  };

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
          <Text style={styles.title}>Training limitations</Text>
          <Text style={styles.subtitle}>Explicit self-reported restrictions</Text>
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
            <Text style={styles.cardTitle}>Current limitations</Text>
            <Text style={styles.bodyText}>
              These records describe only the restrictions you explicitly select. The app does not
              infer a diagnosis, read free-text medical notes, or change a workout automatically.
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{activeLimitations.length}</Text>
                <Text style={styles.metaText}>Active records</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{pendingOperations}</Text>
                <Text style={styles.metaText}>Pending sync operations</Text>
              </View>
            </View>

            {activeLimitations.length === 0 ? (
              <Text style={styles.emptyText}>No active limitation has been recorded.</Text>
            ) : (
              <View style={styles.listStack}>
                {activeLimitations.map((limitation) => (
                  <View key={limitation.id} style={styles.listRow}>
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle}>
                        {formatCode(limitation.bodyRegion)} · {formatCode(limitation.severity)}
                      </Text>
                      <Text style={styles.bodyText}>
                        {formatCode(limitation.kind)} · {formatCode(limitation.trainingImpact)}
                      </Text>
                      {limitation.movementPatterns.length > 0 ? (
                        <Text style={styles.metaText}>
                          Movements: {limitation.movementPatterns.map(formatCode).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityLabel={`Remove ${formatCode(limitation.bodyRegion)} limitation`}
                      accessibilityRole="button"
                      disabled={Boolean(pendingSyncAction)}
                      onPress={() => removeLimitation(limitation.id)}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                      <Text style={styles.removeLabel}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <SecondaryButton
              disabled={Boolean(pendingSyncAction)}
              label={formVisible ? 'Cancel new limitation' : 'Add limitation'}
              onPress={() => {
                setFormVisible((current) => !current);
                setFormError(null);
                setMessage(null);
              }}
            />
          </AppCard>

          {formVisible ? (
            <AppCard>
              <Text style={styles.cardTitle}>New limitation</Text>
              <Text style={styles.bodyText}>
                Choose only fields you intend the deterministic policy to enforce.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Type</Text>
                <ChoiceGrid
                  accessibilityLabel="Limitation type"
                  onChange={(value) => updateDraft('kind', value)}
                  options={kindOptions}
                  value={draft.kind}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Body region</Text>
                <ChoiceGrid
                  accessibilityLabel="Body region"
                  onChange={(value) => updateDraft('bodyRegion', value)}
                  options={bodyRegionOptions}
                  value={draft.bodyRegion}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Side</Text>
                <ChoiceGrid
                  accessibilityLabel="Limitation side"
                  onChange={(value) => updateDraft('side', value)}
                  options={sideOptions}
                  value={draft.side}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Severity</Text>
                <ChoiceGrid
                  accessibilityLabel="Limitation severity"
                  onChange={(value) => updateDraft('severity', value)}
                  options={severityOptions}
                  value={draft.severity}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Training impact</Text>
                <Text style={styles.helperText}>
                  Pause training is a hard block only when you explicitly choose it.
                </Text>
                <ChoiceGrid
                  accessibilityLabel="Training impact"
                  onChange={(value) => updateDraft('trainingImpact', value)}
                  options={impactOptions}
                  value={draft.trainingImpact}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Affected movements</Text>
                <Text style={styles.helperText}>
                  Required for Avoid movement. No movement restriction is inferred from body region.
                </Text>
                <MovementGrid
                  onChange={(value) => updateDraft('movementPatterns', value)}
                  value={draft.movementPatterns}
                />
              </View>

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
              <PrimaryButton
                disabled={Boolean(pendingSyncAction)}
                label="Save limitation"
                onPress={saveLimitation}
              />
            </AppCard>
          ) : null}

          {message ? (
            <AppCard style={styles.successCard}>
              <Text style={styles.successText}>{message}</Text>
            </AppCard>
          ) : null}

          {syncError ? (
            <AppCard style={styles.errorCard}>
              <Text style={styles.errorTitle}>Sync error</Text>
              <Text style={styles.bodyText}>{syncError}</Text>
            </AppCard>
          ) : null}

          <AppCard>
            <Text style={styles.cardTitle}>Deterministic review</Text>
            <Text style={styles.bodyText}>
              Synchronize the typed records, then open the existing Safety & Recovery review.
              Automatic application remains disabled.
            </Text>
            <PrimaryButton
              label={authenticated ? 'Sync & open review' : 'Open review and sign in'}
              loading={openingReview}
              onPress={() => void syncAndOpenReview()}
            />
            <Text style={styles.disclaimer}>Current sync status: {syncStatus}</Text>
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
    choice: {
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flexGrow: 1,
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
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '700',
      lineHeight: Typography.caption.lineHeight,
      textAlign: 'center',
    },
    choiceLabelSelected: {
      color: colors.accent,
    },
    choiceSelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
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
    emptyText: {
      color: colors.textMuted,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    errorCard: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    errorTitle: {
      color: colors.error,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
    },
    fieldGroup: {
      gap: Spacing.one,
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
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    helperText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    listCopy: {
      flex: 1,
      minWidth: 0,
    },
    listRow: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    listStack: {
      gap: Spacing.two,
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
      flex: 1,
      gap: 2,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
    },
    pressed: {
      opacity: 0.7,
    },
    removeButton: {
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    removeLabel: {
      color: colors.error,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
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
    successCard: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    successText: {
      color: colors.success,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });
