import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  createDefaultTrainingProgram,
  getActiveWorkoutSessionDraft,
  getWorkoutHubViewModel,
  getWorkoutPrograms,
  getWorkoutProgramSummary,
  startEmptyWorkoutSessionDraft,
  startWorkoutSessionDraft,
} from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';

const viewModeOptions = [
  { label: 'Start now', value: 'start-now' as const },
  { label: 'Programs', value: 'programs' as const },
];

type ViewMode = (typeof viewModeOptions)[number]['value'];

type WorkoutRowProps = {
  accessibilityLabel: string;
  detail: string;
  onPress: () => void;
  styles: WorkoutStyles;
  title: string;
  value: string;
};

type WorkoutStyles = ReturnType<typeof createStyles>;

function formatElapsedLabel(startedAt: string, now = Date.now()) {
  const elapsedMs = Math.max(0, now - new Date(startedAt).getTime());
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function WorkoutRow({ accessibilityLabel, detail, onPress, styles: rowStyles, title, value }: WorkoutRowProps) {
  return (
    <Pressable accessibilityHint="Opens this workout" accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [rowStyles.row, pressed && rowStyles.rowPressed]}>
      <View style={rowStyles.rowCopy}>
        <View style={rowStyles.rowTitleLine}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={rowStyles.rowTitle}>
            {title}
          </Text>
          <Text style={rowStyles.rowChevron}>›</Text>
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={rowStyles.rowValue}>
          {value}
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={rowStyles.rowDetail}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

function CompactButton({ label, onPress, styles: buttonStyles, variant = 'primary' }: { label: string; onPress: () => void; styles: WorkoutStyles; variant?: 'primary' | 'secondary' }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [buttonStyles.buttonBase, variant === 'primary' ? buttonStyles.primaryButton : buttonStyles.secondaryButton, pressed && (variant === 'primary' ? buttonStyles.primaryPressed : buttonStyles.secondaryPressed)]}>
      <Text style={variant === 'primary' ? buttonStyles.primaryButtonLabel : buttonStyles.secondaryButtonLabel}>{label}</Text>
    </Pressable>
  );
}

