import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, hydrateActiveWorkoutSessionDraft, markActiveWorkoutSessionCompleted, markActiveWorkoutSessionFinishing } from '@/lib/workouts';
import { buildCompletedWorkoutSessionSnapshotFromDraft, getWorkoutSessionCompletedSetCount } from '@/features/workouts/sessionScreenModel';
import { openAppleHealthIntegration } from '@/features/workouts/integrations/appleHealth';
import { openStravaIntegration } from '@/features/workouts/integrations/strava';
import { openWorkoutMediaIntegration } from '@/features/workouts/integrations/workoutMedia';
import { shareWorkoutSummary } from '@/features/workouts/integrations/shareWorkout';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

const formatDurationLabel = (startedAt: string, finishedAt = new Date().toISOString()) => {
  const elapsedMs = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDateTimeLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export default function WorkoutSessionFinishScreen() {
  const { workoutSessions, isRestoringState, saveWorkoutSession } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const draft = getActiveWorkoutSessionDraft();
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [updateTemplate, setUpdateTemplate] = useState(false);
  const [stravaEnabled, setStravaEnabled] = useState(false);
  const [appleHealthEnabled, setAppleHealthEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedFinishedAt, setSavedFinishedAt] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<ReturnType<typeof buildCompletedWorkoutSessionSnapshotFromDraft> | null>(null);
  const saveGuard = useRef(false);

  useEffect(() => {
    if (draft) {
      setTitle(draft.workoutTitle);
    }
  }, [draft]);

  useEffect(() => {
    if (isRestoringState) {
      return;
    }

    if (!draft && !saved) {
      clearActiveWorkoutSessionDraft();
      router.replace('/workouts');
    }
  }, [draft, isRestoringState, saved]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingLabel}>Loading workout…</Text>
        </View>
      </View>
    );
  }

  if (!draft && !saved) {
    return null;
  }

  const workoutStartedAt = saved ? savedSnapshot?.startedAt ?? new Date().toISOString() : draft!.startedAt;
  const workoutTitle = saved ? savedSnapshot?.workoutTitle ?? '' : title;
  const completedSetCount = saved ? savedSnapshot?.sets.length ?? 0 : getWorkoutSessionCompletedSetCount(draft);
  const dateTimeLabel = formatDateTimeLabel(workoutStartedAt);
  const durationLabel = formatDurationLabel(workoutStartedAt, savedFinishedAt ?? undefined);
  const workoutNumber = workoutSessions.length + (saved ? 0 : 1);

  const handleSave = () => {
    if (!draft || completedSetCount === 0 || saveGuard.current) {
      return;
    }

    saveGuard.current = true;
    const finishedAt = new Date().toISOString();
    const completedSnapshot = buildCompletedWorkoutSessionSnapshotFromDraft(
      {
        ...draft,
        workoutTitle: title.trim() || draft.workoutTitle,
      },
      {
        finishedAt,
        notes,
      },
    );

    setSavedSnapshot(completedSnapshot);
    setSavedFinishedAt(finishedAt);
    markActiveWorkoutSessionFinishing();
    saveWorkoutSession(completedSnapshot);
    clearActiveWorkoutSessionDraft();
    markActiveWorkoutSessionCompleted();
    setSaved(true);
  };

  const discardWorkout = () => {
    Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard workout',
        style: 'destructive',
        onPress: () => {
          clearActiveWorkoutSessionDraft();
          router.replace('/workouts');
        },
      },
    ]);
  };

  if (saved && savedSnapshot) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.savedShell, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.savedTopRow}>
            <View>
              <Text style={styles.savedTitle}>Great work!</Text>
              <Text style={styles.savedSubtitle}>Workout saved</Text>
            </View>
            <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Text style={styles.closeButtonLabel}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Workout #{workoutNumber}</Text>
            <Text selectable style={styles.resultWorkout}>{savedSnapshot.workoutTitle}</Text>
            <View style={styles.metricRow}>
              <Metric label="Duration" value={durationLabel} />
              <Metric label="Sets" value={String(savedSnapshot.sets.length)} />
            </View>
            <View style={styles.metricRow}>
              <Metric label="Date & time" value={dateTimeLabel} />
              <Metric label="Template" value={updateTemplate ? 'Updated' : 'Saved'} />
            </View>
          </View>

          <View style={styles.savedActions}>
            <Pressable onPress={() => shareWorkoutSummary(savedSnapshot.workoutTitle, savedSnapshot.sets.length, durationLabel)} style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}>
              <Text style={styles.shareButtonLabel}>Share</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.primaryCloseButton, pressed && styles.pressed]}>
              <Text style={styles.primaryCloseButtonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>Resume</Text>
            </Pressable>
            <Text style={styles.title}>Finish Workout</Text>
          </View>

          <View style={styles.card}>
            <Field label="Workout name">
              <TextInput
                placeholder="Workout title"
                placeholderTextColor={colors.textSecondary}
                selectionColor={colors.accent}
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
              />
            </Field>
            <Field label="Date & time">
              <Text selectable style={styles.fieldValue}>{dateTimeLabel}</Text>
            </Field>
            <Field label="Duration">
              <Text selectable style={styles.fieldValue}>{durationLabel}</Text>
            </Field>
            <Field label="Photo / video">
              <Pressable onPress={openWorkoutMediaIntegration} style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}>
                <Text style={styles.inlineButtonLabel}>Add photo or video</Text>
              </Pressable>
            </Field>
            <Field label="Workout title field">
              <Text style={styles.helperText}>Rename before saving if needed.</Text>
            </Field>
            <Field label="Update Workout Template">
              <Switch value={updateTemplate} onValueChange={setUpdateTemplate} trackColor={{ false: colors.surfaceSecondary, true: colors.accent }} thumbColor={colors.background} />
            </Field>
            <Field label="Integrations">
              <View style={styles.integrationRow}>
                <Pressable onPress={() => {
                  setStravaEnabled((value) => !value);
                  openStravaIntegration();
                }} style={({ pressed }) => [styles.toggleChip, stravaEnabled && styles.toggleChipActive, pressed && styles.pressed]}>
                  <Text style={styles.toggleChipLabel}>Strava</Text>
                </Pressable>
                <Pressable onPress={() => {
                  setAppleHealthEnabled((value) => !value);
                  openAppleHealthIntegration();
                }} style={({ pressed }) => [styles.toggleChip, appleHealthEnabled && styles.toggleChipActive, pressed && styles.pressed]}>
                  <Text style={styles.toggleChipLabel}>Apple Health</Text>
                </Pressable>
              </View>
            </Field>
            <Field label="Notes">
              <TextInput
                multiline
                placeholder="Optional notes"
                placeholderTextColor={colors.textSecondary}
                selectionColor={colors.accent}
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
              />
            </Field>
          </View>

          <Pressable onPress={discardWorkout} style={({ pressed }) => [styles.discardButton, pressed && styles.pressed]}>
            <Text style={styles.discardLabel}>Discard Workout</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <Pressable disabled={completedSetCount === 0} onPress={handleSave} style={({ pressed }) => [styles.saveButton, completedSetCount === 0 && styles.saveButtonDisabled, pressed && completedSetCount > 0 && styles.pressed]}>
            <Text style={[styles.saveButtonLabel, completedSetCount === 0 && styles.saveButtonLabelDisabled]}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createFieldStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createMetricStyles(colors), [colors]);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text selectable style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const createFieldStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    field: {
      gap: 8,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
  });

const createMetricStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    metric: {
      flex: 1,
      gap: 4,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
  });

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    closeButtonLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    discardButton: {
      alignSelf: 'center',
      marginTop: Spacing.two,
      paddingVertical: Spacing.one,
    },
    discardLabel: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '800',
    },
    fieldValue: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    inlineButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    inlineButtonLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    integrationRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      width: '100%',
    },
    metricRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    notesInput: {
      color: colors.textPrimary,
      minHeight: 96,
      textAlignVertical: 'top',
    },
    primaryCloseButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      minHeight: 52,
      justifyContent: 'center',
    },
    primaryCloseButtonLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
    resultCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      padding: Spacing.three,
      width: '100%',
    },
    resultLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    resultWorkout: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 24,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      minHeight: 52,
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.surfaceSecondary,
    },
    saveButtonLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    saveButtonLabelDisabled: {
      color: colors.textMuted,
    },
    savedActions: {
      gap: Spacing.two,
      width: '100%',
    },
    savedShell: {
      alignItems: 'center',
      flex: 1,
      gap: Spacing.three,
      paddingHorizontal: Spacing.three,
    },
    savedTitle: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    savedSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    savedTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    shareButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 18,
      minHeight: 52,
      justifyContent: 'center',
    },
    shareButtonLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
    },
    textAction: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    textActionLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
    textInput: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      minHeight: 44,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    toggleChip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    toggleChipActive: {
      borderColor: colors.accent,
      borderWidth: StyleSheet.hairlineWidth,
    },
    toggleChipLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
  });
