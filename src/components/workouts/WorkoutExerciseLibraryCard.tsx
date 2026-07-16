import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { Exercise, WorkoutSession } from '@/types';
import { getRecentExercisesFromWorkoutSessions, getSimilarExercises, searchExercises, type SimilarExerciseMatch } from '@/lib/workouts';
import { matchesExerciseQuery } from '@/data/exercises';

import { EmptyWorkoutState } from './EmptyWorkoutState';

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

type FilterValue = 'all' | string;

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

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
};

type DetailBulletListProps = {
  items: string[];
  emptyLabel: string;
};

type ExerciseDetailSheetProps = {
  exercise: Exercise;
  isFavorite: boolean;
  onAdd: (name: string) => void;
  onClose: () => void;
  onToggleFavorite: (exerciseId: string) => void;
  similarExercises: SimilarExerciseMatch[];
};

const FAVORITES_STORAGE_KEY = 'exercise-browser:favorites-v1';
const FILTER_ALL: FilterValue = 'all';
const DIFFICULTY_FILTERS = ['beginner', 'intermediate', 'advanced'] as const;
const EXERCISE_TYPE_FILTERS = ['compound', 'isolation', 'cardio', 'mobility', 'skill'] as const;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const titleCase = (value: string) =>
  normalize(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean)));

const formatFilterLabel = (value: string) => titleCase(value) || value;

const isFieldMatch = (value: string, query: string) => normalize(value).includes(normalize(query));

const getFacetOptions = (exercises: Exercise[]) => {
  const muscles = uniqueStrings(exercises.flatMap((exercise) => [exercise.muscleGroup, ...(exercise.primaryMuscles ?? []), ...(exercise.secondaryMuscles ?? [])]))
    .map(titleCase)
    .sort((left, right) => left.localeCompare(right));
  const equipment = uniqueStrings(exercises.flatMap((exercise) => exercise.equipment ?? [])).map(titleCase).sort((left, right) => left.localeCompare(right));

  return { equipment, muscles };
};

const buildQueryHighlight = (text: string, query: string) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return <Text>{text}</Text>;
  }

  const tokens = uniqueStrings(normalizedQuery.split(/\s+/).filter((token) => token.length > 1)).sort((left, right) => right.length - left.length);
  const lowerText = text.toLowerCase();

  let bestIndex = -1;
  let bestToken = '';

  tokens.forEach((token) => {
    const index = lowerText.indexOf(token);

    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
      bestToken = token;
    }
  });

  if (bestIndex === -1) {
    return <Text>{text}</Text>;
  }

  const matchEnd = bestIndex + bestToken.length;

  return (
    <Text>
      {text.slice(0, bestIndex)}
      <Text style={styles.highlight}>{text.slice(bestIndex, matchEnd)}</Text>
      {text.slice(matchEnd)}
    </Text>
  );
};

const getExerciseSummary = (exercise: Exercise) => {
  const primaryMuscles = uniqueStrings(exercise.primaryMuscles ?? []).map(titleCase);
  const secondaryMuscles = uniqueStrings(exercise.secondaryMuscles ?? []).map(titleCase);
  const equipment = uniqueStrings(exercise.equipment ?? []).map(titleCase);

  return {
    equipment,
    primaryMuscles,
    secondaryMuscles,
  };
};

const getExerciseTypeLabel = (exercise: Exercise) => titleCase(exercise.exerciseType ?? '');
const getDifficultyLabel = (exercise: Exercise) => titleCase(exercise.difficulty ?? '');

const matchesFacet = (exercise: Exercise, facet: FilterValue, facetType: 'muscle' | 'equipment' | 'difficulty' | 'exerciseType') => {
  if (facet === FILTER_ALL) {
    return true;
  }

  if (facetType === 'difficulty') {
    return normalize(exercise.difficulty ?? '') === normalize(facet);
  }

  if (facetType === 'exerciseType') {
    return normalize(exercise.exerciseType ?? '') === normalize(facet);
  }

  if (facetType === 'muscle') {
    return matchesExerciseQuery(exercise, facet) || isFieldMatch(exercise.muscleGroup ?? '', facet);
  }

  return matchesExerciseQuery(exercise, facet);
};

const FilterChip = memo(function FilterChip({ label, onPress, selected = false }: FilterChipProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityHint="Toggle this exercise filter"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}>
      <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelSelected]}>{label}</Text>
    </Pressable>
  );
});

