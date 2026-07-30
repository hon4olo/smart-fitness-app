import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { getExerciseLibraryCopy } from '@/localization/exerciseLibraryCopy';
import { useLocalization } from '@/localization';
import type { Exercise } from '@/types';

import {
  buildQueryHighlight,
  getDifficultyLabel,
  getExerciseSummary,
  getExerciseTypeLabel,
} from './exerciseLibraryDisplay';

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

export const ExerciseRow = memo(function ExerciseRow({
  exercise,
  isAdded,
  isFavorite,
  onAdd,
  onDelete,
  onOpenDetail,
  onToggleFavorite,
  query,
  sectionLabel,
  styles,
}: ExerciseRowProps) {
  const { locale } = useLocalization();
  const copy = getExerciseLibraryCopy(locale);
  const summary = getExerciseSummary(exercise);
  const exerciseMeta = [
    copy.facetLabel(getDifficultyLabel(exercise)),
    copy.facetLabel(getExerciseTypeLabel(exercise)),
    ...summary.equipment.slice(0, 2),
  ]
    .filter(Boolean)
    .join(' · ');
  const muscleMeta = [
    exercise.muscleGroup,
    ...summary.primaryMuscles.slice(0, 2),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.exerciseRow}>
      <Pressable
        accessibilityLabel={copy.openDetails(exercise.name)}
        onPress={() => onOpenDetail(exercise.id)}
        style={({ pressed }) => [styles.exerciseMain, pressed && styles.pressed]}>
        <View style={styles.exerciseTitleRow}>
          <Text style={styles.exerciseName}>
            {buildQueryHighlight(exercise.name, query, styles)}
          </Text>
          {isFavorite ? <Text style={styles.favoriteBadge}>★</Text> : null}
        </View>
        {muscleMeta ? <Text style={styles.exerciseMeta}>{muscleMeta}</Text> : null}
        {exerciseMeta ? (
          <Text style={styles.exerciseMetaSecondary}>{exerciseMeta}</Text>
        ) : null}
        <Text style={styles.exerciseSectionLabel}>{sectionLabel}</Text>
      </Pressable>

      <View style={styles.exerciseActions}>
        <AppButton
          disabled={isAdded}
          label={isAdded ? copy.added : copy.add}
          onPress={() => onAdd(exercise.name)}
          variant="secondary"
        />
        <AppButton
          label={copy.details}
          onPress={() => onOpenDetail(exercise.id)}
          variant="secondary"
        />
        <Pressable
          accessibilityLabel={
            isFavorite
              ? copy.removeFavorite(exercise.name)
              : copy.addFavorite(exercise.name)
          }
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          onPress={() => onToggleFavorite(exercise.id)}
          style={({ pressed }) => [
            styles.favoriteToggle,
            isFavorite && styles.favoriteToggleActive,
            pressed && styles.pressed,
          ]}>
          <Text
            style={[
              styles.favoriteToggleLabel,
              isFavorite && styles.favoriteToggleLabelActive,
            ]}>
            ★
          </Text>
        </Pressable>
        {exercise.isCustom ? (
          <AppButton
            label={copy.delete}
            onPress={() => onDelete(exercise.id)}
            variant="secondary"
          />
        ) : null}
      </View>
    </View>
  );
});
