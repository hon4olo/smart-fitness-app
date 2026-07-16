import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { BottomTabInset, Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  createDefaultTrainingProgram,
  getActiveWorkoutSessionDraft,
  getSessionExercises,
  getSessionVolume,
  getWorkoutHubViewModel,
  getWorkoutProgramSchedule,
  getWorkoutProgramSummary,
  getWorkoutPrograms,
  getWorkoutTemplateSummary,
  startEmptyWorkoutSessionDraft,
  startWorkoutSessionDraft,
} from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';

const viewModeOptions = [
  { label: 'Start now', value: 'start-now' as const },
  { label: 'Programs', value: 'programs' as const },
];

type ViewMode = (typeof viewModeOptions)[number]['value'];

type WorkoutStyles = ReturnType<typeof createStyles>;

const sessionDateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

const formatDurationLabel = (startedAt: string, finishedAt: string) => {
  const elapsedMs = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  const totalMinutes = Math.max(0, Math.round(elapsedMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

function SectionHeaderRow({ actionLabel, onActionPress, styles, subtitle, title }: { actionLabel?: string; onActionPress?: () => void; styles: WorkoutStyles; subtitle?: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text selectable style={styles.sectionTitle}>
          {title}
        </Text>
        {subtitle ? <Text selectable style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityRole="button" onPress={onActionPress} style={({ pressed }) => [styles.sectionAction, pressed && styles.sectionActionPressed]}>
          <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StartRow({
  onPress,
  styles,
  title,
  meta,
  extra,
}: {
  extra?: string;
  meta: string;
  onPress: () => void;
  styles: WorkoutStyles;
  title: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.templateRow, pressed && styles.rowPressed]}>
      <View style={styles.rowCopy}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} selectable style={styles.rowTitle}>
            {title}
          </Text>
          <Text style={styles.rowChevron}>›</Text>
        </View>
        <Text selectable style={styles.rowMeta}>
          {meta}
        </Text>
        {extra ? (
          <Text numberOfLines={1} selectable style={styles.rowSecondary}>
            {extra}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowActionPill}>
        <Text style={styles.rowActionPillLabel}>Start</Text>
      </View>
    </Pressable>
  );
}

function SessionInfoRow({
  styles,
  title,
  dateLabel,
  meta,
  volumeLabel,
}: {
  dateLabel: string;
  meta: string;
  styles: WorkoutStyles;
  title: string;
  volumeLabel: string;
}) {
  return (
    <View style={styles.sessionRow}>
      <View style={styles.rowCopy}>
        <View style={styles.rowTitleLine}>
          <Text selectable style={styles.rowTitle}>
            {dateLabel}
          </Text>
          <Text style={styles.rowChevron}>·</Text>
          <Text selectable style={styles.sessionWorkoutName} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text selectable style={styles.rowMeta}>
          {meta}
        </Text>
      </View>
      <Text selectable style={styles.sessionVolume}>
        {volumeLabel}
      </Text>
    </View>
  );
}

function ProgramCard({
  active,
  onOpen,
  scheduleLabel,
  styles,
  summary,
}: {
  active: boolean;
  onOpen: () => void;
  scheduleLabel?: string;
  styles: WorkoutStyles;
  summary: ReturnType<typeof getWorkoutProgramSummary>;
}) {
  return (
    <AppCard style={styles.programCard}>
      <View style={styles.programTopRow}>
        <View style={styles.programCopy}>
          <Text selectable style={styles.programTitle}>
            {summary.program.name}
          </Text>
          <Text selectable style={styles.programMeta}>
            {summary.workoutCount} weekly workouts · {summary.program.durationWeeks} weeks
          </Text>
        </View>
        <View style={[styles.statePill, active ? styles.statePillActive : styles.statePillInactive]}>
          <Text style={[styles.statePillLabel, active ? styles.statePillLabelActive : styles.statePillLabelInactive]}>{active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <Text selectable style={styles.programSecondary}>
        {summary.subtitle}
      </Text>

      {scheduleLabel ? (
        <Text selectable style={styles.programNext}>
          Next: {scheduleLabel}
        </Text>
      ) : null}

      <AppButton label="Open program" onPress={onOpen} variant="secondary" />
    </AppCard>
  );
}

export default function WorkoutsScreen() {
  const { workoutSessions, workouts } = useAppContext();
  const { colors } = useAppTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('start-now');

  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentProgram = useMemo(() => createDefaultTrainingProgram(workouts), [workouts]);
  const hub = useMemo(() => getWorkoutHubViewModel({ activeProgram: currentProgram, workouts, workoutSessions }), [currentProgram, workoutSessions, workouts]);
  const allPrograms = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const currentProgramSummary = useMemo(() => getWorkoutProgramSummary(currentProgram, workouts, workoutSessions), [currentProgram, workoutSessions, workouts]);
  const programSummaries = useMemo(() => allPrograms.map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions)), [allPrograms, workoutSessions, workouts]);
  const savedProgramSummaries = useMemo(() => programSummaries.filter((item) => item.program.isCustom), [programSummaries]);
  const templateSummaries = useMemo(() => workouts.map((workout) => getWorkoutTemplateSummary(workout, workoutSessions)), [workouts, workoutSessions]);
  const recentSessions = useMemo(() => [...workoutSessions].sort((left, right) => right.finishedAt.localeCompare(left.finishedAt)).slice(0, 3), [workoutSessions]);
  const activeDraft = getActiveWorkoutSessionDraft();
  const activeWorkoutSummary = hub.activeWorkout;
  const hasHistory = workoutSessions.length > 0;
  const hasSavedPrograms = savedProgramSummaries.length > 0;

  const openWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) {
      return;
    }

    if (activeDraft?.workoutId === workoutId) {
      router.push('/workout-session');
      return;
    }

    startWorkoutSessionDraft(workout);
    router.push('/workout-session');
  };

  const handleStartEmpty = () => {
    startEmptyWorkoutSessionDraft();
    router.push('/workout-session');
  };

  const handleOpenProgramBuilder = () => {
    router.push('/workouts/builder');
  };

  const openProgram = (programId: string) => {
    router.push({ pathname: '/workouts/program/[programId]', params: { programId } });
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.six }]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text selectable style={styles.screenTitle}>
            Workouts
          </Text>
          <View style={styles.segmentedControl}>
            {viewModeOptions.map((option) => {
              const selected = viewMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setViewMode(option.value)}
                  style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && !selected && styles.segmentPressed]}>
                  <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {viewMode === 'start-now' ? (
          <>
            {activeWorkoutSummary ? (
              <AppCard style={styles.activeCard}>
                <Text selectable style={styles.activeBadge}>
                  Workout in progress
                </Text>
                <View style={styles.activeHeaderRow}>
                  <Text selectable style={styles.activeTitle}>
                    {activeWorkoutSummary.workout.title}
                  </Text>
                  <Text selectable style={styles.activeElapsed}>
                    {activeWorkoutSummary.elapsedLabel}
                  </Text>
                </View>
                <Text selectable style={styles.activeMeta}>
                  {activeWorkoutSummary.completedExercises} of {activeWorkoutSummary.exerciseCount} exercises completed
                </Text>
                <AppButton label="Continue workout" onPress={() => router.push('/workout-session')} />
              </AppCard>
            ) : null}

            <AppCard style={styles.sectionCard}>
              <SectionHeaderRow
                styles={styles}
                subtitle={activeDraft ? 'Start another session or jump into a template.' : 'Start from scratch or pick a template.'}
                title="Quick start"
              />
              <AppButton label="Start empty workout" onPress={handleStartEmpty} />

              <View style={styles.rowGroup}>
                {templateSummaries.map((summary, index) => (
                  <View key={summary.workout.id} style={[styles.rowWrap, index > 0 && styles.rowDivider]}>
                    <StartRow
                      extra={summary.lastUsedLabel ? `Last used ${summary.lastUsedLabel}` : undefined}
                      meta={`${summary.exerciseCount} exercises · ${summary.estimatedDuration}`}
                      onPress={() => openWorkout(summary.workout.id)}
                      styles={styles}
                      title={summary.workout.title}
                    />
                  </View>
                ))}
              </View>
            </AppCard>

            <AppCard style={styles.sectionCard}>
              <SectionHeaderRow actionLabel={hasHistory ? 'View history' : undefined} onActionPress={hasHistory ? () => router.push('/workouts/history') : undefined} styles={styles} subtitle="Latest completed sessions." title="Recent workouts" />

              {recentSessions.length > 0 ? (
                <View style={styles.rowGroup}>
                  {recentSessions.map((session, index) => {
                    const completedExercises = getSessionExercises(session).length;
                    const volume = getSessionVolume(session);
                    const duration = formatDurationLabel(session.startedAt, session.finishedAt);
                    const dateLabel = sessionDateFormatter.format(new Date(session.finishedAt));

                    return (
                      <View key={session.id} style={[styles.rowWrap, index > 0 && styles.rowDivider]}>
                        <SessionInfoRow
                          dateLabel={dateLabel}
                          meta={`${duration} · ${completedExercises} exercises`}
                          styles={styles}
                          title={session.workoutTitle}
                          volumeLabel={`${volume.toLocaleString()} kg`}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text selectable style={styles.sectionEmptyText}>
                  Complete a workout to see recent sessions here.
                </Text>
              )}
            </AppCard>
          </>
        ) : (
          <View style={styles.sectionStack}>
            <AppCard style={styles.sectionCard}>
              <SectionHeaderRow styles={styles} subtitle="Saved plans stay separate from workout templates." title="Programs" />

              <AppCard style={styles.programCard}>
                <View style={styles.programTopRow}>
                  <View style={styles.programCopy}>
                    <Text selectable style={styles.programTitle}>
                      {currentProgramSummary.program.name}
                    </Text>
                    <Text selectable style={styles.programMeta}>
                      {currentProgramSummary.workoutCount} weekly workouts · {currentProgramSummary.program.durationWeeks} weeks
                    </Text>
                  </View>
                  <View style={[styles.statePill, styles.statePillActive]}>
                    <Text style={[styles.statePillLabel, styles.statePillLabelActive]}>Active</Text>
                  </View>
                </View>
                <Text selectable style={styles.programSecondary}>
                  {currentProgramSummary.subtitle}
                </Text>
                {getWorkoutProgramSchedule(currentProgram).nextWorkout?.workoutTemplateName ? (
                  <Text selectable style={styles.programNext}>
                    Next: {getWorkoutProgramSchedule(currentProgram).nextWorkout?.workoutTemplateName}
                  </Text>
                ) : null}
                <AppButton label="Open program" onPress={() => openProgram(currentProgramSummary.program.id)} variant="secondary" />
              </AppCard>

              {hasSavedPrograms ? (
                <View style={styles.programList}>
                  {savedProgramSummaries.map((summary, index) => {
                    const schedule = getWorkoutProgramSchedule(summary.program);
                    return (
                      <View key={summary.program.id} style={[styles.programRowWrap, index > 0 && styles.rowDivider]}>
                        <ProgramCard
                          active={false}
                          onOpen={() => openProgram(summary.program.id)}
                          scheduleLabel={schedule.nextWorkout?.workoutTemplateName}
                          styles={styles}
                          summary={summary}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyProgramsCard}>
                  <Text selectable style={styles.emptyProgramsTitle}>
                    No saved programs yet
                  </Text>
                  <Text selectable style={styles.emptyProgramsCopy}>
                    Templates can still be used without creating a program.
                  </Text>
                  <AppButton label="Create program" onPress={handleOpenProgramBuilder} />
                </View>
              )}
            </AppCard>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    activeBadge: {
      color: colors.accent,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      textTransform: Typography.sectionTitle.textTransform,
    },
    activeCard: {
      gap: Spacing.two,
    },
    activeElapsed: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.callout.lineHeight,
    },
    activeHeaderRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    activeMeta: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    activeTitle: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    container: {
      alignSelf: 'center',
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      padding: Spacing.three,
    },
    emptyProgramsCard: {
      gap: Spacing.two,
      paddingTop: Spacing.one,
    },
    emptyProgramsCopy: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    emptyProgramsTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    headerBlock: {
      gap: Spacing.two,
    },
    programCard: {
      gap: Spacing.three,
      padding: Spacing.four,
    },
    programCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    programList: {
      gap: Spacing.two,
    },
    programMeta: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    programNext: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    programRowWrap: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: Spacing.two,
    },
    programSecondary: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    programTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    programTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    rowActionPill: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSelected,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      justifyContent: 'center',
      minHeight: 32,
      minWidth: 56,
      paddingHorizontal: Spacing.two,
    },
    rowActionPillLabel: {
      color: colors.textPrimary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      lineHeight: Typography.caption.lineHeight,
    },
    rowChevron: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontWeight: '800',
      lineHeight: Typography.callout.lineHeight,
    },
    rowCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowGroup: {
      gap: Spacing.two,
    },
    rowMeta: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    rowPressed: {
      opacity: 0.88,
    },
    rowSecondary: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    rowTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      minWidth: 0,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 34,
    },
    sectionAction: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    sectionActionLabel: {
      color: colors.accent,
      fontSize: Typography.callout.fontSize,
      fontWeight: '800',
      lineHeight: Typography.callout.lineHeight,
    },
    sectionActionPressed: {
      opacity: 0.8,
    },
    sectionCard: {
      gap: Spacing.three,
      padding: Spacing.four,
    },
    sectionEmptyText: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    sectionHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    sectionHeaderCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    sectionStack: {
      gap: Spacing.three,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    segmentedControl: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      padding: 2,
    },
    sessionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 64,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    sessionVolume: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.callout.lineHeight,
    },
    sessionWorkoutName: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '800',
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    statePill: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      minHeight: 28,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
    },
    statePillActive: {
      backgroundColor: colors.accentSoft,
    },
    statePillInactive: {
      backgroundColor: colors.backgroundSelected,
    },
    statePillLabel: {
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      lineHeight: Typography.caption.lineHeight,
    },
    statePillLabelActive: {
      color: colors.accent,
    },
    statePillLabelInactive: {
      color: colors.textSecondary,
    },
    templateRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 64,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    rowLabel: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '800',
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    rowWrap: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    segment: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      flex: 1,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: Spacing.two,
      paddingVertical: 10,
    },
    segmentLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    segmentLabelSelected: {
      color: colors.textPrimary,
    },
    segmentPressed: {
      backgroundColor: colors.backgroundSelected,
    },
    segmentSelected: {
      backgroundColor: colors.surfacePrimary,
    },
  });
