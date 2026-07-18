import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
  getRecentlyUsedWorkoutTemplates,
  getSuggestedWorkoutTemplates,
  getWorkoutProgramSummary,
  getWorkoutPrograms,
  hydrateActiveWorkoutSessionDraft,
  setActiveWorkoutSessionDraft,
} from '@/lib/workouts';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
// useAppTheme is intentionally bypassed here so the workouts flow stays workout-scoped dark.

const tabs = [
  { key: 'start-now', label: 'Start now' },
  { key: 'programs', label: 'Programs' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

function createEmptyWorkoutDraft() {
  return {
    id: `${Date.now()}`,
    workoutId: 'empty-workout',
    workoutTitle: 'Empty workout',
    startedAt: new Date().toISOString(),
    sets: [],
  };
}

function SectionHeader({ action, title }: { action?: ReactNode; title: string }) {
  const { colors } = useWorkoutTheme();
  return (
    <View style={sectionHeaderStyles.container}>
      <Text style={[sectionHeaderStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      {action ? <View style={sectionHeaderStyles.action}>{action}</View> : null}
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  action: {
    flexShrink: 0,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    minWidth: 0,
  },
});

function WorkoutGridCard({
  line2,
  line3,
  onPress,
  tileColor,
  title,
}: {
  line2: string;
  line3: string;
  onPress: () => void;
  tileColor: string;
  title: string;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.cover, { backgroundColor: tileColor }]}>
        <Text style={styles.coverLabel}>{title.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.metaLinePrimary}>
          {line2}
        </Text>
        <Text numberOfLines={1} style={styles.metaLineSecondary}>
          {line3}
        </Text>
      </View>
    </Pressable>
  );
}

const createCardStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: 8,
      minWidth: 0,
    },
    cardPressed: {
      opacity: 0.78,
    },
    copy: {
      gap: 2,
      minHeight: 44,
    },
    cover: {
      alignItems: 'center',
      aspectRatio: 0.96,
      borderCurve: 'continuous',
      borderRadius: 24,
      justifyContent: 'center',
      overflow: 'hidden',
      width: '100%',
    },
    coverLabel: {
      color: colors.background,
      fontSize: 26,
      fontWeight: '900',
      opacity: 0.9,
    },
    metaLinePrimary: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 16,
    },
    metaLineSecondary: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
      lineHeight: 18,
    },
  });

function WorkoutListRow({
  countLabel,
  detailLabel,
  iconLabel,
  onPress,
  title,
}: {
  countLabel: string;
  detailLabel?: string;
  iconLabel: string;
  onPress: () => void;
  title: string;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createListStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.icon}>
        <Text style={styles.iconLabel}>{iconLabel}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.count}>
          {countLabel}
        </Text>
        {detailLabel ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {detailLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const createListStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    count: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 16,
    },
    copy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: '#222A32',
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    iconLabel: {
      color: '#0F1317',
      fontSize: 14,
      fontWeight: '900',
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
      width: '100%',
    },
    rowPressed: {
      backgroundColor: '#222A32',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
  });

