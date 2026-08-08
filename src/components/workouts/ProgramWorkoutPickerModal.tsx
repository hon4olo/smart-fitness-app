import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { getWorkoutsHubWorkoutTitle } from '@/features/workouts/workoutsHubLocalization';
import { useLocalization } from '@/localization';
import { getWorkoutBuilderCopy } from '@/localization/workoutBuilderCopy';
import type { Workout } from '@/types';

type ProgramWorkoutPickerModalProps = {
  visible: boolean;
  availableWorkouts: Workout[];
  onClose: () => void;
  onCreateNew: () => void;
  onAddWorkouts: (workoutIds: string[]) => void;
};

export function ProgramWorkoutPickerModal({
  visible,
  availableWorkouts,
  onAddWorkouts,
  onClose,
  onCreateNew,
}: ProgramWorkoutPickerModalProps) {
  const { formatNumber, locale, t } = useLocalization();
  const copy = getWorkoutBuilderCopy(locale);
  const [mode, setMode] = useState<'choice' | 'existing'>('choice');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

  useEffect(() => {
    if (!visible) return;
    setMode('choice');
    setSelectedIds([]);
  }, [visible]);

  if (!visible) return null;

  const toggleWorkout = (workoutId: string) => {
    setSelectedIds((current) =>
      current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId],
    );
  };

  const addLabel =
    selectedCount > 0
      ? copy.addWorkoutCount(
          selectedCount,
          formatNumber(selectedCount, { maximumFractionDigits: 0 }),
        )
      : copy.addSelected;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{copy.addWorkout}</Text>
            <Text style={styles.subtitle}>{copy.addWorkoutSubtitle}</Text>
          </View>
          <Pressable
            accessibilityLabel={copy.cancel}
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text numberOfLines={2} style={styles.closeLabel}>
              {copy.cancel}
            </Text>
          </Pressable>
        </View>

        {mode === 'choice' ? (
          <View style={styles.choiceGroup}>
            <Pressable
              accessibilityLabel={copy.chooseExistingWorkout}
              accessibilityRole="button"
              onPress={() => setMode('existing')}
              style={({ pressed }) => [styles.choiceButton, pressed && styles.pressed]}>
              <Text style={styles.choiceTitle}>{copy.chooseExistingWorkout}</Text>
              <Text style={styles.choiceSubtitle}>{copy.chooseExistingWorkoutBody}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={copy.createNewWorkout}
              accessibilityRole="button"
              onPress={onCreateNew}
              style={({ pressed }) => [styles.choiceButton, pressed && styles.pressed]}>
              <Text style={styles.choiceTitle}>{copy.createNewWorkout}</Text>
              <Text style={styles.choiceSubtitle}>{copy.createNewWorkoutBody}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.existingGroup}>
            <Pressable
              accessibilityLabel={copy.back}
              accessibilityRole="button"
              onPress={() => setMode('choice')}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>{copy.back}</Text>
            </Pressable>

            {availableWorkouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{copy.noReusableWorkouts}</Text>
                <Text style={styles.emptySubtitle}>{copy.noReusableWorkoutsBody}</Text>
              </View>
            ) : (
              <FlatList
                contentContainerStyle={styles.listContent}
                data={availableWorkouts}
                initialNumToRender={6}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(workout) => workout.id}
                maxToRenderPerBatch={6}
                renderItem={({ item: workout }) => {
                  const selected = selectedIds.includes(workout.id);
                  const displayTitle = getWorkoutsHubWorkoutTitle(t, workout);
                  return (
                    <Pressable
                      accessibilityLabel={displayTitle}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() => toggleWorkout(workout.id)}
                      style={({ pressed }) => [
                        styles.row,
                        selected && styles.rowSelected,
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.rowCopy}>
                        <Text numberOfLines={2} style={styles.rowTitle}>
                          {displayTitle}
                        </Text>
                        <Text numberOfLines={1} style={styles.rowMeta}>
                          {copy.exerciseCount(
                            workout.exercises.length,
                            formatNumber(workout.exercises.length, {
                              maximumFractionDigits: 0,
                            }),
                          )}
                        </Text>
                      </View>
                      <Text accessibilityElementsHidden style={styles.checkmark}>
                        {selected ? '✓' : ''}
                      </Text>
                    </Pressable>
                  );
                }}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                windowSize={5}
              />
            )}

            <View style={styles.footer}>
              <Pressable
                accessibilityLabel={addLabel}
                accessibilityRole="button"
                accessibilityState={{ disabled: selectedCount === 0 }}
                disabled={selectedCount === 0}
                onPress={() => {
                  onAddWorkouts(selectedIds);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  selectedCount === 0 && styles.disabledButton,
                  pressed && selectedCount > 0 && styles.pressed,
                ]}>
                <Text numberOfLines={2} style={styles.primaryLabel}>
                  {addLabel}
                </Text>
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
    flexShrink: 0,
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
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: 120,
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  closeLabel: {
    color: Colors.dark.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
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
    flex: 1,
    gap: Spacing.two,
    minHeight: 0,
  },
  footer: {
    flexShrink: 0,
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
    minWidth: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
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
    maxHeight: '92%',
    maxWidth: 540,
    padding: Spacing.three,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  primaryLabel: {
    color: Colors.dark.background,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
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
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.two,
  },
  rowMeta: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
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
    flexShrink: 1,
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
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '900',
  },
});
