import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { Workout } from '@/types';

type ProgramWorkoutPickerModalProps = {
  visible: boolean;
  availableWorkouts: Workout[];
  onClose: () => void;
  onCreateNew: () => void;
  onAddWorkouts: (workoutIds: string[]) => void;
};

export function ProgramWorkoutPickerModal({ visible, availableWorkouts, onAddWorkouts, onClose, onCreateNew }: ProgramWorkoutPickerModalProps) {
  const [mode, setMode] = useState<'choice' | 'existing'>('choice');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setMode('choice');
    setSelectedIds([]);
  }, [visible]);

  if (!visible) {
    return null;
  }

  const toggleWorkout = (workoutId: string) => {
    setSelectedIds((current) => (current.includes(workoutId) ? current.filter((id) => id !== workoutId) : [...current, workoutId]));
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Add workout</Text>
            <Text style={styles.subtitle}>Choose an existing template or create a new one.</Text>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeLabel}>Cancel</Text>
          </Pressable>
        </View>

        {mode === 'choice' ? (
          <View style={styles.choiceGroup}>
            <Pressable onPress={() => setMode('existing')} style={({ pressed }) => [styles.choiceButton, pressed && styles.pressed]}>
              <Text style={styles.choiceTitle}>Choose existing workout</Text>
              <Text style={styles.choiceSubtitle}>Attach one or more saved templates.</Text>
            </Pressable>
            <Pressable onPress={onCreateNew} style={({ pressed }) => [styles.choiceButton, pressed && styles.pressed]}>
              <Text style={styles.choiceTitle}>Create new workout</Text>
              <Text style={styles.choiceSubtitle}>Build a new template from inside this flow.</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.existingGroup}>
            <Pressable onPress={() => setMode('choice')} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>

            {availableWorkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No reusable workouts yet</Text>
                <Text style={styles.emptySubtitle}>Create a workout template first, then come back to attach it.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {availableWorkouts.map((workout) => {
                  const selected = selectedIds.includes(workout.id);
                  return (
                    <Pressable
                      key={workout.id}
                      onPress={() => toggleWorkout(workout.id)}
                      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
                      <View style={styles.rowCopy}>
                        <Text style={styles.rowTitle}>{workout.title}</Text>
                        <Text style={styles.rowMeta}>{workout.exercises.length} exercises</Text>
                      </View>
                      <Text style={styles.checkmark}>{selected ? '✓' : ''}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.footer}>
              <Pressable
                disabled={selectedCount === 0}
                onPress={() => {
                  onAddWorkouts(selectedIds);
                  onClose();
                }}
                style={({ pressed }) => [styles.primaryButton, selectedCount === 0 && styles.disabledButton, pressed && selectedCount > 0 && styles.pressed]}>
                <Text style={styles.primaryLabel}>{selectedCount > 0 ? `Add ${selectedCount} workout${selectedCount === 1 ? '' : 's'}` : 'Add selected'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backLabel: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  checkmark: {
    color: Colors.dark.accent,
    fontSize: 18,
    fontWeight: '900',
    minWidth: 18,
    textAlign: 'right',
  },
  choiceButton: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderCurve: 'continuous',
    borderRadius: 18,
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 16,
  },
  choiceGroup: {
    gap: Spacing.two,
  },
  choiceSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  choiceTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderCurve: 'continuous',
    borderRadius: 16,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
  },
  closeLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
  emptyState: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderCurve: 'continuous',
    borderRadius: 18,
    gap: 4,
    padding: Spacing.three,
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  existingGroup: {
    gap: Spacing.two,
  },
  footer: {
    paddingTop: Spacing.one,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  list: {
    gap: Spacing.two,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.74)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  panel: {
    backgroundColor: Colors.dark.background,
    borderCurve: 'continuous',
    borderRadius: 28,
    maxWidth: 540,
    padding: Spacing.three,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 18,
    paddingVertical: 14,
  },
  primaryLabel: {
    color: Colors.dark.background,
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
  row: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderCurve: 'continuous',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  rowCopy: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  rowMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  rowSelected: {
    borderColor: Colors.dark.accent,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '900',
  },
});
