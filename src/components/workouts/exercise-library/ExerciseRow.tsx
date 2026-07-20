import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import type { Exercise } from '@/types';

import { buildQueryHighlight, getDifficultyLabel, getExerciseSummary, getExerciseTypeLabel } from './exerciseLibraryDisplay';

type ExerciseRowProps = {
  exercise: Exercise;
  isAdded: boolean;
  isFavorite: boolean;
  onAdd: (name: string) => void;
  onDelete: (exerciseId: string) => void;
  onOpenDetail: (exerciseId: string) => void;
  onToggleFavorite: (exerciseId: string) => void;
  query: string;
  sectionLabel: string;
  styles: Record<string, any>;
};

export const ExerciseRow = memo(function ExerciseRow({ exercise, isAdded, isFavorite, onAdd, onDelete, onOpenDetail, onToggleFavorite, query, sectionLabel, styles }: ExerciseRowProps) {
  const summary = getExerciseSummary(exercise);
  const exerciseMeta = [getDifficultyLabel(exercise), getExerciseTypeLabel(exercise), ...summary.equipment.slice(0, 2)].filter(Boolean).join(' · ');
  const muscleMeta = [exercise.muscleGroup, ...summary.primaryMuscles.slice(0, 2)].filter(Boolean).join(' · ');

  return (
    <View style={styles.exerciseRow}>
      <Pressable
        accessibilityLabel={`Open details for ${exercise.name}`}
        onPress={() => onOpenDetail(exercise.id)}
        style={({ pressed }) => [styles.exerciseMain, pressed && styles.pressed]}>
        <View style={styles.exerciseTitleRow}>
          <Text style={styles.exerciseName}>{buildQueryHighlight(exercise.name, query, styles)}</Text>
          {isFavorite ? <Text style={styles.favoriteBadge}>★</Text> : null}
        </View>
        {muscleMeta ? <Text style={styles.exerciseMeta}>{muscleMeta}</Text> : null}
        {exerciseMeta ? <Text style={styles.exerciseMetaSecondary}>{exerciseMeta}</Text> : null}
        <Text style={styles.exerciseSectionLabel}>{sectionLabel}</Text>
      </Pressable>

      <View style={styles.exerciseActions}>
        <AppButton disabled={isAdded} label={isAdded ? 'Added' : 'Add'} onPress={() => onAdd(exercise.name)} variant="secondary" />
        <AppButton label="Details" onPress={() => onOpenDetail(exercise.id)} variant="secondary" />
        <Pressable
          accessibilityLabel={isFavorite ? `Remove ${exercise.name} from favorites` : `Add ${exercise.name} to favorites`}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          onPress={() => onToggleFavorite(exercise.id)}
          style={({ pressed }) => [styles.favoriteToggle, isFavorite && styles.favoriteToggleActive, pressed && styles.pressed]}>
          <Text style={[styles.favoriteToggleLabel, isFavorite && styles.favoriteToggleLabelActive]}>★</Text>
        </Pressable>
        {exercise.isCustom ? <AppButton label="Delete" onPress={() => onDelete(exercise.id)} variant="secondary" /> : null}
      </View>
    </View>
  );
});
