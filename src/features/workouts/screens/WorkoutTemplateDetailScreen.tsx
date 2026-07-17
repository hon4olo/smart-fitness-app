import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutTemplateById, hydrateActiveWorkoutSessionDraft, startWorkoutSession, toggleWorkoutTemplateFavorite } from '@/lib/workouts';
import { resolveWorkoutTemplateRouteState } from '@/features/workouts/routeResolution';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function WorkoutTemplateDetailScreen() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const { workouts, isRestoringState, deleteWorkoutTemplate } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    void hydrateActiveWorkoutSessionDraft();
  }, []);

  const routeState = useMemo(
    () => resolveWorkoutTemplateRouteState({ workoutId, workouts, isRestoringState }),
    [isRestoringState, workoutId, workouts],
  );
  const workout = useMemo(() => (routeState.status === 'ready' ? getWorkoutTemplateById(routeState.workoutId, workouts) : null), [routeState, workouts]);

  if (isRestoringState || routeState.status === 'loading') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>
            Loading workout…
          </Text>
        </View>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text selectable style={styles.emptyTitle}>
            Workout not found
          </Text>
          <AppButton label="Back to workouts" onPress={() => router.replace('/workouts')} />
        </View>
      </View>
    );
  }

  const openMenu = () => {
    const items: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Favorite / unfavorite',
        onPress: () => toggleWorkoutTemplateFavorite(workout.id),
      },
    ];

    if (workout.isCustom) {
      items.push({
        text: 'Delete workout',
        style: 'destructive',
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
      });
    }

    Alert.alert(workout.title, undefined, items);
  };

  const startWorkout = () => {
    startWorkoutSession(workout);
    router.push({ pathname: '/workout-session', params: { workoutId: workout.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>‹</Text>
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={openMenu} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
              <Text style={styles.menuLabel}>⋯</Text>
            </Pressable>
          </View>

          <Text selectable style={styles.title}>
            {workout.title}
          </Text>

          {workout.description?.trim() ? (
            <Text selectable style={styles.subtitle}>
              {workout.description.trim()}
            </Text>
          ) : null}

          <View style={styles.card}>
            {workout.exercises.map((exercise, index) => (
              <View key={exercise.id} style={[styles.exerciseRow, index > 0 && styles.exerciseDivider]}>
                <View style={styles.exerciseIcon}>
                  <Text style={styles.exerciseIconLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.exerciseCopy}>
                  <Text selectable style={styles.exerciseName}>
                    {exercise.name}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton label="Start workout" onPress={startWorkout} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      marginTop: Spacing.three,
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
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    exerciseCopy: {
      flex: 1,
      minWidth: 0,
    },
    exerciseDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    exerciseIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    exerciseIconLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    exerciseName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    exerciseRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
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
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
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
      gap: Spacing.two,
    },
    menuButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    menuLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    pressed: {
      opacity: 0.72,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: Spacing.one,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
  });
