import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getActiveWorkoutSessionDraft, setActiveWorkoutSessionDraft } from '@/features/workouts/storage';
import { addWorkoutSessionExercises } from '@/features/workouts/sessionScreenModel';
import { resolveExerciseByName, searchExercises } from '@/lib/workouts';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

type ExerciseCardProps = {
  selected: boolean;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

function ExerciseCard({ selected, subtitle, title, onPress }: ExerciseCardProps) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.cardPressed]}>
      <View style={styles.icon}><Text style={styles.iconLabel}>{title.slice(0, 1).toUpperCase()}</Text></View>
      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export default function WorkoutExerciseLibraryScreen() {
  const { exercises, workoutSessions } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const results = useMemo(() => searchExercises(exercises, query), [exercises, query]);
  const recentExercises = useMemo(() => {
    const recent = workoutSessions
      .flatMap((session) => session.sets.map((set) => resolveExerciseByName(set.exerciseName, exercises)).filter(Boolean))
      .filter((exercise): exercise is NonNullable<ReturnType<typeof resolveExerciseByName>> => Boolean(exercise));

    return Array.from(new Map(recent.map((exercise) => [exercise.id, exercise] as const)).values()).slice(0, 6);
  }, [exercises, workoutSessions]);

  const toggleExercise = (exerciseId: string) => {
    setSelectedIds((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId],
    );
  };

  const handleAdd = () => {
    const activeDraft = getActiveWorkoutSessionDraft();
    if (!activeDraft || selectedIds.length === 0) {
      return;
    }

    const nextExercises = selectedIds
      .map((id) => exercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));

    if (nextExercises.length === 0) {
      return;
    }

    const nextDraft = addWorkoutSessionExercises(activeDraft, nextExercises);
    setActiveWorkoutSessionDraft(nextDraft);
    router.replace('/workout-session');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>‹</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Add exercises</Text>
              <Text style={styles.subtitle}>Pick one or more movements to add to the active workout.</Text>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder="Search exercises"
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.accent}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {recentExercises.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <View style={styles.grid}>
                {recentExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    selected={selectedIds.includes(exercise.id)}
                    subtitle={exercise.muscleGroup ?? exercise.category}
                    title={exercise.name}
                    onPress={() => toggleExercise(exercise.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'All exercises'}</Text>
            <View style={styles.grid}>
              {results.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  selected={selectedIds.includes(exercise.id)}
                  subtitle={exercise.muscleGroup ?? exercise.category}
                  title={exercise.name}
                  onPress={() => toggleExercise(exercise.id)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

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
      minHeight: 52,
      justifyContent: 'center',
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
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    pressed: {
      opacity: 0.72,
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
    scrollView: {
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
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.4,
      lineHeight: 32,
    },
  });

const createCardStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
      padding: Spacing.three,
      width: '48%',
      minHeight: 128,
    },
    cardPressed: {
      opacity: 0.75,
    },
    cardSelected: {
      borderColor: colors.accent,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 16,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    iconLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
      lineHeight: 19,
    },
  });
