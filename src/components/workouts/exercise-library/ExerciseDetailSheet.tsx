import { memo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import type { SimilarExerciseMatch } from '@/lib/workouts';
import { getExerciseLibraryCopy } from '@/localization/exerciseLibraryCopy';
import { useLocalization } from '@/localization';
import type { Exercise } from '@/types';

import {
  getDifficultyLabel,
  getExerciseSummary,
  getExerciseTypeLabel,
} from './exerciseLibraryDisplay';

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

const DetailBulletList = memo(function DetailBulletList({
  emptyLabel,
  items,
  styles,
}: DetailBulletListProps) {
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

export const ExerciseDetailSheet = memo(function ExerciseDetailSheet({
  exercise,
  isFavorite,
  onAdd,
  onClose,
  onToggleFavorite,
  similarExercises,
  styles,
}: ExerciseDetailSheetProps) {
  const { locale } = useLocalization();
  const copy = getExerciseLibraryCopy(locale);
  const summary = getExerciseSummary(exercise);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel={copy.closeDetails(exercise.name)}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderContent}>
              <Text style={styles.sheetTitle}>{exercise.name}</Text>
              <Text style={styles.sheetSubtitle}>
                {exercise.muscleGroup || copy.databaseEntry}
              </Text>
            </View>
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
                styles.sheetFavorite,
                isFavorite && styles.sheetFavoriteActive,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.sheetFavoriteLabel,
                  isFavorite && styles.sheetFavoriteLabelActive,
                ]}>
                ★
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>{copy.summary}</Text>
              <View style={styles.pillGrid}>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>{copy.primaryMuscles}</Text>
                  <Text style={styles.pillValue}>
                    {summary.primaryMuscles.length > 0
                      ? summary.primaryMuscles.join(', ')
                      : '—'}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>{copy.secondaryMuscles}</Text>
                  <Text style={styles.pillValue}>
                    {summary.secondaryMuscles.length > 0
                      ? summary.secondaryMuscles.join(', ')
                      : '—'}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>{copy.equipment}</Text>
                  <Text style={styles.pillValue}>
                    {summary.equipment.length > 0
                      ? summary.equipment.join(', ')
                      : copy.bodyweight}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>{copy.difficulty}</Text>
                  <Text style={styles.pillValue}>
                    {copy.facetLabel(getDifficultyLabel(exercise)) || copy.intermediate}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>{copy.type}</Text>
                  <Text style={styles.pillValue}>
                    {copy.facetLabel(getExerciseTypeLabel(exercise)) || copy.compound}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>{copy.instructions}</Text>
              <DetailBulletList
                emptyLabel={copy.noInstructions}
                items={exercise.instructions ?? []}
                styles={styles}
              />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>{copy.tips}</Text>
              <DetailBulletList
                emptyLabel={copy.noTips}
                items={exercise.tips ?? []}
                styles={styles}
              />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>{copy.commonMistakes}</Text>
              <DetailBulletList
                emptyLabel={copy.noMistakes}
                items={exercise.commonMistakes ?? []}
                styles={styles}
              />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>{copy.similarExercises}</Text>
              {similarExercises.length === 0 ? (
                <Text style={styles.detailEmpty}>{copy.noSimilar}</Text>
              ) : (
                <View style={styles.similarList}>
                  {similarExercises.map((match) => {
                    const shared = [
                      ...match.sharedMuscles.slice(0, 2),
                      ...match.sharedEquipment.slice(0, 1),
                      ...match.sharedMovementPatterns.slice(0, 1),
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    const fallback = `${copy.facetLabel(getExerciseTypeLabel(match.exercise))} · ${copy.facetLabel(getDifficultyLabel(match.exercise))}`;
                    return (
                      <View key={match.exercise.id} style={styles.similarRow}>
                        <Pressable
                          accessibilityLabel={copy.addSimilar(match.exercise.name)}
                          onPress={() => onAdd(match.exercise.name)}
                          style={({ pressed }) => [
                            styles.similarMain,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.similarName}>{match.exercise.name}</Text>
                          <Text style={styles.similarMeta}>{shared || fallback}</Text>
                        </Pressable>
                        <View style={styles.similarActions}>
                          <AppButton
                            label={copy.add}
                            onPress={() => onAdd(match.exercise.name)}
                            variant="secondary"
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.sheetFooter}>
              <AppButton label={copy.addToWorkout} onPress={() => onAdd(exercise.name)} />
              <AppButton label={copy.close} onPress={onClose} variant="secondary" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});