export default function WorkoutsScreen() {
  const { workoutSessions, workouts, isRestoringState } = useAppContext();
  const { colors } = useWorkoutTheme();
  const [viewMode, setViewMode] = useState<TabKey>('start-now');
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hydrateActiveWorkoutSessionDraft().then(() => {
      if (!cancelled) {
        setDraftReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeDraft = draftReady ? getActiveWorkoutSessionDraft() : null;
  const programs = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const programSummaries = useMemo(
    () => programs.map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions)),
    [programs, workouts, workoutSessions],
  );
  const suggestedWorkouts = useMemo(() => getSuggestedWorkoutTemplates(workouts, workoutSessions), [workouts, workoutSessions]);
  const recentWorkouts = useMemo(() => getRecentlyUsedWorkoutTemplates(workouts, workoutSessions), [workouts, workoutSessions]);

  const openWorkout = (workoutId: string) => {
    router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } });
  };

  const openProgram = (programId: string) => {
    router.push({ pathname: '/workouts/program/[programId]', params: { programId } });
  };

  const createProgram = () => {
    router.push('/workouts/builder');
  };

  const startEmptyWorkout = () => {
    const draft = createEmptyWorkoutDraft();
    setActiveWorkoutSessionDraft(draft);
    router.push({ pathname: '/workout-session', params: { workoutId: draft.workoutId } });
  };

  const resumeActiveWorkout = () => {
    if (!activeDraft) {
      return;
    }

    router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } });
  };

  const discardActiveWorkout = () => {
    Alert.alert('Discard workout?', 'This will remove the active workout draft.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          clearActiveWorkoutSessionDraft();
        },
      },
    ]);
  };

  if (isRestoringState || !draftReady) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingLabel}>Loading workouts…</Text>
        </View>
      </View>
    );
  }

  const renderStickyAction = () => {
    if (activeDraft) {
      return (
        <View style={styles.activeBlock}>
          <Text style={styles.activeLabel}>Workout in progress</Text>
          <Text selectable numberOfLines={1} style={styles.activeTitle}>
            {activeDraft.workoutTitle || 'Empty workout'}
          </Text>
          <View style={styles.activeActions}>
            <Pressable onPress={resumeActiveWorkout} style={({ pressed }) => [styles.secondaryPill, pressed && styles.pressed]}>
              <Text style={styles.secondaryPillLabel}>Resume</Text>
            </Pressable>
            <Pressable onPress={discardActiveWorkout} style={({ pressed }) => [styles.secondaryPill, pressed && styles.pressed]}>
              <Text style={[styles.secondaryPillLabel, styles.discardLabel]}>Discard</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <Pressable onPress={startEmptyWorkout} style={({ pressed }) => [styles.stickyPill, pressed && styles.pressed]}>
        <Text style={styles.stickyIcon}>▶</Text>
        <Text style={styles.stickyText}>Start an Empty Workout</Text>
      </Pressable>
    );
  };

  const renderStartNow = () => (
    <View style={styles.sectionStack}>
      <View style={styles.sectionBlock}>
        <SectionHeader title="Suggested Workouts" />
        <View style={styles.grid}>
          {suggestedWorkouts.map((summary, index) => (
            <WorkoutGridCard
              key={summary.workout.id}
              line2={`${summary.exerciseCount} exercises`}
              line3={summary.estimatedDuration ? summary.estimatedDuration : 'Duration unavailable'}
              title={summary.workout.title}
              tileColor={index % 3 === 0 ? '#3D5AFE' : index % 3 === 1 ? '#7C4DFF' : '#FF6D5A'}
              onPress={() => openWorkout(summary.workout.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeader title="Recently Added" />
        <View style={styles.grid}>
          {recentWorkouts.map((summary, index) => (
            <WorkoutGridCard
              key={summary.workout.id}
              line2={`${summary.exerciseCount} exercises`}
              line3={summary.estimatedDuration ? summary.estimatedDuration : 'Duration unavailable'}
              title={summary.workout.title}
              tileColor={index % 2 === 0 ? '#00C2FF' : '#15C39A'}
              onPress={() => openWorkout(summary.workout.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderPrograms = () => (
    <View style={styles.sectionStack}>
      <SectionHeader
        action={
          <Pressable onPress={createProgram} style={({ pressed }) => [styles.addProgramAction, pressed && styles.pressed]}>
            <Text style={styles.addProgramActionLabel}>+</Text>
          </Pressable>
        }
        title="Programs"
      />

      <View style={styles.listCard}>
        {programSummaries.map((summary, index) => (
          <View key={summary.program.id} style={index > 0 ? styles.dividerTop : undefined}>
            <WorkoutListRow
              countLabel={`${summary.workoutCount} workout${summary.workoutCount === 1 ? '' : 's'}`}
              detailLabel={summary.subtitle}
              iconLabel={summary.program.name.slice(0, 1).toUpperCase()}
              title={summary.program.name}
              onPress={() => openProgram(summary.program.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.two }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Workouts</Text>
              <Pressable onPress={() => Alert.alert('Search workouts', 'Coming soon.')} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
                <Text style={styles.searchLabel}>⌕</Text>
              </Pressable>
            </View>
            <View style={styles.tabs}>
              {tabs.map((tab) => {
                const selected = viewMode === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setViewMode(tab.key)}
                    style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && !selected && styles.tabPressed]}>
                    <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {viewMode === 'start-now' ? renderStartNow() : renderPrograms()}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <View style={styles.container}>{renderStickyAction()}</View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    activeActions: {
      flexDirection: 'row',
      gap: 8,
    },
    activeBlock: {
      alignSelf: 'stretch',
      alignItems: 'flex-start',
      backgroundColor: '#171C22',
      borderColor: '#242C34',
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
      padding: 12,
      width: '100%',
    },
    activeLabel: {
      color: '#A8B1BB',
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    activeTitle: {
      color: '#F4F7FA',
      fontSize: 18,
      fontWeight: '900',
    },
    addProgramAction: {
      alignItems: 'center',
      backgroundColor: '#222A32',
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    addProgramActionLabel: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 24,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
    },
    discardLabel: {
      color: '#E37E8B',
    },
    dividerTop: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      marginBottom: 8,
      paddingHorizontal: Spacing.three,
      paddingTop: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    header: {
      gap: 16,
    },
    headerTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
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
    listCard: {
      backgroundColor: '#171C22',
      borderColor: '#242C34',
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.72,
    },
    rowPressed: {
      backgroundColor: '#222A32',
    },
    searchButton: {
      alignItems: 'center',
      backgroundColor: '#222A32',
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    searchLabel: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 18,
      marginTop: -1,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    secondaryPill: {
      alignItems: 'center',
      backgroundColor: '#222A32',
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    secondaryPillLabel: {
      color: '#F4F7FA',
      fontSize: 13,
      fontWeight: '900',
    },
    sectionBlock: {
      gap: 12,
      marginTop: 0,
    },
    sectionStack: {
      gap: 20,
    },
    stickyIcon: {
      color: '#0F1317',
      fontSize: 14,
      fontWeight: '900',
    },
    stickyPill: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 10,
    },
    stickyText: {
      color: '#0F1317',
      fontSize: 14,
      fontWeight: '900',
    },
    tab: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tabLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '900',
    },
    tabLabelSelected: {
      color: colors.textPrimary,
    },
    tabPressed: {
      backgroundColor: '#222A32',
    },
    tabSelected: {
      backgroundColor: '#222A32',
    },
    tabs: {
      backgroundColor: '#171C22',
      borderColor: '#242C34',
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 4,
      padding: 4,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
  });
