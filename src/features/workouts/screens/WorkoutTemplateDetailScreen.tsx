import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getWorkoutsHubWorkoutTitle } from '@/features/workouts/workoutsHubLocalization';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import {
  getWorkoutTemplateById,
  hydrateActiveWorkoutSessionDraft,
  isWorkoutTemplateFavorite,
  parseWorkoutPlanDescription,
  startWorkoutSession,
  toggleWorkoutTemplateFavorite,
} from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { getWorkoutTemplateDetailCopy } from '@/localization/workoutTemplateDetailCopy';

export default function WorkoutTemplateDetailScreen() {
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const { workouts, isRestoringState, deleteWorkoutTemplate } = useAppContext();
  const { colors } = useWorkoutTheme();
  const { formatNumber, locale, t } = useLocalization();
  const copy = getWorkoutTemplateDetailCopy(locale);
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    void hydrateActiveWorkoutSessionDraft();
  }, []);

  const workout = useMemo(
    () => (workoutId ? getWorkoutTemplateById(workoutId, workouts) : null),
    [workoutId, workouts],
  );
  const parsedPlan = useMemo(
    () => parseWorkoutPlanDescription(workout?.description),
    [workout?.description],
  );

  if (isRestoringState) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingLabel}>{copy.loading}</Text>
        </View>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingState}>
          <Text style={styles.emptyTitle}>{copy.notFound}</Text>
          <Pressable
            accessibilityLabel={copy.backToWorkouts}
            accessibilityRole="button"
            onPress={() => router.replace('/workouts')}
            style={({ pressed }) => [styles.backToWorkouts, pressed && styles.pressed]}>
            <Text style={styles.backToWorkoutsLabel}>{copy.backToWorkouts}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const displayTitle = getWorkoutsHubWorkoutTitle(t, workout);

  const openMenu = () => {
    const favorite = isWorkoutTemplateFavorite(workout.id);
    Alert.alert(displayTitle, undefined, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: favorite ? copy.removeFavorite : copy.addFavorite,
        onPress: () => toggleWorkoutTemplateFavorite(workout.id),
      },
      ...(workout.isCustom
        ? [
            {
              text: copy.deleteWorkout,
              style: 'destructive' as const,
              onPress: () => {
                Alert.alert(copy.deleteTitle, copy.deleteBody, [
                  { text: copy.cancel, style: 'cancel' },
                  {
                    text: copy.delete,
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
        <Pressable
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backButtonLabel}>‹ {copy.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{copy.headerTitle}</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel={copy.shareUnavailable}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={styles.iconButton}>
            <Text style={styles.headerIcon}>↗</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={copy.moreOptions}
            accessibilityRole="button"
            onPress={openMenu}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Text style={styles.headerIcon}>…</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          {
            minHeight: viewportHeight - insets.top,
            paddingBottom: insets.bottom + 116,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text selectable style={styles.title}>
            {displayTitle}
          </Text>

          <View style={styles.exerciseList}>
            {workout.exercises.map((exercise, index) => {
              const plan = parsedPlan.exercises[index];
              const targetSets = plan?.targetSets ?? 3;
              return (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseThumb}>
                    <Text style={styles.exerciseThumbLabel}>
                      {exercise.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.exerciseCopy}>
                    <Text selectable style={styles.exerciseTitle}>
                      {exercise.name}
                    </Text>
                    <Text selectable style={styles.exerciseMeta}>
                      {copy.setCount(
                        targetSets,
                        formatNumber(targetSets, { maximumFractionDigits: 0 }),
                      )}
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
          <Pressable
            accessibilityHint={copy.startWorkoutHint}
            accessibilityLabel={copy.startWorkout}
            accessibilityRole="button"
            onPress={startWorkout}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
            <Text style={styles.footerButtonLabel}>{copy.startWorkout}</Text>
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
      color: colors.accent,
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
      backgroundColor: colors.background,
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
      backgroundColor: colors.backgroundSecondary,
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
      backgroundColor: colors.background,
      borderTopColor: colors.divider,
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
      backgroundColor: colors.textPrimary,
      borderCurve: 'continuous',
      borderRadius: 999,
      minHeight: 58,
      justifyContent: 'center',
    },
    footerButtonLabel: {
      color: colors.background,
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 24,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
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
      color: colors.accent,
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
      backgroundColor: colors.background,
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '400',
      lineHeight: 38,
    },
  });
