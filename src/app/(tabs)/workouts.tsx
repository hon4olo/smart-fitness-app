import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
  getRecentlyUsedWorkoutTemplates,
  getSuggestedWorkoutTemplates,
  getWorkoutHubViewModel,
  getWorkoutProgramById,
  getWorkoutProgramSchedule,
  getWorkoutProgramSummary,
  getWorkoutPrograms,
  getWorkoutTemplateSummary,
  resetWorkoutHubState,
  saveWorkoutProgram,
  startEmptyWorkoutSessionDraft,
  startWorkoutSessionDraft,
  toggleWorkoutProgramFavorite,
} from '@/lib/workouts';
import { formatShortDate, formatShortDateTime } from '@/lib';
import type { TrainingProgram, Workout } from '@/types';

const MODES = [
  { key: 'start-now', label: 'Start Now' },
  { key: 'programs', label: 'Programs' },
] as const;

type ModeKey = (typeof MODES)[number]['key'];

type WorkoutCardSummary = ReturnType<typeof getWorkoutTemplateSummary>;
type ProgramSummary = ReturnType<typeof getWorkoutProgramSummary>;

const formatElapsedDuration = (startedAt: string) => {
  const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000));

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  return `${totalMinutes}m`;
};

const formatWorkoutSubtitle = (summary: WorkoutCardSummary) =>
  [summary.subtitle, `${summary.exerciseCount} exercise${summary.exerciseCount === 1 ? '' : 's'}`].filter(Boolean).join(' · ');

function SegmentButton({ label, selected, onPress }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}>
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function WorkoutPreviewCard({
  actionLabel,
  onAction,
  onOpen,
  summary,
  variant,
}: {
  actionLabel: string;
  onAction: () => void;
  onOpen: () => void;
  summary: WorkoutCardSummary;
  variant: 'suggested' | 'recent';
}) {
  return (
    <AppCard style={[styles.previewCard, variant === 'recent' && styles.recentPreviewCard]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.previewPressable, pressed && styles.pressed]}>
        <View style={styles.previewHeader}>
          <View style={styles.previewCopy}>
            <Text selectable style={styles.previewTitle}>
              {summary.workout.title}
            </Text>
            <Text selectable style={styles.previewSubtitle}>
              {formatWorkoutSubtitle(summary)}
            </Text>
          </View>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeLabel}>{summary.estimatedDuration}</Text>
          </View>
        </View>

        <View style={styles.previewMetaRow}>
          <View style={styles.previewMetaChip}>
            <Text style={styles.previewMetaLabel}>Exercises</Text>
            <Text style={styles.previewMetaValue}>{summary.exerciseCount}</Text>
          </View>
          {summary.lastUsedLabel ? (
            <View style={styles.previewMetaChip}>
              <Text style={styles.previewMetaLabel}>Last used</Text>
              <Text style={styles.previewMetaValue}>{summary.lastUsedLabel}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <AppButton label={actionLabel} onPress={onAction} />
    </AppCard>
  );
}

function ProgramRow({ onOpen, onToggleFavorite, program }: { onOpen: () => void; onToggleFavorite: () => void; program: ProgramSummary }) {
  const schedule = getWorkoutProgramSchedule(program.program);

  return (
    <AppCard style={styles.programRow}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.programRowPressable, pressed && styles.pressed]}>
        <View style={styles.programRowHeader}>
          <View style={styles.programRowCopy}>
            <Text selectable style={styles.programTitle}>
              {program.program.name}
            </Text>
            <Text selectable style={styles.programSubtitle}>
              {program.subtitle}
            </Text>
          </View>
          <Text style={[styles.favoriteMark, program.isFavorite && styles.favoriteMarkActive]}>{program.isFavorite ? '★' : '☆'}</Text>
        </View>

        <View style={styles.programMetaRow}>
          <Text style={styles.programMetaText}>{program.workoutCount} workout{program.workoutCount === 1 ? '' : 's'}</Text>
          <Text style={styles.programMetaText}>{program.daysPerWeek} days/week</Text>
          <Text style={styles.programMetaText}>{program.goalLabel} · {program.difficultyLabel}</Text>
        </View>

        {schedule.isRestDayToday ? (
          <Text style={styles.programRestNote}>Rest day today · Next: {schedule.nextWorkout?.workoutTemplateName ?? 'next workout'}</Text>
        ) : null}
      </Pressable>

      <View style={styles.programRowActions}>
        <AppButton label={program.isFavorite ? 'Unfavorite' : 'Favorite'} onPress={onToggleFavorite} variant="secondary" />
        <AppButton label="Open" onPress={onOpen} />
      </View>
    </AppCard>
  );
}

