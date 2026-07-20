import { Pressable, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { parseWorkoutPlanDescription } from '@/lib/workouts';
import type { Workout } from '@/types';

import { CompactAction, SectionHeading } from './ProgramBuilderUi';

type ProgramTemplatePickerSectionProps = {
  onAddSelected: () => void;
  onRemoveTemplate: (workoutId: string) => void;
  onSelectWorkout: (workoutId: string) => void;
  selectedTemplateSummaries: Workout[];
  selectedWorkout: Workout | null;
  styles: Record<string, any>;
  workouts: Workout[];
};

export function ProgramTemplatePickerSection({
  onAddSelected,
  onRemoveTemplate,
  onSelectWorkout,
  selectedTemplateSummaries,
  selectedWorkout,
  styles,
  workouts,
}: ProgramTemplatePickerSectionProps) {
  return (
    <AppCard style={styles.sectionCard}>
      <SectionHeading styles={styles} subtitle="Pick templates, add them to the program, or remove them from selected days." title="Workout templates" />

      <View style={styles.templatePickerHeader}>
        <Text selectable style={styles.blockMeta}>
          Selected template: {selectedWorkout?.title ?? 'none'}
        </Text>
        <CompactAction label="Add selected" onPress={onAddSelected} styles={styles} tone="primary" />
      </View>

      <View style={styles.templateBank}>
        {workouts.map((workout) => {
          const parsedPlan = parseWorkoutPlanDescription(workout.description);
          const exerciseCount = parsedPlan.exercises.length > 0 ? parsedPlan.exercises.length : workout.exercises.length;
          const selected = workout.id === selectedWorkout?.id;

          return (
            <Pressable key={workout.id} onPress={() => onSelectWorkout(workout.id)} style={({ pressed }) => [styles.templateBankRow, selected && styles.templateBankRowSelected, pressed && styles.compactActionPressed]}>
              <View style={styles.templateBankCopy}>
                <Text selectable style={styles.templateBankTitle}>
                  {workout.title}
                </Text>
                <Text selectable style={styles.templateBankMeta}>
                  {exerciseCount} exercises · {workout.duration}
                </Text>
              </View>
              <View style={[styles.statePill, selected ? styles.statePillWorkout : styles.statePillRest]}>
                <Text style={[styles.statePillText, selected ? styles.statePillTextWorkout : styles.statePillTextRest]}>{selected ? 'Selected' : 'Select'}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedTemplatesBlock}>
        <Text selectable style={styles.blockTitle}>
          Selected templates
        </Text>
        {selectedTemplateSummaries.length > 0 ? (
          <View style={styles.selectedTemplateList}>
            {selectedTemplateSummaries.map((workout, index) => (
              <View key={workout.id} style={[styles.selectedTemplateRow, index > 0 && styles.rowDivider]}>
                <View style={styles.selectedTemplateCopy}>
                  <Text selectable style={styles.selectedTemplateTitle}>
                    {workout.title}
                  </Text>
                  <Text selectable style={styles.selectedTemplateMeta}>
                    {workout.exercises.length} exercises
                  </Text>
                </View>
                <CompactAction label="Remove" onPress={() => onRemoveTemplate(workout.id)} styles={styles} />
              </View>
            ))}
          </View>
        ) : (
          <Text selectable style={styles.blockMeta}>
            No templates selected yet.
          </Text>
        )}
      </View>
    </AppCard>
  );
}
