import { Text, TextInput, View, Pressable } from 'react-native';

import { Colors } from '@/constants/theme';
import { WEEKDAY_LABELS } from '@/domain/models';
import type { TrainingProgramDay } from '@/types';

import { CompactAction } from './ProgramBuilderUi';

type ScheduleDayRowProps = {
  day: TrainingProgramDay;
  expanded: boolean;
  onAssignSelected: () => void;
  onDuplicate: (dayId: string) => void;
  onMove: (dayId: string, direction: -1 | 1) => void;
  onToggleExpanded: (dayId: string) => void;
  onToggleRest: (dayId: string) => void;
  onUpdate: (dayId: string, patch: Partial<TrainingProgramDay>) => void;
  selectedWorkoutTitle?: string;
  styles: Record<string, any>;
  workoutTitle?: string | null;
};

export function ScheduleDayRow({
  day,
  expanded,
  onAssignSelected,
  onDuplicate,
  onMove,
  onToggleRest,
  onToggleExpanded,
  onUpdate,
  selectedWorkoutTitle,
  styles,
  workoutTitle,
}: ScheduleDayRowProps) {
  const isRest = day.restDay;

  return (
    <View style={styles.dayBlock}>
      <Pressable accessibilityRole="button" onPress={() => onToggleExpanded(day.id)} style={({ pressed }) => [styles.dayHeader, pressed && styles.compactActionPressed]}>
        <View style={styles.dayHeaderCopy}>
          <View style={styles.dayTopLine}>
            <Text selectable style={styles.dayTitle}>
              {WEEKDAY_LABELS[day.weekday]}
            </Text>
            <View style={[styles.statePill, isRest ? styles.statePillRest : styles.statePillWorkout]}>
              <Text style={[styles.statePillText, isRest ? styles.statePillTextRest : styles.statePillTextWorkout]}>{isRest ? 'Rest' : 'Workout'}</Text>
            </View>
          </View>
          <Text selectable style={styles.dayWorkoutName}>
            {workoutTitle ?? (isRest ? 'Rest day' : 'Unassigned')}
          </Text>
        </View>
        <Text style={styles.sectionToggle}>{expanded ? '−' : '+'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.dayExpanded}>
          <View style={styles.dayActionGrid}>
            <CompactAction label={`Assign ${selectedWorkoutTitle ?? 'selected'}`} onPress={onAssignSelected} styles={styles} tone="primary" />
            <CompactAction label={isRest ? 'Mark workout' : 'Mark rest'} onPress={() => onToggleRest(day.id)} styles={styles} />
            <CompactAction label="Duplicate" onPress={() => onDuplicate(day.id)} styles={styles} />
            <CompactAction label="Move up" onPress={() => onMove(day.id, -1)} styles={styles} />
            <CompactAction label="Move down" onPress={() => onMove(day.id, 1)} styles={styles} />
          </View>

          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Notes
            </Text>
            <TextInput
              onChangeText={(value) => onUpdate(day.id, { notes: value })}
              placeholder="Optional notes for this day"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.notesInput}
              value={day.notes ?? ''}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
