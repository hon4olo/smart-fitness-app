import { memo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import type { Exercise } from '@/types';
import type { SimilarExerciseMatch } from '@/lib/workouts';

import { getDifficultyLabel, getExerciseSummary, getExerciseTypeLabel } from './exerciseLibraryDisplay';

type DetailBulletListProps = {
  emptyLabel: string;
  items: string[];
  styles: Record<string, any>;
};

type ExerciseDetailSheetProps = {
  exercise: Exercise;
  isFavorite: boolean;
  onAdd: (name: string) => void;
  onClose: () => void;
  onToggleFavorite: (exerciseId: string) => void;
  similarExercises: SimilarExerciseMatch[];
  styles: Record<string, any>;
};

const DetailBulletList = memo(function DetailBulletList({ emptyLabel, items, styles }: DetailBulletListProps) {
  if (items.length === 0) {
    return <Text style={styles.detailEmpty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.detailBulletList}>
      {items.map((item) => (
        <View key={item} style={styles.detailBulletRow}>
          <Text style={styles.detailBulletDot}>•</Text>
          <Text style={styles.detailBulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
});

export const ExerciseDetailSheet = memo(function ExerciseDetailSheet({ exercise, isFavorite, onAdd, onClose, onToggleFavorite, similarExercises, styles }: ExerciseDetailSheetProps) {
  const summary = getExerciseSummary(exercise);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel={`Close exercise details for ${exercise.name}`}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderContent}>
              <Text style={styles.sheetTitle}>{exercise.name}</Text>
              <Text style={styles.sheetSubtitle}>{exercise.muscleGroup || 'Exercise database entry'}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isFavorite }}
              onPress={() => onToggleFavorite(exercise.id)}
              style={({ pressed }) => [styles.sheetFavorite, isFavorite && styles.sheetFavoriteActive, pressed && styles.pressed]}>
              <Text style={[styles.sheetFavoriteLabel, isFavorite && styles.sheetFavoriteLabelActive]}>★</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Summary</Text>
              <View style={styles.pillGrid}>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Primary muscles</Text>
                  <Text style={styles.pillValue}>{summary.primaryMuscles.length > 0 ? summary.primaryMuscles.join(', ') : '—'}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Secondary muscles</Text>
                  <Text style={styles.pillValue}>{summary.secondaryMuscles.length > 0 ? summary.secondaryMuscles.join(', ') : '—'}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Equipment</Text>
                  <Text style={styles.pillValue}>{summary.equipment.length > 0 ? summary.equipment.join(', ') : 'Bodyweight'}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Difficulty</Text>
                  <Text style={styles.pillValue}>{getDifficultyLabel(exercise) || 'Intermediate'}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Type</Text>
                  <Text style={styles.pillValue}>{getExerciseTypeLabel(exercise) || 'Compound'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Instructions</Text>
              <DetailBulletList emptyLabel="No instructions saved for this exercise." items={exercise.instructions ?? []} styles={styles} />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Tips</Text>
              <DetailBulletList emptyLabel="No tips saved for this exercise." items={exercise.tips ?? []} styles={styles} />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Common mistakes</Text>
              <DetailBulletList emptyLabel="No common mistakes saved for this exercise." items={exercise.commonMistakes ?? []} styles={styles} />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Similar exercises</Text>
              {similarExercises.length === 0 ? (
                <Text style={styles.detailEmpty}>No close matches in the current library.</Text>
              ) : (
                <View style={styles.similarList}>
                  {similarExercises.map((match) => {
                    const shared = [...match.sharedMuscles.slice(0, 2), ...match.sharedEquipment.slice(0, 1), ...match.sharedMovementPatterns.slice(0, 1)]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <View key={match.exercise.id} style={styles.similarRow}>
                        <Pressable
                          accessibilityLabel={`Add similar exercise ${match.exercise.name}`}
                          onPress={() => onAdd(match.exercise.name)}
                          style={({ pressed }) => [styles.similarMain, pressed && styles.pressed]}>
                          <Text style={styles.similarName}>{match.exercise.name}</Text>
                          <Text style={styles.similarMeta}>{shared || `${getExerciseTypeLabel(match.exercise)} · ${getDifficultyLabel(match.exercise)}`}</Text>
                        </Pressable>
                        <View style={styles.similarActions}>
                          <AppButton label="Add" onPress={() => onAdd(match.exercise.name)} variant="secondary" />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.sheetFooter}>
              <AppButton label="Add to workout" onPress={() => onAdd(exercise.name)} />
              <AppButton label="Close" onPress={onClose} variant="secondary" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});