const DetailBulletList = memo(function DetailBulletList({ emptyLabel, items }: DetailBulletListProps) {
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

const ExerciseRow = memo(function ExerciseRow({ exercise, isAdded, isFavorite, onAdd, onDelete, onOpenDetail, onToggleFavorite, query, sectionLabel }: ExerciseRowProps) {
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
          <Text style={styles.exerciseName}>{buildQueryHighlight(exercise.name, query)}</Text>
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

const ExerciseDetailSheet = memo(function ExerciseDetailSheet({ exercise, isFavorite, onAdd, onClose, onToggleFavorite, similarExercises }: ExerciseDetailSheetProps) {
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
              <DetailBulletList emptyLabel="No instructions saved for this exercise." items={exercise.instructions ?? []} />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Tips</Text>
              <DetailBulletList emptyLabel="No tips saved for this exercise." items={exercise.tips ?? []} />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Common mistakes</Text>
              <DetailBulletList emptyLabel="No common mistakes saved for this exercise." items={exercise.commonMistakes ?? []} />
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
  const recentExercises = useMemo(() => getRecentExercisesFromWorkoutSessions(workoutSessions, exercises, 10), [exercises, workoutSessions]);
  const recentIds = useMemo(() => new Set(recentExercises.map((exercise) => exercise.id)), [recentExercises]);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((value) => {
        if (!active) {
          return;
        }

        if (value) {
          try {
            const parsed = JSON.parse(value) as unknown;
            if (Array.isArray(parsed)) {
              setFavoriteExerciseIds(parsed.filter((entry): entry is string => typeof entry === 'string' && exerciseIdSet.has(entry)));
            }
          } catch {
            setFavoriteExerciseIds([]);
          }
        }

        setIsFavoritesReady(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setIsFavoritesReady(true);
      });

    return () => {
      active = false;
    };
  }, [exerciseIdSet]);

  useEffect(() => {
    if (!isFavoritesReady) {
      return;
    }

    const filteredFavoriteIds = favoriteExerciseIds.filter((id) => exerciseIdSet.has(id));

    if (filteredFavoriteIds.length !== favoriteExerciseIds.length) {
      setFavoriteExerciseIds(filteredFavoriteIds);
      return;
    }

    void AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filteredFavoriteIds)).catch(() => undefined);
  }, [exerciseIdSet, favoriteExerciseIds, isFavoritesReady]);

  useEffect(() => {
    if (!selectedExerciseId) {
      return;
    }

    if (!exerciseIdSet.has(selectedExerciseId)) {
      setSelectedExerciseId(null);
    }
  }, [exerciseIdSet, selectedExerciseId]);

  const toggleFavorite = useCallback((exerciseId: string) => {
    setFavoriteExerciseIds((currentFavorites) => {
      if (currentFavorites.includes(exerciseId)) {
        return currentFavorites.filter((id) => id !== exerciseId);
      }

      return [exerciseId, ...currentFavorites].slice(0, 50);
    });
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

    if (!searchQuery) {
      return [...filtered].sort((left, right) => left.name.localeCompare(right.name));
    }

    return filtered;
  }, [exercises, searchQuery, selectedDifficulty, selectedEquipment, selectedExerciseType, selectedMuscle]);

  const favoriteExercises = useMemo(
    () => favoriteExerciseIds.map((id) => filteredExercises.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise)),
    [favoriteExerciseIds, filteredExercises],
  );
  const recentFilteredExercises = useMemo(
    () => recentExercises.filter((exercise) => filteredExercises.some((filteredExercise) => filteredExercise.id === exercise.id)),
    [filteredExercises, recentExercises],
  );
  const sectionedExerciseIds = useMemo(
    () => new Set([...favoriteExercises.map((exercise) => exercise.id), ...recentFilteredExercises.map((exercise) => exercise.id)]),
    [favoriteExercises, recentFilteredExercises],
  );
  const mainExercises = useMemo(
    () => filteredExercises.filter((exercise) => !sectionedExerciseIds.has(exercise.id)),
    [filteredExercises, sectionedExerciseIds],
  );
  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exerciseIdSet, exercises, selectedExerciseId],
  );
  const selectedSimilarExercises = useMemo(
    () => (selectedExercise ? getSimilarExercises(selectedExercise, exercises, 5) : []),
    [exercises, selectedExercise],
  );
  const isFiltersActive = selectedMuscle !== FILTER_ALL || selectedEquipment !== FILTER_ALL || selectedDifficulty !== FILTER_ALL || selectedExerciseType !== FILTER_ALL;
  const hasActiveSearch = searchQuery.length > 0;
  const hasAnyResults = filteredExercises.length > 0;

  const handleClearFilters = useCallback(() => {
    setSelectedMuscle(FILTER_ALL);
    setSelectedEquipment(FILTER_ALL);
    setSelectedDifficulty(FILTER_ALL);
    setSelectedExerciseType(FILTER_ALL);
    onSearchChange('');
  }, [onSearchChange]);

  const handleDeleteExercise = useCallback(
    (exerciseId: string) => {
      if (selectedExerciseId === exerciseId) {
        setSelectedExerciseId(null);
      }

      setFavoriteExerciseIds((currentFavorites) => currentFavorites.filter((id) => id !== exerciseId));
      onDeleteExercise(exerciseId);
    },
    [onDeleteExercise, selectedExerciseId],
  );

  const handleCloseSelectedExercise = useCallback(() => {
    setSelectedExerciseId(null);
  }, []);

  const handleAddExercise = useCallback(
    (name: string) => {
      onAddDatabaseExercise(name);
    },
    [onAddDatabaseExercise],
  );
  const renderExerciseSection = (title: string, exercisesToRender: Exercise[], sectionLabel: string) => {
    if (exercisesToRender.length === 0) {
      return null;
    }

    return (
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{title}</Text>
          <Text style={styles.sectionCount}>{exercisesToRender.length}</Text>
        </View>
        <View style={styles.sectionList}>
          {exercisesToRender.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              isAdded={isExerciseAdded(exercise.name)}
              isFavorite={favoriteIdSet.has(exercise.id)}
              onAdd={handleAddExercise}
              onDelete={handleDeleteExercise}
              onOpenDetail={setSelectedExerciseId}
              onToggleFavorite={toggleFavorite}
              query={searchQuery}
              sectionLabel={sectionLabel}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <AppCard>
      <Pressable
        accessibilityLabel="Toggle exercise browser"
        accessibilityRole="button"
        onPress={onToggleExpanded}
        style={styles.collapsibleHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.sectionTitle}>{`Exercise browser ${isExpanded ? '−' : '+'}`}</Text>
            <Text style={styles.subtitle}>Search aliases, tags, equipment, muscles, and similar movements.</Text>
          </View>
          <Text style={styles.toggle}>{isExpanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.searchSection}>
            <Text selectable style={styles.inputLabel}>
              Search exercises
            </Text>
            <TextInput
              onChangeText={onSearchChange}
              placeholder="Search aliases, tags, equipment, muscles..."
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={searchValue}
            />
            <Text style={styles.searchHint}>Partial matches are supported across names, aliases, tags, equipment, and muscle names.</Text>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.sectionHeading}>Filter bar</Text>
              <Pressable
                accessibilityLabel="Clear exercise filters"
                accessibilityRole="button"
                onPress={handleClearFilters}
                style={({ pressed }) => [styles.clearFiltersButton, pressed && styles.pressed]}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </Pressable>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Muscle</Text>
              <View style={styles.filterChips}>
                <FilterChip label="All" onPress={() => setSelectedMuscle(FILTER_ALL)} selected={selectedMuscle === FILTER_ALL} />
                {muscles.map((muscle) => (
                  <FilterChip key={muscle} label={muscle} onPress={() => setSelectedMuscle(muscle)} selected={selectedMuscle === muscle} />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Equipment</Text>
              <View style={styles.filterChips}>
                <FilterChip label="All" onPress={() => setSelectedEquipment(FILTER_ALL)} selected={selectedEquipment === FILTER_ALL} />
                {equipment.map((item) => (
                  <FilterChip key={item} label={item} onPress={() => setSelectedEquipment(item)} selected={selectedEquipment === item} />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Difficulty</Text>
              <View style={styles.filterChips}>
                <FilterChip label="All" onPress={() => setSelectedDifficulty(FILTER_ALL)} selected={selectedDifficulty === FILTER_ALL} />
                {DIFFICULTY_FILTERS.map((difficulty) => (
                  <FilterChip key={difficulty} label={formatFilterLabel(difficulty)} onPress={() => setSelectedDifficulty(difficulty)} selected={selectedDifficulty === difficulty} />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Exercise type</Text>
              <View style={styles.filterChips}>
                <FilterChip label="All" onPress={() => setSelectedExerciseType(FILTER_ALL)} selected={selectedExerciseType === FILTER_ALL} />
                {EXERCISE_TYPE_FILTERS.map((exerciseType) => (
                  <FilterChip key={exerciseType} label={formatFilterLabel(exerciseType)} onPress={() => setSelectedExerciseType(exerciseType)} selected={selectedExerciseType === exerciseType} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Favorites</Text>
              <Text style={styles.sectionCount}>{favoriteExercises.length}</Text>
            </View>
            {isFavoritesReady && favoriteExercises.length === 0 ? (
              <Text style={styles.sectionHint}>Tap the star on any exercise to pin it here.</Text>
            ) : (
              renderExerciseSection('Favorite exercises', favoriteExercises, 'Saved')
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Recently used</Text>
              <Text style={styles.sectionCount}>{recentFilteredExercises.length}</Text>
            </View>
            {recentFilteredExercises.length === 0 ? (
              <Text style={styles.sectionHint}>Your last 10 unique exercises from workout history will appear here.</Text>
            ) : (
              renderExerciseSection('Recently used exercises', recentFilteredExercises, 'Recent')
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Browse results</Text>
              <Text style={styles.sectionCount}>{filteredExercises.length}</Text>
            </View>

            {hasAnyResults ? (
              mainExercises.length > 0 ? (
                renderExerciseSection('All exercises', mainExercises, 'Browse')
              ) : (
                <Text style={styles.sectionHint}>Everything matching the current search already appears in Favorites or Recently Used.</Text>
              )
            ) : (
              <EmptyWorkoutState
                actionLabel={hasActiveSearch || isFiltersActive ? 'Clear Filters' : undefined}
                description={hasActiveSearch || isFiltersActive ? 'Broaden the search or reset the filter bar to see more exercises.' : 'Add the first exercise to your library to make browsing faster.'}
                message={hasActiveSearch || isFiltersActive ? 'No exercises match your current search and filters.' : 'No exercises found.'}
                onActionPress={hasActiveSearch || isFiltersActive ? handleClearFilters : undefined}
                title="Nothing matches"
              />
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Add custom exercise</Text>
            </View>
            <View style={styles.customForm}>
              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Exercise name
                </Text>
                <TextInput
                  onChangeText={onExerciseNameChange}
                  placeholder="Bench press"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={exerciseName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Muscle group
                </Text>
                <TextInput
                  onChangeText={onExerciseMuscleGroupChange}
                  placeholder="Chest"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={exerciseMuscleGroup}
                />
              </View>

              <View style={styles.customActions}>
                <AppButton disabled={isSaveExerciseDisabled} label="Save exercise" onPress={onSaveExercise} variant="secondary" />
              </View>
            </View>
          </View>

          {selectedExercise ? (
            <ExerciseDetailSheet
              exercise={selectedExercise}
              isFavorite={favoriteIdSet.has(selectedExercise.id)}
              onAdd={handleAddExercise}
              onClose={handleCloseSelectedExercise}
              onToggleFavorite={toggleFavorite}
              similarExercises={selectedSimilarExercises}
            />
          ) : null}
        </>
      ) : null}
    </AppCard>
  );
});

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  clearFiltersButton: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '800',
  },
  customActions: {
    alignItems: 'flex-start',
  },
  customForm: {
    gap: Spacing.two,
  },
  detailBulletDot: {
    color: Colors.dark.accent,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 22,
    width: 16,
  },
  detailBulletList: {
    gap: Spacing.one,
  },
  detailBulletRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  detailBulletText: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  detailEmpty: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  exerciseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    justifyContent: 'flex-end',
  },
  exerciseMain: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseMetaSecondary: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  exerciseName: {
    color: Colors.dark.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  exerciseRow: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  exerciseSectionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  exerciseTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  favoriteBadge: {
    color: Colors.dark.warning,
    fontSize: 14,
    fontWeight: '900',
  },
  favoriteToggle: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  favoriteToggleActive: {
    borderColor: Colors.dark.warning,
  },
  favoriteToggleLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '900',
  },
  favoriteToggleLabelActive: {
    color: Colors.dark.warning,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  filterChipLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  filterChipLabelSelected: {
    color: Colors.dark.text,
  },
  filterChipSelected: {
    borderColor: Colors.dark.accent,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  filterGroup: {
    gap: Spacing.one,
  },
  filterGroupTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filterHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterSection: {
    gap: Spacing.two,
  },
  headerContent: {
    flex: 1,
    gap: Spacing.one,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  highlight: {
    color: Colors.dark.accent,
    fontWeight: '900',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    minWidth: 145,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  pillLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pillValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.78,
  },
  searchHint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  searchSection: {
    gap: Spacing.one,
  },
  sectionBlock: {
    gap: Spacing.two,
  },
  sectionCount: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionList: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  similarActions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  similarList: {
    gap: Spacing.two,
  },
  similarMain: {
    flex: 1,
    gap: 2,
  },
  similarMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  similarName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  similarRow: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  sheet: {
    backgroundColor: Colors.dark.backgroundElement,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: '92%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  sheetFavorite: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sheetFavoriteActive: {
    borderColor: Colors.dark.warning,
  },
  sheetFavoriteLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '900',
  },
  sheetFavoriteLabelActive: {
    color: Colors.dark.warning,
  },
  sheetFooter: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: Colors.dark.border,
    borderRadius: 999,
    height: 4,
    marginBottom: Spacing.two,
    width: 72,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sheetHeaderContent: {
    flex: 1,
    gap: 2,
  },
  sheetSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '700',
  },
});
