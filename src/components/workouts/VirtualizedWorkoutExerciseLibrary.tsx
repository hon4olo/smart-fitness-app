import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing } from '@/constants/theme';
import {
  loadWorkoutExerciseFavoriteIds,
  saveWorkoutExerciseFavoriteIds,
} from '@/features/workouts/exerciseFavoritesStorage';
import {
  getRecentExercisesFromWorkoutSessions,
  getSimilarExercises,
  searchExercises,
} from '@/lib/workouts';
import { useLocalization } from '@/localization';
import { getExerciseLibraryCopy } from '@/localization/exerciseLibraryCopy';
import type { Exercise, WorkoutSession } from '@/types';

import { ExerciseDetailSheet } from './exercise-library/ExerciseDetailSheet';
import { ExerciseFilterBar } from './exercise-library/ExerciseFilterBar';
import { ExerciseRow } from './exercise-library/ExerciseRow';
import {
  DIFFICULTY_FILTERS,
  EXERCISE_TYPE_FILTERS,
  FILTER_ALL,
  getFacetOptions,
  matchesFacet,
  type FilterValue,
} from './exercise-library/exerciseLibraryUtils';
import { styles } from './exercise-library/workoutExerciseLibraryCardStyles';

type Props = {
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
  bottomInset: number;
};

type ExerciseSection = {
  key: 'favorites' | 'recent' | 'browse';
  title: string;
  sectionLabel: string;
  emptyHint?: string;
  data: Exercise[];
};

