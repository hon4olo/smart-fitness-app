import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, markActiveWorkoutSessionCompleted, markActiveWorkoutSessionFinishing } from '@/lib/workouts';
import { buildCompletedWorkoutSessionSnapshotFromDraft, getWorkoutSessionCompletedSetCount } from '@/features/workouts/sessionScreenModel';
import { useAppTheme } from '@/theme/AppThemeProvider';

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
  const { saveWorkoutSession, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const draft = getActiveWorkoutSessionDraft();
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedFinishedAt, setSavedFinishedAt] = useState<string | null>(null);
  const [savedStartedAt, setSavedStartedAt] = useState<string | null>(null);
  const [savedWorkoutTitle, setSavedWorkoutTitle] = useState('');
  const [savedCompletedSetCount, setSavedCompletedSetCount] = useState(0);

  useEffect(() => {
    if (isRestoringState) {
      return;
    }

    if (!draft && !saved) {
      clearActiveWorkoutSessionDraft();
      router.replace('/workouts');
    }
  }, [draft, isRestoringState]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>
            Loading workout…
          </Text>
        </View>
      </View>
    );
  }

  if (!draft && !saved) {
    return null;
  }

  const completedSetCount = draft ? getWorkoutSessionCompletedSetCount(draft) : 0;
  const workoutStartedAt = saved ? savedStartedAt ?? new Date().toISOString() : draft!.startedAt;
  const workoutTitle = saved ? savedWorkoutTitle : draft!.workoutTitle;
  const dateTimeLabel = formatDateTimeLabel(workoutStartedAt);

  const handleSave = () => {
    if (!draft || saved || completedSetCount === 0) {
      return;
    }

    const finishedAt = new Date().toISOString();
    const completedSnapshot = buildCompletedWorkoutSessionSnapshotFromDraft(draft, {
      finishedAt,
      notes,
    });

    setSavedStartedAt(draft.startedAt);
    setSavedWorkoutTitle(draft.workoutTitle);
    setSavedCompletedSetCount(completedSetCount);
    setSavedFinishedAt(finishedAt);
    setSaved(true);
    markActiveWorkoutSessionFinishing();
    saveWorkoutSession(completedSnapshot);
    clearActiveWorkoutSessionDraft();
    markActiveWorkoutSessionCompleted();
  };

  if (saved) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.savedShell, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.savedCard}>
            <Text selectable style={styles.savedTitle}>
              Workout saved
            </Text>
            <Text selectable style={styles.savedName}>
              {savedWorkoutTitle}
            </Text>
            <Text selectable style={styles.savedMeta}>
              {formatDurationLabel(workoutStartedAt, savedFinishedAt ?? undefined)} · {savedCompletedSetCount} set{savedCompletedSetCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.savedActions}>
            <AppButton label="Back to Workouts" onPress={() => router.replace('/workouts')} />
            <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}>
              <Text style={styles.textActionLabel}>Home</Text>
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>‹</Text>
            </Pressable>
            <Text selectable style={styles.title}>
              Finish Workout
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Workout</Text>
              <Text selectable style={styles.summaryValue}>
                {workoutTitle}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date &amp; time</Text>
              <Text selectable style={styles.summaryValue}>
                {dateTimeLabel}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text selectable style={styles.summaryValue}>
                {formatDurationLabel(workoutStartedAt, savedFinishedAt ?? undefined)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Completed sets</Text>
              <Text selectable style={styles.summaryValue}>
                {savedCompletedSetCount || completedSetCount}
              </Text>
            </View>
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes</Text>
            <TextInput
              multiline
              placeholder="Optional notes"
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.accent}
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton disabled={completedSetCount === 0} label="Save" onPress={handleSave} />
          <Pressable
            accessibilityRole="button"
            onPress={() =>
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
              ])
            }
            style={({ pressed }) => [styles.discardAction, pressed && styles.textActionPressed]}>
            <Text style={styles.discardLabel}>Discard workout</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.three,
      gap: Spacing.two,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
      gap: Spacing.three,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    discardAction: {
      alignSelf: 'center',
      marginTop: Spacing.two,
      paddingVertical: Spacing.one,
    },
    discardLabel: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '800',
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
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
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
      gap: Spacing.two,
      padding: Spacing.three,
    },
    notesCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.three,
      gap: Spacing.two,
    },
    notesInput: {
      color: colors.textPrimary,
      fontSize: 14,
      minHeight: 96,
      textAlignVertical: 'top',
    },
    notesLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    savedActions: {
      gap: Spacing.two,
      width: '100%',
    },
    savedCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.three,
      gap: Spacing.one,
      width: '100%',
    },
    savedMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    savedName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    savedShell: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.three,
    },
    savedTitle: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      width: 96,
    },
    summaryRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    summaryValue: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'right',
    },
    textAction: {
      alignSelf: 'center',
      paddingVertical: Spacing.one,
    },
    textActionLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
    },
    textActionPressed: {
      opacity: 0.72,
    },
    title: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 32,
    },
  });
