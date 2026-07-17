import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutProgramById, getWorkoutPrograms, saveWorkoutProgram } from '@/lib/workouts';
import { SimpleProgramEditor } from '@/components/workouts/SimpleProgramEditor';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import type { TrainingProgram } from '@/types/programs';

const createBlankProgramDraft = (workouts: Parameters<typeof getWorkoutPrograms>[0]): TrainingProgram => {
  const template = getWorkoutPrograms(workouts)[0];
  return {
    ...template,
    id: `program-${Date.now()}`,
    name: '',
    description: undefined,
    isCustom: true,
    days: template.days.map((day) => ({
      ...day,
      notes: undefined,
      restDay: true,
      workoutTemplateId: undefined,
      workoutTemplateName: undefined,
    })),
  };
};

const createDraftProgram = (program: TrainingProgram): TrainingProgram => ({
  ...program,
  days: program.days.map((day) => ({ ...day })),
});

export default function ProgramBuilderRoute() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { workouts } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const existingProgram = useMemo(() => (programId ? getWorkoutProgramById(programId, workouts) : null), [programId, workouts]);
  const [program, setProgram] = useState<TrainingProgram>(() => (existingProgram ? createDraftProgram(existingProgram) : createBlankProgramDraft(workouts)));
  const [isPickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (existingProgram) {
      setProgram(createDraftProgram(existingProgram));
      return;
    }

    if (!programId) {
      setProgram(createBlankProgramDraft(workouts));
    }
  }, [existingProgram, programId, workouts]);

  const workoutRows = useMemo(
    () =>
      program.days
        .filter((day) => !day.restDay && Boolean(day.workoutTemplateId))
        .map((day, index) => ({
          id: day.id ?? `${day.weekday}-${index}`,
          title: day.workoutTemplateName ?? day.workoutTemplateId ?? 'Workout',
          exerciseCount: workouts.find((workout) => workout.id === day.workoutTemplateId)?.exercises.length ?? 0,
        })),
    [program.days, workouts],
  );

  const availableWorkouts = useMemo(
    () => workouts.filter((workout) => !program.days.some((day) => day.workoutTemplateId === workout.id)),
    [program.days, workouts],
  );

  const addWorkout = () => {
    if (availableWorkouts.length === 0) {
      Alert.alert('No workouts available', 'Add more workout templates first.');
      return;
    }

    setPickerOpen(true);
  };

  const handlePickWorkout = (workoutId: string) => {
    const workout = availableWorkouts.find((entry) => entry.id === workoutId);
    if (!workout) {
      setPickerOpen(false);
      return;
    }

    const dayIndex = program.days.findIndex((day) => day.restDay);
    if (dayIndex === -1) {
      Alert.alert('Program full', 'Remove a workout first.');
      setPickerOpen(false);
      return;
    }

    const nextDays = program.days.map((day, index) =>
      index === dayIndex
        ? {
            ...day,
            restDay: false,
            workoutTemplateId: workout.id,
            workoutTemplateName: workout.title,
          }
        : day,
    );

    setProgram((current) => ({ ...current, days: nextDays }));
    setPickerOpen(false);
  };

  const removeWorkout = (dayId: string) => {
    setProgram((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              notes: undefined,
              restDay: true,
              workoutTemplateId: undefined,
              workoutTemplateName: undefined,
            }
          : day,
      ),
    }));
  };

  const saveDisabled = program.name.trim().length === 0 || program.days.every((day) => day.restDay || !day.workoutTemplateId);

  const handleSave = () => {
    if (saveDisabled) {
      return;
    }

    const saved = saveWorkoutProgram({
      ...program,
      createdAt: program.createdAt ?? new Date().toISOString(),
      id: program.id,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    });

    router.replace({ pathname: '/workouts/program/[programId]', params: { programId: saved.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 104 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={styles.container}>
            <Text selectable style={styles.title}>
              {existingProgram ? 'Edit program' : 'Create program'}
            </Text>
            <SimpleProgramEditor
              colors={colors}
              name={program.name}
              onAddWorkout={addWorkout}
              onNameChange={(value) => setProgram((current) => ({ ...current, name: value }))}
              onOpenWorkout={(workoutId) => router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } })}
              onRemoveWorkout={removeWorkout}
              workoutRows={workoutRows}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isPickerOpen ? (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>Add workout</Text>
            {availableWorkouts.map((workout) => (
              <Pressable
                key={workout.id}
                onPress={() => handlePickWorkout(workout.id)}
                style={({ pressed }) => [styles.pickerItem, pressed && styles.pickerItemPressed]}>
                <Text style={styles.pickerItemLabel}>{workout.title}</Text>
                <Text style={styles.pickerItemMeta}>{workout.exercises.length} exercises</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setPickerOpen(false)} style={({ pressed }) => [styles.pickerCancel, pressed && styles.pressed]}>
              <Text style={styles.pickerCancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton disabled={saveDisabled} label="Save Program" onPress={handleSave} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
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
    fill: {
      flex: 1,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
      marginBottom: Spacing.three,
    },
    pickerCancel: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 16,
      marginTop: Spacing.two,
      paddingVertical: 14,
    },
    pickerCancelLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    pickerItem: {
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 18,
      marginTop: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: 14,
    },
    pickerItemLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    pickerItemMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 4,
    },
    pickerItemPressed: {
      opacity: 0.74,
    },
    pickerOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.72)',
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      padding: Spacing.three,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    pickerPanel: {
      backgroundColor: colors.background,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: 420,
      padding: Spacing.three,
      width: '100%',
    },
    pickerTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      marginBottom: Spacing.one,
    },
    pressed: {
      opacity: 0.72,
    },
  });