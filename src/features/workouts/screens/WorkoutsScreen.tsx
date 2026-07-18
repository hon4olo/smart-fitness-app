import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
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

function SectionTitle({ title, rightLabel }: { title: string; rightLabel?: string }) {
  const { colors } = useWorkoutTheme();
  return (
    <View style={sectionTitleStyles.container}>
      <Text style={[sectionTitleStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      {rightLabel ? <Text style={[sectionTitleStyles.rightLabel, { color: colors.textSecondary }]}>{rightLabel}</Text> : null}
    </View>
  );
}

const sectionTitleStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
});

function WorkoutGridCard({
  subtitle,
  title,
  onPress,
  tileColor,
}: {
  subtitle?: string;
  title: string;
  onPress: () => void;
  tileColor: string;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.cover, { backgroundColor: tileColor }]}>
        <Text style={styles.coverLabel}>{title.slice(0, 1).toUpperCase()}</Text>
      </View>
      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const createCardStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    cardPressed: {
      opacity: 0.78,
    },
    cover: {
      alignItems: 'center',
      aspectRatio: 0.88,
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
    subtitle: {
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
  iconLabel,
  onPress,
  title,
  subtitle,
}: {
  countLabel: string;
  iconLabel: string;
  onPress: () => void;
  title: string;
  subtitle?: string;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createListStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.icon}><Text style={styles.iconLabel}>{iconLabel}</Text></View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.count}>{countLabel}</Text>
    </Pressable>
  );
}

const createListStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    count: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
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
      height: 32,
      justifyContent: 'center',
      width: 32,
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
      paddingVertical: 8,
    },
    rowPressed: {
      backgroundColor: '#222A32',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
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
  const insets = useSafeAreaInsets();
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
  const favoritePrograms = useMemo(() => programSummaries.filter((summary) => summary.isFavorite), [programSummaries]);
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
      <SectionTitle title="Suggested Workouts" />
      <View style={styles.grid}>
        {suggestedWorkouts.map((summary, index) => (
          <WorkoutGridCard
            key={summary.workout.id}
            subtitle={summary.subtitle || summary.estimatedDuration}
            title={summary.workout.title}
            tileColor={index % 3 === 0 ? '#3D5AFE' : index % 3 === 1 ? '#7C4DFF' : '#FF6D5A'}
            onPress={() => openWorkout(summary.workout.id)}
          />
        ))}
      </View>

      <SectionTitle title="Recently Added" />
      <View style={styles.grid}>
        {recentWorkouts.map((summary, index) => (
          <WorkoutGridCard
            key={summary.workout.id}
            subtitle={summary.subtitle || summary.estimatedDuration}
            title={summary.workout.title}
            tileColor={index % 2 === 0 ? '#00C2FF' : '#15C39A'}
            onPress={() => openWorkout(summary.workout.id)}
          />
        ))}
      </View>
    </View>
  );

  const renderPrograms = () => (
    <View style={styles.sectionStack}>
      <Pressable onPress={createProgram} style={({ pressed }) => [styles.addProgramRow, pressed && styles.rowPressed]}>
        <View style={styles.addProgramIcon}><Text style={styles.addProgramIconLabel}>+</Text></View>
        <View style={styles.addProgramCopy}>
          <Text style={styles.addProgramTitle}>Create program</Text>
          <Text style={styles.addProgramSubtitle}>Create a new training split</Text>
        </View>
      </Pressable>

      {favoritePrograms.length > 0 ? (
        <View style={styles.sectionBlock}>
          <SectionTitle title="Favorites" />
          <View style={styles.listCard}>
            {favoritePrograms.map((summary, index) => (
              <View key={summary.program.id} style={index > 0 ? styles.dividerTop : undefined}>
                <WorkoutListRow
                  countLabel={`${summary.workoutCount} workout${summary.workoutCount === 1 ? '' : 's'}`}
                  iconLabel={summary.program.name.slice(0, 1).toUpperCase()}
                  subtitle={summary.subtitle}
                  title={summary.program.name}
                  onPress={() => openProgram(summary.program.id)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <SectionTitle title="Programs" />
        <View style={styles.listCard}>
          {programSummaries.map((summary, index) => (
            <View key={summary.program.id} style={index > 0 ? styles.dividerTop : undefined}>
              <WorkoutListRow
                countLabel={`${summary.workoutCount} workout${summary.workoutCount === 1 ? '' : 's'}`}
                iconLabel={summary.program.name.slice(0, 1).toUpperCase()}
                subtitle={summary.subtitle}
                title={summary.program.name}
                onPress={() => openProgram(summary.program.id)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 64 }]}
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

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + 2 }]}>
        <View style={styles.container}>{renderStickyAction()}</View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    activeActions: {
      flexDirection: 'row',
      gap: 6,
    },
    activeBlock: {
      alignItems: 'flex-start',
      backgroundColor: '#171C22',
      borderColor: '#242C34',
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
      padding: 8,
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
    addProgramCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    addProgramIcon: {
      alignItems: 'center',
      backgroundColor: '#222A32',
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    addProgramIconLabel: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 24,
    },
    addProgramRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingVertical: 2,
    },
    addProgramSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    addProgramTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
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
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: 0,
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    header: {
      gap: Spacing.two,
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
      height: 34,
      justifyContent: 'center',
      width: 34,
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
      backgroundColor: '#222A32',
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    secondaryPillLabel: {
      color: '#F4F7FA',
      fontSize: 13,
      fontWeight: '900',
    },
    sectionBlock: {
      gap: 8,
      marginTop: 8,
    },
    sectionStack: {
      gap: 8,
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
