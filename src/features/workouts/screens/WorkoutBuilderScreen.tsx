import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutProgramById, getWorkoutProgramSchedule, saveWorkoutProgram } from '@/lib/workouts';
import { ProgramWorkoutEditorModal } from '@/components/workouts/ProgramWorkoutEditorModal';
import { ProgramWorkoutPickerModal } from '@/components/workouts/ProgramWorkoutPickerModal';
import { createStyles } from '@/features/workouts/styles/workoutBuilderScreenStyles';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import {
  attachWorkoutsToProgramDraft,
  createBlankProgramDraft,
  createProgramDraftFromProgram,
  removeWorkoutFromProgramDraft,
  serializeProgramDraft,
} from '@/features/workouts/programEditorModel';
import type { TrainingProgram } from '@/types/programs';
import type { Workout } from '@/types';

const createDefaultProgramDraft = () => createBlankProgramDraft();

export function WorkoutBuilderScreen() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { workouts, addWorkoutTemplate, updateWorkoutTemplate } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const existingProgram = useMemo(() => (programId ? getWorkoutProgramById(programId, workouts) : null), [programId, workouts]);
  const [programDraft, setProgramDraft] = useState<TrainingProgram | null>(() => existingProgram ?? createDefaultProgramDraft());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [workoutEditorTarget, setWorkoutEditorTarget] = useState<Workout | null | undefined>(undefined);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const initialSnapshotRef = useRef('');

  useEffect(() => {
    const nextDraft = existingProgram ? createProgramDraftFromProgram(existingProgram) : createDefaultProgramDraft();
    setProgramDraft(nextDraft);
    initialSnapshotRef.current = nextDraft ? serializeProgramDraft(nextDraft) : '';
  }, [existingProgram, programId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (isSavingProgram || !programDraft) {
        return;
      }

      if (serializeProgramDraft(programDraft) === initialSnapshotRef.current) {
        return;
      }

      event.preventDefault();
      Alert.alert('Discard changes?', undefined, [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            initialSnapshotRef.current = '';
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [isSavingProgram, navigation, programDraft]);

  const program = programDraft ?? createDefaultProgramDraft();
  const isDirty = program ? serializeProgramDraft(program) !== initialSnapshotRef.current : false;
  const workoutById = useMemo(() => new Map(workouts.map((workout) => [workout.id, workout])), [workouts]);
  const attachedWorkoutRows = useMemo(() => {
    if (!program) {
      return [];
    }

    return program.days
      .filter((day) => !day.restDay && day.workoutTemplateId)
      .map((day, index) => {
        const workout = workoutById.get(day.workoutTemplateId!);
        return {
          dayId: day.id ?? `${day.weekday}-${index}`,
          workout,
          workoutId: day.workoutTemplateId!,
          title: workout?.title ?? day.workoutTemplateName ?? 'Workout unavailable',
          exerciseCount: workout?.exercises.length ?? 0,
          isMissing: !workout,
        };
      });
  }, [program, workoutById]);

  const availableWorkouts = useMemo(() => {
    if (!program) {
      return [];
    }

    return workouts.filter((workout) => !program.days.some((day) => day.workoutTemplateId === workout.id));
  }, [program, workouts]);

  const programSchedule = useMemo(() => {
    if (!program) {
      return null;
    }

    return getWorkoutProgramSchedule(program);
  }, [program]);

  const handleDiscardAndLeave = () => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Discard changes?', undefined, [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleSaveProgram = () => {
    if (!program || isSavingProgram) {
      return;
    }

    if (program.name.trim().length === 0) {
      return;
    }

    setIsSavingProgram(true);
    const now = new Date().toISOString();
    const saved = saveWorkoutProgram({
      ...program,
      days: program.days.map((day) => {
        if (day.restDay || !day.workoutTemplateId) {
          return { ...day };
        }

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

    if (!programId) {
      initialSnapshotRef.current = serializeProgramDraft(saved);
    }

    router.replace({ pathname: '/workouts/program/[programId]', params: { programId: saved.id } });
  };

  const handleAddExistingWorkouts = (workoutIds: string[]) => {
    setProgramDraft((current) => {
      if (!current) {
        return current;
      }

      return attachWorkoutsToProgramDraft(current, workouts, workoutIds);
    });
  };

  const handleSaveWorkout = (payload: { title: string; description?: string; exercises: string[] }) => {
    if (!payload.title.trim()) {
      return;
    }

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
      setProgramDraft((current) => {
        if (!current) {
          return current;
        }

        return attachWorkoutsToProgramDraft(current, [...workouts, syntheticWorkout], [id]);
      });
    }

    setWorkoutEditorTarget(undefined);
  };

  if (!program) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No program template available</Text>
          <Text style={styles.emptyText}>Create a workout template first, then come back to build a program.</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const saveDisabled = program.name.trim().length === 0 || isSavingProgram;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two, borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={handleDiscardAndLeave} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
          <Text style={styles.headerActionLabel}>{programId ? 'Back' : 'Cancel'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{programId ? 'Edit program' : 'Create program'}</Text>
        <Pressable disabled={saveDisabled} onPress={saveDisabled ? undefined : handleSaveProgram} style={({ pressed }) => [styles.saveAction, saveDisabled && styles.saveActionDisabled, pressed && !saveDisabled && styles.pressed]}>
          <Text style={styles.saveActionLabel}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + Spacing.four }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={styles.container}>
            <View style={styles.fieldGroup}>
              <Text selectable style={styles.fieldLabel}>
                Program name
              </Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={(value) => setProgramDraft((current) => (current ? { ...current, name: value } : current))}
                placeholder="Strength block"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={program.name}
              />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Workouts</Text>
              {programSchedule?.nextWorkout && workoutById.get(programSchedule.nextWorkout.workoutTemplateId ?? '') ? (
                <Pressable
                  onPress={() => {
                    const nextWorkout = workoutById.get(programSchedule.nextWorkout?.workoutTemplateId ?? '');
                    if (!nextWorkout) {
                      return;
                    }
                    router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId: nextWorkout.id } });
                  }}
                  style={({ pressed }) => [styles.startNextButton, pressed && styles.pressed]}>
                  <Text style={styles.startNextLabel}>Start next workout</Text>
                </Pressable>
              ) : null}
            </View>

            {attachedWorkoutRows.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No workouts added yet</Text>
                <Text style={styles.emptyStateSubtitle}>Attach reusable workouts now or create a new one inside this flow.</Text>
              </View>
            ) : (
              <View style={styles.workoutList}>
                {attachedWorkoutRows.map((row) => (
                  <View key={row.dayId} style={styles.workoutRow}>
                    <Pressable
                      onPress={() => {
                        if (!row.workout) {
                          Alert.alert('Workout unavailable', 'This program references a workout template that no longer exists. Remove it or replace it with another workout.');
                          return;
                        }

                        router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId: row.workout.id } });
                      }}
                      style={({ pressed }) => [styles.workoutRowBody, pressed && styles.pressed]}>
                      <View style={styles.workoutRowCopy}>
                        <Text style={styles.workoutRowTitle}>{row.title}</Text>
                        <Text style={styles.workoutRowMeta}>{row.exerciseCount} exercises</Text>
                      </View>
                      <Text style={styles.workoutRowChevron}>›</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        const workout = row.workout;
                        if (!workout) {
                          Alert.alert('Workout unavailable', 'This workout template is missing from the library.');
                          return;
                        }

                        const actions = [
                          ...(workout.isCustom
                            ? [
                                {
                                  text: 'Edit workout',
                                  onPress: () => setWorkoutEditorTarget(workout),
                                },
                              ]
                            : []),
                          {
                            text: 'Remove from program',
                            style: 'destructive' as const,
                            onPress: () => {
                              setProgramDraft((current) => (current ? removeWorkoutFromProgramDraft(current, row.dayId) : current));
                            },
                          },
                          { text: 'Cancel', style: 'cancel' as const },
                        ];

                        Alert.alert(workout.title, undefined, actions);
                      }}
                      style={({ pressed }) => [styles.overflowButton, pressed && styles.pressed]}>
                      <Text style={styles.overflowLabel}>⋯</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.addWorkoutButton, pressed && styles.pressed]}>
              <Text style={styles.addWorkoutLabel}>+ Add workout</Text>
            </Pressable>
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

      {pickerOpen && !workoutEditorTarget ? null : null}
    </View>
  );
}
