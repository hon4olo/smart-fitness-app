import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { buildWorkoutTemplateSavePayload, getWorkoutTemplateById, parseWorkoutPlanDescription, toggleWorkoutTemplateFavorite } from '@/lib/workouts';
import { resolveWorkoutTemplateRouteState } from '@/features/workouts/routeResolution';
import { startWorkoutSession } from '@/features/workouts/sessionService';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { Exercise, Workout } from '@/types';

type DraftExercise = {
  name: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

const createDraftExercises = (workout: Workout): DraftExercise[] => {
  const parsed = parseWorkoutPlanDescription(workout.description);
  if (parsed.exercises.length > 0) {
    return parsed.exercises.map((exercise) => ({
      name: exercise.name,
      targetSets: exercise.targetSets ?? 3,
      targetReps: exercise.targetReps ?? 8,
      restSeconds: exercise.restSeconds ?? 90,
    }));
  }

  return workout.exercises.map((exercise) => ({
    name: exercise.name,
    targetSets: 3,
    targetReps: 8,
    restSeconds: 90,
  }));
};

export default function WorkoutDetailRoute() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const { addWorkoutTemplate, deleteWorkoutTemplate, updateWorkoutTemplate, workouts, exercises, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const routeState = useMemo(
    () => resolveWorkoutTemplateRouteState({ workoutId, workouts, isRestoringState }),
    [isRestoringState, workoutId, workouts],
  );
  const workout = useMemo(() => (routeState.status === 'ready' ? getWorkoutTemplateById(routeState.workoutId, workouts) : null), [routeState, workouts]);
  const [draftTitle, setDraftTitle] = useState(workout?.title ?? '');
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>(() => (workout ? createDraftExercises(workout) : []));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingSets, setEditingSets] = useState('3');
  const [editingReps, setEditingReps] = useState('8');
  const [editingRest, setEditingRest] = useState('90');
  const [addingExercise, setAddingExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  useEffect(() => {
    if (workout) {
      setDraftTitle(workout.title);
      setDraftExercises(createDraftExercises(workout));
    }
  }, [workout]);

  const normalizedDraftTitle = draftTitle.trim();
  const isDirty = Boolean(workout) && (normalizedDraftTitle !== workout!.title || JSON.stringify(draftExercises) !== JSON.stringify(createDraftExercises(workout!)));

  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    if (!query) {
      return exercises;
    }
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [exerciseSearch, exercises]);

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

  if (!workout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text selectable style={styles.emptyTitle}>
            Workout not found
          </Text>
          <AppButton label="Back to workouts" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const commitExercise = (index: number, next: DraftExercise) => {
    setDraftExercises((current) => current.map((exercise, exerciseIndex) => (exerciseIndex === index ? next : exercise)));
  };

  const openEditor = (index: number) => {
    const exercise = draftExercises[index];
    if (!exercise) return;
    setEditingIndex(index);
    setEditingName(exercise.name);
    setEditingSets(String(exercise.targetSets));
    setEditingReps(String(exercise.targetReps));
    setEditingRest(String(exercise.restSeconds));
  };

  const saveEditor = () => {
    if (editingIndex === null) return;
    const next: DraftExercise = {
      name: editingName.trim() || draftExercises[editingIndex].name,
      targetSets: Math.max(1, Number.parseInt(editingSets, 10) || 1),
      targetReps: Math.max(1, Number.parseInt(editingReps, 10) || 1),
      restSeconds: Math.max(0, Number.parseInt(editingRest, 10) || 0),
    };
    commitExercise(editingIndex, next);
    setEditingIndex(null);
  };

  const removeExercise = (index: number) => {
    setDraftExercises((current) => current.filter((_, exerciseIndex) => exerciseIndex !== index));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    setDraftExercises((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addExercise = (exercise: Exercise) => {
    setDraftExercises((current) => [
      ...current,
      {
        name: exercise.name,
        targetSets: 3,
        targetReps: 8,
        restSeconds: 90,
      },
    ]);
    setAddingExercise(false);
    setExerciseSearch('');
  };

  const saveWorkout = (): Workout => {
    const nextWorkout: Workout = {
      ...workout,
      id: workout.id,
      title: normalizedDraftTitle || workout.title,
      description: buildWorkoutTemplateSavePayload(workout, normalizedDraftTitle, draftExercises).description,
      exercises: draftExercises.map((exercise, index) => ({
        id: `${workout.id}-exercise-${index}`,
        name: exercise.name,
        createdAt: workout.createdAt ?? new Date().toISOString(),
        isCustom: true,
      })),
      isCustom: true,
    };
    const savedTemplate = buildWorkoutTemplateSavePayload(workout, normalizedDraftTitle, draftExercises);

    if (workout.isCustom) {
      updateWorkoutTemplate(workout.id, savedTemplate);
      return nextWorkout;
    }

    addWorkoutTemplate({
      id: workout.id,
      title: savedTemplate.title,
      description: savedTemplate.description,
      exercises: savedTemplate.exercises,
      createdAt: workout.createdAt ?? new Date().toISOString(),
    });
    return nextWorkout;
  };

  const handleStartWorkout = () => {
    const nextWorkout = saveWorkout();
    startWorkoutSession(nextWorkout);
    router.push({ pathname: '/workout-session', params: { workoutId: nextWorkout.id } });
  };

  const showOverflow = () => {
    const buttons: any[] = [
      {
        text: 'Duplicate workout',
        onPress: () => {
          const nextWorkout = saveWorkout();
          const nextId = `workout-${Date.now()}`;
          addWorkoutTemplate({
            id: nextId,
            title: `${nextWorkout.title} Copy`,
            description: nextWorkout.description,
            exercises: nextWorkout.exercises.map((exercise) => exercise.name),
            createdAt: nextWorkout.createdAt ?? new Date().toISOString(),
          });
          router.replace({ pathname: '/workouts/template/[workoutId]', params: { workoutId: nextId } });
        },
      },
      {
        text: 'Favorite / unfavorite',
        onPress: () => toggleWorkoutTemplateFavorite(workout.id),
      },
      {
        text: 'Advanced settings',
        onPress: () => Alert.alert('Advanced settings', 'Hidden workout fields are preserved automatically.'),
      },
    ];

    if (workout.isCustom) {
      buttons.push({
        text: 'Delete workout',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete workout?', 'This removes the workout template only. Completed sessions stay in history.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteWorkoutTemplate(workout.id);
                router.back();
              },
            },
          ]);
        },
      });
    }

    Alert.alert(workout.title, undefined, [{ text: 'Cancel', style: 'cancel' }, ...buttons]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 112 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text selectable style={styles.title}>
              Workout Details
            </Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={showOverflow} style={({ pressed }) => [styles.menuButton, pressed && styles.menuPressed]}>
              <Text style={styles.menuLabel}>⋯</Text>
            </Pressable>
          </View>

          <TextInput
            autoCapitalize="words"
            placeholder="Workout name"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.accent}
            style={styles.input}
            value={draftTitle}
            onChangeText={setDraftTitle}
          />

          <View style={styles.list}>
            {draftExercises.map((exercise, index) => (
              <View key={`${exercise.name}-${index}`} style={[styles.rowWrap, index > 0 && styles.rowDivider]}>
                <Pressable accessibilityRole="button" onPress={() => openEditor(index)} style={({ pressed }) => [styles.exerciseRow, pressed && styles.rowPressed]}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.exerciseCopy}>
                    <View style={styles.exerciseTitleLine}>
                      <Text numberOfLines={1} selectable style={styles.exerciseName}>
                        {exercise.name}
                      </Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                    <Text selectable style={styles.exerciseMeta}>
                      {exercise.targetSets} sets · {exercise.targetReps} reps · {exercise.restSeconds}s rest
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => {
                      const actions: any[] = [{ text: 'Cancel', style: 'cancel' }];
                      if (index > 0) actions.push({ text: 'Move up', onPress: () => moveExercise(index, -1) });
                      if (index < draftExercises.length - 1) actions.push({ text: 'Move down', onPress: () => moveExercise(index, 1) });
                      actions.push({ text: 'Delete', style: 'destructive', onPress: () => removeExercise(index) });
                      Alert.alert(exercise.name, undefined, actions);
                    }}
                    style={({ pressed }) => [styles.menuButton, pressed && styles.menuPressed]}>
                    <Text style={styles.menuLabel}>⋯</Text>
                  </Pressable>
                </Pressable>
              </View>
            ))}
          </View>

            <Pressable accessibilityRole="button" onPress={() => setAddingExercise(true)} style={({ pressed }) => [styles.addRow, pressed && styles.rowPressed]}>
            <Text style={styles.addPlus}>+</Text>
            <Text selectable style={styles.addLabel}>
              Add exercise
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton disabled={normalizedDraftTitle.length === 0 || draftExercises.length === 0} label="Start Workout" onPress={handleStartWorkout} />
        </View>
      </View>

      <Modal animationType="slide" transparent visible={editingIndex !== null} onRequestClose={() => setEditingIndex(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
            <Text style={styles.sheetTitle}>Edit exercise</Text>
            <TextInput autoCapitalize="words" placeholder="Exercise name" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} value={editingName} onChangeText={setEditingName} style={styles.sheetInput} />
            <View style={styles.sheetRow}>
              <TextInput keyboardType="number-pad" placeholder="Sets" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} value={editingSets} onChangeText={setEditingSets} style={[styles.sheetInput, styles.sheetField]} />
              <TextInput keyboardType="number-pad" placeholder="Reps" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} value={editingReps} onChangeText={setEditingReps} style={[styles.sheetInput, styles.sheetField]} />
              <TextInput keyboardType="number-pad" placeholder="Rest" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} value={editingRest} onChangeText={setEditingRest} style={[styles.sheetInput, styles.sheetField]} />
            </View>
            <View style={styles.sheetActions}>
              <AppButton label="Cancel" onPress={() => setEditingIndex(null)} variant="secondary" />
              <AppButton label="Save" onPress={saveEditor} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={addingExercise} onRequestClose={() => setAddingExercise(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
            <Text style={styles.sheetTitle}>Add exercise</Text>
            <TextInput autoCapitalize="none" autoCorrect={false} placeholder="Search exercises" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} value={exerciseSearch} onChangeText={setExerciseSearch} style={styles.sheetInput} />
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetList}>
              {filteredExercises.map((exercise) => (
                <Pressable key={exercise.id} accessibilityRole="button" onPress={() => addExercise(exercise)} style={({ pressed }) => [styles.sheetExerciseRow, pressed && styles.rowPressed]}>
                  <Text selectable style={styles.sheetExerciseName}>
                    {exercise.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.sheetActions}>
              <AppButton label="Close" onPress={() => setAddingExercise(false)} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    addPlus: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 22,
      width: 20,
    },
    addRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 52,
      paddingVertical: Spacing.two,
    },
    chevron: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 18,
      marginLeft: Spacing.one,
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
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    exerciseCopy: {
      flex: 1,
      gap: 4,
    },
    exerciseIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    exerciseIconLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '900',
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
    exerciseName: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 21,
    },
    exerciseRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 54,
      paddingVertical: Spacing.two,
    },
    exerciseTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: Spacing.three,
      minHeight: 48,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    list: {
      gap: 0,
    },
    menuButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      minWidth: 32,
    },
    menuPressed: {
      opacity: 0.65,
    },
    menuLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowPressed: {
      opacity: 0.72,
    },
    rowWrap: {},
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    sheet: {
      borderCurve: 'continuous',
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      padding: Spacing.three,
      width: '100%',
    },
    sheetActions: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    sheetBackdrop: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.48)',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    sheetExerciseName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    sheetExerciseRow: {
      minHeight: 48,
      justifyContent: 'center',
      paddingVertical: Spacing.two,
    },
    sheetField: {
      flex: 1,
    },
    sheetInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      minHeight: 48,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    sheetList: {
      maxHeight: 320,
    },
    sheetRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
  });
