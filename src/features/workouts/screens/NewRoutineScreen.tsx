import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  RoutineExerciseMenuModal,
  RoutineExercisePickerModal,
  type RoutinePickerMode,
} from '@/features/workouts/components/NewRoutineModals';
import { attachWorkoutsToProgramDraft } from '@/features/workouts/programEditorModel';
import { createStyles } from '@/features/workouts/styles/newRoutineScreenStyles';
import { formatWorkoutPlanDescription, getWorkoutProgramById } from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { getProgramRoutineCopy } from '@/localization/programRoutineCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { Exercise, Workout } from '@/types';
import { useUnitPreferences } from '@/units';

type RoutinePlanExercise = {
  exercise: Exercise;
  notes: string;
  restSeconds: number;
  targetReps: number;
  targetSets: number;
};

export function NewRoutineScreen() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { colors } = useAppTheme();
  const { formatNumber, locale } = useLocalization();
  const copy = getProgramRoutineCopy(locale);
  const { weight } = useUnitPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    addWorkoutTemplate,
    exercises,
    saveTrainingProgram,
    trainingPrograms,
    workouts,
  } = useAppContext();
  const program = useMemo(
    () => (programId ? getWorkoutProgramById(programId, workouts, trainingPrograms) : null),
    [programId, trainingPrograms, workouts],
  );
  const nextRoutineNumber = workouts.filter((workout) => workout.isCustom).length + 1;
  const [title, setTitle] = useState(
    copy.defaultRoutineTitle(
      formatNumber(nextRoutineNumber, { maximumFractionDigits: 0 }),
    ),
  );
  const [notes, setNotes] = useState('');
  const [planExercises, setPlanExercises] = useState<RoutinePlanExercise[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<RoutinePickerMode | null>(null);
  const [exerciseMenu, setExerciseMenu] = useState<Exercise | null>(null);

  const canSave = Boolean(program && title.trim().length > 0);
  const selectedExerciseIds = useMemo(
    () => new Set(planExercises.map((item) => item.exercise.id)),
    [planExercises],
  );

  const addExercise = (exercise: Exercise) => {
    setPlanExercises((current) => {
      if (current.some((item) => item.exercise.id === exercise.id)) return current;
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
          ? { ...item, exercise: replacement }
          : item,
      ),
    );
    setExpandedExerciseId(replacement.id);
  };

  const updatePlanExercise = (
    exerciseId: string,
    patch: Partial<Omit<RoutinePlanExercise, 'exercise'>>,
  ) => {
    setPlanExercises((current) =>
      current.map((item) =>
        item.exercise.id === exerciseId ? { ...item, ...patch } : item,
      ),
    );
  };

  const deleteExercise = (exerciseId: string) => {
    setPlanExercises((current) =>
      current.filter((item) => item.exercise.id !== exerciseId),
    );
    setExpandedExerciseId((current) => (current === exerciseId ? null : current));
    setExerciseMenu(null);
  };

  const saveRoutine = () => {
    if (!program || !canSave) return;

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

    saveTrainingProgram(
      attachWorkoutsToProgramDraft(program, [...workouts, syntheticWorkout], [workoutId]),
    );
    router.replace({
      pathname: '/workouts/program/[programId]',
      params: { programId: program.id, savedWorkout: '1' },
    });
  };

  if (!program) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Text style={styles.emptyTitle}>{copy.programNotFound}</Text>
        <Pressable
          accessibilityLabel={copy.backToWorkouts}
          accessibilityRole="button"
          onPress={() => router.replace('/workouts')}
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
          <Text style={styles.textButtonLabel}>{copy.backToWorkouts}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel={copy.cancel}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <Text style={styles.navButtonLabel}>{copy.cancel}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{copy.newRoutine}</Text>
        <Pressable
          accessibilityLabel={copy.save}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={saveRoutine}
          style={({ pressed }) => [
            styles.navButton,
            !canSave && styles.disabled,
            pressed && canSave && styles.pressed,
          ]}>
          <Text style={styles.navButtonLabel}>{copy.save}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.six },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <TextInput
            accessibilityLabel={copy.routineName}
            autoCapitalize="words"
            onChangeText={setTitle}
            placeholder={copy.routineName}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.titleInput}
            value={title}
          />
          <TextInput
            accessibilityLabel={copy.routineNotes}
            multiline
            onChangeText={setNotes}
            placeholder={copy.routineNotes}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.notesInput}
            value={notes}
          />

          {planExercises.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>{copy.noExercises}</Text>
              <Text style={styles.emptyText}>{copy.noExercisesBody}</Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {planExercises.map((item) => {
                const expanded = expandedExerciseId === item.exercise.id;
                return (
                  <View key={item.exercise.id} style={styles.exerciseBlock}>
                    <Pressable
                      accessibilityLabel={
                        expanded
                          ? copy.collapseExercise(item.exercise.name)
                          : copy.expandExercise(item.exercise.name)
                      }
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      onPress={() =>
                        setExpandedExerciseId(expanded ? null : item.exercise.id)
                      }
                      style={({ pressed }) => [
                        styles.exerciseHeaderRow,
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.exerciseThumb}>
                        <Text style={styles.exerciseThumbLabel}>
                          {item.exercise.name.slice(0, 1).toUpperCase()}
                        </Text>
                        <Text style={styles.exerciseHelp}>?</Text>
                      </View>
                      <View style={styles.exerciseCopy}>
                        <Text numberOfLines={1} style={styles.exerciseTitle}>
                          {item.exercise.name}
                        </Text>
                        {!expanded
                          ? Array.from({ length: item.targetSets }, (_, index) => (
                              <Text
                                key={`${item.exercise.id}-${index}`}
                                numberOfLines={1}
                                style={styles.collapsedSetLine}>
                                {copy.emptySetLine(
                                  formatNumber(index + 1, { maximumFractionDigits: 0 }),
                                  weight,
                                )}
                              </Text>
                            ))
                          : null}
                      </View>
                      <Pressable
                        accessibilityLabel={copy.exerciseOptions(item.exercise.name)}
                        accessibilityRole="button"
                        hitSlop={12}
                        onPress={() => setExerciseMenu(item.exercise)}
                        style={({ pressed }) => [
                          styles.exerciseMenuButton,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={styles.exerciseMenuLabel}>•••</Text>
                      </Pressable>
                    </Pressable>

                    {expanded ? (
                      <View style={styles.expandedPanel}>
                        <TextInput
                          accessibilityLabel={copy.exerciseNotes}
                          multiline
                          onChangeText={(value) =>
                            updatePlanExercise(item.exercise.id, { notes: value })
                          }
                          placeholder={copy.exerciseNotes}
                          placeholderTextColor={colors.textMuted}
                          selectionColor={colors.accent}
                          style={styles.exerciseNotesInput}
                          value={item.notes}
                        />
                        <Text style={styles.restTimer}>{copy.restTimerOff}</Text>
                        <View style={styles.planTableHeader}>
                          <Text style={[styles.tableHeaderText, styles.colSet]}>
                            {copy.set}
                          </Text>
                          <Text style={[styles.tableHeaderText, styles.colPrevious]}>
                            {copy.previous}
                          </Text>
                          <Text style={[styles.tableHeaderText, styles.colWeight]}>
                            {weight}
                          </Text>
                          <Text style={[styles.tableHeaderText, styles.colReps]}>
                            {copy.repsHeader}
                          </Text>
                        </View>
                        {Array.from({ length: item.targetSets }, (_, index) => (
                          <View
                            key={`${item.exercise.id}-row-${index}`}
                            style={styles.planSetRow}>
                            <Text style={[styles.planSetText, styles.colSet]}>
                              {formatNumber(index + 1, { maximumFractionDigits: 0 })}
                            </Text>
                            <Text style={[styles.planPrevious, styles.colPrevious]}>
                              {index === 0
                                ? '—'
                                : copy.reps(
                                    item.targetReps,
                                    formatNumber(item.targetReps, {
                                      maximumFractionDigits: 0,
                                    }),
                                  )}
                            </Text>
                            <TextInput
                              accessibilityLabel={`${item.exercise.name} ${weight}`}
                              keyboardType="decimal-pad"
                              selectionColor={colors.accent}
                              style={[styles.planInput, styles.colWeight]}
                            />
                            <TextInput
                              accessibilityLabel={`${item.exercise.name} ${copy.repsHeader}`}
                              keyboardType="number-pad"
                              onChangeText={(value) =>
                                updatePlanExercise(item.exercise.id, {
                                  targetReps: Number.parseInt(value, 10) || 8,
                                })
                              }
                              selectionColor={colors.accent}
                              style={[styles.planInput, styles.colReps]}
                            />
                          </View>
                        ))}
                        <Pressable
                          accessibilityLabel={copy.addSetForExercise(item.exercise.name)}
                          accessibilityRole="button"
                          onPress={() =>
                            updatePlanExercise(item.exercise.id, {
                              targetSets: item.targetSets + 1,
                            })
                          }
                          style={({ pressed }) => [
                            styles.addSetButton,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.addSetLabel}>{copy.addSet}</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            accessibilityLabel={copy.addExercises}
            accessibilityRole="button"
            onPress={() => setPickerMode({ type: 'add' })}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonLabel}>{copy.addExercises}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <RoutineExercisePickerModal
        copy={copy}
        exercises={exercises}
        mode={pickerMode}
        onAdd={addExercise}
        onClose={() => setPickerMode(null)}
        onReplace={replaceExercise}
        selectedExerciseIds={selectedExerciseIds}
      />
      <RoutineExerciseMenuModal
        copy={copy}
        exercise={exerciseMenu}
        onClose={() => setExerciseMenu(null)}
        onDelete={deleteExercise}
        onReplace={(exerciseId) => {
          setPickerMode({ type: 'replace', exerciseId });
          setExerciseMenu(null);
        }}
      />
    </View>
  );
}