function CompactSegmentedControl({
  onChange,
  value,
}: {
  onChange: (value: ViewMode) => void;
  value: ViewMode;
}) {
  const { colors } = useAppTheme();
  const controlStyles = useMemo(() => createControlStyles(colors), [colors]);

  return (
    <View accessibilityLabel="Workout view" accessibilityRole="tablist" style={controlStyles.container}>
      {viewModeOptions.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [controlStyles.segment, selected && controlStyles.segmentSelected, pressed && !selected && controlStyles.segmentPressed]}>
            <Text style={[controlStyles.segmentLabel, selected && controlStyles.segmentLabelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
  const programs = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const customProgramSummaries = useMemo(() => programs.filter((program) => program.isCustom).map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions)), [programs, workoutSessions, workouts]);
  const activeDraft = getActiveWorkoutSessionDraft();
  const activeWorkout = hub.activeWorkout;
  const heroSummary = activeDraft ? activeWorkout : hub.suggestedWorkouts[0] ?? hub.starterWorkout;
  const heroWorkoutId = activeDraft?.workoutId ?? heroSummary?.workout.id ?? null;
  const hasCustomPrograms = customProgramSummaries.length > 0;

  const recentSummaries = useMemo(
    () => hub.recentWorkouts.filter((summary) => summary.workout.id !== heroWorkoutId).slice(0, 2),
    [heroWorkoutId, hub.recentWorkouts]
  );
  const showRecentSection = viewMode === 'start-now' && recentSummaries.length > 0;

  const heroStateLabel = activeDraft ? 'Workout in progress' : heroSummary ? (workoutSessions.length > 0 ? 'Next workout' : 'Ready to train') : 'Ready to train';
  const heroTitle = activeDraft?.workoutTitle ?? heroSummary?.workout.title ?? 'Workout';
  const heroDetail = activeDraft
    ? `${activeWorkout?.completedExercises ?? 0} exercises completed · ${activeWorkout?.elapsedLabel ?? formatElapsedLabel(activeDraft.startedAt)}`
    : heroSummary
      ? [
          `${heroSummary.exerciseCount} exercises`,
          heroSummary.estimatedDuration,
          heroSummary.lastUsedLabel ? `Last used ${heroSummary.lastUsedLabel}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'No workout selected';
  const showStartEmpty = !activeDraft;

  const startWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId);

    if (!workout) {
      return;
    }

    startWorkoutSessionDraft(workout);
    router.push('/workout-session');
  };

  const handlePrimaryStart = () => {
    if (activeDraft) {
      router.push('/workout-session');
      return;
    }

    if (heroSummary) {
      startWorkout(heroSummary.workout.id);
    }
  };

  const handleStartEmpty = () => {
    startEmptyWorkoutSessionDraft();
    router.push('/workout-session');
  };

  const handleOpenProgramBuilder = () => {
    router.push('/workouts/builder');
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + Spacing.six }] } showsVerticalScrollIndicator={false} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text selectable style={styles.screenTitle}>
            Workouts
          </Text>
          <CompactSegmentedControl onChange={setViewMode} value={viewMode} />
        </View>

        {viewMode === 'start-now' ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroStatusPill}>
                <Text selectable style={styles.heroStatusText}>
                  {heroStateLabel}
                </Text>
              </View>

              <View style={styles.heroCopy}>
                <Text selectable style={styles.heroTitle}>
                  {heroTitle}
                </Text>
                <Text selectable style={styles.heroDetail}>
                  {heroDetail}
                </Text>
              </View>

              <View style={styles.heroActions}>
                <CompactButton label={activeDraft ? 'Continue workout' : 'Start workout'} onPress={handlePrimaryStart} styles={styles} />
                {showStartEmpty ? <CompactButton label="Start Empty Workout" onPress={handleStartEmpty} styles={styles} variant="secondary" /> : null}
              </View>
            </View>

            {showRecentSection ? (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeading}>
                  <Text selectable style={styles.sectionTitle}>
                    Recently used
                  </Text>
                </View>

                <View style={styles.groupSurface}>
                  {recentSummaries.map((summary, index) => (
                    <View key={summary.workout.id} style={[styles.rowWrapper, index > 0 && styles.rowDivider]}>
                      <WorkoutRow
                        accessibilityLabel={`${summary.workout.title}, ${summary.exerciseCount} exercises, ${summary.estimatedDuration}${summary.lastUsedLabel ? `, used ${summary.lastUsedLabel}` : ''}`}
                        detail={summary.lastUsedLabel ? `Used ${summary.lastUsedLabel}` : summary.subtitle}
                        onPress={() => startWorkout(summary.workout.id)}
                        styles={styles}
                        title={summary.workout.title}
                        value={`${summary.exerciseCount} exercises · ${summary.estimatedDuration}`}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeading}>
              <Text selectable style={styles.sectionTitle}>
                Programs
              </Text>
            </View>

            {hasCustomPrograms ? (
              <>
                <View style={styles.groupSurface}>
                  {customProgramSummaries.map((program, index) => (
                    <View key={program.program.id} style={[styles.rowWrapper, index > 0 && styles.rowDivider]}>
                      <WorkoutRow
                        accessibilityLabel={`${program.program.name}, ${program.daysPerWeek} days per week, ${program.goalLabel}`}
                        detail={program.subtitle}
                        onPress={() => router.push({ pathname: '/workouts/program/[programId]', params: { programId: program.program.id } })}
                        styles={styles}
                        title={program.program.name}
                        value={`${program.daysPerWeek} days · ${program.goalLabel}`}
                      />
                    </View>
                  ))}
                </View>

                <CompactButton label="Create Program" onPress={handleOpenProgramBuilder} styles={styles} variant="secondary" />
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text selectable style={styles.emptyStateTitle}>
                  No programs yet
                </Text>
                <Text selectable style={styles.emptyStateCopy}>
                  Build a reusable weekly plan from your workouts.
                </Text>
                <CompactButton label="Create Program" onPress={handleOpenProgramBuilder} styles={styles} />
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const createControlStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      padding: 2,
    },
    segment: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
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

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    buttonBase: {
      alignItems: 'center',
      alignSelf: 'stretch',
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    container: {
      alignSelf: 'stretch',
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    emptyState: {
      alignSelf: 'stretch',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      padding: Spacing.four,
    },
    emptyStateCopy: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    emptyStateTitle: {
      color: colors.textPrimary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      lineHeight: Typography.sectionTitle.lineHeight,
    },
    groupSurface: {
      alignSelf: 'stretch',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    headerBlock: {
      alignSelf: 'stretch',
      gap: Spacing.two,
    },
    heroActions: {
      gap: Spacing.two,
    },
    heroCard: {
      alignSelf: 'stretch',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.three,
      padding: Spacing.four,
    },
    heroCopy: {
      gap: Spacing.one,
    },
    heroDetail: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    heroStatusPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.two,
      paddingVertical: 4,
    },
    heroStatusText: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 28,
    },
    primaryButton: {
      backgroundColor: colors.accent,
    },
    primaryButtonLabel: {
      color: colors.textOnAccent,
      fontSize: Typography.button.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.button.lineHeight,
    },
    primaryPressed: {
      backgroundColor: colors.accentPressed,
    },
    row: {
      alignSelf: 'stretch',
      minHeight: 44,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
    },
    rowChevron: {
      color: colors.textMuted,
      fontSize: 22,
      lineHeight: 22,
      marginLeft: Spacing.one,
    },
    rowCopy: {
      gap: 2,
      minWidth: 0,
    },
    rowDetail: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowPressed: {
      backgroundColor: colors.backgroundSelected,
    },
    rowTitle: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
      minWidth: 0,
    },
    rowTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    rowValue: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    rowWrapper: {
      alignSelf: 'stretch',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    secondaryButton: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: StyleSheet.hairlineWidth,
    },
    secondaryButtonLabel: {
      color: colors.textPrimary,
      fontSize: Typography.button.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.button.lineHeight,
    },
    secondaryPressed: {
      backgroundColor: colors.backgroundSelected,
    },
    sectionBlock: {
      alignSelf: 'stretch',
      gap: Spacing.two,
    },
    sectionHeading: {
      paddingHorizontal: Spacing.one,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      lineHeight: Typography.sectionTitle.lineHeight,
    },
  });
