import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createBlankProgramDraft } from '@/features/workouts/programEditorModel';
import type { WorkoutSessionDraft } from '@/features/workouts/types';
import {
  getActiveWorkoutSessionDraft,
  getRecentlyUsedWorkoutTemplates,
  getSuggestedWorkoutTemplates,
  getWorkoutPrograms,
  getWorkoutProgramSummary,
  hydrateActiveWorkoutSessionDraft,
  startEmptyWorkoutSessionDraft,
} from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { TrainingProgram } from '@/types';

import {
  CreateWorkoutProgramModal,
  WorkoutProgramRow,
  WorkoutRoutineCard,
  WorkoutsTopTabs,
  type WorkoutsTabKey,
} from './WorkoutsScreenComponents';
import { createWorkoutsScreenStyles } from './workoutsScreen.styles';

export default function WorkoutsScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createWorkoutsScreenStyles(colors), [colors]);
  const {
    isRestoringState,
    saveTrainingProgram,
    trainingPrograms,
    workoutSessions,
    workouts,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<WorkoutsTabKey>('start-now');
  const [activeDraft, setActiveDraft] = useState<WorkoutSessionDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [createProgramOpen, setCreateProgramOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hydrateActiveWorkoutSessionDraft().then(() => {
      if (!cancelled) {
        setActiveDraft(getActiveWorkoutSessionDraft());
        setDraftReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void hydrateActiveWorkoutSessionDraft().then(() => {
        if (!cancelled) {
          setActiveDraft(getActiveWorkoutSessionDraft());
          setDraftReady(true);
        }
      });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const suggested = useMemo(
    () => getSuggestedWorkoutTemplates(workouts, workoutSessions).slice(0, 2),
    [workoutSessions, workouts],
  );
  const recent = useMemo(
    () => getRecentlyUsedWorkoutTemplates(workouts, workoutSessions, 6),
    [workoutSessions, workouts],
  );
  const programSummaries = useMemo(() => {
    const programs = getWorkoutPrograms(workouts, trainingPrograms);
    return programs.map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions));
  }, [trainingPrograms, workoutSessions, workouts]);
  const favoriteCount = programSummaries.filter((summary) => summary.isFavorite).length;
  const visibleProgramSummaries = favoritesOnly
    ? programSummaries.filter((summary) => summary.isFavorite)
    : programSummaries;

  const startEmptyWorkout = () => {
    const draft = startEmptyWorkoutSessionDraft();
    setActiveDraft(draft);
    router.push({ pathname: '/workout-session', params: { workoutId: draft.workoutId } });
  };

  const resumeWorkout = () => {
    if (!activeDraft) {
      return;
    }

    router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } });
  };

  const createProgram = (name: string) => {
    const draft = createBlankProgramDraft();
    const program: TrainingProgram = {
      ...draft,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };

    saveTrainingProgram(program);
    setCreateProgramOpen(false);
    router.push({ pathname: '/workouts/program/[programId]', params: { programId: program.id } });
  };

  if (isRestoringState || !draftReady) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>{t('workouts.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 84 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <WorkoutsTopTabs activeTab={activeTab} onChange={setActiveTab} />
            <Pressable
              accessibilityHint={t('workouts.searchExercisesHint')}
              accessibilityLabel={t('workouts.searchExercisesAccessibility')}
              accessibilityRole="button"
              onPress={() => router.push('/workouts/exercise-library')}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
              <Text style={styles.searchLabel}>⌕</Text>
            </Pressable>
          </View>

          {activeTab === 'start-now' ? (
            <View style={styles.sectionStack}>
              {suggested.length > 0 ? (
                <View style={styles.grid}>
                  {suggested.map((summary, index) => (
                    <WorkoutRoutineCard key={summary.workout.id} index={index} summary={summary} />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyProgramText}>{t('workouts.noRoutines')}</Text>
              )}
              <Text style={styles.sectionTitle}>{t('workouts.recentlyAdded')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}>
                {(recent.length > 0 ? recent : suggested).map((summary, index) => (
                  <View key={summary.workout.id} style={styles.horizontalCard}>
                    <WorkoutRoutineCard index={index} summary={summary} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.programList}>
              <WorkoutProgramRow
                icon="add"
                title={t('workouts.addProgram')}
                workoutCount={0}
                onPress={() => setCreateProgramOpen(true)}
              />
              <WorkoutProgramRow
                favoriteMode={favoritesOnly ? 'show-all' : 'show-favorites'}
                icon="favorite"
                title={favoritesOnly ? t('workouts.allPrograms') : t('workouts.favorites')}
                workoutCount={favoritesOnly ? programSummaries.length : favoriteCount}
                onPress={() => setFavoritesOnly((current) => !current)}
              />
              {favoritesOnly && visibleProgramSummaries.length === 0 ? (
                <Text style={styles.emptyProgramText}>{t('workouts.noFavorites')}</Text>
              ) : null}
              {visibleProgramSummaries.map((summary) => (
                <WorkoutProgramRow
                  key={summary.program.id}
                  icon="program"
                  summary={summary}
                  title={summary.program.name}
                  workoutCount={summary.workoutCount}
                  onPress={() =>
                    router.push({
                      pathname: '/workouts/program/[programId]',
                      params: { programId: summary.program.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.footer, { paddingBottom: insets.bottom + 2 }]}>
        <View style={styles.container}>
          <Pressable
            accessibilityHint={t(
              activeDraft ? 'workouts.resumeWorkoutHint' : 'workouts.startEmptyWorkoutHint',
            )}
            accessibilityLabel={t(
              activeDraft ? 'workouts.resumeWorkout' : 'workouts.startEmptyWorkout',
            )}
            accessibilityRole="button"
            onPress={activeDraft ? resumeWorkout : startEmptyWorkout}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
            <Text style={styles.footerIcon}>▶</Text>
            <Text style={styles.footerLabel}>
              {activeDraft ? t('workouts.resumeWorkout') : t('workouts.startEmptyWorkout')}
            </Text>
          </Pressable>
        </View>
      </View>

      <CreateWorkoutProgramModal
        visible={createProgramOpen}
        onClose={() => setCreateProgramOpen(false)}
        onCreate={createProgram}
      />
    </View>
  );
}
