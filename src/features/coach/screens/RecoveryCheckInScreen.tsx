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
import { upsertRecoveryCheckInInState } from '@/context/appContext/safetyRecoveryActions';
import { createUuid } from '@/lib/ids';
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

const formatTimestamp = (value: string): string => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

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

function ScorePicker<T extends number>({
  label,
  helperText,
  options,
  value,
  onChange,
}: {
  label: string;
  helperText: string;
  options: readonly T[];
  value: T | null;
  onChange(value: T | null): void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldCopy}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label}`}
          disabled={value === null}
          onPress={() => onChange(null)}>
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
              accessibilityRole="radio"
              accessibilityLabel={`${label} ${option}`}
              accessibilityState={{ checked: selected }}
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
                  styles.scoreButtonLabel,
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

export default function RecoveryCheckInScreen() {
  const { colors } = useAppTheme();
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
        if (!cancelled) {
          setSaveMessage('Recovery check-in saved and synchronized.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaveMessage('Recovery check-in saved locally. Sync will retry when available.');
        }
      })
      .finally(() => {
        if (!cancelled) setPendingSyncId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [app.recoveryCheckIns, pendingSyncId, syncNow]);

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
      setFormError(result.message);
      return;
    }

    const nextState = upsertRecoveryCheckInInState(toAppState(app), result.checkIn);
    if (!nextState.recoveryCheckIns.some((checkIn) => checkIn.id === result.checkIn.id)) {
      setFormError('The recovery check-in did not pass local validation.');
      return;
    }

    app.replaceState(nextState);
    setPendingSyncId(result.checkIn.id);
    setDraft(emptyRecoveryCheckInDraft());
    setSaveMessage(`Saved ${result.signalCount} recovery signals locally.`);
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
        <View style={styles.fieldCopy}>
          <Text style={themedStyles.title}>Recovery check-in</Text>
          <Text style={themedStyles.subtitle}>Self-reported signals for deterministic review</Text>
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
            <Text style={themedStyles.cardTitle}>Current status</Text>
            <Text style={themedStyles.bodyText}>
              Latest saved check-in:{' '}
              {latestCheckIn ? formatTimestamp(latestCheckIn.recordedAt) : 'none'}
            </Text>
            <Text style={themedStyles.metaText}>
              Sync: {syncStatus} · pending operations: {pendingOperations}
            </Text>
            {syncError ? (
              <Text style={[themedStyles.metaText, { color: colors.warning }]}>
                {syncError}
              </Text>
            ) : null}
          </AppCard>

          <AppCard>
            <Text style={themedStyles.cardTitle}>Today’s signals</Text>
            <Text style={themedStyles.bodyText}>
              Add at least two fields. Higher fatigue, soreness, stress, and pain interference mean
              more disruption. Higher sleep quality and readiness mean better recovery.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={themedStyles.fieldLabel}>Sleep duration</Text>
              <Text style={themedStyles.metaText}>Hours from 0 to 24</Text>
              <TextInput
                accessibilityLabel="Sleep duration in hours"
                keyboardType="decimal-pad"
                onChangeText={(value) => updateDraft('sleepDurationHours', value)}
                placeholder="7.5"
                placeholderTextColor={colors.textMuted}
                style={themedStyles.input}
                value={draft.sleepDurationHours}
              />
            </View>

            <ScorePicker
              helperText="1 = very poor · 5 = very good"
              label="Sleep quality"
              onChange={(value) => updateDraft('sleepQuality', value)}
              options={ONE_TO_FIVE}
              value={draft.sleepQuality}
            />
            <ScorePicker
              helperText="1 = low · 5 = maximum"
              label="Fatigue"
              onChange={(value) => updateDraft('fatigue', value)}
              options={ONE_TO_FIVE}
              value={draft.fatigue}
            />
            <ScorePicker
              helperText="0 = none · 5 = maximum"
              label="Soreness"
              onChange={(value) => updateDraft('soreness', value)}
              options={ZERO_TO_FIVE}
              value={draft.soreness}
            />
            <ScorePicker
              helperText="1 = low · 5 = maximum"
              label="Stress"
              onChange={(value) => updateDraft('stress', value)}
              options={ONE_TO_FIVE}
              value={draft.stress}
            />
            <ScorePicker
              helperText="0 = none · 5 = maximum"
              label="Pain interference"
              onChange={(value) => updateDraft('painInterference', value)}
              options={ZERO_TO_FIVE}
              value={draft.painInterference}
            />
            <ScorePicker
              helperText="1 = very low · 5 = very high"
              label="Readiness"
              onChange={(value) => updateDraft('readiness', value)}
              options={ONE_TO_FIVE}
              value={draft.readiness}
            />

            <Text style={themedStyles.metaText}>
              Selected signals: {selectedSignalCount} / 7
            </Text>
            {formError ? <Text style={themedStyles.errorText}>{formError}</Text> : null}
            {saveMessage ? (
              <Text style={[themedStyles.metaText, { color: colors.success }]}>{saveMessage}</Text>
            ) : null}

            <PrimaryButton
              disabled={app.isRestoringState || Boolean(pendingSyncId)}
              label="Save recovery check-in"
              loading={Boolean(pendingSyncId)}
              onPress={saveCheckIn}
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
              These are self-reported inputs, not a diagnosis. The review cannot automatically apply
              workout changes. Free-text medical notes are not collected on this screen.
            </Text>
          </AppCard>
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
  fieldCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  fieldHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
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
  pressed: {
    opacity: 0.68,
  },
  scoreButton: {
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  scoreButtonLabel: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: '800',
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: Spacing.one,
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
