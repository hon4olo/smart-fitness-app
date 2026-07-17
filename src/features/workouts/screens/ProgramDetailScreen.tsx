import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  deleteWorkoutProgram,
  duplicateWorkoutProgram,
  getWorkoutProgramById,
  hydrateActiveWorkoutSessionDraft,
  toggleWorkoutProgramFavorite,
} from '@/lib/workouts';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

export default function ProgramDetailScreen() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { workouts, isRestoringState } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    void hydrateActiveWorkoutSessionDraft();
  }, []);

  const program = useMemo(() => (programId ? getWorkoutProgramById(programId, workouts) : null), [programId, workouts]);

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingLabel}>Loading program…</Text>
        </View>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text style={styles.emptyTitle}>Program not found</Text>
          <Pressable onPress={() => router.replace('/workouts')} style={({ pressed }) => [styles.backToWorkouts, pressed && styles.pressed]}>
            <Text style={styles.backToWorkoutsLabel}>Back to Workouts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const workoutRows = program.days
    .filter((day) => !day.restDay && day.workoutTemplateId)
    .map((day, index) => {
      const workout = workouts.find((candidate) => candidate.id === day.workoutTemplateId) ?? null;
      return {
        id: day.id ?? `${day.weekday}-${index}`,
        title: day.workoutTemplateName ?? workout?.title ?? 'Workout',
        workoutId: workout?.id ?? day.workoutTemplateId!,
        exerciseCount: workout?.exercises.length ?? 0,
      };
    });

  const openMenu = () => {
    Alert.alert(program.name, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit program', onPress: () => router.push({ pathname: '/workouts/builder', params: { programId: program.id } }) },
      {
        text: 'Duplicate program',
        onPress: () => {
          const duplicated = duplicateWorkoutProgram(program.id, workouts);
          if (duplicated) {
            router.replace({ pathname: '/workouts/program/[programId]', params: { programId: duplicated.id } });
          }
        },
      },
      { text: 'Favorite / unfavorite', onPress: () => toggleWorkoutProgramFavorite(program.id) },
      ...(program.isCustom
        ? [
            {
              text: 'Delete program',
              style: 'destructive' as const,
              onPress: () => {
                Alert.alert('Delete program?', 'This removes the program only. Workout history stays intact.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteWorkoutProgram(program.id);
                      router.replace('/workouts');
                    },
                  },
                ]);
              },
            },
          ]
        : []),
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120, minHeight: viewportHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <Text style={styles.circleLabel}>‹</Text>
            </Pressable>
            <Pressable onPress={openMenu} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
              <Text style={styles.circleLabel}>⋯</Text>
            </Pressable>
          </View>

          <View style={styles.cover}>
            <Text style={styles.coverLabel}>{program.name.slice(0, 1).toUpperCase()}</Text>
          </View>

          <Text selectable style={styles.title}>
            {program.name}
          </Text>

          <View style={styles.metaGrid}>
            <MetaItem label="Level" value={program.difficulty ?? '—'} />
            <MetaItem label="Main goal" value={program.goal ?? '—'} />
            <MetaItem label="Days / week" value={`${program.days.filter((day) => !day.restDay).length}`} />
            <MetaItem label="Duration" value={`${program.durationWeeks} weeks`} />
          </View>

          {program.description ? <Text selectable style={styles.description}>{program.description}</Text> : null}

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Routines</Text>
              <Pressable onPress={() => router.push({ pathname: '/workouts/builder', params: { programId: program.id } })} style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}>
                <Text style={styles.inlineActionLabel}>Add routine to program</Text>
              </Pressable>
            </View>

            {workoutRows.length > 0 ? (
              workoutRows.map((row, index) => (
                <View key={row.id} style={index > 0 ? styles.dividerTop : undefined}>
                  <View style={styles.workoutRow}>
                    <View style={styles.workoutIcon}><Text style={styles.workoutIconLabel}>{row.title.slice(0, 1).toUpperCase()}</Text></View>
                    <View style={styles.workoutCopy}>
                      <Text selectable style={styles.workoutTitle}>{row.title}</Text>
                      <Text selectable style={styles.workoutMeta}>{row.exerciseCount} exercise{row.exerciseCount === 1 ? '' : 's'}</Text>
                    </View>
                    <Pressable onPress={() => router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId: row.workoutId } })} style={({ pressed }) => [styles.startChip, pressed && styles.pressed]}>
                      <Text style={styles.startChipLabel}>Start</Text>
                    </Pressable>
                    <Pressable onPress={openMenu} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
                      <Text style={styles.smallButtonLabel}>⋯</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyRows}>No workouts assigned yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createMetaStyles(colors), [colors]);
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

const createMetaStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    item: {
      gap: 4,
      minWidth: '47%',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    value: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
  });

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backToWorkouts: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      marginTop: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    backToWorkoutsLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    circleLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    content: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexGrow: 1,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },


    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    cover: {
      alignItems: 'center',
      aspectRatio: 1.7,
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      justifyContent: 'center',
      marginBottom: Spacing.three,
      overflow: 'hidden',
    },
    coverLabel: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: '900',
      opacity: 0.9,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: Spacing.three,
    },
    dividerTop: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    emptyRows: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: Spacing.two,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    inlineAction: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: 8,
    },
    inlineActionLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '900',
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
    },
    pressed: {
      opacity: 0.72,
    },
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionCard: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: Spacing.three,
      overflow: 'hidden',
      padding: Spacing.three,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    sectionTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
      marginBottom: Spacing.two,
    },
    smallButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    smallButtonLabel: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 20,
      marginTop: -2,
    },
    startChip: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
    },
    startChipLabel: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '900',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    workoutCopy: {
      flex: 1,
      minWidth: 0,
    },
    workoutIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    workoutIconLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '900',
    },
    workoutMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    workoutRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      paddingVertical: 12,
    },
    workoutTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
  });
