import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
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

  const openWorkout = (workoutId: string) => {
    router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { minHeight: viewportHeight, paddingBottom: insets.bottom + BottomTabInset + 108 }]}
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

      <WorkoutFlowTabBar bottomInset={insets.bottom} colors={colors} />

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

function WorkoutFlowTabBar({ bottomInset, colors }: { bottomInset: number; colors: typeof Colors.light }) {
  const styles = useMemo(() => createTabStyles(colors), [colors]);
  const items = [
    { icon: '⌂', label: 'Home', route: '/' },
    { icon: '◉', label: 'Explore', route: '/workouts' },
    { icon: '+', label: 'Workout', route: '/workouts' },
    { icon: '⌁', label: 'Progress', route: '/progress' },
    { icon: '◎', label: 'Profile', route: '/profile' },
  ] as const;

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 6) }]}>
      {items.map((item) => {
        const active = item.label === 'Workout';
        return (
          <Pressable key={item.label} onPress={() => router.push(item.route)} style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
            <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{item.icon}</Text>
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createTabStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    pressed: {
      opacity: 0.72,
    },
    tabBar: {
      alignItems: 'flex-start',
      backgroundColor: colors.background,
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      flexDirection: 'row',
      height: 84,
      justifyContent: 'space-around',
      left: 0,
      paddingTop: 10,
      position: 'absolute',
      right: 0,
    },
    tabIcon: {
      color: colors.textMuted,
      fontSize: 24,
      lineHeight: 26,
    },
    tabIconActive: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 22,
    },
    tabIconWrap: {
      alignItems: 'center',
      height: 28,
      justifyContent: 'center',
      width: 34,
    },
    tabIconWrapActive: {
      backgroundColor: colors.textPrimary,
      borderRadius: 999,
      height: 28,
      width: 28,
    },
    tabItem: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
    },
    tabLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    tabLabelActive: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
  });

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addRoutineIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      height: 80,
      justifyContent: 'center',
      width: 80,
    },
    addRoutineIconLabel: {
      color: colors.textPrimary,
      fontSize: 40,
      fontWeight: '300',
      lineHeight: 44,
    },
    addRoutineLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 20,
      fontWeight: '500',
    },
    addRoutineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.four,
      marginTop: Spacing.five,
      minHeight: 80,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 42,
      fontWeight: '300',
      lineHeight: 44,
      marginLeft: -2,
      marginTop: -2,
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 52,
      justifyContent: 'center',
      width: 52,
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
      height: 300,
      justifyContent: 'center',
      width: 300,
    },
    coverLabel: {
      color: colors.textPrimary,
      fontSize: 74,
      fontWeight: '200',
      lineHeight: 78,
      transform: [{ rotate: '180deg' }],
    },
    coverStage: {
      alignItems: 'center',
      gap: Spacing.five,
      paddingTop: 12,
    },
    hero: {
      backgroundColor: colors.surfaceSecondary,
      marginHorizontal: -Spacing.three,
      paddingBottom: Spacing.five,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
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
      height: 52,
      justifyContent: 'center',
      width: 28,
    },
    moreLabel: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 30,
    },
    moreNavLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '800',
      lineHeight: 32,
      marginTop: -2,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.two,
    },
    playButton: {
      alignItems: 'center',
      height: 52,
      justifyContent: 'center',
      width: 44,
    },
    playLabel: {
      color: colors.textPrimary,
      fontSize: 30,
      lineHeight: 32,
    },
    pressed: {
      opacity: 0.72,
    },
    routineBody: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.four,
      minWidth: 0,
    },
    routineCopy: {
      flex: 1,
      minWidth: 0,
    },
    routineIcon: {
      alignItems: 'center',
      backgroundColor: '#ED7B2F',
      height: 80,
      justifyContent: 'center',
      width: 80,
    },
    routineIconLabel: {
      color: colors.textOnAccent,
      fontSize: 24,
      fontWeight: '500',
    },
    routineMeta: {
      color: colors.textMuted,
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
    routineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: Spacing.three,
      minHeight: 80,
    },
    routineTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 24,
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
      fontSize: 34,
      fontWeight: '700',
      lineHeight: 41,
      marginTop: Spacing.four,
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
      bottom: 84,
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
      fontSize: 26,
      lineHeight: 24,
    },
    viewMoreLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  });
