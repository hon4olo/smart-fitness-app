import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  getWorkoutTemplateById,
  hydrateActiveWorkoutSessionDraft,
  parseWorkoutPlanDescription,
  startWorkoutSession,
  toggleWorkoutTemplateFavorite,
} from '@/lib/workouts';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

export default function WorkoutTemplateDetailScreen() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const { workouts, isRestoringState, deleteWorkoutTemplate } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    void hydrateActiveWorkoutSessionDraft();
  }, []);

  const workout = useMemo(() => (workoutId ? getWorkoutTemplateById(workoutId, workouts) : null), [workoutId, workouts]);
  const parsedPlan = useMemo(() => parseWorkoutPlanDescription(workout?.description), [workout?.description]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingLabel}>Loading workout…</Text>
        </View>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.emptyTitle}>Workout not found</Text>
          <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.backToWorkouts, pressed && styles.pressed]}>
            <Text style={styles.backToWorkoutsLabel}>Back to Workouts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const openMenu = () => {
    Alert.alert(workout.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Favorite / unfavorite', onPress: () => toggleWorkoutTemplateFavorite(workout.id) },
      ...(workout.isCustom
        ? [
            {
              text: 'Delete workout',
              style: 'destructive' as const,
              onPress: () => {
                Alert.alert('Delete workout?', 'This removes the template only. Completed sessions stay in history.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteWorkoutTemplate(workout.id);
                      router.replace('/workouts');
                    },
                  },
                ]);
              },
            },
          ]
        : []),
    ]);
  };

  const startWorkout = () => {
    startWorkoutSession(workout);
    router.push({ pathname: '/workout-session', params: { workoutId: workout.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 116, minHeight: viewportHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <Text style={styles.circleLabel}>‹</Text>
            </Pressable>
            <Pressable onPress={openMenu} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <Text style={styles.circleLabel}>⋯</Text>
            </Pressable>
          </View>

          <View style={styles.cover}>
            <Text style={styles.coverLabel}>{workout.title.slice(0, 1).toUpperCase()}</Text>
          </View>

          <Text selectable style={styles.title}>
            {workout.title}
          </Text>

          {workout.description?.trim() ? <Text selectable style={styles.description}>{workout.description.trim()}</Text> : null}

          <View style={styles.metaGrid}>
            <MetaItem label="Exercises" value={`${workout.exercises.length}`} />
            <MetaItem label="Duration" value={workout.duration} />
            <MetaItem label="Sets" value={`${parsedPlan.exercises.reduce((total, exercise) => total + (exercise.targetSets ?? 3), 0) || workout.exercises.length * 3}`} />
            <MetaItem label="Rest" value={`${parsedPlan.exercises[0]?.restSeconds ?? 90}s`} />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Workout plan</Text>
              <Pressable onPress={startWorkout} style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}>
                <Text style={styles.inlineActionLabel}>Start workout</Text>
              </Pressable>
            </View>

            {workout.exercises.map((exercise, index) => {
              const plan = parsedPlan.exercises[index];
              return (
                <View key={exercise.id} style={index > 0 ? styles.dividerTop : undefined}>
                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseThumb}>
                      <Text style={styles.exerciseThumbLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={styles.exerciseCopy}>
                      <Text selectable style={styles.exerciseTitle}>{exercise.name}</Text>
                      <Text selectable style={styles.exerciseMeta}>
                        {plan?.targetSets ?? 3} sets · {plan?.targetReps ?? 8} reps · {plan?.restSeconds ?? 90}s rest
                      </Text>
                    </View>
                    <Pressable onPress={() => router.push({ pathname: '/workout-session', params: { workoutId: workout.id } })} style={({ pressed }) => [styles.startChip, pressed && styles.pressed]}>
                      <Text style={styles.startChipLabel}>Start</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <Pressable onPress={startWorkout} style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
            <Text style={styles.footerButtonLabel}>Start workout</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createMetaStyles(colors), [colors]);
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

const createMetaStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    item: {
      gap: 4,
      minWidth: '47%',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    value: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
  });

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backToWorkouts: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      marginTop: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    backToWorkoutsLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    circleLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    content: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexGrow: 1,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    cover: {
      alignItems: 'center',
      aspectRatio: 1.7,
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      justifyContent: 'center',
      marginBottom: Spacing.three,
      overflow: 'hidden',
    },
    coverLabel: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: '900',
      opacity: 0.9,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: Spacing.three,
    },
    dividerTop: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    exerciseCopy: {
      flex: 1,
      minWidth: 0,
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    exerciseRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      paddingVertical: 12,
    },
    exerciseThumb: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    exerciseThumbLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
    exerciseTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
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
    footerButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      minHeight: 52,
      justifyContent: 'center',
    },
    footerButtonLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    inlineAction: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: 8,
    },
    inlineActionLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '900',
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
    },
    pressed: {
      opacity: 0.72,
    },
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: Spacing.three,
      overflow: 'hidden',
      padding: Spacing.three,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    sectionTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
      marginBottom: Spacing.two,
    },
    startChip: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
    },
    startChipLabel: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '900',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
  });
