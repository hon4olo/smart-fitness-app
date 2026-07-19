import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createBlankProgramDraft } from '@/features/workouts/programEditorModel';
import {
  getActiveWorkoutSessionDraft,
  getRecentlyUsedWorkoutTemplates,
  getSuggestedWorkoutTemplates,
  getWorkoutPrograms,
  getWorkoutProgramSummary,
  hydrateActiveWorkoutSessionDraft,
  startEmptyWorkoutSessionDraft,
} from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { TrainingProgram } from '@/types';
import type { WorkoutSessionDraft, WorkoutTemplateSummary, WorkoutProgramSummary } from '@/features/workouts/types';

const tabs = [
  { key: 'start-now', label: 'Start Now' },
  { key: 'programs', label: 'Programs' },
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

function TopTabs({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createTopTabsStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab.key)}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RoutineCard({ index, summary }: { index: number; summary: WorkoutTemplateSummary }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createRoutineCardStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId: summary.workout.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.cover, { backgroundColor: cardTints[index % cardTints.length] }]}>
        <Text style={styles.coverLabel}>{getInitials(summary.workout.title)}</Text>
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {summary.workout.title}
      </Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        {summary.subtitle || `${summary.exerciseCount} exercises`}
      </Text>
    </Pressable>
  );
}

function ProgramRow({
  icon,
  onPress,
  summary,
  title,
  workoutCount,
}: {
  icon: 'add' | 'favorite' | 'program';
  onPress: () => void;
  summary?: WorkoutProgramSummary;
  title: string;
  workoutCount: number;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createProgramRowStyles(colors), [colors]);
  const isAdd = icon === 'add';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconBox, isAdd && styles.addIconBox]}>
        <Text style={[styles.iconLabel, isAdd && styles.addIconLabel]}>{icon === 'add' ? '+' : icon === 'favorite' ? '♡' : '▰'}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {summary?.program.name ?? title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {workoutCount} Workout{workoutCount === 1 ? '' : 's'}
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
          <Text style={styles.title}>Give the program a name</Text>
          <TextInput
            autoCapitalize="words"
            autoFocus
            onChangeText={setName}
            placeholder="Program name"
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
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!canCreate}
              onPress={() => onCreate(name)}
              style={({ pressed }) => [styles.createButton, !canCreate && styles.disabledButton, pressed && canCreate && styles.pressed]}>
              <Text style={styles.createLabel}>Create</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function WorkoutsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isRestoringState, saveTrainingProgram, trainingPrograms, workoutSessions, workouts } = useAppContext();
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

  const suggested = useMemo(() => getSuggestedWorkoutTemplates(workouts, workoutSessions).slice(0, 2), [workoutSessions, workouts]);
  const recent = useMemo(() => getRecentlyUsedWorkoutTemplates(workouts, workoutSessions, 6), [workoutSessions, workouts]);
  const programSummaries = useMemo(() => {
    const programs = getWorkoutPrograms(workouts, trainingPrograms);
    return programs.map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions));
  }, [trainingPrograms, workoutSessions, workouts]);
  const favoriteCount = programSummaries.filter((summary) => summary.isFavorite).length;
  const visibleProgramSummaries = favoritesOnly ? programSummaries.filter((summary) => summary.isFavorite) : programSummaries;

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
        <Text style={styles.loadingLabel}>Loading workouts...</Text>
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
            <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
              <Text style={styles.searchLabel}>⌕</Text>
            </Pressable>
          </View>

          {activeTab === 'start-now' ? (
            <View style={styles.sectionStack}>
              <View style={styles.grid}>
                {suggested.map((summary, index) => (
                  <RoutineCard key={summary.workout.id} index={index} summary={summary} />
                ))}
              </View>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {(recent.length > 0 ? recent : suggested).map((summary, index) => (
                  <View key={summary.workout.id} style={styles.horizontalCard}>
                    <RoutineCard index={index} summary={summary} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.programList}>
              <ProgramRow icon="add" title="Add new program" workoutCount={0} onPress={() => setCreateProgramOpen(true)} />
              <ProgramRow icon="favorite" title={favoritesOnly ? 'All programs' : 'Favorites'} workoutCount={favoritesOnly ? programSummaries.length : favoriteCount} onPress={() => setFavoritesOnly((current) => !current)} />
              {favoritesOnly && visibleProgramSummaries.length === 0 ? <Text style={styles.emptyProgramText}>No favorite programs yet.</Text> : null}
              {visibleProgramSummaries.map((summary) => (
                <ProgramRow
                  key={summary.program.id}
                  icon="program"
                  summary={summary}
                  title={summary.program.name}
                  workoutCount={summary.workoutCount}
                  onPress={() => router.push({ pathname: '/workouts/program/[programId]', params: { programId: summary.program.id } })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.footer, { paddingBottom: insets.bottom + 2 }]}>
        <View style={styles.container}>
          <Pressable onPress={activeDraft ? resumeWorkout : startEmptyWorkout} style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
            <Text style={styles.footerIcon}>▶</Text>
            <Text style={styles.footerLabel}>{activeDraft ? 'Resume Workout' : 'Start an Empty Workout'}</Text>
          </Pressable>
        </View>
      </View>

      <CreateProgramModal visible={createProgramOpen} onClose={() => setCreateProgramOpen(false)} onCreate={createProgram} />
    </View>
  );
}

const createTopTabsStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    label: {
      color: colors.textMuted,
      fontSize: 23,
      fontWeight: '900',
      lineHeight: 29,
    },
    labelSelected: {
      color: colors.textPrimary,
      fontSize: 28,
      lineHeight: 34,
    },
    row: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: Spacing.three,
    },
  });

const createRoutineCardStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: 6,
      minWidth: 0,
    },
    cover: {
      alignItems: 'center',
      aspectRatio: 1,
      borderCurve: 'continuous',
      borderRadius: 8,
      justifyContent: 'center',
      width: '100%',
    },
    coverLabel: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: '500',
    },
    pressed: {
      opacity: 0.72,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 18,
      lineHeight: 23,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 25,
    },
  });

const createProgramRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addIconBox: {
      borderRadius: 999,
    },
    addIconLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '300',
      lineHeight: 34,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    iconBox: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 4,
      height: 58,
      justifyContent: 'center',
      width: 58,
    },
    iconLabel: {
      color: colors.textMuted,
      fontSize: 23,
      fontWeight: '500',
      lineHeight: 26,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 72,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 21,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: '900',
      lineHeight: 24,
    },
  });

const createModalStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'flex-end',
    },
    cancelButton: {
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    cancelLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '800',
    },
    createButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 14,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
    },
    createLabel: {
      color: colors.textOnAccent,
      fontSize: 16,
      fontWeight: '900',
    },
    disabledButton: {
      opacity: 0.45,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      minHeight: 52,
      paddingHorizontal: Spacing.three,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    panel: {
      backgroundColor: colors.surfacePrimary,
      borderCurve: 'continuous',
      borderRadius: 24,
      gap: Spacing.three,
      maxWidth: 520,
      padding: Spacing.four,
      width: '100%',
    },
    pressed: {
      opacity: 0.72,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 28,
    },
  });

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
    },
    footer: {
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      position: 'absolute',
      right: 0,
    },
    footerButton: {
      alignItems: 'center',
      alignSelf: 'flex-end',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 16,
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'center',
      maxWidth: 360,
      minHeight: 48,
      minWidth: 260,
      paddingHorizontal: Spacing.three,
    },
    footerIcon: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '900',
    },
    footerLabel: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '900',
    },
    emptyProgramText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
      paddingVertical: Spacing.one,
    },
    grid: {
      flexDirection: 'row',
      gap: Spacing.six,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    horizontalCard: {
      width: 220,
    },
    horizontalList: {
      gap: Spacing.five,
      paddingRight: Spacing.three,
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
    pressed: {
      opacity: 0.72,
    },
    programList: {
      gap: Spacing.two,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    searchButton: {
      alignItems: 'center',
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    searchLabel: {
      color: colors.textPrimary,
      fontSize: 27,
      fontWeight: '500',
      lineHeight: 30,
    },
    sectionStack: {
      gap: Spacing.six,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 23,
      fontWeight: '900',
      lineHeight: 29,
    },
  });
