import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
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
    toggleTrainingProgramFavorite,
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
      { text: 'Favorite / unfavorite', onPress: () => toggleTrainingProgramFavorite(program.id) },
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

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { minHeight: viewportHeight, paddingBottom: insets.bottom + BottomTabInset + Spacing.six }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.navRow}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <Text style={styles.circleLabel}>‹</Text>
            </Pressable>
            <Pressable onPress={openMenu} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <Text style={styles.circleLabel}>⋯</Text>
            </Pressable>
          </View>

          <View style={styles.coverStage}>
            <View style={styles.cover}>
              <Text style={styles.coverLabel}>{getInitial(program.name)}</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.viewMore, pressed && styles.pressed]}>
              <Text style={styles.viewMoreLabel}>VIEW MORE</Text>
              <Text style={styles.viewMoreArrow}>⌄</Text>
            </Pressable>
          </View>

          <Text selectable style={styles.title}>
            {program.name}
          </Text>

          {workoutRows.length > 0 ? (
            <View style={styles.routinesCard}>
              <Text style={styles.sectionTitle}>Routines</Text>
              {workoutRows.map((row) => (
                <View key={row.id} style={styles.routineRow}>
                  <Pressable
                    onPress={() => {
                      if (!row.workout) {
                        Alert.alert('Workout unavailable', 'This routine points to a workout that no longer exists.');
                        return;
                      }
                      router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId: row.workout.id } });
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
                      Alert.alert(row.title, undefined, [
                        { text: 'Remove from program', style: 'destructive', onPress: () => removeWorkout(row.dayId) },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }}
                    style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
                    <Text style={styles.moreLabel}>⋯</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() => router.push({ pathname: '/workouts/routine/new', params: { programId: program.id } })}
                style={({ pressed }) => [styles.addRoutineCompact, pressed && styles.pressed]}>
                <Text style={styles.addRoutineCompactLabel}>+ Add routine</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push({ pathname: '/workouts/routine/new', params: { programId: program.id } })}
              style={({ pressed }) => [styles.addRoutineRow, pressed && styles.pressed]}>
              <View style={styles.addRoutineIcon}>
                <Text style={styles.addRoutineIconLabel}>+</Text>
              </View>
              <Text style={styles.addRoutineLabel}>Add routine to program</Text>
            </Pressable>
          )}
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
    addRoutineCompact: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    addRoutineCompactLabel: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '900',
    },
    addRoutineIcon: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      height: 78,
      justifyContent: 'center',
      width: 78,
    },
    addRoutineIconLabel: {
      color: colors.textPrimary,
      fontSize: 38,
      fontWeight: '300',
    },
    addRoutineLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 20,
      fontWeight: '800',
    },
    addRoutineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.four,
      marginTop: Spacing.six,
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    circleLabel: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 30,
      marginTop: -2,
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
    cover: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 20,
      height: 300,
      justifyContent: 'center',
      width: '100%',
    },
    coverLabel: {
      color: colors.textPrimary,
      fontSize: 48,
      fontWeight: '900',
    },
    coverStage: {
      gap: Spacing.six,
      paddingBottom: Spacing.three,
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
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    moreLabel: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 24,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
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
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    routineIconLabel: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    routineMeta: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '700',
    },
    routineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 72,
    },
    routinesCard: {
      backgroundColor: colors.surfacePrimary,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      gap: Spacing.three,
      marginTop: Spacing.three,
      padding: Spacing.three,
    },
    routineTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 25,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
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
      fontSize: 36,
      fontWeight: '900',
      lineHeight: 42,
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
      fontSize: 24,
      lineHeight: 24,
    },
    viewMoreLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
