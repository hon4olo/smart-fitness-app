import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { DEFAULT_WORKOUT_PROGRAM_ID, clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, getWorkoutPrograms, getWorkoutTemplateSummary, hydrateActiveWorkoutSessionDraft } from '@/lib/workouts';
import { formatWorkoutSessionElapsedLabel } from '@/features/workouts/sessionModel';
import { useAppTheme } from '@/theme/AppThemeProvider';

const segmentedTabs = [
  { label: 'Start now', value: 'start-now' as const },
  { label: 'Programs', value: 'programs' as const },
];

type ViewMode = (typeof segmentedTabs)[number]['value'];

type Styles = ReturnType<typeof createStyles>;

const sessionDateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

function Panel({ children, styles }: { children: React.ReactNode; styles: Styles }) {
  return <View style={styles.panel}>{children}</View>;
}

function Row({ children, onPress, styles }: { children: React.ReactNode; onPress?: () => void; styles: Styles }) {
  if (!onPress) {
    return <View style={styles.row}>{children}</View>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {children}
    </Pressable>
  );
}

function Chevron({ styles }: { styles: Styles }) {
  return <Text style={styles.chevron}>›</Text>;
}

function WorkoutRow({
  label,
  meta,
  subtitle,
  initial,
  onPress,
  styles,
}: {
  label: string;
  meta: string;
  subtitle?: string;
  initial: string;
  onPress?: () => void;
  styles: Styles;
}) {
  return (
    <Row onPress={onPress} styles={styles}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconLabel}>{initial}</Text>
      </View>
      <View style={styles.rowCopy}>
        <View style={styles.rowHeading}>
          <Text numberOfLines={1} selectable style={styles.rowTitle}>
            {label}
          </Text>
          {onPress ? <Chevron styles={styles} /> : null}
        </View>
        <Text selectable style={styles.rowMeta}>
          {meta}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} selectable style={styles.rowSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Row>
  );
}

export default function WorkoutsScreen() {
  const { workoutSessions, workouts, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('start-now');
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

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    const activeDraft = getActiveWorkoutSessionDraft();
    if (activeDraft?.workoutId === 'empty-workout') {
      clearActiveWorkoutSessionDraft();
    }
  }, [draftReady]);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeDraft = draftReady ? getActiveWorkoutSessionDraft() : null;
  const visibleActiveDraft = activeDraft?.workoutId === 'empty-workout' ? null : activeDraft;
  const activeWorkout = visibleActiveDraft ? workouts.find((workout) => workout.id === visibleActiveDraft.workoutId) ?? null : null;
  const programs = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const templateSummaries = useMemo(() => workouts.map((workout) => getWorkoutTemplateSummary(workout, workoutSessions)), [workouts, workoutSessions]);
  const defaultProgramId = DEFAULT_WORKOUT_PROGRAM_ID;

  const openProgram = (programId: string) => {
    router.push({ pathname: '/workouts/program/[programId]', params: { programId } });
  };

  const openTemplate = (workoutId: string) => {
    router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId } });
  };

  const createProgram = () => {
    router.push('/workouts/builder');
  };

  const renderStartNow = () => (
    <View style={styles.sectionStack}>
      {visibleActiveDraft && activeWorkout ? (
        <Panel styles={styles}>
          <Row onPress={() => router.push({ pathname: '/workout-session', params: { workoutId: visibleActiveDraft.workoutId } })} styles={styles}>
            <View style={styles.bannerIcon}>
              <Text style={styles.bannerIconLabel}>{activeWorkout.title.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.rowCopy}>
              <View style={styles.rowHeading}>
                <Text numberOfLines={1} selectable style={styles.rowTitle}>
                  {activeWorkout.title}
                </Text>
                <Chevron styles={styles} />
              </View>
              <Text selectable style={styles.rowMeta}>
                {formatWorkoutSessionElapsedLabel(visibleActiveDraft.startedAt)} elapsed · {sessionDateFormatter.format(new Date(visibleActiveDraft.startedAt))}
              </Text>
              <Text selectable style={styles.rowSubtitle}>
                {visibleActiveDraft.sets.filter((set) => set.completed !== false).length} completed set{visibleActiveDraft.sets.filter((set) => set.completed !== false).length === 1 ? '' : 's'}
              </Text>
              <View style={styles.inlineAction}>
                <Text style={styles.inlineActionLabel}>Continue</Text>
              </View>
            </View>
          </Row>
        </Panel>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Templates
        </Text>
      </View>

      <View style={styles.stack}>
        {templateSummaries.map((summary, index) => (
          <View key={summary.workout.id} style={[styles.stackItem, index > 0 && styles.dividerTop]}>
            <WorkoutRow
              initial={summary.workout.title.slice(0, 1).toUpperCase()}
              label={summary.workout.title}
              meta={`${summary.exerciseCount} exercises`}
              subtitle={summary.subtitle || undefined}
              onPress={() => openTemplate(summary.workout.id)}
              styles={styles}
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderPrograms = () => (
    <View style={styles.sectionStack}>
      <AppButton label="Create program" onPress={createProgram} />

      <View style={styles.stack}>
        {programs.map((program, index) => {
          const workoutCount = program.days.filter((day) => !day.restDay && Boolean(day.workoutTemplateId)).length;
          const isDefaultProgram = program.id === defaultProgramId;

          return (
            <View key={program.id} style={[styles.stackItem, index > 0 && styles.dividerTop]}>
              <WorkoutRow
                initial="P"
                label={program.name}
                meta={`${workoutCount} workout${workoutCount === 1 ? '' : 's'}`}
                subtitle={isDefaultProgram ? 'Default program' : undefined}
                onPress={() => openProgram(program.id)}
                styles={styles}
              />
            </View>
          );
        })}
      </View>
    </View>
  );

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text selectable style={styles.loadingLabel}>
            Loading workouts…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 96 }]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text selectable style={styles.title}>
              Workouts
            </Text>
            <View style={styles.tabs}>
              {segmentedTabs.map((tab) => {
                const selected = viewMode === tab.value;
                return (
                  <Pressable
                    key={tab.value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setViewMode(tab.value)}
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
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    bannerIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 16,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    bannerIconLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    dividerTop: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    header: {
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    inlineAction: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      marginTop: Spacing.one,
      paddingHorizontal: Spacing.two,
      paddingVertical: 6,
    },
    inlineActionLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
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
    panel: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.three,
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingVertical: Spacing.two,
    },
    rowCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    rowHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
      justifyContent: 'space-between',
      minWidth: 0,
    },
    rowIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    rowIconLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    rowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    rowPressed: {
      opacity: 0.7,
    },
    rowSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    rowTitle: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      minWidth: 0,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    sectionHeader: {
      marginBottom: Spacing.one,
      marginTop: Spacing.two,
    },
    sectionStack: {
      gap: Spacing.three,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    stack: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    stackItem: {
      paddingHorizontal: Spacing.three,
    },
    chevron: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
    },
    tab: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 38,
      paddingHorizontal: Spacing.two,
      paddingVertical: 10,
    },
    tabLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
    },
    tabLabelSelected: {
      color: colors.textPrimary,
    },
    tabPressed: {
      opacity: 0.8,
    },
    tabSelected: {
      backgroundColor: colors.borderSubtle,
    },
    tabs: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
  });
