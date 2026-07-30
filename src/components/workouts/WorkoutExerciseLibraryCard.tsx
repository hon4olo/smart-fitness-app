import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors } from '@/constants/theme';
import { loadWorkoutExerciseFavoriteIds, saveWorkoutExerciseFavoriteIds } from '@/features/workouts/exerciseFavoritesStorage';
import { getRecentExercisesFromWorkoutSessions, getSimilarExercises, searchExercises } from '@/lib/workouts';
import { getExerciseLibraryCopy } from '@/localization/exerciseLibraryCopy';
import { useLocalization } from '@/localization';
import type { Exercise, WorkoutSession } from '@/types';

import { EmptyWorkoutState } from './EmptyWorkoutState';
import { ExerciseDetailSheet } from './exercise-library/ExerciseDetailSheet';
import { ExerciseFilterBar } from './exercise-library/ExerciseFilterBar';
import { ExerciseSection } from './exercise-library/ExerciseSection';
import {
  DIFFICULTY_FILTERS,
  EXERCISE_TYPE_FILTERS,
  FILTER_ALL,
  getFacetOptions,
  matchesFacet,
  type FilterValue,
} from './exercise-library/exerciseLibraryUtils';
import { styles } from './exercise-library/workoutExerciseLibraryCardStyles';

