import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { buildCompletedWorkoutSessionSnapshot } from '@/lib/workouts';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, markActiveWorkoutSessionCompleted, markActiveWorkoutSessionFinishing } from '@/features/workouts/sessionService';
import { FinishWorkoutActions } from '@/features/workouts/components/finish/FinishWorkoutActions';
import { FinishWorkoutNotes } from '@/features/workouts/components/finish/FinishWorkoutNotes';
import { FinishWorkoutSummary } from '@/features/workouts/components/finish/FinishWorkoutSummary';
import { WorkoutSavedSummary } from '@/features/workouts/components/finish/WorkoutSavedSummary';
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

export default function WorkoutSessionFinishRoute() {
  const { saveWorkoutSession, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const draft = getActiveWorkoutSessionDraft();
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [completedSession, setCompletedSession] = useState<ReturnType<typeof buildCompletedWorkoutSessionSnapshot> | null>(null);

  const sessionToRender = completedSession ?? draft;

  useEffect(() => {
    if (isRestoringState) {
      return;
    }

    if (!sessionToRender) {
      clearActiveWorkoutSessionDraft();
      router.replace('/workouts');
    }
  }, [clearActiveWorkoutSessionDraft, isRestoringState, sessionToRender]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>Loading workout…</Text>
        </View>
      </View>
    );
  }

  if (!sessionToRender) {
    return null;
  }

  const workoutName = sessionToRender.workoutTitle;
  const dateTimeLabel = formatDateTimeLabel(sessionToRender.startedAt);
  const durationLabel = formatDurationLabel(sessionToRender.startedAt, completedSession?.finishedAt ?? new Date().toISOString());
  const completedSets = sessionToRender.sets.filter((set) => set.completed !== false);

  const handleSave = () => {
    if (saved) {
      return;
    }

    if (completedSets.length === 0) {
      Alert.alert('Add at least one set', 'You need at least one completed set before saving.');
      return;
    }

    const completedSnapshot = {
      ...buildCompletedWorkoutSessionSnapshot(sessionToRender, {
        notes,
        finishedAt: new Date().toISOString(),
      }),
      sets: completedSets,
    };

    markActiveWorkoutSessionFinishing();
    saveWorkoutSession(completedSnapshot);
    setCompletedSession(completedSnapshot);
    setSaved(true);
    clearActiveWorkoutSessionDraft();
    markActiveWorkoutSessionCompleted();
  };

  if (saved) {
    return (
      <WorkoutSavedSummary
        dateTimeLabel={dateTimeLabel}
        durationLabel={durationLabel}
        notes={notes}
        onBackToWorkouts={() => router.replace('/workouts')}
        onHome={() => router.replace('/')}
        setCount={completedSets.length}
        workoutName={workoutName}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five + 112 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.textActionPressed]}>
                <Text style={styles.backButtonLabel}>‹</Text>
              </Pressable>
              <Text selectable style={styles.title}>Finish Workout</Text>
            </View>

            <FinishWorkoutSummary dateTimeLabel={dateTimeLabel} durationLabel={durationLabel} workoutName={workoutName} />
            <FinishWorkoutNotes notes={notes} onChangeNotes={setNotes} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <FinishWorkoutActions
            disabled={completedSets.length === 0}
            onDiscard={() => Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard Workout', style: 'destructive', onPress: () => { clearActiveWorkoutSessionDraft(); router.replace('/workouts'); } }])}
            onSave={handleSave}
          />
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
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    backButtonLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
    },
    emptyState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    fill: {
      flex: 1,
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
    headerRow: {
      alignItems: 'center',
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    message: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: Spacing.three,
    },
    screen: {
      flex: 1,
    },
    textAction: {
      alignSelf: 'flex-start',
      paddingVertical: Spacing.one,
    },
    textActionLabel: {
      color: colors.textPrimary,
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
