import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { ExerciseMediaPreview } from '@/features/exercises/components/ExerciseMediaPreview';
import { exerciseRepository, isOssExerciseDbEnabled, type Exercise, type ExerciseRepositoryDiagnostics } from '@/features/exercises';
import { addWorkoutSessionExercises } from '@/features/workouts/sessionScreenModel';
import { getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
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
      <ExerciseMediaPreview colors={colors} contentFit="contain" exercise={exercise} playing={false} priority="low" style={styles.thumbnail} />
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

const createStyles = (colors: typeof Colors.light) =>
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
    attribution: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 16,
      marginTop: Spacing.three,
      textAlign: 'center',
    },
    diagnostic: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 14,
      textAlign: 'center',
    },
    diagnosticBlock: {
      gap: 1,
      marginTop: Spacing.one,
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'stretch',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    footer: {
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
    itemContainer: {
      alignSelf: 'center',
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    list: {
      gap: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
    },
    retryButton: {
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 14,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    retryLabel: {
      color: colors.background,
      fontSize: 13,
      fontWeight: '900',
    },
    scrollView: {
      flex: 1,
    },
    searchBar: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      marginTop: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    searchIcon: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '700',
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      minWidth: 0,
    },
    screen: {
      flex: 1,
    },
    section: {
      gap: Spacing.two,
      marginTop: Spacing.three,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    stateCard: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      marginTop: Spacing.three,
      padding: Spacing.four,
    },
    stateText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      textAlign: 'center',
    },
    stateTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 22,
      textAlign: 'center',
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

const createRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    infoButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: Spacing.two,
    },
    infoLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '900',
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 17,
      textTransform: 'capitalize',
    },
    name: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 21,
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
      minHeight: 98,
      padding: Spacing.two,
    },
    rowSelected: {
      borderColor: colors.accent,
    },
    selection: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    selectionLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '900',
    },
    selectionLabelSelected: {
      color: colors.background,
    },
    selectionSelected: {
      backgroundColor: colors.accent,
    },
    thumbnail: {
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 72,
      width: 72,
    },
  });

const createFilterStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    chip: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: Spacing.three,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'capitalize',
    },
    chipLabelActive: {
      color: colors.background,
    },
    chips: {
      alignItems: 'center',
      gap: Spacing.two,
      paddingRight: Spacing.three,
    },
    chipScroll: {
      maxHeight: 38,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
    section: {
      gap: Spacing.two,
      marginTop: Spacing.three,
    },
  });
