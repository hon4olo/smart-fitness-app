import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createDefaultTrainingProgram, getWorkoutHubViewModel, getWorkoutPrograms, getWorkoutProgramSummary, startEmptyWorkoutSessionDraft, startWorkoutSessionDraft } from '@/lib/workouts';

const viewModeOptions = [
  { label: 'Start now', value: 'start-now' as const },
  { label: 'Programs', value: 'programs' as const },
];

export default function WorkoutsScreen() {
  const { workoutSessions, workouts } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'start-now' | 'programs'>('start-now');

  const currentProgram = useMemo(() => createDefaultTrainingProgram(workouts), [workouts]);
  const hub = useMemo(() => getWorkoutHubViewModel({ activeProgram: currentProgram, workouts, workoutSessions }), [currentProgram, workoutSessions, workouts]);
  const programs = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const customProgramSummaries = useMemo(() => programs.filter((program) => program.isCustom).map((program) => getWorkoutProgramSummary(program, workouts, workoutSessions)), [programs, workoutSessions, workouts]);

  const activeDraft = hub.activeWorkout;
  const hasHistory = workoutSessions.length > 0;
  const hasCustomPrograms = customProgramSummaries.length > 0;

  const starterSummary = hasHistory ? hub.suggestedWorkouts[0] ?? hub.starterWorkout : hub.starterWorkout;
  const recentSummaries = hub.recentWorkouts.slice(0, 2);
  const recommendationSummary = hub.suggestedWorkouts.slice(0, 1)[0] ?? null;

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

    if (starterSummary) {
      startWorkout(starterSummary.workout.id);
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]} showsVerticalScrollIndicator={false} style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Workouts" />

        <SegmentedControl accessibilityLabel="Workout view" onChange={setViewMode} options={viewModeOptions} value={viewMode} />

        {viewMode === 'start-now' ? (
          <>
            <AppCard>
              <View style={styles.sectionHeader}>
                <Text selectable style={styles.sectionTitle}>
                  {activeDraft ? 'Continue workout' : hasHistory ? 'Next workout' : 'Start now'}
                </Text>
                <Text selectable style={styles.sectionSubtitle}>
                  {activeDraft ? activeDraft.progressLabel : starterSummary ? `${starterSummary.exerciseCount} exercises · ${starterSummary.estimatedDuration}` : 'Pick one workout and start'}
                </Text>
              </View>

              <Text selectable style={styles.summaryTitle}>
                {activeDraft ? activeDraft.workout.title : starterSummary?.workout.title ?? 'Empty workout'}
              </Text>
              <Text selectable style={styles.summaryDetail}>
                {activeDraft ? `${activeDraft.completedExercises} completed · ${activeDraft.elapsedLabel}` : starterSummary?.subtitle ?? 'Concise summary'}
              </Text>

              <View style={styles.actionRow}>
                <AppButton label={activeDraft ? 'Continue workout' : 'Start workout'} onPress={handlePrimaryStart} />
                {!activeDraft ? <Text style={styles.secondaryText} onPress={handleStartEmpty}>Start Empty Workout</Text> : null}
              </View>
            </AppCard>

            {hasHistory ? (
              <AppCard>
                <View style={styles.sectionHeader}>
                  <Text selectable style={styles.sectionTitle}>
                    Recently used
                  </Text>
                  <Text selectable style={styles.sectionSubtitle}>
                    Compact history
                  </Text>
                </View>

                <View style={styles.list}>
                  {recentSummaries.length > 0 ? (
                    recentSummaries.map((summary) => (
                      <ListRow
                        key={summary.workout.id}
                        title={summary.workout.title}
                        value={`${summary.exerciseCount} exercises · ${summary.estimatedDuration}`}
                        detail={summary.lastUsedLabel ? `Used ${summary.lastUsedLabel}` : summary.subtitle}
                        onPress={() => startWorkout(summary.workout.id)}
                      />
                    ))
                  ) : (
                    <EmptyState compact description="Recent workouts will show here after you complete a session." message="No recent workouts yet." />
                  )}
                </View>

                {recommendationSummary ? (
                  <View style={styles.recommendationBlock}>
                    <Text selectable style={styles.recommendationLabel}>
                      Recommendation
                    </Text>
                    <Text selectable style={styles.recommendationValue}>
                      {recommendationSummary.workout.title}
                    </Text>
                    <Text selectable style={styles.recommendationDetail}>
                      {recommendationSummary.exerciseCount} exercises · {recommendationSummary.estimatedDuration}
                    </Text>
                  </View>
                ) : null}
              </AppCard>
            ) : null}


          </>
        ) : (
          <>
            {hasCustomPrograms ? (
              <View style={styles.addProgramRow}>
                <AppButton label="Add Program" onPress={handleOpenProgramBuilder} />
              </View>
            ) : null}

            {hasCustomPrograms ? (
              <AppCard>
                <View style={styles.sectionHeader}>
                  <Text selectable style={styles.sectionTitle}>
                    Programs
                  </Text>
                  <Text selectable style={styles.sectionSubtitle}>
                    Saved plans
                  </Text>
                </View>

                <View style={styles.list}>
                  {customProgramSummaries.map((program) => (
                    <ListRow
                      key={program.program.id}
                      title={program.program.name}
                      value={`${program.daysPerWeek} days · ${program.goalLabel}`}
                      detail={program.subtitle}
                      onPress={() => router.push({ pathname: '/workouts/program/[programId]', params: { programId: program.program.id } })}
                    />
                  ))}
                </View>
              </AppCard>
            ) : (
              <EmptyState
                actionLabel="Create Program"
                description="Create a custom program once, then reuse it without rebuilding the same plan again."
                message="No custom programs yet."
                onActionPress={handleOpenProgramBuilder}
                title="Start with one program"
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  addProgramRow: {
    marginTop: Spacing.one,
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
  list: {
    gap: Spacing.one,
  },
  recommendationBlock: {
    borderColor: Colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
  },
  recommendationDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  recommendationLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationValue: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  secondaryText: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    gap: 2,
    marginBottom: Spacing.two,
  },
  sectionSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  starterBlock: {
    gap: 2,
    marginBottom: Spacing.two,
  },
  summaryDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
});