export default function WorkoutsScreen() {
  const { workouts, workoutSessions } = useAppContext();
  const [mode, setMode] = useState<ModeKey>('start-now');
  const insets = useSafeAreaInsets();

  const activeDraft = getActiveWorkoutSessionDraft();
  const hub = useMemo(() => getWorkoutHubViewModel({ activeProgram: null, workouts, workoutSessions }), [workouts, workoutSessions]);
  const allPrograms = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const customPrograms = useMemo(
    () => allPrograms.filter((program) => program.isCustom).map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions)),
    [allPrograms, workoutSessions, workouts],
  );
  const favoritePrograms = useMemo(() => customPrograms.filter((program) => program.isFavorite), [customPrograms]);
  const recentWorkouts = useMemo(() => getRecentlyUsedWorkoutTemplates(workouts, workoutSessions, 4), [workouts, workoutSessions]);
  const suggestions = useMemo(() => getSuggestedWorkoutTemplates(workouts, workoutSessions, null), [workouts, workoutSessions]);

  const activeWorkoutSummary = useMemo(() => {
    if (!activeDraft) {
      return null;
    }

    const workout = workouts.find((candidate) => candidate.id === activeDraft.workoutId);
    if (!workout) {
      return null;
    }

    const summary = getWorkoutTemplateSummary(workout, workoutSessions);
    return {
      ...summary,
      completedExercises: new Set(activeDraft.sets.map((set) => set.exerciseId)).size,
      elapsedLabel: formatElapsedDuration(activeDraft.startedAt),
      progressLabel: `${new Set(activeDraft.sets.map((set) => set.exerciseId)).size}/${workout.exercises.length} exercises`,
    };
  }, [activeDraft, workoutSessions, workouts]);

  const launchWorkout = useCallback(
    (workout: Workout) => {
      if (activeDraft && activeDraft.workoutId !== workout.id) {
        Alert.alert('Existing workout in progress', 'Continue the current workout or discard it and start a new one.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Existing',
            onPress: () => router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } }),
          },
          {
            text: 'Discard and Start New',
            style: 'destructive',
            onPress: () => {
              clearActiveWorkoutSessionDraft();
              startWorkoutSessionDraft(workout);
              router.push({ pathname: '/workout-session', params: { workoutId: workout.id } });
            },
          },
        ]);
        return;
      }

      startWorkoutSessionDraft(workout);
      router.push({ pathname: '/workout-session', params: { workoutId: workout.id } });
    },
    [activeDraft],
  );

  const launchEmptyWorkout = useCallback(() => {
    if (activeDraft) {
      Alert.alert('Existing workout in progress', 'Continue the current workout or discard it and start a new one.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue Existing',
          onPress: () => router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } }),
        },
        {
          text: 'Discard and Start New',
          style: 'destructive',
          onPress: () => {
            clearActiveWorkoutSessionDraft();
            startEmptyWorkoutSessionDraft();
            router.push({ pathname: '/workout-session', params: { workoutId: 'empty-workout' } });
          },
        },
      ]);
      return;
    }

    startEmptyWorkoutSessionDraft();
    router.push({ pathname: '/workout-session', params: { workoutId: 'empty-workout' } });
  }, [activeDraft]);

  const handleOverflow = useCallback(() => {
    Alert.alert('Workouts', 'Choose a section', [
      { text: 'Workout History', onPress: () => router.push('/workouts/history') },
      { text: 'Exercise Library', onPress: () => router.push('/workouts/exercise-library') },
      { text: 'Manage Templates', onPress: () => router.push('/workouts/builder') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const handleTemplateStart = useCallback((summary: WorkoutCardSummary) => launchWorkout(summary.workout), [launchWorkout]);
  const handleOpenTemplate = useCallback((workoutId: string) => router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } }), []);
  const handleOpenProgram = useCallback((programId: string) => router.push({ pathname: '/workouts/program/[programId]', params: { programId } }), []);

  const handleStickyAction = useCallback(() => {
    if (activeDraft) {
      router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } });
      return;
    }

    launchEmptyWorkout();
  }, [activeDraft, launchEmptyWorkout]);

  const handleCreateProgram = useCallback(() => router.push('/workouts/builder'), []);
  const handleSearch = useCallback(() => router.push('/workouts/exercise-library'), []);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 120 }]}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text selectable style={styles.title}>
                Workouts
              </Text>
              <Text selectable style={styles.subtitle}>
                What workout do I want to start now?
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable accessibilityHint="Open the exercise library" accessibilityLabel="Search exercises" accessibilityRole="button" onPress={handleSearch} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <Text style={styles.iconLabel}>⌕</Text>
              </Pressable>
              <Pressable accessibilityHint="Open workout sections and management" accessibilityLabel="More workout options" accessibilityRole="button" onPress={handleOverflow} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <Text style={styles.iconLabel}>⋯</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.segmentRow}>
            <SegmentButton label="Start Now" onPress={() => setMode('start-now')} selected={mode === 'start-now'} />
            <SegmentButton label="Programs" onPress={() => setMode('programs')} selected={mode === 'programs'} />
          </View>

          {mode === 'start-now' ? (
            <View style={styles.modeStack}>
              {activeWorkoutSummary ? (
                <AppCard style={styles.activeCard}>
                  <View style={styles.activeTopRow}>
                    <View style={styles.activeCopy}>
                      <Text selectable style={styles.sectionTitle}>
                        Active workout
                      </Text>
                      <Text selectable style={styles.activeTitle}>
                        {activeWorkoutSummary.workout.title}
                      </Text>
                      <Text selectable style={styles.activeMeta}>
                        {activeWorkoutSummary.elapsedLabel} · {activeWorkoutSummary.progressLabel}
                      </Text>
                    </View>
                    <View style={styles.activeAccent}>
                      <Text style={styles.activeAccentLabel}>Live</Text>
                    </View>
                  </View>
                  <AppButton label="Continue Workout" onPress={handleStickyAction} />
                </AppCard>
              ) : null}

              {!activeWorkoutSummary ? (
                <View style={styles.sectionBlock}>
                  <SectionHeader subtitle="One clear place to pick something and start." title="Suggested Workouts" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
                    {suggestions.map((summary) => (
                      <View key={summary.workout.id} style={styles.horizontalItem}>
                        <WorkoutPreviewCard actionLabel="Start" onAction={() => handleTemplateStart(summary)} onOpen={() => handleOpenTemplate(summary.workout.id)} summary={summary} variant="suggested" />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {!activeWorkoutSummary && recentWorkouts.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <SectionHeader subtitle="Quick repeats from the recent log." title="Recently Used" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
                    {recentWorkouts.map((summary) => (
                      <View key={summary.workout.id} style={styles.horizontalItem}>
                        <WorkoutPreviewCard actionLabel="Repeat" onAction={() => handleTemplateStart(summary)} onOpen={() => handleOpenTemplate(summary.workout.id)} summary={summary} variant="recent" />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {!activeWorkoutSummary && hub.hasFreshStartNowState ? (
                <EmptyState
                  actionLabel="Start Starter Workout"
                  compact
                  description="You have no workout history yet. Start with the starter template or begin empty and add exercises inside the session."
                  message="A clean first session is ready."
                  onActionPress={() => {
                    const starter = suggestions[0] ?? hub.starterWorkout;
                    if (starter) {
                      handleTemplateStart(starter);
                    }
                  }}
                  title="Fresh start"
                />
              ) : null}
            </View>
          ) : null}

          {mode === 'programs' ? (
            <View style={styles.modeStack}>
              <AppCard style={styles.addProgramCard}>
                <Text selectable style={styles.sectionTitle}>
                  Add New Program
                </Text>
                <Text selectable style={styles.sectionBody}>
                  Open the builder, edit a draft, and save only when it is ready.
                </Text>
                <AppButton label="+ Add New Program" onPress={handleCreateProgram} />
              </AppCard>

              {favoritePrograms.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <SectionHeader subtitle="Pinned programs you reach for most often." title="Favorites" />
                  <View style={styles.programList}>
                    {favoritePrograms.map((program) => (
                      <ProgramRow key={program.program.id} onOpen={() => handleOpenProgram(program.program.id)} onToggleFavorite={() => toggleWorkoutProgramFavorite(program.program.id)} program={program} />
                    ))}
                  </View>
                </View>
              ) : null}

              {customPrograms.length > 0 ? (
                <View style={styles.sectionBlock}>
                  <SectionHeader subtitle="Your saved training plans." title="My Programs" />
                  <View style={styles.programList}>
                    {customPrograms.map((program) => (
                      <ProgramRow key={program.program.id} onOpen={() => handleOpenProgram(program.program.id)} onToggleFavorite={() => toggleWorkoutProgramFavorite(program.program.id)} program={program} />
                    ))}
                  </View>
                </View>
              ) : (
                <EmptyState
                  actionLabel="Create Program"
                  compact
                  description="Build your first plan from the current workout templates."
                  message="No saved programs yet."
                  onActionPress={handleCreateProgram}
                  title="Programs are empty"
                />
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two + 8 }]}>
        <View style={styles.footerInner}>
          <AppButton label={activeDraft ? 'Continue Workout' : 'Start Empty Workout'} onPress={handleStickyAction} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeAccent: {
    alignItems: 'center',
    backgroundColor: Colors.dark.accentMuted,
    borderColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  activeAccentLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  activeCard: {
    gap: Spacing.three,
  },
  activeCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  activeMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  activeTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '900',
  },
  activeTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  addProgramCard: {
    gap: Spacing.two,
  },
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  footer: {
    backgroundColor: Colors.dark.background,
    borderTopColor: Colors.dark.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    position: 'absolute',
    right: 0,
  },
  footerInner: {
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  favoriteMark: {
    color: Colors.dark.textSecondary,
    fontSize: 20,
    fontWeight: '900',
  },
  favoriteMarkActive: {
    color: Colors.dark.accent,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: Spacing.two,
  },
  iconLabel: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  modeStack: {
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.82,
  },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  previewBadgeLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '800',
  },
  previewCard: {
    gap: Spacing.three,
    width: 272,
  },
  previewCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  previewHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  previewMetaChip: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 96,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  previewMetaLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  previewMetaValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  previewPressable: {
    gap: Spacing.three,
  },
  previewSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  previewTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  programList: {
    gap: Spacing.two,
  },
  programMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  programMetaText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  programRestNote: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  programRow: {
    gap: Spacing.two,
  },
  programRowActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  programRowCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  programRowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  programRowPressable: {
    gap: Spacing.two,
  },
  programSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  programTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  recentPreviewCard: {
    width: 232,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionBlock: {
    gap: Spacing.two,
  },
  sectionBody: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '900',
  },
  segment: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  segmentLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentLabelSelected: {
    color: Colors.dark.text,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '900',
  },
  horizontalItem: {
    width: 272,
  },
  horizontalRail: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
});
