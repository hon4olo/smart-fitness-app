import { Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import type { getTrainingProgramOverview, getTrainingProgramValidation } from '@/lib/workouts';

import { MetricTile, SectionHeading } from './ProgramBuilderUi';

type ProgramReviewSectionProps = {
  expanded: boolean;
  formatDuration: (minutes: number) => string;
  formatSets: (value: number) => string;
  onToggleExpanded: () => void;
  overview: ReturnType<typeof getTrainingProgramOverview>;
  styles: Record<string, any>;
  warnings: ReturnType<typeof getTrainingProgramValidation>;
};

export function ProgramReviewSection({ expanded, formatDuration, formatSets, onToggleExpanded, overview, styles, warnings }: ProgramReviewSectionProps) {
  return (
    <AppCard style={styles.sectionCard}>
      <SectionHeading
        collapsed={!expanded}
        onToggle={onToggleExpanded}
        styles={styles}
        subtitle="Review stays secondary and collapsible until the program is mostly configured."
        title="Review"
      />

      {expanded ? (
        <>
          <View style={styles.metricGrid}>
            <MetricTile detail="Assigned workouts in the current week" label="Weekly workouts" styles={styles} value={`${overview.assignedWorkouts}`} />
            <MetricTile detail="Planned working sets" label="Weekly sets" styles={styles} value={formatSets(overview.weeklySets)} />
            <MetricTile detail="Estimated weekly training time" label="Duration" styles={styles} value={formatDuration(overview.estimatedWorkoutDurationMinutes)} />
            <MetricTile detail={overview.musclesTrained.length > 0 ? overview.musclesTrained.join(' · ') : 'No muscles mapped yet'} label="Muscles trained" styles={styles} value={`${overview.musclesTrained.length}`} />
          </View>

          {warnings.length > 0 ? (
            <View style={styles.reviewBlock}>
              <Text selectable style={styles.blockTitle}>
                Warnings
              </Text>
              {warnings.slice(0, 4).map((warning) => (
                <Text key={warning.id} selectable style={styles.reviewText}>
                  • {warning.message}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.reviewBlock}>
            <Text selectable style={styles.blockTitle}>
              Muscle coverage
            </Text>
            <Text selectable style={styles.reviewText}>
              Trained this week: {overview.musclesTrained.join(', ') || 'none'}
            </Text>
            <Text selectable style={styles.reviewText}>
              Missing groups: {overview.missingMuscleGroups.join(', ') || 'none'}
            </Text>
            <View style={styles.frequencyList}>
              {overview.muscleFrequency.map((item) => (
                <View key={item.key} style={styles.frequencyRow}>
                  <Text selectable style={styles.frequencyLabel}>
                    {item.label}
                  </Text>
                  <Text selectable style={styles.frequencyValue}>
                    {item.trainingFrequency} day{item.trainingFrequency === 1 ? '' : 's'} · {formatSets(item.workingSets)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : null}
    </AppCard>
  );
}
