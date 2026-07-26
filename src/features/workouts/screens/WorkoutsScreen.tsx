import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createBlankProgramDraft } from '@/features/workouts/programEditorModel';
import type {
  WorkoutProgramSummary,
  WorkoutSessionDraft,
  WorkoutTemplateSummary,
} from '@/features/workouts/types';
import {
  getActiveWorkoutSessionDraft,
  getRecentlyUsedWorkoutTemplates,
  getSuggestedWorkoutTemplates,
  getWorkoutPrograms,
  getWorkoutProgramSummary,
  hydrateActiveWorkoutSessionDraft,
  startEmptyWorkoutSessionDraft,
} from '@/lib/workouts';
import { formatPlural, useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { TrainingProgram } from '@/types';
import {
  getWorkoutsHubProgramTitle,
  getWorkoutsHubWorkoutTitle,
} from '@/features/workouts/workoutsHubLocalization';

import {
  createModalStyles,
  createProgramRowStyles,
  createRoutineCardStyles,
  createTopTabsStyles,
  createWorkoutsScreenStyles,
} from './workoutsScreen.styles';

const tabs = [
  { key: 'start-now', messageKey: 'workouts.tabs.startNow' },
  { key: 'programs', messageKey: 'workouts.tabs.programs' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const cardTints = ['#EB737D', '#6BBFC2', '#8C83D8', '#E4A65A'];

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join('')
    .toUpperCase() || '+';

function TopTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createTopTabsStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{t(tab.messageKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RoutineCard({ index, summary }: { index: number; summary: WorkoutTemplateSummary }) {
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const styles = useMemo(() => createRoutineCardStyles(colors), [colors]);
  const exerciseCountLabel = formatPlural(locale, summary.exerciseCount, {
    one: t('workouts.exerciseCount.one'),
    few: t('workouts.exerciseCount.few'),
    many: t('workouts.exerciseCount.many'),
    other: t('workouts.exerciseCount.other'),
  });

  const displayTitle = getWorkoutsHubWorkoutTitle(t, summary.workout);
  const displaySubtitle =
    summary.workout.isCustom && summary.subtitle ? summary.subtitle : exerciseCountLabel;

  return (
    <Pressable
      accessibilityHint={t('workouts.openTemplateHint')}
      accessibilityLabel={displayTitle}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/workouts/template/[workoutId]',
          params: { workoutId: summary.workout.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.cover, { backgroundColor: cardTints[index % cardTints.length] }]}>
        <Text style={styles.coverLabel}>{getInitials(displayTitle)}</Text>
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {displayTitle}
      </Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        {displaySubtitle}
      </Text>
    </Pressable>
  );
}

function ProgramRow({
  favoriteMode,
  icon,
  onPress,
  summary,
  title,
  workoutCount,
}: {
  favoriteMode?: 'show-all' | 'show-favorites';
  icon: 'add' | 'favorite' | 'program';
  onPress: () => void;
  summary?: WorkoutProgramSummary;
  title: string;
  workoutCount: number;
}) {
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const styles = useMemo(() => createProgramRowStyles(colors), [colors]);
  const isAdd = icon === 'add';
  const workoutCountLabel = formatPlural(locale, workoutCount, {
    one: t('workouts.workoutCount.one'),
    few: t('workouts.workoutCount.few'),
    many: t('workouts.workoutCount.many'),
    other: t('workouts.workoutCount.other'),
  });

  const displayTitle = summary ? getWorkoutsHubProgramTitle(t, summary.program) : title;
  const accessibilityHint =
    icon === 'add'
      ? t('workouts.addProgramHint')
      : icon === 'favorite'
        ? t(
            favoriteMode === 'show-all'
              ? 'workouts.showAllProgramsHint'
              : 'workouts.showFavoritesHint',
          )
        : t('workouts.openProgramHint');

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={displayTitle}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconBox, isAdd && styles.addIconBox]}>
        <Text style={[styles.iconLabel, isAdd && styles.addIconLabel]}>
          {icon === 'add' ? '+' : icon === 'favorite' ? '♡' : '▰'}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {displayTitle}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {workoutCountLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function CreateProgramModal({
  onClose,
  onCreate,
  visible,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
  visible: boolean;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createModalStyles(colors), [colors]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
    }
  }, [visible]);

  const canCreate = name.trim().length > 0;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>{t('workouts.createProgramTitle')}</Text>
          <TextInput
            autoCapitalize="words"
            autoFocus
            onChangeText={setName}
            accessibilityLabel={t('workouts.programName')}
            placeholder={t('workouts.programName')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            selectionColor={colors.accent}
            style={styles.input}
            value={name}
            onSubmitEditing={() => {
              if (canCreate) {
                onCreate(name);
              }
            }}
          />
          {!canCreate ? (
            <Text accessibilityLiveRegion="polite" style={styles.modalHelperText}>
              {t('workouts.programNameRequired')}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityState={{ disabled: !canCreate }}
              disabled={!canCreate}
              onPress={() => onCreate(name)}
              style={({ pressed }) => [
                styles.createButton,
                !canCreate && styles.disabledButton,
                pressed && canCreate && styles.pressed,
              ]}>
              <Text style={styles.createLabel}>{t('workouts.create')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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

          {activeTab === 'start-now' ? (
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
          ) : (
            <View style={styles.programList}>
              <ProgramRow
                icon="add"
                title={t('workouts.addProgram')}
                workoutCount={0}
                onPress={() => setCreateProgramOpen(true)}
              />
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
              {visibleProgramSummaries.map((summary) => (
                <ProgramRow
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

      <CreateProgramModal
        visible={createProgramOpen}
        onClose={() => setCreateProgramOpen(false)}
        onCreate={createProgram}
      />
    </View>
  );
}
