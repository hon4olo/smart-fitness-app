import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { attachWorkoutsToProgramDraft } from '@/features/workouts/programEditorModel';
import { getWorkoutProgramById } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { Workout } from '@/types';

export default function NewRoutineRoute() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addWorkoutTemplate, exercises, saveTrainingProgram, trainingPrograms, workouts } = useAppContext();
  const program = useMemo(
    () => (programId ? getWorkoutProgramById(programId, workouts, trainingPrograms) : null),
    [programId, trainingPrograms, workouts],
  );
  const [title, setTitle] = useState(`My routine #${workouts.filter((workout) => workout.isCustom).length + 1}`);
  const [notes, setNotes] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  const selectedExercises = useMemo(
    () => selectedExerciseIds.map((id) => exercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise)),
    [exercises, selectedExerciseIds],
  );
  const canSave = Boolean(program && title.trim().length > 0);

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((current) => (current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]));
  };

  const saveRoutine = () => {
    if (!program || !canSave) {
      return;
    }

    const now = new Date().toISOString();
    const workoutId = `workout-${Date.now()}`;
    const exerciseNames = selectedExercises.map((exercise) => exercise.name);
    const description = notes.trim() || undefined;
    addWorkoutTemplate({
      id: workoutId,
      title: title.trim(),
      description,
      exercises: exerciseNames,
      createdAt: now,
    });

    const syntheticWorkout: Workout = {
      id: workoutId,
      title: title.trim(),
      description,
      duration: `${Math.max(15, exerciseNames.length * 10)} min`,
      exercises: selectedExercises.map((exercise) => ({ ...exercise })),
      createdAt: now,
      isCustom: true,
    };

    saveTrainingProgram(attachWorkoutsToProgramDraft(program, [...workouts, syntheticWorkout], [workoutId]));
    router.replace({ pathname: '/workouts/program/[programId]', params: { programId: program.id } });
  };

  if (!program) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Text style={styles.emptyTitle}>Program not found</Text>
        <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
          <Text style={styles.textButtonLabel}>Back to Workouts</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <Text style={styles.navButtonLabel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Routine</Text>
        <Pressable disabled={!canSave} onPress={saveRoutine} style={({ pressed }) => [styles.navButton, !canSave && styles.disabled, pressed && canSave && styles.pressed]}>
          <Text style={styles.navButtonLabel}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + Spacing.six }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setTitle}
            placeholder="Routine name"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.titleInput}
            value={title}
          />
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Notes..."
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.notesInput}
            value={notes}
          />

          {selectedExercises.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No Exercises Added</Text>
              <Text style={styles.emptyText}>Tap the button below to start adding exercises to your workout.</Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {selectedExercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <Text numberOfLines={1} style={styles.exerciseTitle}>
                    {exercise.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.exerciseMeta}>
                    {exercise.muscleGroup ?? exercise.category ?? 'Exercise'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Pressable onPress={() => setExercisePickerOpen(true)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonLabel}>{selectedExercises.length > 0 ? 'Edit exercises' : 'Add exercises'}</Text>
            <View style={styles.addButtonDivider} />
            <Text style={styles.addButtonIcon}>✦</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={exercisePickerOpen} onRequestClose={() => setExercisePickerOpen(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Add exercises</Text>
              <Pressable onPress={() => setExercisePickerOpen(false)} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
                <Text style={styles.textButtonLabel}>Done</Text>
              </Pressable>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
              {exercises.slice(0, 80).map((exercise) => {
                const selected = selectedExerciseIds.includes(exercise.id);
                return (
                  <Pressable key={exercise.id} onPress={() => toggleExercise(exercise.id)} style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}>
                    <View style={styles.pickerRowCopy}>
                      <Text numberOfLines={1} style={styles.pickerRowTitle}>
                        {exercise.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.pickerRowMeta}>
                        {exercise.muscleGroup ?? exercise.category ?? 'Exercise'}
                      </Text>
                    </View>
                    <Text style={styles.check}>{selected ? '✓' : ''}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: '#0A8DFF',
      borderCurve: 'continuous',
      borderRadius: 999,
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: 78,
      overflow: 'hidden',
    },
    addButtonDivider: {
      backgroundColor: 'rgba(255,255,255,0.65)',
      height: 78,
      marginLeft: 'auto',
      width: StyleSheet.hairlineWidth,
    },
    addButtonIcon: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '900',
      textAlign: 'center',
      width: 78,
    },
    addButtonLabel: {
      color: '#FFFFFF',
      flex: 1,
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.three,
    },
    check: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '900',
      width: 24,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.six,
    },
    disabled: {
      opacity: 0.35,
    },
    emptyBlock: {
      alignItems: 'center',
      gap: Spacing.three,
      paddingHorizontal: Spacing.five,
      paddingVertical: Spacing.eight,
    },
    emptyText: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 28,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 28,
      textAlign: 'center',
    },
    exerciseList: {
      gap: Spacing.two,
      paddingVertical: Spacing.five,
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 3,
    },
    exerciseRow: {
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      padding: Spacing.three,
    },
    exerciseTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '900',
    },
    header: {
      alignItems: 'center',
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    navButton: {
      minWidth: 72,
      paddingVertical: Spacing.two,
    },
    navButtonLabel: {
      color: '#0A8DFF',
      fontSize: 17,
      fontWeight: '600',
    },
    notesInput: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 28,
      minHeight: 46,
      paddingVertical: Spacing.one,
    },
    pickerHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: Spacing.three,
    },
    pickerOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    pickerPanel: {
      backgroundColor: colors.surfacePrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '78%',
      padding: Spacing.three,
    },
    pickerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 64,
    },
    pickerRowCopy: {
      flex: 1,
      minWidth: 0,
    },
    pickerRowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 3,
    },
    pickerRowTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
    },
    pickerTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    textButton: {
      paddingVertical: Spacing.two,
    },
    textButtonLabel: {
      color: '#0A8DFF',
      fontSize: 16,
      fontWeight: '800',
    },
    titleInput: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      lineHeight: 36,
      paddingVertical: Spacing.one,
    },
  });
