import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  deleteWorkoutProgram,
  duplicateWorkoutProgram,
  getWorkoutProgramById,
  getWorkoutProgramSchedule,
  getWorkoutProgramSummary,
  getWorkoutTemplateById,
  saveWorkoutProgram,
  startWorkoutSessionDraft,
  toggleWorkoutProgramFavorite,
} from '@/lib/workouts';

export default function ProgramDetailRoute() {
  const { programId } = useLocalSearchParams<{ programId?: string }>();
  const { workouts, workoutSessions } = useAppContext();
  const insets = useSafeAreaInsets();
  const resolvedProgramId = Array.isArray(programId) ? programId[0] : programId;

  const program = useMemo(() => (resolvedProgramId ? getWorkoutProgramById(resolvedProgramId, workouts) : null), [resolvedProgramId, workouts]);
  const summary = useMemo(() => (program ? getWorkoutProgramSummary(program, workouts, workoutSessions) : null), [program, workoutSessions, workouts]);
  const schedule = useMemo(() => (program ? getWorkoutProgramSchedule(program) : null), [program]);

  if (!program || !summary || !schedule) {
    return (
      <View style={styles.screen}>
        <EmptyState compact message="This program no longer exists." title="Program not found" />
      </View>
    );
  }

  const nextWorkoutId = schedule.nextWorkout?.workoutTemplateId ?? program.days.find((day) => !day.restDay && day.workoutTemplateId)?.workoutTemplateId;
  const nextWorkout = nextWorkoutId ? getWorkoutTemplateById(nextWorkoutId, workouts) : null;

  const handleStart = () => {
    if (!nextWorkout) {
      Alert.alert('No workout assigned', 'Assign a workout template before starting.');
      return;
    }

    startWorkoutSessionDraft(nextWorkout);
    router.push({ pathname: '/workout-session', params: { workoutId: nextWorkout.id } });
  };

  const handleDelete = () => {
    if (!program.isCustom) {
      return;
    }

    Alert.alert('Delete program?', 'This will remove the program definition only. Completed workout history stays intact.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteWorkoutProgram(program.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 120 }]} style={styles.scrollView}>
        <View style={styles.container}>
          <SectionHeader subtitle={summary.subtitle} title={program.name} />

          <AppCard style={styles.heroCard}>
            <Text selectable style={styles.heroMeta}>
              {program.goal} · {program.difficulty} · {program.durationWeeks} weeks
            </Text>
            <Text selectable style={styles.heroDescription}>
              {program.description ?? 'Program details and weekly schedule.'}
            </Text>
            {schedule.isRestDayToday ? (
              <Text selectable style={styles.restCallout}>
                Rest day today · next scheduled workout: {schedule.nextWorkout?.workoutTemplateName ?? 'Unassigned'}
              </Text>
            ) : null}
            <AppButton label="Start Next Workout" onPress={handleStart} />
            {schedule.isRestDayToday ? <AppButton label="Start Anyway" onPress={handleStart} variant="secondary" /> : null}
          </AppCard>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Weekly schedule
            </Text>
            <View style={styles.scheduleList}>
              {program.days.map((day) => (
                <View key={day.id} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{day.weekday.slice(0, 3).toUpperCase()}</Text>
                  <View style={styles.scheduleCopy}>
                    <Text selectable style={styles.scheduleTitle}>
                      {day.restDay ? 'Rest day' : day.workoutTemplateName ?? 'Unassigned workout'}
                    </Text>
                    <Text selectable style={styles.scheduleMeta}>
                      {day.restDay ? 'Recovery focus' : day.notes ?? 'Training day'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Summary metadata
            </Text>
            <Text selectable style={styles.summaryLine}>
              {summary.workoutCount} workout days · {summary.daysPerWeek} active days/week
            </Text>
            <Text selectable style={styles.summaryLine}>
              {summary.goalLabel} · {summary.difficultyLabel}
            </Text>
            <Text selectable style={styles.summaryLine}>
              {program.createdAt ? `Created ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(program.createdAt))}` : 'Created recently'}
            </Text>
          </AppCard>

          <View style={styles.actions}>
            <AppButton label="Edit Program" onPress={() => router.push('/workouts/builder')} variant="secondary" />
            <AppButton
              label="Duplicate"
              onPress={() => {
                const duplicate = duplicateWorkoutProgram(program.id, workouts);
                if (duplicate) {
                  router.push({ pathname: '/workouts/program/[programId]', params: { programId: duplicate.id } });
                }
              }}
              variant="secondary"
            />
            <AppButton label={summary.isFavorite ? 'Unfavorite' : 'Favorite'} onPress={() => toggleWorkoutProgramFavorite(program.id)} variant="secondary" />
            {program.isCustom ? <AppButton label="Delete" onPress={handleDelete} variant="secondary" /> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
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
  heroCard: {
    gap: Spacing.two,
  },
  heroDescription: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroMeta: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  restCallout: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleCopy: {
    flex: 1,
    gap: 4,
  },
  scheduleDay: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '900',
    width: 36,
  },
  scheduleList: {
    gap: Spacing.two,
  },
  scheduleMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  scheduleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  scheduleTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLine: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