type WorkoutExerciseLibraryCardProps = {
  exerciseName: string;
  exerciseMuscleGroup: string;
  exercises: Exercise[];
  isExpanded: boolean;
  isExerciseAdded: (name: string) => boolean;
  isSaveExerciseDisabled: boolean;
  onAddDatabaseExercise: (name: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onExerciseMuscleGroupChange: (value: string) => void;
  onExerciseNameChange: (value: string) => void;
  onSaveExercise: () => void;
  onSearchChange: (value: string) => void;
  onToggleExpanded: () => void;
  searchValue: string;
  workoutSessions: WorkoutSession[];
};

export const WorkoutExerciseLibraryCard = memo(function WorkoutExerciseLibraryCard({
  exerciseName,
  exerciseMuscleGroup,
  exercises,
  isExpanded,
  isExerciseAdded,
  isSaveExerciseDisabled,
  onAddDatabaseExercise,
  onDeleteExercise,
  onExerciseMuscleGroupChange,
  onExerciseNameChange,
  onSaveExercise,
  onSearchChange,
  onToggleExpanded,
  searchValue,
  workoutSessions,
}: WorkoutExerciseLibraryCardProps) {
  const { locale } = useLocalization();
  const copy = getExerciseLibraryCopy(locale);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([]);
  const [isFavoritesReady, setIsFavoritesReady] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<FilterValue>(FILTER_ALL);
  const [selectedEquipment, setSelectedEquipment] = useState<FilterValue>(FILTER_ALL);
  const [selectedDifficulty, setSelectedDifficulty] = useState<FilterValue>(FILTER_ALL);
  const [selectedExerciseType, setSelectedExerciseType] = useState<FilterValue>(FILTER_ALL);
  const searchQuery = searchValue.trim();
  const exerciseIdSet = useMemo(
    () => new Set(exercises.map((exercise) => exercise.id)),
    [exercises],
  );
  const favoriteIdSet = useMemo(
    () => new Set(favoriteExerciseIds),
    [favoriteExerciseIds],
  );
  const { muscles, equipment } = useMemo(
    () => getFacetOptions(exercises),
    [exercises],
  );
  const recentExercises = useMemo(
    () => getRecentExercisesFromWorkoutSessions(workoutSessions, exercises, 10),
    [exercises, workoutSessions],
  );

  useEffect(() => {
    let active = true;
    loadWorkoutExerciseFavoriteIds()
      .then((value) => {
        if (!active) return;
        setFavoriteExerciseIds(
          Array.from(value).filter((entry) => exerciseIdSet.has(entry)),
        );
        setIsFavoritesReady(true);
      })
      .catch(() => {
        if (active) setIsFavoritesReady(true);
      });
    return () => {
      active = false;
    };
  }, [exerciseIdSet]);

  useEffect(() => {
    if (!isFavoritesReady) return;
    const filteredFavoriteIds = favoriteExerciseIds.filter((id) =>
      exerciseIdSet.has(id),
    );
    if (filteredFavoriteIds.length !== favoriteExerciseIds.length) {
      setFavoriteExerciseIds(filteredFavoriteIds);
      return;
    }
    void saveWorkoutExerciseFavoriteIds(filteredFavoriteIds).catch(() => undefined);
  }, [exerciseIdSet, favoriteExerciseIds, isFavoritesReady]);

  useEffect(() => {
    if (selectedExerciseId && !exerciseIdSet.has(selectedExerciseId)) {
      setSelectedExerciseId(null);
    }
  }, [exerciseIdSet, selectedExerciseId]);

  const toggleFavorite = useCallback((exerciseId: string) => {
    setFavoriteExerciseIds((currentFavorites) =>
      currentFavorites.includes(exerciseId)
        ? currentFavorites.filter((id) => id !== exerciseId)
        : [exerciseId, ...currentFavorites].slice(0, 50),
    );
  }, []);

  const filteredExercises = useMemo(() => {
    const searchedExercises = searchExercises(exercises, searchQuery);
    const filtered = searchedExercises.filter(
      (exercise) =>
        matchesFacet(exercise, selectedMuscle, 'muscle') &&
        matchesFacet(exercise, selectedEquipment, 'equipment') &&
        matchesFacet(exercise, selectedDifficulty, 'difficulty') &&
        matchesFacet(exercise, selectedExerciseType, 'exerciseType'),
    );
    return searchQuery
      ? filtered
      : [...filtered].sort((left, right) => left.name.localeCompare(right.name));
  }, [
    exercises,
    searchQuery,
    selectedDifficulty,
    selectedEquipment,
    selectedExerciseType,
    selectedMuscle,
  ]);

  const favoriteExercises = useMemo(
    () =>
      favoriteExerciseIds
        .map((id) => filteredExercises.find((exercise) => exercise.id === id))
        .filter((exercise): exercise is Exercise => Boolean(exercise)),
    [favoriteExerciseIds, filteredExercises],
  );
  const recentFilteredExercises = useMemo(
    () =>
      recentExercises.filter((exercise) =>
        filteredExercises.some((filteredExercise) => filteredExercise.id === exercise.id),
      ),
    [filteredExercises, recentExercises],
  );
  const sectionedExerciseIds = useMemo(
    () =>
      new Set([
        ...favoriteExercises.map((exercise) => exercise.id),
        ...recentFilteredExercises.map((exercise) => exercise.id),
      ]),
    [favoriteExercises, recentFilteredExercises],
  );
  const mainExercises = useMemo(
    () =>
      filteredExercises.filter((exercise) => !sectionedExerciseIds.has(exercise.id)),
    [filteredExercises, sectionedExerciseIds],
  );
  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId],
  );
  const selectedSimilarExercises = useMemo(
    () => (selectedExercise ? getSimilarExercises(selectedExercise, exercises, 5) : []),
    [exercises, selectedExercise],
  );
  const isFiltersActive =
    selectedMuscle !== FILTER_ALL ||
    selectedEquipment !== FILTER_ALL ||
    selectedDifficulty !== FILTER_ALL ||
    selectedExerciseType !== FILTER_ALL;
  const hasActiveSearch = searchQuery.length > 0;

  const handleClearFilters = useCallback(() => {
    setSelectedMuscle(FILTER_ALL);
    setSelectedEquipment(FILTER_ALL);
    setSelectedDifficulty(FILTER_ALL);
    setSelectedExerciseType(FILTER_ALL);
    onSearchChange('');
  }, [onSearchChange]);

  const handleDeleteExercise = useCallback(
    (exerciseId: string) => {
      if (selectedExerciseId === exerciseId) setSelectedExerciseId(null);
      setFavoriteExerciseIds((currentFavorites) =>
        currentFavorites.filter((id) => id !== exerciseId),
      );
      onDeleteExercise(exerciseId);
    },
    [onDeleteExercise, selectedExerciseId],
  );

  return (
    <AppCard>
      <Pressable
        accessibilityLabel={copy.toggleBrowser}
        accessibilityRole="button"
        onPress={onToggleExpanded}
        style={styles.collapsibleHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.sectionTitle}>{`${copy.browserTitle} ${isExpanded ? '−' : '+'}`}</Text>
            <Text style={styles.subtitle}>{copy.browserSubtitle}</Text>
          </View>
          <Text style={styles.toggle}>{isExpanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.searchSection}>
            <Text selectable style={styles.inputLabel}>{copy.searchLabel}</Text>
            <TextInput
              onChangeText={onSearchChange}
              placeholder={copy.searchPlaceholder}
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={searchValue}
            />
            <Text style={styles.searchHint}>{copy.searchHint}</Text>
          </View>

          <ExerciseFilterBar
            difficultyFilters={DIFFICULTY_FILTERS}
            equipment={equipment}
            exerciseTypeFilters={EXERCISE_TYPE_FILTERS}
            formatFilterLabel={copy.facetLabel}
            muscles={muscles}
            onClearFilters={handleClearFilters}
            onSelectDifficulty={setSelectedDifficulty}
            onSelectEquipment={setSelectedEquipment}
            onSelectExerciseType={setSelectedExerciseType}
            onSelectMuscle={setSelectedMuscle}
            selectedDifficulty={selectedDifficulty}
            selectedEquipment={selectedEquipment}
            selectedExerciseType={selectedExerciseType}
            selectedMuscle={selectedMuscle}
            styles={styles}
          />

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>{copy.favorites}</Text>
              <Text style={styles.sectionCount}>{favoriteExercises.length}</Text>
            </View>
            {isFavoritesReady && favoriteExercises.length === 0 ? (
              <Text style={styles.sectionHint}>{copy.favoriteHint}</Text>
            ) : (
              <ExerciseSection
                exercises={favoriteExercises}
                favoriteIdSet={favoriteIdSet}
                isExerciseAdded={isExerciseAdded}
                onAdd={onAddDatabaseExercise}
                onDelete={handleDeleteExercise}
                onOpenDetail={setSelectedExerciseId}
                onToggleFavorite={toggleFavorite}
                query={searchQuery}
                sectionLabel={copy.favoriteSection}
                styles={styles}
                title={copy.favoriteExercises}
              />
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>{copy.recentlyUsed}</Text>
              <Text style={styles.sectionCount}>{recentFilteredExercises.length}</Text>
            </View>
            {recentFilteredExercises.length === 0 ? (
              <Text style={styles.sectionHint}>{copy.recentHint}</Text>
            ) : (
              <ExerciseSection
                exercises={recentFilteredExercises}
                favoriteIdSet={favoriteIdSet}
                isExerciseAdded={isExerciseAdded}
                onAdd={onAddDatabaseExercise}
                onDelete={handleDeleteExercise}
                onOpenDetail={setSelectedExerciseId}
                onToggleFavorite={toggleFavorite}
                query={searchQuery}
                sectionLabel={copy.recentSection}
                styles={styles}
                title={copy.recentlyUsedExercises}
              />
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>{copy.browseResults}</Text>
              <Text style={styles.sectionCount}>{filteredExercises.length}</Text>
            </View>
            {filteredExercises.length > 0 ? (
              mainExercises.length > 0 ? (
                <ExerciseSection
                  exercises={mainExercises}
                  favoriteIdSet={favoriteIdSet}
                  isExerciseAdded={isExerciseAdded}
                  onAdd={onAddDatabaseExercise}
                  onDelete={handleDeleteExercise}
                  onOpenDetail={setSelectedExerciseId}
                  onToggleFavorite={toggleFavorite}
                  query={searchQuery}
                  sectionLabel={copy.browseSection}
                  styles={styles}
                  title={copy.allExercises}
                />
              ) : (
                <Text style={styles.sectionHint}>{copy.alreadySectioned}</Text>
              )
            ) : (
              <EmptyWorkoutState
                actionLabel={hasActiveSearch || isFiltersActive ? copy.clearFilters : undefined}
                description={hasActiveSearch || isFiltersActive ? copy.broadenSearch : copy.addFirst}
                message={hasActiveSearch || isFiltersActive ? copy.noFilteredMatches : copy.noExercises}
                onActionPress={hasActiveSearch || isFiltersActive ? handleClearFilters : undefined}
                title={copy.noMatchesTitle}
              />
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>{copy.addCustom}</Text>
            </View>
            <View style={styles.customForm}>
              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>{copy.exerciseName}</Text>
                <TextInput
                  onChangeText={onExerciseNameChange}
                  placeholder={copy.exerciseNamePlaceholder}
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={exerciseName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>{copy.muscleGroup}</Text>
                <TextInput
                  onChangeText={onExerciseMuscleGroupChange}
                  placeholder={copy.muscleGroupPlaceholder}
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={exerciseMuscleGroup}
                />
              </View>
              <View style={styles.customActions}>
                <AppButton
                  disabled={isSaveExerciseDisabled}
                  label={copy.saveExercise}
                  onPress={onSaveExercise}
                  variant="secondary"
                />
              </View>
            </View>
          </View>

          {selectedExercise ? (
            <ExerciseDetailSheet
              exercise={selectedExercise}
              isFavorite={favoriteIdSet.has(selectedExercise.id)}
              onAdd={onAddDatabaseExercise}
              onClose={() => setSelectedExerciseId(null)}
              onToggleFavorite={toggleFavorite}
              similarExercises={selectedSimilarExercises}
              styles={styles}
            />
          ) : null}
        </>
      ) : null}
    </AppCard>
  );
});
