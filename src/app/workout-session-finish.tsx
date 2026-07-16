import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';

const formatDurationLabel = (startedAt: string, finishedAt = new Date().toISOString()) => {
  const elapsedMs = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
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
  const { saveWorkoutSession } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const draft = getActiveWorkoutSessionDraft();
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  if (!draft) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text selectable style={styles.title}>
            Finish Workout
          </Text>
          <Text selectable style={styles.message}>
            No active workout was found.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}>
            <Text style={styles.textActionLabel}>Back to Workouts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const workoutName = draft.workoutTitle;
  const dateTimeLabel = formatDateTimeLabel(draft.startedAt);
  const durationLabel = formatDurationLabel(draft.startedAt);
  const completedSets = draft.sets.filter((set) => set.completed !== false);

  const handleSave = () => {
    if (saved) {
      return;
    }

    if (completedSets.length === 0) {
      Alert.alert('Add at least one set', 'You need at least one completed set before saving.');
      return;
    }

    saveWorkoutSession({
      id: draft.id,
      workoutId: draft.workoutId,
      workoutTitle: workoutName,
      startedAt: draft.startedAt,
      finishedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
      sets: completedSets,
    });
    clearActiveWorkoutSessionDraft();
    setSaved(true);
  };

  if (saved) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.savedState}>
          <Text selectable style={styles.savedTitle}>
            Workout saved
          </Text>
          <Text selectable style={styles.savedWorkoutName}>
            {workoutName}
          </Text>
          <Text selectable style={styles.savedMeta}>
            {dateTimeLabel} · {durationLabel} · {completedSets.length} set{completedSets.length === 1 ? '' : 's'}
          </Text>
          {notes.trim() ? <Text selectable style={styles.savedNotes}>{notes.trim()}</Text> : null}
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.three + 84 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.textActionPressed]}>
              <Text style={styles.backButtonLabel}>‹</Text>
            </Pressable>
            <Text selectable style={styles.title}>
              Finish Workout
            </Text>
          </View>

          <View style={styles.block}>
            <Text selectable style={styles.label}>
              Workout
            </Text>
            <Text selectable style={styles.value}>
              {workoutName}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text selectable style={styles.label}>
                Date & time
              </Text>
              <Text selectable style={styles.value}>
                {dateTimeLabel}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text selectable style={styles.label}>
                Duration
              </Text>
              <Text selectable style={styles.value}>
                {durationLabel}
              </Text>
            </View>
          </View>

          <View style={styles.block}>
            <Text selectable style={styles.label}>
              Notes
            </Text>
            <TextInput
              multiline
              placeholder="Optional notes"
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.accent}
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
            />
          </View>

          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard Workout', style: 'destructive', onPress: () => { clearActiveWorkoutSessionDraft(); router.replace('/workouts'); } }])} style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}>
            <Text style={styles.discardLabel}>Discard workout</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton label="Save" onPress={handleSave} />
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
    block: {
      gap: Spacing.two,
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
    discardLabel: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '800',
    },
    emptyState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
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
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    message: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: Spacing.three,
    },
    metaCell: {
      flex: 1,
      gap: 4,
    },
    metaRow: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    notesInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 96,
      paddingHorizontal: Spacing.three,
      paddingVertical: 12,
      textAlignVertical: 'top',
    },
    savedActions: {
      gap: Spacing.one,
      marginTop: Spacing.two,
    },
    savedMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    savedNotes: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
    },
    savedState: {
      gap: Spacing.one,
      padding: Spacing.three,
    },
    savedTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    savedWorkoutName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
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
    value: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 21,
    },
  });
