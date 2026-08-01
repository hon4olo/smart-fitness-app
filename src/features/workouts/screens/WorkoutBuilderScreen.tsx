import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgramWorkoutEditorModal } from '@/components/workouts/ProgramWorkoutEditorModal';
import { ProgramWorkoutPickerModal } from '@/components/workouts/ProgramWorkoutPickerModal';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppActions, useWorkoutState } from '@/context/AppContext';
import {
  attachWorkoutsToProgramDraft,
  createBlankProgramDraft,
  createProgramDraftFromProgram,
  removeWorkoutFromProgramDraft,
  serializeProgramDraft,
} from '@/features/workouts/programEditorModel';
import { createStyles } from '@/features/workouts/styles/workoutBuilderScreenStyles';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import { getWorkoutsHubWorkoutTitle } from '@/features/workouts/workoutsHubLocalization';
import {
  getWorkoutProgramById,
  getWorkoutProgramSchedule,
  saveWorkoutProgram,
} from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { getWorkoutBuilderCopy } from '@/localization/workoutBuilderCopy';
import type { Workout } from '@/types';
import type { TrainingProgram } from '@/types/programs';

import { WorkoutBuilderProgramWorkouts } from './WorkoutBuilderProgramWorkouts';

const createDefaultProgramDraft = () => createBlankProgramDraft();

