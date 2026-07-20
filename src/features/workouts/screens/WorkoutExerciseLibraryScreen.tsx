import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { addWorkoutSessionExercises } from '@/features/workouts/sessionScreenModel';
import { getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

const SAFE_EXERCISES = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    bodyPart: 'Chest',
    equipment: 'Barbell',
    primaryMuscle: 'Chest',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    bodyPart: 'Back',
    equipment: 'Cable',
    primaryMuscle: 'Lats',
  },
  {
    id: 'squat',
    name: 'Squat',
    bodyPart: 'Legs',
    equipment: 'Barbell',
    primaryMuscle: 'Quads',
  },
] as const;

export default function WorkoutExerciseLibraryScreen() {
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleExercise = (exerciseId: string) => {
    setSelectedIds((current) => (current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]));
  };

  const handleAdd = () => {
    const activeDraft = getActiveWorkoutSessionDraft();
    if (!activeDraft || selectedIds.length === 0) {
      return;
    }

    const selectedExercises = selectedIds
      .map((id) => SAFE_EXERCISES.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is (typeof SAFE_EXERCISES)[number] => Boolean(exercise))
      .map((exercise) => ({ id: exercise.id, name: exercise.name }));

    if (selectedExercises.length === 0) {
      return;
    }

    setActiveWorkoutSessionDraft(addWorkoutSessionExercises(activeDraft, selectedExercises));
    router.replace('/workout-session');
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + Spacing.two, paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Exercise Library</Text>
            <Text style={styles.subtitle}>Safe text-only mode for runtime 1.0.0 compatibility.</Text>
          </View>
        </View>

        <View style={styles.list}>
          {SAFE_EXERCISES.map((exercise) => {
            const selected = selectedIds.includes(exercise.id);

            return (
              <Pressable
                key={exercise.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleExercise(exercise.id)}
                style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
                <View style={styles.copy}>
                  <Text style={styles.name}>{exercise.name}</Text>
                  <Text style={styles.meta}>{exercise.primaryMuscle}</Text>
                  <Text style={styles.meta}>{exercise.equipment} · {exercise.bodyPart}</Text>
                </View>
                <View style={[styles.selection, selected && styles.selectionSelected]}>
                  <Text style={[styles.selectionLabel, selected && styles.selectionLabelSelected]}>{selected ? 'Selected' : 'Add'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <Pressable accessibilityRole="button" disabled={selectedIds.length === 0} onPress={handleAdd} style={({ pressed }) => [styles.addButton, selectedIds.length === 0 && styles.addButtonDisabled, pressed && selectedIds.length > 0 && styles.addButtonPressed]}>
            <Text style={styles.addButtonLabel}>{selectedIds.length > 0 ? `Add ${selectedIds.length}` : 'Add selected'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useWorkoutTheme>['colors']) =>
  StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      justifyContent: 'center',
      minHeight: 52,
    },
    addButtonDisabled: {
      opacity: 0.45,
    },
    addButtonLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    addButtonPressed: {
      opacity: 0.88,
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: Spacing.three,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    copy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    footer: {
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    list: {
      gap: Spacing.two,
      marginTop: Spacing.four,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '900',
      lineHeight: 22,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 84,
      padding: Spacing.three,
    },
    rowSelected: {
      borderColor: colors.accent,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
      paddingHorizontal: Spacing.three,
    },
    selection: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 34,
      minWidth: 64,
      paddingHorizontal: Spacing.two,
    },
    selectionLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '900',
    },
    selectionLabelSelected: {
      color: colors.background,
    },
    selectionSelected: {
      backgroundColor: colors.accent,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });
