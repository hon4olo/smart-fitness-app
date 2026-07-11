import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { Workout, WorkoutSession } from '@/context/AppContext';

type WorkoutLauncherCardProps = {
  isExpanded: boolean;
  onCreateWorkout: () => void;
  onStart: (workoutId: string) => void;
  onToggleExpanded: () => void;
  workoutSessions: WorkoutSession[];
  workouts: Workout[];
};

function getLatestSessionForWorkout(workoutId: string, sessions: WorkoutSession[]) {
  return sessions
    .filter((session) => session.workoutId === workoutId)
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())[0];
}

function formatLastSession(session: WorkoutSession | undefined) {
  if (!session) {
    return 'Not completed yet';
  }

  const volume = session.sets.reduce((total, set) => total + set.weight * set.reps, 0);
  const date = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(session.finishedAt));

  return `${date} · ${session.sets.length} sets · ${volume.toLocaleString()} kg`;
}

export function WorkoutLauncherCard({
  isExpanded,
  onCreateWorkout,
  onStart,
  onToggleExpanded,
  workoutSessions,
  workouts,
}: WorkoutLauncherCardProps) {
  const headerLabel = isExpanded ? 'Hide workout picker' : 'Choose workout';

  return (
    <AppCard>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={onToggleExpanded}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Start a workout</Text>
          <Text style={styles.subtitle}>
            {workouts.length === 0
              ? 'Create a template before starting a session.'
              : 'Pick the template you want to train today.'}
          </Text>
        </View>
        <Text style={styles.toggle}>{isExpanded ? '−' : '+'}</Text>
      </Pressable>

      {isExpanded ? (
        workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You do not have any workout templates yet.</Text>
            <AppButton label="Create workout" onPress={onCreateWorkout} />
          </View>
        ) : (
          <View style={styles.workoutList}>
            {workouts.map((workout) => {
              const latestSession = getLatestSessionForWorkout(workout.id, workoutSessions);

              return (
                <View key={workout.id} style={styles.workoutRow}>
                  <View style={styles.workoutContent}>
                    <View style={styles.workoutHeading}>
                      <Text style={styles.workoutTitle}>{workout.title}</Text>
                      <Text style={styles.duration}>{workout.duration}</Text>
                    </View>
                    {workout.description ? (
                      <Text style={styles.description}>{workout.description}</Text>
                    ) : null}
                    <Text style={styles.meta}>
                      {workout.exercises.length} exercise{workout.exercises.length === 1 ? '' : 's'}
                    </Text>
                    <Text style={styles.lastSession}>{formatLastSession(latestSession)}</Text>
                  </View>
                  <AppButton label="Start" onPress={() => onStart(workout.id)} />
                </View>
              );
            })}
          </View>
        )
      ) : (
        <AppButton label={headerLabel} onPress={onToggleExpanded} />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  duration: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  emptyState: {
    gap: Spacing.two,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  lastSession: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  meta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  toggle: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  workoutContent: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  workoutHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'space-between',
  },
  workoutList: {
    gap: Spacing.two,
  },
  workoutRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  workoutTitle: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
});