export function WorkoutBuilderScreen() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { addWorkoutTemplate, updateWorkoutTemplate } = useAppActions();
  const { workouts } = useWorkoutState();
  const { colors } = useWorkoutTheme();
  const { formatNumber, locale, t } = useLocalization();
  const copy = useMemo(() => getWorkoutBuilderCopy(locale), [locale]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const existingProgram = useMemo(
    () => (programId ? getWorkoutProgramById(programId, workouts) : null),
    [programId, workouts],
  );
  const [programDraft, setProgramDraft] = useState<TrainingProgram | null>(
    () => existingProgram ?? createDefaultProgramDraft(),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [workoutEditorTarget, setWorkoutEditorTarget] = useState<
    Workout | null | undefined
  >(undefined);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const initialSnapshotRef = useRef('');

  useEffect(() => {
    const nextDraft = existingProgram
      ? createProgramDraftFromProgram(existingProgram)
      : createDefaultProgramDraft();
    setProgramDraft(nextDraft);
    initialSnapshotRef.current = nextDraft ? serializeProgramDraft(nextDraft) : '';
  }, [existingProgram, programId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (isSavingProgram || !programDraft) return;
      if (serializeProgramDraft(programDraft) === initialSnapshotRef.current) return;

      event.preventDefault();
      Alert.alert(copy.discardChanges, undefined, [
        { text: copy.keepEditing, style: 'cancel' },
        {
          text: copy.discard,
          style: 'destructive',
          onPress: () => {
            initialSnapshotRef.current = '';
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [copy, isSavingProgram, navigation, programDraft]);

  const program = programDraft ?? createDefaultProgramDraft();
  const isDirty = serializeProgramDraft(program) !== initialSnapshotRef.current;
  const workoutById = useMemo(
    () => new Map(workouts.map((workout) => [workout.id, workout])),
    [workouts],
  );
  const attachedWorkoutRows = useMemo(
    () =>
      program.days
        .filter((day) => !day.restDay && day.workoutTemplateId)
        .map((day, index) => {
          const workout = workoutById.get(day.workoutTemplateId!);
          const exerciseCount = workout?.exercises.length ?? 0;
          return {
            dayId: day.id ?? `${day.weekday}-${index}`,
            workout,
            title: workout
              ? getWorkoutsHubWorkoutTitle(t, workout)
              : day.workoutTemplateName ?? copy.workoutUnavailable,
            exerciseCountLabel: copy.exerciseCount(
              exerciseCount,
              formatNumber(exerciseCount, { maximumFractionDigits: 0 }),
            ),
          };
        }),
    [copy, formatNumber, program.days, t, workoutById],
  );
  const availableWorkouts = useMemo(
    () =>
      workouts.filter(
        (workout) =>
          !program.days.some((day) => day.workoutTemplateId === workout.id),
      ),
    [program.days, workouts],
  );
  const programSchedule = useMemo(
    () => getWorkoutProgramSchedule(program),
    [program],
  );
  const nextWorkout = programSchedule?.nextWorkout
    ? workoutById.get(programSchedule.nextWorkout.workoutTemplateId ?? '')
    : undefined;

  const handleDiscardAndLeave = () => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert(copy.discardChanges, undefined, [
      { text: copy.keepEditing, style: 'cancel' },
      {
        text: copy.discard,
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleSaveProgram = () => {
    if (isSavingProgram || program.name.trim().length === 0) return;

    setIsSavingProgram(true);
    const now = new Date().toISOString();
    const saved = saveWorkoutProgram({
      ...program,
      days: program.days.map((day) => {
        if (day.restDay || !day.workoutTemplateId) return { ...day };
        const workout = workoutById.get(day.workoutTemplateId);
        return {
          ...day,
          workoutTemplateName: workout?.title ?? day.workoutTemplateName,
        };
      }),
      createdAt: program.createdAt ?? now,
      updatedAt: now,
      isCustom: true,
    });

    if (!programId) initialSnapshotRef.current = serializeProgramDraft(saved);
    router.replace({
      pathname: '/workouts/program/[programId]',
      params: { programId: saved.id },
    });
  };

  const handleAddExistingWorkouts = (workoutIds: string[]) => {
    setProgramDraft((current) =>
      current ? attachWorkoutsToProgramDraft(current, workouts, workoutIds) : current,
    );
  };

  const handleSaveWorkout = (payload: {
    title: string;
    description?: string;
    exercises: string[];
  }) => {
    if (!payload.title.trim()) return;
    const createdAt = new Date().toISOString();

    if (workoutEditorTarget) {
      updateWorkoutTemplate(workoutEditorTarget.id, payload);
    } else {
      const id = `workout-${Date.now()}`;
      addWorkoutTemplate({
        id,
        title: payload.title,
        description: payload.description,
        exercises: payload.exercises,
        createdAt,
      });

      const syntheticWorkout: Workout = {
        id,
        title: payload.title,
        description: payload.description,
        duration: `${Math.max(15, payload.exercises.length * 10)} min`,
        exercises: [],
        createdAt,
        isCustom: true,
      };
      setProgramDraft((current) =>
        current
          ? attachWorkoutsToProgramDraft(current, [...workouts, syntheticWorkout], [id])
          : current,
      );
    }

    setWorkoutEditorTarget(undefined);
  };

  if (!program) {
    return (
      <View
        style={[
          styles.screen,
          { backgroundColor: colors.background, paddingTop: insets.top + Spacing.three },
        ]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{copy.noProgramTemplate}</Text>
          <Text style={styles.emptyText}>{copy.noProgramTemplateBody}</Text>
          <Pressable
            accessibilityLabel={copy.back}
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>{copy.back}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const saveDisabled = program.name.trim().length === 0 || isSavingProgram;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.two,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        <Pressable
          accessibilityLabel={programId ? copy.back : copy.cancel}
          accessibilityRole="button"
          onPress={handleDiscardAndLeave}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <Text style={styles.headerActionLabel}>
            {programId ? copy.back : copy.cancel}
          </Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {programId ? copy.editProgram : copy.createProgram}
        </Text>
        <Pressable
          accessibilityLabel={copy.save}
          accessibilityRole="button"
          accessibilityState={{ disabled: saveDisabled }}
          disabled={saveDisabled}
          onPress={handleSaveProgram}
          style={({ pressed }) => [
            styles.saveAction,
            saveDisabled && styles.saveActionDisabled,
            pressed && !saveDisabled && styles.pressed,
          ]}>
          <Text style={styles.saveActionLabel}>{copy.save}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={styles.container}>
            <View style={styles.fieldGroup}>
              <Text selectable style={styles.fieldLabel}>
                {copy.programName}
              </Text>
              <TextInput
                accessibilityLabel={copy.programName}
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={(value) =>
                  setProgramDraft((current) =>
                    current ? { ...current, name: value } : current,
                  )
                }
                placeholder={copy.programNamePlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={program.name}
              />
            </View>

            <WorkoutBuilderProgramWorkouts
              copy={copy}
              nextWorkout={nextWorkout}
              onAddWorkout={() => setPickerOpen(true)}
              onEditWorkout={setWorkoutEditorTarget}
              onRemoveWorkout={(dayId) =>
                setProgramDraft((current) =>
                  current ? removeWorkoutFromProgramDraft(current, dayId) : current,
                )
              }
              rows={attachedWorkoutRows}
              styles={styles}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ProgramWorkoutPickerModal
        availableWorkouts={availableWorkouts}
        onAddWorkouts={handleAddExistingWorkouts}
        onClose={() => setPickerOpen(false)}
        onCreateNew={() => {
          setPickerOpen(false);
          setWorkoutEditorTarget(null);
        }}
        visible={pickerOpen}
      />

      <ProgramWorkoutEditorModal
        onClose={() => setWorkoutEditorTarget(undefined)}
        onSaveWorkout={handleSaveWorkout}
        visible={workoutEditorTarget !== undefined}
        workout={workoutEditorTarget === undefined ? null : workoutEditorTarget}
      />
    </View>
  );
}
