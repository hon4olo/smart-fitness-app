import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type WorkoutSessionProgressCardProps = {
  nextExerciseName?: string;
  progressLabel: string;
  progressPercent: number;
  selectedExerciseName?: string;
};

export function WorkoutSessionProgressCard({ nextExerciseName, progressLabel, progressPercent, selectedExerciseName }: WorkoutSessionProgressCardProps) {
  return (
    <AppCard>
      <View style={styles.progressHeader}>
        <View style={styles.progressCopy}>
          <Text selectable style={styles.sectionTitle}>
            Current exercise
          </Text>
          <Text selectable style={styles.currentExerciseName}>
            {selectedExerciseName ?? 'No exercise selected'}
          </Text>
          <Text selectable style={styles.progressMeta}>
            {progressLabel}
            {nextExerciseName ? ` · Next: ${nextExerciseName}` : ''}
          </Text>
        </View>
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeLabel}>Now</Text>
        </View>
      </View>

      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  currentBadge: {
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
  currentBadgeLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  currentExerciseName: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '900',
  },
  progressBarFill: {
    backgroundColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 999,
    height: 8,
  },
  progressBarTrack: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
  },
  progressCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  progressHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  progressMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
