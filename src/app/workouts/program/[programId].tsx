import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { deleteWorkoutProgram, duplicateWorkoutProgram, getWorkoutProgramById, saveWorkoutProgram, toggleWorkoutProgramFavorite } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { SimpleProgramEditor } from '@/components/workouts/SimpleProgramEditor';
import type { TrainingProgram } from '@/types/programs';

const createDraftProgram = (program: TrainingProgram): TrainingProgram => ({
  ...program,
  days: program.days.map((day) => ({ ...day })),
});

export default function ProgramDetailRoute() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { workouts, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const program = useMemo(() => (programId ? getWorkoutProgramById(programId, workouts) : null), [programId, workouts]);
  const [draftName, setDraftName] = useState(program?.name ?? '');
  const [draftProgram, setDraftProgram] = useState<TrainingProgram | null>(() => (program ? createDraftProgram(program) : null));

  const workoutRows = useMemo(
    () =>
      (draftProgram?.days ?? [])
        .filter((day) => !day.restDay && Boolean(day.workoutTemplateId))
        .map((day, index) => ({
          id: day.id ?? `${day.weekday}-${index}`,
          title: day.workoutTemplateName ?? day.workoutTemplateId ?? 'Workout',
          exerciseCount: workouts.find((workout) => workout.id === day.workoutTemplateId)?.exercises.length ?? 0,
          secondary: day.notes?.trim() ? day.notes.trim() : undefined,
        })),
    [draftProgram, workouts],
  );

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>
            Loading workout…
          </Text>
        </View>
      </View>
    );
  }

  if (!program || !draftProgram) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrap}>
          <Text selectable style={styles.emptyTitle}>
            Program not found
          </Text>
          <AppButton label="Back to workouts" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const addWorkout = () => {
    const available = workouts.slice(0, 10);
    const buttons = available.map((workout) => ({
      text: workout.title,
      onPress: () => {
        const nextIndex = draftProgram.days.findIndex((day) => day.restDay || !day.workoutTemplateId);
        if (nextIndex === -1) {
          Alert.alert('Program full', 'Remove a workout before adding another one.');
          return;
        }

        const nextDays = draftProgram.days.map((day, index) =>
          index === nextIndex
            ? {
                ...day,
                notes: undefined,
                restDay: false,
                workoutTemplateId: workout.id,
                workoutTemplateName: workout.title,
              }
            : day,
        );

        setDraftProgram({ ...draftProgram, days: nextDays });
      },
    }));

    Alert.alert('Add workout', 'Pick a template', [{ text: 'Cancel', style: 'cancel' }, ...buttons]);
  };

  const removeWorkout = (rowId: string) => {
    const nextDays = draftProgram.days.map((day, index) =>
      (day.id ?? `${day.weekday}-${index}`) === rowId
        ? {
            ...day,
            notes: undefined,
            restDay: true,
            workoutTemplateId: undefined,
            workoutTemplateName: undefined,
          }
        : day,
    );

    setDraftProgram({ ...draftProgram, days: nextDays });
  };

  const openWorkout = (rowId: string) => {
    const row = draftProgram.days.find((day, index) => (day.id ?? `${day.weekday}-${index}`) === rowId);
    const workoutId = row?.workoutTemplateId;
    if (workoutId) {
      router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } });
    }
  };

  const saveProgram = () => {
    const nextProgram: TrainingProgram = {
      ...draftProgram,
      id: program.id,
      isCustom: true,
      name: draftName.trim() || program.name,
    };

    saveWorkoutProgram(nextProgram);
    router.back();
  };

  const showOverflow = () => {
    const duplicate = () => {
      const duplicated = duplicateWorkoutProgram(program.id, workouts);
      if (duplicated) {
        router.replace({ pathname: '/workouts/program/[programId]', params: { programId: duplicated.id } });
      }
    };

    const buttons: any[] = [{ text: 'Duplicate program', onPress: duplicate }];

    if (program.isCustom) {
      buttons.push({
        text: 'Delete program',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete program?', 'This removes the program definition only. Completed workout history stays intact.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteWorkoutProgram(program.id);
                router.back();
              },
            },
          ]);
        },
      });
    }

    buttons.push({ text: 'Favorite / unfavorite', onPress: () => toggleWorkoutProgramFavorite(program.id) });
    buttons.push({ text: 'Advanced settings', onPress: () => Alert.alert('Advanced settings', 'Hidden fields are preserved automatically.') });

    Alert.alert(program.name, undefined, [{ text: 'Cancel', style: 'cancel' }, ...buttons]);
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
          <View style={styles.headerRow}>
            <Text selectable style={styles.title}>
              Program
            </Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={showOverflow} style={({ pressed }) => [styles.menuButton, pressed && styles.menuPressed]}>
              <Text style={styles.menuLabel}>⋯</Text>
            </Pressable>
          </View>

          <SimpleProgramEditor
            colors={colors}
            name={draftName}
            onAddWorkout={addWorkout}
            onNameChange={setDraftName}
            onOpenWorkout={openWorkout}
            onRemoveWorkout={removeWorkout}
            workoutRows={workoutRows}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton label="Save program" onPress={saveProgram} />
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
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    loadingWrap: {
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
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
  });
