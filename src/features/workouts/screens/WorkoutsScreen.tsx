import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import {
  useAppActions,
  useAppInfrastructure,
  useWorkoutState,
} from '@/context/AppContext';
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
  CreateProgramModal,
  ProgramRow,
  RoutineCard,
  TopTabs,
  type TabKey,
} from './WorkoutsScreenComponents';
import { createWorkoutsScreenStyles } from './workoutsScreen.styles';

export default function WorkoutsScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createWorkoutsScreenStyles(colors), [colors]);
  const { saveTrainingProgram } = useAppActions();
  const { isRestoringState } = useAppInfrastructure();
  const { trainingPrograms, workoutSessions, workouts } = useWorkoutState();
  const [activeTab, setActiveTab] = useState<TabKey>('start-now');
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
    if (activeDraft) {
      router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } });
    }
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

  const header = (
    <View style={styles.header}>
      <TopTabs activeTab={activeTab} onChange={setActiveTab} />
      <Pressable
        accessibilityHint={t('workouts.searchExercisesHint')}
        accessibilityLabel={t('workouts.searchExercisesAccessibility')}
        accessibilityRole="button"
        onPress={() => router.push('/workouts/exercise-library')}
        style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
        <Text style={styles.searchLabel}>⌕</Text>
      </Pressable>
    </View>
  );

  if (isRestoringState || !draftReady) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>{t('workouts.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {activeTab === 'start-now' ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + BottomTabInset + 84 },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {header}
            <View style={styles.sectionStack}>
              {suggested.length > 0 ? (
                <View style={styles.grid}>
                  {suggested.map((summary, index) => (
                    <RoutineCard key={summary.workout.id} index={index} summary={summary} />
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
                    <RoutineCard index={index} summary={summary} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + BottomTabInset + 84 },
          ]}
          data={visibleProgramSummaries}
          keyExtractor={(summary) => summary.program.id}
          ListHeaderComponent={
            <View style={styles.container}>
              {header}
              <View style={styles.programList}>
                <ProgramRow
                  icon="add"
                  title={t('workouts.addProgram')}
                  workoutCount={0}
                  onPress={() => setCreateProgramOpen(true)}
                />
                {/* FlatList replaces visibleProgramSummaries.map while preserving row order. */}
                <ProgramRow
                  favoriteMode={favoritesOnly ? 'show-all' : 'show-favorites'}
                  icon="favorite"
                  title={favoritesOnly ? t('workouts.allPrograms') : t('workouts.favorites')}
                  workoutCount={favoritesOnly ? programSummaries.length : favoriteCount}
                  onPress={() => setFavoritesOnly((current) => !current)}
                />
                {favoritesOnly && visibleProgramSummaries.length === 0 ? (
                  <Text style={styles.emptyProgramText}>{t('workouts.noFavorites')}</Text>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item: summary }) => (
            <View style={[styles.container, styles.programList]}>
              <ProgramRow
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
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

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

      <CreateProgramModal
        visible={createProgramOpen}
        onClose={() => setCreateProgramOpen(false)}
        onCreate={createProgram}
      />
    </View>
  );
}
