import { Text, TextInput, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import type { TrainingProgram } from '@/types';

import { PillRow, SectionHeading } from './ProgramBuilderUi';

type ProgramBasicsSectionProps = {
  colors: Record<string, any>;
  difficulties: readonly TrainingProgram['difficulty'][];
  goals: readonly string[];
  onUpdateField: (patch: Partial<TrainingProgram>) => void;
  program: TrainingProgram;
  styles: Record<string, any>;
};

export function ProgramBasicsSection({ colors, difficulties, goals, onUpdateField, program, styles }: ProgramBasicsSectionProps) {
  return (
    <AppCard style={styles.sectionCard}>
      <SectionHeading styles={styles} subtitle="Name, goal, and experience level." title="Basics" />

      <View style={styles.inputGroup}>
        <Text selectable style={styles.inputLabel}>
          Program name
        </Text>
        <TextInput
          onChangeText={(value) => onUpdateField({ name: value })}
          placeholder="8-week strength block"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={program.name}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text selectable style={styles.inputLabel}>
          Description
        </Text>
        <TextInput
          multiline
          onChangeText={(value) => onUpdateField({ description: value })}
          placeholder="Training intent, split, or coaching notes"
          placeholderTextColor={colors.textSecondary}
          style={styles.notesInput}
          value={program.description ?? ''}
        />
      </View>

      <PillRow label="Goal" items={goals} onSelect={(goal) => onUpdateField({ goal })} selectedValue={program.goal} styles={styles} />
      <PillRow label="Experience level" items={difficulties} onSelect={(difficulty) => onUpdateField({ difficulty: difficulty as TrainingProgram['difficulty'] })} selectedValue={program.difficulty} styles={styles} />
    </AppCard>
  );
}
