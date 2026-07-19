import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutProgramById } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { TrainingProgram } from '@/types';

const getInitial = (value: string) => value.trim().slice(0, 1).toUpperCase() || 'P';

export default function ProgramDetailScreen() {
  const params = useLocalSearchParams<{ programId?: string; savedWorkout?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const savedWorkout = Array.isArray(params.savedWorkout) ? params.savedWorkout[0] : params.savedWorkout;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showSavedToast, setShowSavedToast] = useState(savedWorkout === '1');
  const {
    deleteTrainingProgram,
    isRestoringState,
    saveTrainingProgram,
    trainingPrograms,
    workouts,
  } = useAppContext();

  const program = useMemo(
    () => (programId ? getWorkoutProgramById(programId, workouts, trainingPrograms) : null),
    [programId, trainingPrograms, workouts],
  );

  useEffect(() => {
    if (savedWorkout !== '1') {
      return;
    }

    setShowSavedToast(true);
    const timer = setTimeout(() => setShowSavedToast(false), 2600);
    return () => clearTimeout(timer);
  }, [savedWorkout]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>Loading program...</Text>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.title}>Program not found</Text>
        <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.simpleButton, pressed && styles.pressed]}>
          <Text style={styles.simpleButtonLabel}>Back to Workouts</Text>
        </Pressable>
      </View>
    );
  }

  const workoutRows = program.days
    .filter((day) => !day.restDay && day.workoutTemplateId)
    .map((day, index) => {
      const workout = workouts.find((item) => item.id === day.workoutTemplateId) ?? null;
      return {
        dayId: day.id ?? `${day.weekday}-${index}`,
        exerciseCount: workout?.exercises.length ?? 0,
        id: `${day.id ?? day.weekday}-${day.workoutTemplateId}`,
        title: day.workoutTemplateName ?? workout?.title ?? 'Workout unavailable',
        workout,
      };
    });

  const saveProgram = (nextProgram: TrainingProgram) => {
    saveTrainingProgram({
      ...nextProgram,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeWorkout = (dayId: string) => {
    saveProgram({
      ...program,
      days: program.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              notes: undefined,
              restDay: true,
              workoutTemplateId: undefined,
              workoutTemplateName: undefined,
            }
          : { ...day },
      ),
    });
  };

  const openMenu = () => {
    Alert.alert(program.name, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: program.metadata?.favorite ? 'Remove from favorites' : 'Add to favorites',
        onPress: () =>
          saveProgram({
            ...program,
            metadata: {
              ...(program.metadata ?? {}),
              favorite: !Boolean(program.metadata?.favorite),
            },
          }),
      },
      {
        text: 'Delete program',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete program?', 'This removes the program only. Workout history stays saved.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteTrainingProgram(program.id);
                router.replace('/workouts');
              },
            },
          ]);
        },
      },
    ]);
  };

  const openWorkout = (workoutId: string) => {
    router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { minHeight: viewportHeight, paddingBottom: insets.bottom + Spacing.six }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.navRow}>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <Text style={styles.backLabel}>‹</Text>
              </Pressable>
              <Pressable onPress={openMenu} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <Text style={styles.moreNavLabel}>⋮</Text>
              </Pressable>
            </View>

            <View style={styles.coverStage}>
              <View style={styles.cover}>
                <Text style={styles.coverLabel}>▱</Text>
              </View>
              <Pressable style={({ pressed }) => [styles.viewMore, pressed && styles.pressed]}>
                <Text style={styles.viewMoreLabel}>VIEW MORE</Text>
                <Text style={styles.viewMoreArrow}>⌄</Text>
              </Pressable>
            </View>
          </View>

          <Text selectable style={styles.title}>
            {program.name}
          </Text>

          <Pressable
            onPress={() => router.push({ pathname: '/workouts/routine/new', params: { programId: program.id } })}
            style={({ pressed }) => [styles.addRoutineRow, pressed && styles.pressed]}>
            <View style={styles.addRoutineIcon}>
              <Text style={styles.addRoutineIconLabel}>+</Text>
            </View>
            <Text style={styles.addRoutineLabel}>Add routine to program</Text>
          </Pressable>

          {workoutRows.map((row) => (
            <View key={row.id} style={styles.routineRow}>
              <Pressable
                onPress={() => {
                  if (!row.workout) {
                    Alert.alert('Workout unavailable', 'This routine points to a workout that no longer exists.');
                    return;
                  }
                  openWorkout(row.workout.id);
                }}
                style={({ pressed }) => [styles.routineBody, pressed && styles.pressed]}>
                <View style={styles.routineIcon}>
                  <Text style={styles.routineIconLabel}>{getInitial(row.title)}</Text>
                </View>
                <View style={styles.routineCopy}>
                  <Text numberOfLines={1} style={styles.routineTitle}>
                    {row.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.routineMeta}>
                    {row.exerciseCount} exercise{row.exerciseCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!row.workout) {
                    Alert.alert('Workout unavailable', 'This routine points to a workout that no longer exists.');
                    return;
                  }
                  openWorkout(row.workout.id);
                }}
                style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
                <Text style={styles.playLabel}>▶</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert(row.title, undefined, [
                    { text: 'Remove from program', style: 'destructive', onPress: () => removeWorkout(row.dayId) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
                style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
                <Text style={styles.moreLabel}>⋮</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {showSavedToast ? (
        <View style={[styles.toastWrap, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>Workout saved</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addRoutineIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      height: 62,
      justifyContent: 'center',
      width: 62,
    },
    addRoutineIconLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '300',
      lineHeight: 36,
    },
    addRoutineLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 17,
      fontWeight: '500',
    },
    addRoutineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      marginTop: Spacing.three,
      minHeight: 62,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 36,
      fontWeight: '300',
      lineHeight: 38,
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.three,
      paddingTop: 0,
    },
    cover: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 210,
      justifyContent: 'center',
      width: 210,
    },
    coverLabel: {
      color: colors.textPrimary,
      fontSize: 54,
      fontWeight: '200',
      lineHeight: 58,
      transform: [{ rotate: '180deg' }],
    },
    coverStage: {
      alignItems: 'center',
      gap: Spacing.three,
      paddingTop: 4,
    },
    hero: {
      backgroundColor: colors.surfaceSecondary,
      marginHorizontal: -Spacing.three,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.one,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '800',
    },
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 28,
    },
    moreLabel: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 28,
    },
    moreNavLabel: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 30,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.one,
    },
    playButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 36,
    },
    playLabel: {
      color: colors.textPrimary,
      fontSize: 25,
      lineHeight: 28,
    },
    pressed: {
      opacity: 0.72,
    },
    routineBody: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.three,
      minWidth: 0,
    },
    routineCopy: {
      flex: 1,
      minWidth: 0,
    },
    routineIcon: {
      alignItems: 'center',
      backgroundColor: '#ED7B2F',
      height: 62,
      justifyContent: 'center',
      width: 62,
    },
    routineIconLabel: {
      color: colors.textOnAccent,
      fontSize: 21,
      fontWeight: '500',
    },
    routineMeta: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 19,
    },
    routineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: Spacing.two,
      minHeight: 62,
    },
    routineTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 22,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    simpleButton: {
      padding: Spacing.three,
    },
    simpleButtonLabel: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '800',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
      marginTop: Spacing.three,
    },
    toast: {
      backgroundColor: colors.textPrimary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
    },
    toastText: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    toastWrap: {
      alignItems: 'center',
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      position: 'absolute',
      right: 0,
    },
    viewMore: {
      alignItems: 'center',
      gap: 4,
    },
    viewMoreArrow: {
      color: colors.textSecondary,
      fontSize: 22,
      lineHeight: 20,
    },
    viewMoreLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  });
