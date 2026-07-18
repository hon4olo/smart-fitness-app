import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import {
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
  getRecentlyUsedWorkoutTemplates,
  getSessionExercises,
  getSessionVolume,
  getSuggestedWorkoutTemplates,
  getWorkoutTemplateSummary,
  hydrateActiveWorkoutSessionDraft,
  searchExercises,
  startEmptyWorkoutSessionDraft,
  startWorkoutSession,
} from '@/lib/workouts';
import type { Exercise, Workout, WorkoutSession } from '@/types';
import type { WorkoutSessionDraft, WorkoutTemplateSummary } from '@/features/workouts/types';

const tabs = [
  { key: 'routines', label: 'Routines' },
  { key: 'history', label: 'History' },
  { key: 'exercises', label: 'Exercises' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

type StatItem = {
  label: string;
  value: string;
};

const formatNumber = (value: number) => Math.round(value).toLocaleString();

const formatSessionDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }

  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(date);
};

const getSessionTime = (session: WorkoutSession) => {
  const start = new Date(session.startedAt).getTime();
  const finish = new Date(session.finishedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(finish) || finish <= start) {
    return 'Logged';
  }

  const minutes = Math.max(1, Math.round((finish - start) / 60000));
  return `${minutes} min`;
};

const getExerciseSubtitle = (exercise: Exercise) => {
  const muscle = exercise.muscleGroup ?? exercise.primaryMuscles?.[0] ?? exercise.category;
  const equipment = exercise.equipment?.[0];

  return [muscle, equipment].filter(Boolean).join(' · ') || 'Exercise';
};

const getExerciseInitial = (value: string) => value.trim().slice(0, 1).toUpperCase() || '+';

const matchesWorkoutQuery = (summary: WorkoutTemplateSummary, query: string) => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const haystack = [
    summary.workout.title,
    summary.workout.description,
    summary.subtitle,
    summary.workout.duration,
    ...summary.workout.exercises.map((exercise) => exercise.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
};

const getWeekActivity = (sessions: WorkoutSession[]) => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const active = sessions.some((session) => {
      const timestamp = new Date(session.finishedAt).getTime();
      return timestamp >= date.getTime() && timestamp < nextDate.getTime();
    });

    return {
      active,
      id: date.toISOString(),
      label: new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date),
    };
  });
};

function SectionTitle({ action, title }: { action?: ReactNode; title: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createSectionTitleStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  );
}

