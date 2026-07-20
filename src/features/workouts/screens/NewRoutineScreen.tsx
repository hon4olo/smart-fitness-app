import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { attachWorkoutsToProgramDraft } from '@/features/workouts/programEditorModel';
import { formatWorkoutPlanDescription, getWorkoutProgramById } from '@/lib/workouts';
import { createStyles } from '@/features/workouts/styles/newRoutineScreenStyles';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { Exercise, Workout } from '@/types';

type RoutinePlanExercise = {
  exercise: Exercise;
  notes: string;
  restSeconds: number;
  targetReps: number;
  targetSets: number;
};

type PickerMode =
  | { type: 'add' }
  | { type: 'replace'; exerciseId: string };

const getExerciseSubtitle = (exercise: Exercise) => exercise.muscleGroup ?? exercise.category ?? exercise.primaryMuscles?.[0] ?? 'Exercise';

export function NewRoutineScreen() {
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
  const [planExercises, setPlanExercises] = useState<RoutinePlanExercise[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [exerciseMenu, setExerciseMenu] = useState<RoutinePlanExercise | null>(null);

  const canSave = Boolean(program && title.trim().length > 0);
  const selectedExerciseIds = useMemo(() => new Set(planExercises.map((item) => item.exercise.id)), [planExercises]);

  const addExercise = (exercise: Exercise) => {
    setPlanExercises((current) => {
      if (current.some((item) => item.exercise.id === exercise.id)) {
        return current;
      }

      return [
        ...current,
        {
          exercise,
          notes: '',
          restSeconds: 90,
          targetReps: 8,
          targetSets: 3,
        },
      ];
    });
    setExpandedExerciseId(exercise.id);
  };

  const replaceExercise = (targetExerciseId: string, replacement: Exercise) => {
    setPlanExercises((current) =>
      current.map((item) =>
        item.exercise.id === targetExerciseId
          ? {
              ...item,
              exercise: replacement,
            }
          : item,
      ),
    );
    setExpandedExerciseId(replacement.id);
  };

  const updatePlanExercise = (exerciseId: string, patch: Partial<Omit<RoutinePlanExercise, 'exercise'>>) => {
    setPlanExercises((current) => current.map((item) => (item.exercise.id === exerciseId ? { ...item, ...patch } : item)));
  };

  const deleteExercise = (exerciseId: string) => {
    setPlanExercises((current) => current.filter((item) => item.exercise.id !== exerciseId));
    setExpandedExerciseId((current) => (current === exerciseId ? null : current));
    setExerciseMenu(null);
  };

  const saveRoutine = () => {
    if (!program || !canSave) {
      return;
    }

    const now = new Date().toISOString();
    const workoutId = `workout-${Date.now()}`;
    const exerciseNames = planExercises.map((item) => item.exercise.name);
    const description = formatWorkoutPlanDescription(
      notes,
      planExercises.map((item) => ({
        name: item.exercise.name,
        notes: item.notes.trim() || undefined,
        restSeconds: item.restSeconds,
        targetReps: item.targetReps,
        targetSets: item.targetSets,
      })),
    );
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
      exercises: planExercises.map((item) => ({ ...item.exercise })),
      createdAt: now,
      isCustom: true,
    };

    saveTrainingProgram(attachWorkoutsToProgramDraft(program, [...workouts, syntheticWorkout], [workoutId]));
    router.replace({ pathname: '/workouts/program/[programId]', params: { programId: program.id, savedWorkout: '1' } });
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

          {planExercises.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No Exercises Added</Text>
              <Text style={styles.emptyText}>Tap the button below to start adding exercises to your workout.</Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {planExercises.map((item) => {
                const expanded = expandedExerciseId === item.exercise.id;

                return (
                  <View key={item.exercise.id} style={styles.exerciseBlock}>
                    <Pressable
                      onPress={() => setExpandedExerciseId(expanded ? null : item.exercise.id)}
                      style={({ pressed }) => [styles.exerciseHeaderRow, pressed && styles.pressed]}>
                      <View style={styles.exerciseThumb}>
                        <Text style={styles.exerciseThumbLabel}>{item.exercise.name.slice(0, 1).toUpperCase()}</Text>
                        <Text style={styles.exerciseHelp}>?</Text>
                      </View>
                      <View style={styles.exerciseCopy}>
                        <Text numberOfLines={1} style={styles.exerciseTitle}>
                          {item.exercise.name}
                        </Text>
                        {!expanded ? (
                          Array.from({ length: item.targetSets }, (_, index) => (
                            <Text key={`${item.exercise.id}-${index}`} numberOfLines={1} style={styles.collapsedSetLine}>
                              {index + 1}   - kg  ·  - Reps
                            </Text>
                          ))
                        ) : null}
                      </View>
                      <Pressable
                        hitSlop={12}
                        onPress={() => setExerciseMenu(item)}
                        style={({ pressed }) => [styles.exerciseMenuButton, pressed && styles.pressed]}>
                        <Text style={styles.exerciseMenuLabel}>•••</Text>
                      </Pressable>
                    </Pressable>

                    {expanded ? (
                      <View style={styles.expandedPanel}>
                        <TextInput
                          multiline
                          onChangeText={(value) => updatePlanExercise(item.exercise.id, { notes: value })}
                          placeholder="Notes..."
                          placeholderTextColor={colors.textMuted}
                          selectionColor={colors.accent}
                          style={styles.exerciseNotesInput}
                          value={item.notes}
                        />
                        <Text style={styles.restTimer}>⏱ Rest Timer: Off</Text>
                        <View style={styles.planTableHeader}>
                          <Text style={[styles.tableHeaderText, styles.colSet]}>Set</Text>
                          <Text style={[styles.tableHeaderText, styles.colPrevious]}>Previous</Text>
                          <Text style={[styles.tableHeaderText, styles.colWeight]}>kg</Text>
                          <Text style={[styles.tableHeaderText, styles.colReps]}>Reps</Text>
                        </View>
                        {Array.from({ length: item.targetSets }, (_, index) => (
                          <View key={`${item.exercise.id}-row-${index}`} style={styles.planSetRow}>
                            <Text style={[styles.planSetText, styles.colSet]}>{index + 1}</Text>
                            <Text style={[styles.planPrevious, styles.colPrevious]}>{index === 0 ? '—' : `${item.targetReps} reps`}</Text>
                            <TextInput
                              keyboardType="decimal-pad"
                              placeholder=""
                              selectionColor={colors.accent}
                              style={[styles.planInput, styles.colWeight]}
                            />
                            <TextInput
                              keyboardType="number-pad"
                              onChangeText={(value) => updatePlanExercise(item.exercise.id, { targetReps: Number.parseInt(value, 10) || 8 })}
                              placeholder=""
                              selectionColor={colors.accent}
                              style={[styles.planInput, styles.colReps]}
                            />
                          </View>
                        ))}
                        <Pressable
                          onPress={() => updatePlanExercise(item.exercise.id, { targetSets: item.targetSets + 1 })}
                          style={({ pressed }) => [styles.addSetButton, pressed && styles.pressed]}>
                          <Text style={styles.addSetLabel}>+ Add set</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <Pressable onPress={() => setPickerMode({ type: 'add' })} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonLabel}>Add exercises</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={Boolean(pickerMode)} onRequestClose={() => setPickerMode(null)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerMode?.type === 'replace' ? 'Replace exercise' : 'Add exercises'}</Text>
              <Pressable onPress={() => setPickerMode(null)} style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
                <Text style={styles.textButtonLabel}>Done</Text>
              </Pressable>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
              {exercises.slice(0, 100).map((exercise) => {
                const selected = selectedExerciseIds.has(exercise.id);
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      if (pickerMode?.type === 'replace') {
                        replaceExercise(pickerMode.exerciseId, exercise);
                        setPickerMode(null);
                        return;
                      }

                      addExercise(exercise);
                    }}
                    style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}>
                    <View style={styles.pickerRowCopy}>
                      <Text numberOfLines={1} style={styles.pickerRowTitle}>
                        {exercise.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.pickerRowMeta}>
                        {getExerciseSubtitle(exercise)}
                      </Text>
                    </View>
                    <Text style={styles.check}>{selected && pickerMode?.type === 'add' ? '✓' : ''}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={Boolean(exerciseMenu)} onRequestClose={() => setExerciseMenu(null)}>
        <Pressable onPress={() => setExerciseMenu(null)} style={[styles.menuOverlay, { paddingBottom: insets.bottom + Spacing.three }]}>
          <Pressable onPress={() => undefined} style={styles.menuPanel}>
            <Text style={styles.menuTitle}>{exerciseMenu?.exercise.name}</Text>
            <Pressable
              onPress={() => {
                if (!exerciseMenu) {
                  return;
                }

                setPickerMode({ type: 'replace', exerciseId: exerciseMenu.exercise.id });
                setExerciseMenu(null);
              }}
              style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
              <Text style={styles.menuActionLabel}>Replace exercise</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!exerciseMenu) {
                  return;
                }

                Alert.alert('Delete exercise?', 'This removes it from this routine.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete exercise', style: 'destructive', onPress: () => deleteExercise(exerciseMenu.exercise.id) },
                ]);
              }}
              style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}>
              <Text style={[styles.menuActionLabel, styles.deleteLabel]}>Delete exercise</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
