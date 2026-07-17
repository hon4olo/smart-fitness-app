import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { deleteWorkoutProgram, duplicateWorkoutProgram, getWorkoutProgramById, hydrateActiveWorkoutSessionDraft, toggleWorkoutProgramFavorite } from '@/lib/workouts';
import { resolveWorkoutProgramRouteState } from '@/features/workouts/routeResolution';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function ProgramDetailScreen() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { workouts, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    void hydrateActiveWorkoutSessionDraft();
  }, []);

  const routeState = useMemo(
    () => resolveWorkoutProgramRouteState({ programId, workouts, isRestoringState }),
    [isRestoringState, programId, workouts],
  );
  const program = useMemo(() => (routeState.status === 'ready' ? getWorkoutProgramById(routeState.workoutId, workouts) : null), [routeState, workouts]);

  if (isRestoringState || routeState.status === 'loading') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>
            Loading program…
          </Text>
        </View>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <Text selectable style={styles.emptyTitle}>
            Program not found
          </Text>
          <AppButton label="Back to workouts" onPress={() => router.replace('/workouts')} />
        </View>
      </View>
    );
  }

  const workoutRows = program.days
    .filter((day) => !day.restDay && Boolean(day.workoutTemplateId))
    .map((day, index) => {
      const workout = workouts.find((candidate) => candidate.id === day.workoutTemplateId);
      return {
        id: day.id ?? `${day.weekday}-${index}`,
        title: day.workoutTemplateName ?? workout?.title ?? 'Workout',
        exerciseCount: workout?.exercises.length ?? 0,
      };
    });

  const openMenu = () => {
    const items: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit program',
        onPress: () => router.push({ pathname: '/workouts/builder', params: { programId: program.id } }),
      },
      {
        text: 'Duplicate program',
        onPress: () => {
          const duplicated = duplicateWorkoutProgram(program.id, workouts);
          if (duplicated) {
            router.replace({ pathname: '/workouts/program/[programId]', params: { programId: duplicated.id } });
          }
        },
      },
      {
        text: 'Favorite / unfavorite',
        onPress: () => toggleWorkoutProgramFavorite(program.id),
      },
    ];

    if (program.isCustom) {
      items.push({
        text: 'Delete program',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete program?', 'This removes the program definition only. Completed workout history stays intact.', [
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
      });
    }

    Alert.alert(program.name, undefined, items);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backLabel}>‹</Text>
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={openMenu} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
              <Text style={styles.menuLabel}>⋯</Text>
            </Pressable>
          </View>

          <Text selectable style={styles.title}>
            {program.name}
          </Text>

          <View style={styles.card}>
            {workoutRows.length > 0 ? (
              workoutRows.map((row, index) => (
                <View key={row.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                  <View style={styles.rowIcon}>
                    <Text style={styles.rowIconLabel}>{row.title.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text selectable style={styles.rowTitle}>
                      {row.title}
                    </Text>
                    <Text selectable style={styles.rowMeta}>
                      {row.exerciseCount} exercise{row.exerciseCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text selectable style={styles.rowMeta}>
                  No workouts assigned yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
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
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      marginTop: Spacing.three,
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
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
    emptyWrap: {
      padding: Spacing.three,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
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
      gap: Spacing.two,
    },
    menuButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    menuLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      height: 30,
      justifyContent: 'center',
      width: 30,
    },
    rowIconLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    rowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
  });