function SegmentControl({ value, onChange }: { value: TabKey; onChange: (value: TabKey) => void }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createSegmentStyles(colors), [colors]);

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {tabs.map((tab) => {
        const selected = tab.key === value;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [styles.item, selected && styles.itemSelected, pressed && !selected && styles.itemPressed]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchField({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createSearchStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Search workouts or exercises"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        selectionColor={colors.accent}
        style={styles.input}
        value={value}
      />
      {value.trim().length > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => onChangeText('')} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
          <Text style={styles.clearLabel}>x</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuickStartCard({
  activeDraft,
  onDiscard,
  onResume,
  onStartEmpty,
}: {
  activeDraft: WorkoutSessionDraft | null;
  onDiscard: () => void;
  onResume: () => void;
  onStartEmpty: () => void;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createQuickStartStyles(colors), [colors]);

  if (activeDraft) {
    return (
      <View style={styles.activeCard}>
        <View style={styles.activeTop}>
          <View style={styles.statusDot} />
          <Text style={styles.kicker}>Workout in progress</Text>
        </View>
        <Text numberOfLines={1} style={styles.activeTitle}>
          {activeDraft.workoutTitle || 'Empty workout'}
        </Text>
        <Text style={styles.activeMeta}>{activeDraft.sets.length} sets logged</Text>
        <View style={styles.actionRow}>
          <Pressable onPress={onResume} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryLabel}>Resume</Text>
          </Pressable>
          <Pressable onPress={onDiscard} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.destructiveLabel}>Discard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={onStartEmpty} style={({ pressed }) => [styles.startCard, pressed && styles.pressed]}>
      <View style={styles.playBadge}>
        <Text style={styles.playLabel}>▶</Text>
      </View>
      <View style={styles.startCopy}>
        <Text style={styles.kicker}>Quick start</Text>
        <Text style={styles.startTitle}>Start Empty Workout</Text>
        <Text style={styles.startMeta}>Open the logger and build the session as you train.</Text>
      </View>
    </Pressable>
  );
}

function StatStrip({ stats, weekActivity }: { stats: StatItem[]; weekActivity: ReturnType<typeof getWeekActivity> }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createStatsStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text numberOfLines={1} style={styles.statValue}>
              {stat.value}
            </Text>
            <Text numberOfLines={1} style={styles.statLabel}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.week}>
        {weekActivity.map((day) => (
          <View key={day.id} style={styles.day}>
            <View style={[styles.dayPill, day.active && styles.dayPillActive]} />
            <Text style={[styles.dayLabel, day.active && styles.dayLabelActive]}>{day.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RoutineFeatureCard({ summary, onOpen, onStart }: { summary: WorkoutTemplateSummary; onOpen: () => void; onStart: () => void }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createFeatureStyles(colors), [colors]);

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cover}>
        <Text style={styles.coverLabel}>{getExerciseInitial(summary.workout.title)}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>Next routine</Text>
        <Text numberOfLines={2} style={styles.title}>
          {summary.workout.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {summary.exerciseCount} exercises · {summary.estimatedDuration}
        </Text>
      </View>
      <Pressable onPress={onStart} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
        <Text style={styles.startLabel}>Start</Text>
      </Pressable>
    </Pressable>
  );
}

function RoutineRow({ summary, onOpen, onStart }: { summary: WorkoutTemplateSummary; onOpen: () => void; onStart: () => void }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createRoutineRowStyles(colors), [colors]);

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailLabel}>{getExerciseInitial(summary.workout.title)}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {summary.workout.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {summary.exerciseCount} exercises · {summary.estimatedDuration}
        </Text>
        {summary.subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {summary.subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" onPress={onStart} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
        <Text style={styles.startLabel}>Start</Text>
      </Pressable>
    </Pressable>
  );
}

function SessionRow({ session }: { session: WorkoutSession }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createSessionRowStyles(colors), [colors]);
  const exerciseCount = getSessionExercises(session).length;
  const volume = getSessionVolume(session);

  return (
    <View style={styles.row}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateLabel}>{formatSessionDate(session.finishedAt)}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {session.workoutTitle || 'Workout'}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {session.sets.length} sets · {exerciseCount} exercises · {getSessionTime(session)}
        </Text>
      </View>
      <Text style={styles.volume}>{formatNumber(volume)} kg</Text>
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createExerciseRowStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailLabel}>{getExerciseInitial(exercise.name)}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {exercise.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {getExerciseSubtitle(exercise)}
        </Text>
      </View>
      {exercise.isCustom ? <Text style={styles.badge}>Custom</Text> : null}
    </View>
  );
}

function EmptyState({ action, text, title }: { action?: ReactNode; text: string; title: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createEmptyStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {action}
    </View>
  );
}

export default function WorkoutsScreen() {
  const { exercises, isRestoringState, workoutSessions, workouts } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<TabKey>('routines');
  const [activeDraft, setActiveDraft] = useState<WorkoutSessionDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveWorkoutSessionDraft().then(() => {
      if (cancelled) {
        return;
      }

      setActiveDraft(getActiveWorkoutSessionDraft());
      setDraftReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const templateSummaries = useMemo(
    () => workouts.map((workout) => getWorkoutTemplateSummary(workout, workoutSessions)),
    [workouts, workoutSessions],
  );
  const suggestedRoutines = useMemo(() => getSuggestedWorkoutTemplates(workouts, workoutSessions), [workouts, workoutSessions]);
  const recentlyUsedRoutines = useMemo(() => getRecentlyUsedWorkoutTemplates(workouts, workoutSessions, 3), [workouts, workoutSessions]);
  const filteredRoutines = useMemo(
    () => templateSummaries.filter((summary) => matchesWorkoutQuery(summary, query)),
    [query, templateSummaries],
  );
  const filteredExercises = useMemo(() => searchExercises(exercises, query).slice(0, query.trim() ? 24 : 12), [exercises, query]);
  const recentSessions = useMemo(
    () => [...workoutSessions].sort((left, right) => new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime()),
    [workoutSessions],
  );
  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return recentSessions.slice(0, 12);
    }

    return recentSessions
      .filter((session) => {
        const haystack = [session.workoutTitle, ...session.sets.map((set) => set.exerciseName)].join(' ').toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 12);
  }, [query, recentSessions]);
  const weekActivity = useMemo(() => getWeekActivity(workoutSessions), [workoutSessions]);
  const weeklySessions = useMemo(() => weekActivity.filter((day) => day.active).length, [weekActivity]);
  const weeklyVolume = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(today.getDate() - 6);

    return workoutSessions.reduce((total, session) => {
      const timestamp = new Date(session.finishedAt).getTime();
      return timestamp >= start.getTime() ? total + getSessionVolume(session) : total;
    }, 0);
  }, [workoutSessions]);

  const featuredRoutine = suggestedRoutines[0] ?? templateSummaries[0];
  const stats: StatItem[] = [
    { label: 'This week', value: `${weeklySessions}` },
    { label: 'Routines', value: `${workouts.length}` },
    { label: 'Volume', value: weeklyVolume > 0 ? `${formatNumber(weeklyVolume)} kg` : '0 kg' },
  ];

  const openRoutine = (workoutId: string) => {
    router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } });
  };

  const startRoutine = (workout: Workout) => {
    const draft = startWorkoutSession(workout);
    setActiveDraft(draft);
    router.push({ pathname: '/workout-session', params: { workoutId: workout.id } });
  };

  const startEmptyWorkout = () => {
    const draft = startEmptyWorkoutSessionDraft();
    setActiveDraft(draft);
    router.push({ pathname: '/workout-session', params: { workoutId: draft.workoutId } });
  };

  const resumeActiveWorkout = () => {
    if (!activeDraft) {
      return;
    }

    router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } });
  };

  const discardActiveWorkout = () => {
    Alert.alert('Discard workout?', 'This removes the active workout draft. Completed sessions stay saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          clearActiveWorkoutSessionDraft();
          setActiveDraft(null);
        },
      },
    ]);
  };

  const openBuilder = () => {
    router.push('/workouts/builder');
  };

  const openExerciseLibrary = () => {
    router.push('/workouts/exercise-library');
  };

  if (isRestoringState || !draftReady) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>Loading workouts...</Text>
      </View>
    );
  }

  const renderRoutines = () => (
    <View style={styles.stack}>
      {featuredRoutine ? (
        <RoutineFeatureCard
          summary={featuredRoutine}
          onOpen={() => openRoutine(featuredRoutine.workout.id)}
          onStart={() => startRoutine(featuredRoutine.workout)}
        />
      ) : (
        <EmptyState
          title="No routines yet"
          text="Create a routine, then start it from this tab."
          action={
            <Pressable onPress={openBuilder} style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
              <Text style={styles.emptyActionLabel}>New routine</Text>
            </Pressable>
          }
        />
      )}

      {recentlyUsedRoutines.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Recently used" />
          <View style={styles.list}>
            {recentlyUsedRoutines.map((summary) => (
              <RoutineRow
                key={summary.workout.id}
                summary={summary}
                onOpen={() => openRoutine(summary.workout.id)}
                onStart={() => startRoutine(summary.workout)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionTitle
          title={query.trim() ? 'Matching routines' : 'All routines'}
          action={
            <Pressable onPress={openBuilder} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
              <Text style={styles.headerActionLabel}>New</Text>
            </Pressable>
          }
        />
        {filteredRoutines.length > 0 ? (
          <View style={styles.list}>
            {filteredRoutines.map((summary) => (
              <RoutineRow
                key={summary.workout.id}
                summary={summary}
                onOpen={() => openRoutine(summary.workout.id)}
                onStart={() => startRoutine(summary.workout)}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No matching routines" text="Try another search or create a new routine." />
        )}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.stack}>
      <View style={styles.section}>
        <SectionTitle title={query.trim() ? 'Matching sessions' : 'Recent sessions'} />
        {visibleSessions.length > 0 ? (
          <View style={styles.list}>
            {visibleSessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </View>
        ) : (
          <EmptyState title="No workout history" text="Finished sessions will show up here with sets, volume and time." />
        )}
      </View>
    </View>
  );

  const renderExercises = () => (
    <View style={styles.stack}>
      <View style={styles.section}>
        <SectionTitle
          title={query.trim() ? 'Matching exercises' : 'Exercise library'}
          action={
            <Pressable onPress={openExerciseLibrary} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
              <Text style={styles.headerActionLabel}>Manage</Text>
            </Pressable>
          }
        />
        {filteredExercises.length > 0 ? (
          <View style={styles.list}>
            {filteredExercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </View>
        ) : (
          <EmptyState title="No matching exercises" text="Open the library to add custom exercises." />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 112 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Workouts</Text>
                <Text style={styles.subtitle}>Plan, start, and review training.</Text>
              </View>
              <Pressable onPress={openBuilder} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <Text style={styles.iconButtonLabel}>+</Text>
              </Pressable>
            </View>

            <QuickStartCard
              activeDraft={activeDraft}
              onDiscard={discardActiveWorkout}
              onResume={resumeActiveWorkout}
              onStartEmpty={startEmptyWorkout}
            />

            <StatStrip stats={stats} weekActivity={weekActivity} />
            <SearchField value={query} onChangeText={setQuery} />
            <SegmentControl value={activeTab} onChange={setActiveTab} />
          </View>

          {activeTab === 'routines' ? renderRoutines() : activeTab === 'history' ? renderHistory() : renderExercises()}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <Pressable
            accessibilityRole="button"
            onPress={activeDraft ? resumeActiveWorkout : startEmptyWorkout}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
            <Text style={styles.footerButtonLabel}>{activeDraft ? 'Resume workout' : 'Start Empty Workout'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createSectionTitleStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    title: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 17,
      fontWeight: '900',
      lineHeight: 22,
    },
  });

const createSegmentStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 4,
      padding: 4,
    },
    item: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 16,
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 8,
    },
    itemPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    itemSelected: {
      backgroundColor: colors.surfaceElevated,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '900',
      lineHeight: 18,
    },
    labelSelected: {
      color: colors.textPrimary,
    },
  });

const createSearchStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    clearButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    clearLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '900',
      lineHeight: 16,
    },
    container: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 48,
      paddingHorizontal: Spacing.three,
    },
    icon: {
      color: colors.textMuted,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 18,
    },
    input: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      minWidth: 0,
      paddingVertical: 10,
    },
    pressed: {
      opacity: 0.72,
    },
  });

const createQuickStartStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actionRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: 4,
    },
    activeCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 6,
      padding: Spacing.four,
    },
    activeMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    activeTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 27,
    },
    activeTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
    },
    destructiveLabel: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '900',
    },
    kicker: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    playBadge: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      height: 54,
      justifyContent: 'center',
      width: 54,
    },
    playLabel: {
      color: colors.textOnAccent,
      fontSize: 16,
      fontWeight: '900',
      marginLeft: 2,
    },
    pressed: {
      opacity: 0.78,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
    },
    primaryLabel: {
      color: colors.textOnAccent,
      fontSize: 13,
      fontWeight: '900',
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
    },
    startCard: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      padding: Spacing.four,
    },
    startCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    startMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
    startTitle: {
      color: colors.textPrimary,
      fontSize: 21,
      fontWeight: '900',
      lineHeight: 26,
    },
    statusDot: {
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 8,
      width: 8,
    },
  });

const createStatsStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.three,
      padding: Spacing.three,
    },
    day: {
      alignItems: 'center',
      flex: 1,
      gap: 6,
    },
    dayLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '900',
      lineHeight: 13,
    },
    dayLabelActive: {
      color: colors.textPrimary,
    },
    dayPill: {
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 24,
      width: 8,
    },
    dayPillActive: {
      backgroundColor: colors.accent,
      height: 34,
    },
    statItem: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      lineHeight: 15,
    },
    stats: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 23,
    },
    week: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 6,
    },
  });

const createFeatureStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      padding: Spacing.three,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    cover: {
      alignItems: 'center',
      backgroundColor: colors.accentSoft,
      borderCurve: 'continuous',
      borderRadius: 18,
      height: 58,
      justifyContent: 'center',
      width: 58,
    },
    coverLabel: {
      color: colors.accent,
      fontSize: 24,
      fontWeight: '900',
    },
    kicker: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.4,
      lineHeight: 15,
      textTransform: 'uppercase',
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
    },
    pressed: {
      opacity: 0.78,
    },
    startButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    startLabel: {
      color: colors.textOnAccent,
      fontSize: 13,
      fontWeight: '900',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 23,
    },
  });

const createRoutineRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 16,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 72,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    rowPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    startButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 38,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    startLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '900',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
    },
    thumbnail: {
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 15,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    thumbnailLabel: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '900',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
      lineHeight: 20,
    },
  });

const createSessionRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    copy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    dateBadge: {
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: 7,
      width: 52,
    },
    dateLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '900',
      lineHeight: 14,
      textAlign: 'center',
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 68,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
      lineHeight: 20,
    },
    volume: {
      color: colors.textPrimary,
      flexShrink: 0,
      fontSize: 12,
      fontWeight: '900',
      maxWidth: 82,
      textAlign: 'right',
    },
  });

const createExerciseRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    badge: {
      backgroundColor: colors.accentSoft,
      borderCurve: 'continuous',
      borderRadius: 999,
      color: colors.accent,
      fontSize: 11,
      fontWeight: '900',
      overflow: 'hidden',
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    copy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 66,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    thumbnail: {
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderCurve: 'continuous',
      borderRadius: 15,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    thumbnailLabel: {
      color: colors.accent,
      fontSize: 17,
      fontWeight: '900',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
      lineHeight: 20,
    },
  });

const createEmptyStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      padding: Spacing.five,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
      textAlign: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '900',
      lineHeight: 22,
      textAlign: 'center',
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
      paddingTop: Spacing.three,
    },
    emptyAction: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      marginTop: Spacing.two,
      minHeight: 42,
      paddingHorizontal: Spacing.four,
    },
    emptyActionLabel: {
      color: colors.textOnAccent,
      fontSize: 13,
      fontWeight: '900',
    },
    footer: {
      backgroundColor: colors.background,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
    },
    footerButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      justifyContent: 'center',
      minHeight: 52,
    },
    footerButtonLabel: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '900',
    },
    header: {
      gap: Spacing.three,
    },
    headerAction: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: Spacing.three,
    },
    headerActionLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '900',
    },
    headerCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    headerTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    iconButtonLabel: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 26,
      marginTop: -2,
    },
    list: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
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
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      gap: Spacing.two,
    },
    stack: {
      gap: Spacing.four,
      paddingTop: Spacing.four,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 0,
      lineHeight: 37,
    },
  });
