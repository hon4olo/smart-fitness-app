import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutPrograms, getWorkoutTemplateSummary, saveWorkoutProgram } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { SimpleProgramEditor } from '@/components/workouts/SimpleProgramEditor';
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

export default function ProgramBuilderRoute() {
  const { workouts, workoutSessions } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [program, setProgram] = useState<TrainingProgram>(() => createBlankProgramDraft(workouts));

  const workoutRows = useMemo(
    () =>
      program.days
        .filter((day) => !day.restDay && Boolean(day.workoutTemplateId))
        .map((day) => ({
          id: day.id,
          title: day.workoutTemplateName ?? 'Workout',
          exerciseCount: workouts.find((workout) => workout.id === day.workoutTemplateId)?.exercises.length ?? 0,
          secondary: workouts.find((workout) => workout.id === day.workoutTemplateId)
            ? getWorkoutTemplateSummary(workouts.find((workout) => workout.id === day.workoutTemplateId)!, workoutSessions).subtitle
            : undefined,
        })),
    [program.days, workoutSessions, workouts],
  );

  const addWorkout = () => {
    const available = workouts.filter((workout) => !program.days.some((day) => day.workoutTemplateId === workout.id));

    if (available.length === 0) {
      Alert.alert('No workouts available', 'Add more workout templates first.');
      return;
    }

    Alert.alert(
      'Add workout',
      'Pick a template to add to this program.',
      [
        ...available.map((workout, index) => ({
          text: workout.title,
          onPress: () => {
            const dayIndex = program.days.findIndex((day) => day.restDay);
            if (dayIndex === -1) {
              Alert.alert('Program full', 'Remove a workout first.');
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

    setProgram((current: TrainingProgram) => ({ ...current, days: nextDays as TrainingProgram['days'] }));
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 104 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <Text selectable style={styles.title}>
            Program
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
  });