export function VirtualizedWorkoutExerciseLibrary(props: Props) {
  const {
    bottomInset,
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
  } = props;
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
  const exerciseIdSet = useMemo(() => new Set(exercises.map((exercise) => exercise.id)), [exercises]);
  const favoriteIdSet = useMemo(() => new Set(favoriteExerciseIds), [favoriteExerciseIds]);
  const { muscles, equipment } = useMemo(() => getFacetOptions(exercises), [exercises]);
  const recentExercises = useMemo(
    () => getRecentExercisesFromWorkoutSessions(workoutSessions, exercises, 10),
    [exercises, workoutSessions],
  );

  useEffect(() => {
    let active = true;
    loadWorkoutExerciseFavoriteIds()
      .then((value) => {
        if (!active) return;
        setFavoriteExerciseIds(Array.from(value).filter((entry) => exerciseIdSet.has(entry)));
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
    const filteredIds = favoriteExerciseIds.filter((id) => exerciseIdSet.has(id));
    if (filteredIds.length !== favoriteExerciseIds.length) {
      setFavoriteExerciseIds(filteredIds);
      return;
    }
    void saveWorkoutExerciseFavoriteIds(filteredIds).catch(() => undefined);
  }, [exerciseIdSet, favoriteExerciseIds, isFavoritesReady]);

  useEffect(() => {
    if (selectedExerciseId && !exerciseIdSet.has(selectedExerciseId)) setSelectedExerciseId(null);
  }, [exerciseIdSet, selectedExerciseId]);

  const toggleFavorite = useCallback((exerciseId: string) => {
    setFavoriteExerciseIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [exerciseId, ...current].slice(0, 50),
    );
  }, []);

  const filteredExercises = useMemo(() => {
    const filtered = searchExercises(exercises, searchQuery).filter(
      (exercise) =>
        matchesFacet(exercise, selectedMuscle, 'muscle') &&
        matchesFacet(exercise, selectedEquipment, 'equipment') &&
        matchesFacet(exercise, selectedDifficulty, 'difficulty') &&
        matchesFacet(exercise, selectedExerciseType, 'exerciseType'),
    );
    return searchQuery ? filtered : [...filtered].sort((left, right) => left.name.localeCompare(right.name));
  }, [exercises, searchQuery, selectedDifficulty, selectedEquipment, selectedExerciseType, selectedMuscle]);

  const exerciseById = useMemo(
    () => new Map(filteredExercises.map((exercise) => [exercise.id, exercise])),
    [filteredExercises],
  );
  const favoriteExercises = useMemo(
    () => favoriteExerciseIds.map((id) => exerciseById.get(id)).filter((item): item is Exercise => Boolean(item)),
    [exerciseById, favoriteExerciseIds],
  );
  const filteredIdSet = useMemo(() => new Set(filteredExercises.map((exercise) => exercise.id)), [filteredExercises]);
  const recentFilteredExercises = useMemo(
    () => recentExercises.filter((exercise) => filteredIdSet.has(exercise.id)),
    [filteredIdSet, recentExercises],
  );
  const sectionedIds = useMemo(
    () => new Set([...favoriteExercises, ...recentFilteredExercises].map((exercise) => exercise.id)),
    [favoriteExercises, recentFilteredExercises],
  );
  const mainExercises = useMemo(
    () => filteredExercises.filter((exercise) => !sectionedIds.has(exercise.id)),
    [filteredExercises, sectionedIds],
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

  const clearFilters = useCallback(() => {
    setSelectedMuscle(FILTER_ALL);
    setSelectedEquipment(FILTER_ALL);
    setSelectedDifficulty(FILTER_ALL);
    setSelectedExerciseType(FILTER_ALL);
    onSearchChange('');
  }, [onSearchChange]);
  const handleDelete = useCallback(
    (exerciseId: string) => {
      if (selectedExerciseId === exerciseId) setSelectedExerciseId(null);
      setFavoriteExerciseIds((current) => current.filter((id) => id !== exerciseId));
      onDeleteExercise(exerciseId);
    },
    [onDeleteExercise, selectedExerciseId],
  );

  const sections = useMemo<ExerciseSection[]>(
    () =>
      isExpanded
        ? [
            {
              key: 'favorites',
              title: copy.favorites,
              sectionLabel: copy.favoriteSection,
              emptyHint: isFavoritesReady ? copy.favoriteHint : undefined,
              data: favoriteExercises,
            },
            {
              key: 'recent',
              title: copy.recentlyUsed,
              sectionLabel: copy.recentSection,
              emptyHint: copy.recentHint,
              data: recentFilteredExercises,
            },
            {
              key: 'browse',
              title: copy.browseResults,
              sectionLabel: copy.browseSection,
              data: mainExercises,
            },
          ]
        : [],
    [copy, favoriteExercises, isExpanded, isFavoritesReady, mainExercises, recentFilteredExercises],
  );

  const header = (
    <View>
      <Pressable accessibilityLabel={copy.toggleBrowser} accessibilityRole="button" onPress={onToggleExpanded} style={styles.collapsibleHeader}>
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
            onClearFilters={clearFilters}
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
        </>
      ) : null}
    </View>
  );

  const footer = isExpanded ? (
    <View style={styles.sectionBlock}>
      {filteredExercises.length === 0 ? (
        <EmptyState
          compact
          actionLabel={hasActiveSearch || isFiltersActive ? copy.clearFilters : undefined}
          description={hasActiveSearch || isFiltersActive ? copy.broadenSearch : copy.addFirst}
          message={hasActiveSearch || isFiltersActive ? copy.noFilteredMatches : copy.noExercises}
          onActionPress={hasActiveSearch || isFiltersActive ? clearFilters : undefined}
          title={copy.noMatchesTitle}
        />
      ) : mainExercises.length === 0 ? (
        <Text style={styles.sectionHint}>{copy.alreadySectioned}</Text>
      ) : null}
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
          <AppButton disabled={isSaveExerciseDisabled} label={copy.saveExercise} onPress={onSaveExercise} variant="secondary" />
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
    </View>
  ) : null;

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: bottomInset + Spacing.three }}
      keyExtractor={(exercise) => exercise.id}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      renderItem={({ item, section }) => (
        <ExerciseRow
          exercise={item}
          isAdded={isExerciseAdded(item.name)}
          isFavorite={favoriteIdSet.has(item.id)}
          onAdd={onAddDatabaseExercise}
          onDelete={handleDelete}
          onOpenDetail={setSelectedExerciseId}
          onToggleFavorite={toggleFavorite}
          query={searchQuery}
          sectionLabel={section.sectionLabel}
          styles={styles}
        />
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
          {section.data.length === 0 && section.emptyHint ? <Text style={styles.sectionHint}>{section.emptyHint}</Text> : null}
        </View>
      )}
      sections={sections}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
}
