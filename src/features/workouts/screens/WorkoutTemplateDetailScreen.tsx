import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import {
  getWorkoutTemplateById,
  hydrateActiveWorkoutSessionDraft,
  parseWorkoutPlanDescription,
  startWorkoutSession,
  toggleWorkoutTemplateFavorite,
} from '@/lib/workouts';

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
      <View style={styles.screen}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingLabel}>Loading workout...</Text>
        </View>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.screen}>
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
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backButtonLabel}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={styles.headerActions}>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Text style={styles.headerIcon}>↗</Text>
          </Pressable>
          <Pressable onPress={openMenu} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Text style={styles.headerIcon}>…</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.content, { minHeight: viewportHeight - insets.top, paddingBottom: insets.bottom + 116 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text selectable style={styles.title}>
            {workout.title}
          </Text>

          <View style={styles.exerciseList}>
            {workout.exercises.map((exercise, index) => {
              const plan = parsedPlan.exercises[index];
              return (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseThumb}>
                    <Text style={styles.exerciseThumbLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.exerciseCopy}>
                    <Text selectable style={styles.exerciseTitle}>
                      {exercise.name}
                    </Text>
                    <Text selectable style={styles.exerciseMeta}>
                      {plan?.targetSets ?? 3} Sets
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.container}>
          <Pressable onPress={startWorkout} style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
            <Text style={styles.footerButtonLabel}>Start Workout</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 34,
      justifyContent: 'center',
      minWidth: 74,
    },
    backButtonLabel: {
      color: '#0A84FF',
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
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
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      backgroundColor: '#000000',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.five,
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
    exerciseList: {
      gap: Spacing.four,
      marginTop: Spacing.five,
    },
    exerciseMeta: {
      color: colors.textSecondary,
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 23,
    },
    exerciseRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.four,
      minHeight: 82,
    },
    exerciseThumb: {
      alignItems: 'center',
      backgroundColor: '#0A0A0A',
      height: 76,
      justifyContent: 'center',
      width: 76,
    },
    exerciseThumbLabel: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '300',
    },
    exerciseTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '400',
      lineHeight: 28,
    },
    footer: {
      backgroundColor: '#000000',
      borderTopColor: '#2B2B2B',
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: 14,
      position: 'absolute',
      right: 0,
    },
    footerButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderCurve: 'continuous',
      borderRadius: 999,
      minHeight: 58,
      justifyContent: 'center',
    },
    footerButtonLabel: {
      color: '#000000',
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 24,
    },
    header: {
      alignItems: 'center',
      backgroundColor: '#000000',
      borderBottomColor: '#2B2B2B',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 8,
      paddingHorizontal: 10,
    },
    headerActions: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      minWidth: 96,
    },
    headerIcon: {
      color: '#0A84FF',
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 30,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: '500',
      lineHeight: 24,
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      textAlign: 'center',
    },
    iconButton: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      width: 44,
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
    pressed: {
      opacity: 0.72,
    },
    screen: {
      backgroundColor: '#000000',
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '400',
      lineHeight: 38,
    },
  });
