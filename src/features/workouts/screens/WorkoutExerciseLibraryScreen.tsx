import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { exerciseRepository, isOssExerciseDbEnabled, type Exercise, type ExerciseRepositoryDiagnostics } from '@/features/exercises';
import { addWorkoutSessionExercises } from '@/features/workouts/sessionScreenModel';
import { getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { createFilterStyles, createRowStyles, createStyles } from '@/features/workouts/styles/workoutExerciseLibraryScreenStyles';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

type ExerciseRowProps = {
  exercise: Exercise;
  onInfoPress: () => void;
  onPress: () => void;
  selected: boolean;
};

function ExerciseRow({ exercise, onInfoPress, onPress, selected }: ExerciseRowProps) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createRowStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailLabel}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {exercise.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {exercise.primaryMuscles[0] ?? exercise.bodyPart}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {exercise.equipment.join(', ') || 'No equipment'} · {exercise.bodyPart}
        </Text>
        {exercise.secondaryMuscles.length > 0 ? (
          <Text numberOfLines={1} style={styles.meta}>
            Secondary: {exercise.secondaryMuscles.slice(0, 2).join(', ')}
          </Text>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" onPress={onInfoPress} style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}>
        <Text style={styles.infoLabel}>Info</Text>
      </Pressable>
      <View style={[styles.selection, selected && styles.selectionSelected]}>
        <Text style={[styles.selectionLabel, selected && styles.selectionLabelSelected]}>{selected ? '✓' : '+'}</Text>
      </View>
    </Pressable>
  );
}

const getOptionsFromExercises = (exercises: Exercise[], field: 'equipment' | 'primaryMuscles') =>
  Array.from(new Set(exercises.flatMap((exercise) => exercise[field]))).sort((left, right) => left.localeCompare(right));

function FilterChips({
  activeValue,
  label,
  onChange,
  options,
}: {
  activeValue?: string;
  label: string;
  onChange: (value?: string) => void;
  options: string[];
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createFilterStyles(colors), [colors]);

  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
        <Pressable onPress={() => onChange(undefined)} style={({ pressed }) => [styles.chip, !activeValue && styles.chipActive, pressed && styles.pressed]}>
          <Text style={[styles.chipLabel, !activeValue && styles.chipLabelActive]}>All</Text>
        </Pressable>
        {options.map((option) => {
          const active = activeValue === option;

          return (
            <Pressable key={option} onPress={() => onChange(active ? undefined : option)} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function WorkoutExerciseLibraryScreen() {
  const { workoutSessions } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [results, setResults] = useState<Exercise[]>([]);
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<string | undefined>();
  const [equipmentFilter, setEquipmentFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<ExerciseRepositoryDiagnostics>(exerciseRepository.getDiagnostics());

  const loadInitialData = useCallback(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const exercises = await exerciseRepository.getAllExercises();

        if (cancelled) {
          return;
        }

        setAllExercises(exercises);
        setResults(exercises);
        setMuscleOptions(getOptionsFromExercises(exercises, 'primaryMuscles'));
        setEquipmentOptions(getOptionsFromExercises(exercises, 'equipment'));
        setDiagnostics(exerciseRepository.getDiagnostics());
      } catch {
        if (!cancelled) {
          setError('Could not load exercises.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadInitialData(), [loadInitialData]);

  useEffect(() => {
    let cancelled = false;

    const search = async () => {
      try {
        const nextResults = await exerciseRepository.searchExercises(query, {
          equipment: equipmentFilter,
          muscle: muscleFilter,
        });

        if (!cancelled) {
          setResults(nextResults);
        }
      } catch {
        if (!cancelled) {
          setError('Could not search exercises.');
        }
      }
    };

    void search();

    return () => {
      cancelled = true;
    };
  }, [equipmentFilter, muscleFilter, query]);

  const recentExercises = useMemo(() => {
    const recentIds = workoutSessions.flatMap((session) => session.sets.map((set) => set.exerciseId));
    const byId = new Map(allExercises.map((exercise) => [exercise.id, exercise] as const));

    return Array.from(new Set(recentIds))
      .map((id) => byId.get(id))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
      .slice(0, 6);
  }, [allExercises, workoutSessions]);
  const recentExerciseIds = useMemo(() => new Set(recentExercises.map((exercise) => exercise.id)), [recentExercises]);
  const showRecentExercises = !loading && !error && recentExercises.length > 0 && !query.trim() && !muscleFilter && !equipmentFilter;
  const listResults = useMemo(
    () => (showRecentExercises ? results.filter((exercise) => !recentExerciseIds.has(exercise.id)) : results),
    [recentExerciseIds, results, showRecentExercises],
  );

  const toggleExercise = (exerciseId: string) => {
    setSelectedIds((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId],
    );
  };

  const openDetails = (exerciseId: string) => {
    router.push({ pathname: '/exercises/[exerciseId]', params: { exerciseId } });
  };

  const handleAdd = () => {
    const activeDraft = getActiveWorkoutSessionDraft();
    if (!activeDraft || selectedIds.length === 0) {
      return;
    }

    const selectedExercises = selectedIds
      .map((id) => allExercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
      .map((exercise) => ({ id: exercise.id, name: exercise.name }));

    if (selectedExercises.length === 0) {
      return;
    }

    setActiveWorkoutSessionDraft(addWorkoutSessionExercises(activeDraft, selectedExercises));
    router.replace('/workout-session');
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={styles.itemContainer}>
      <ExerciseRow
        exercise={item}
        selected={selectedIds.includes(item.id)}
        onInfoPress={() => openDetails(item.id)}
        onPress={() => toggleExercise(item.id)}
      />
    </View>
  );

  const listHeader = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.title}>Exercise Library</Text>
          <Text style={styles.subtitle}>Pick one or more movements to add to the active workout.</Text>
          <View style={styles.diagnosticBlock}>
            <Text style={styles.diagnostic}>Provider: {diagnostics.selectedProvider}</Text>
            <Text style={styles.diagnostic}>Source: {diagnostics.loadSource ?? 'loading'}</Text>
            <Text style={styles.diagnostic}>Exercises: {diagnostics.exerciseCount}</Text>
            <Text style={styles.diagnostic}>Error: {diagnostics.lastError ?? 'none'}</Text>
            <Text style={styles.diagnostic}>OSS enabled: {isOssExerciseDbEnabled() ? 'true' : 'false'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput autoCapitalize="none" placeholder="Search exercises" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      <FilterChips activeValue={muscleFilter} label="Muscle" onChange={setMuscleFilter} options={muscleOptions} />
      <FilterChips activeValue={equipmentFilter} label="Equipment" onChange={setEquipmentFilter} options={equipmentOptions} />

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.stateText}>Loading exercises...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Exercise database unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={loadInitialData} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {showRecentExercises ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <View style={styles.list}>
            {recentExercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} selected={selectedIds.includes(exercise.id)} onInfoPress={() => openDetails(exercise.id)} onPress={() => toggleExercise(exercise.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'All exercises'} · {results.length}</Text>
        </View>
      ) : null}
    </View>
  );

  const listFooter = (
    <View style={styles.container}>
      {!loading && !error && results.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>No exercises found</Text>
          <Text style={styles.stateText}>Try a different search, muscle, or equipment filter.</Text>
        </View>
      ) : null}
      {isOssExerciseDbEnabled() && diagnostics.selectedProvider === 'oss-exercisedb' && diagnostics.loadSource !== 'local-fallback' ? (
        <Text style={styles.attribution}>Exercise data and GIFs provided by AscendAPI / ExerciseDB.</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128, paddingTop: insets.top + Spacing.three }]}
        data={loading || error ? [] : listResults}
        initialNumToRender={4}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={4}
        renderItem={renderExercise}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        updateCellsBatchingPeriod={80}
        windowSize={3}
      />

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <Pressable accessibilityRole="button" disabled={selectedIds.length === 0} onPress={handleAdd} style={({ pressed }) => [styles.addButton, selectedIds.length === 0 && styles.addButtonDisabled, pressed && selectedIds.length > 0 && styles.addButtonPressed]}>
            <Text style={styles.addButtonLabel}>{selectedIds.length > 0 ? `Add ${selectedIds.length}` : 'Add selected'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
