import { Text, TextInput, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import type { TrainingProgram } from '@/types';

import { PillRow, SectionHeading } from './ProgramBuilderUi';

type ProgramProgressionSectionProps = {
  colors: Record<string, any>;
  onUpdateField: (patch: Partial<TrainingProgram>) => void;
  onUpdateProgression: (patch: Partial<NonNullable<TrainingProgram['progression']>>) => void;
  program: TrainingProgram;
  strategies: readonly string[];
  styles: Record<string, any>;
};

export function ProgramProgressionSection({ colors, onUpdateField, onUpdateProgression, program, strategies, styles }: ProgramProgressionSectionProps) {
  return (
    <AppCard style={styles.sectionCard}>
      <SectionHeading styles={styles} subtitle="Progression strategy and target loading." title="Progression" />

      <PillRow label="Progression strategy" items={strategies} onSelect={(strategy) => onUpdateProgression({ strategy })} selectedValue={program.progression?.strategy} styles={styles} />

      <View style={styles.progressionGrid}>
        {[
          ['Target reps', 'targetReps', program.progression?.targetReps] as const,
          ['Target weight', 'targetWeight', program.progression?.targetWeight] as const,
          ['RIR', 'rir', program.progression?.rir] as const,
        ].map(([label, key, value]) => (
          <View key={label} style={styles.progressionItem}>
            <Text selectable style={styles.inputLabel}>
              {label}
            </Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={(nextValue) => onUpdateProgression({ [key]: nextValue ? Number(nextValue) : undefined })}
              placeholder="—"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={value === undefined ? '' : String(value)}
            />
          </View>
        ))}
        <View style={styles.progressionItem}>
          <Text selectable style={styles.inputLabel}>
            Duration (weeks)
          </Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => onUpdateField({ durationWeeks: value ? Number(value) : 0 })}
            placeholder="8"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={String(program.durationWeeks)}
          />
        </View>
      </View>
    </AppCard>
  );
}
