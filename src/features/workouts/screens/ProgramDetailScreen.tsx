import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  getWorkoutsHubProgramTitle,
  getWorkoutsHubWorkoutTitle,
} from '@/features/workouts/workoutsHubLocalization';
import { getWorkoutProgramById } from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { getProgramRoutineCopy } from '@/localization/programRoutineCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { TrainingProgram } from '@/types';

import { createProgramDetailScreenStyles } from './programDetailScreen.styles';

const getInitial = (value: string) => value.trim().slice(0, 1).toUpperCase() || 'P';

export default function ProgramDetailScreen() {
  const params = useLocalSearchParams<{ programId?: string; savedWorkout?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const savedWorkout = Array.isArray(params.savedWorkout)
    ? params.savedWorkout[0]
    : params.savedWorkout;
  const { colors } = useAppTheme();
  const { formatNumber, locale, t } = useLocalization();
  const copy = getProgramRoutineCopy(locale);
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const styles = useMemo(() => createProgramDetailScreenStyles(colors), [colors]);
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
    if (savedWorkout !== '1') return;
    setShowSavedToast(true);
    const timer = setTimeout(() => setShowSavedToast(false), 2600);
    return () => clearTimeout(timer);
  }, [savedWorkout]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>{copy.loadingProgram}</Text>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.title}>{copy.programNotFound}</Text>
        <Pressable
          accessibilityLabel={copy.backToWorkouts}
          accessibilityRole="button"
          onPress={() => router.replace('/workouts')}
          style={({ pressed }) => [styles.simpleButton, pressed && styles.pressed]}>
          <Text style={styles.simpleButtonLabel}>{copy.backToWorkouts}</Text>
        </Pressable>
      </View>
    );
  }

  const displayProgramTitle = getWorkoutsHubProgramTitle(t, program);
  const workoutRows = program.days
    .filter((day) => !day.restDay && day.workoutTemplateId)
    .map((day, index) => {
      const workout = workouts.find((item) => item.id === day.workoutTemplateId) ?? null;
      return {
        dayId: day.id ?? `${day.weekday}-${index}`,
        exerciseCount: workout?.exercises.length ?? 0,
        id: `${day.id ?? day.weekday}-${day.workoutTemplateId}`,
        title: workout
          ? getWorkoutsHubWorkoutTitle(t, workout)
          : day.workoutTemplateName ?? copy.workoutUnavailable,
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
    Alert.alert(displayProgramTitle, undefined, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: program.metadata?.favorite ? copy.removeFavorite : copy.addFavorite,
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
        text: copy.deleteProgram,
        style: 'destructive',
        onPress: () => {
          Alert.alert(copy.deleteProgramTitle, copy.deleteProgramBody, [
            { text: copy.cancel, style: 'cancel' },
            {
              text: copy.delete,
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

  const openWorkoutOrExplain = (workoutId: string | null) => {
    if (!workoutId) {
      Alert.alert(copy.workoutUnavailable, copy.workoutUnavailableBody);
      return;
    }
    openWorkout(workoutId);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { minHeight: viewportHeight, paddingBottom: insets.bottom + Spacing.six },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.navRow}>
              <Pressable
                accessibilityLabel={copy.back}
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <Text style={styles.backLabel}>‹</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={copy.moreOptions}
                accessibilityRole="button"
                onPress={openMenu}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <Text style={styles.moreNavLabel}>⋮</Text>
              </Pressable>
            </View>

            <View style={styles.coverStage}>
              <View style={styles.cover}>
                <Text style={styles.coverLabel}>▱</Text>
              </View>
              <View style={styles.viewMore}>
                <Text style={styles.viewMoreLabel}>{copy.viewMore}</Text>
                <Text style={styles.viewMoreArrow}>⌄</Text>
              </View>
            </View>
          </View>

          <Text selectable style={styles.title}>
            {displayProgramTitle}
          </Text>

          <Pressable
            accessibilityHint={copy.addRoutineHint}
            accessibilityLabel={copy.addRoutine}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/workouts/routine/new',
                params: { programId: program.id },
              })
            }
            style={({ pressed }) => [styles.addRoutineRow, pressed && styles.pressed]}>
            <View style={styles.addRoutineIcon}>
              <Text style={styles.addRoutineIconLabel}>+</Text>
            </View>
            <Text style={styles.addRoutineLabel}>{copy.addRoutine}</Text>
          </Pressable>

          {workoutRows.map((row) => {
            const workoutId = row.workout?.id ?? null;
            const exerciseCount = copy.exerciseCount(
              row.exerciseCount,
              formatNumber(row.exerciseCount, { maximumFractionDigits: 0 }),
            );
            return (
              <View key={row.id} style={styles.routineRow}>
                <Pressable
                  accessibilityLabel={copy.openWorkout(row.title)}
                  accessibilityRole="button"
                  onPress={() => openWorkoutOrExplain(workoutId)}
                  style={({ pressed }) => [styles.routineBody, pressed && styles.pressed]}>
                  <View style={styles.routineIcon}>
                    <Text style={styles.routineIconLabel}>{getInitial(row.title)}</Text>
                  </View>
                  <View style={styles.routineCopy}>
                    <Text numberOfLines={1} style={styles.routineTitle}>
                      {row.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.routineMeta}>
                      {exerciseCount}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel={copy.openWorkout(row.title)}
                  accessibilityRole="button"
                  onPress={() => openWorkoutOrExplain(workoutId)}
                  style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
                  <Text style={styles.playLabel}>▶</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={copy.removeWorkout(row.title)}
                  accessibilityRole="button"
                  onPress={() => {
                    Alert.alert(row.title, undefined, [
                      {
                        text: copy.removeFromProgram,
                        style: 'destructive',
                        onPress: () => removeWorkout(row.dayId),
                      },
                      { text: copy.cancel, style: 'cancel' },
                    ]);
                  }}
                  style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
                  <Text style={styles.moreLabel}>⋮</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {showSavedToast ? (
        <View style={[styles.toastWrap, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View accessibilityLiveRegion="polite" style={styles.toast}>
            <Text style={styles.toastText}>{copy.workoutSaved}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
