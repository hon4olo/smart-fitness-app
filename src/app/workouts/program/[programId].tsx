import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { deleteWorkoutProgram, duplicateWorkoutProgram, getWorkoutProgramById, toggleWorkoutProgramFavorite } from '@/lib/workouts';
import { resolveWorkoutProgramRouteState } from '@/features/workouts/routeResolution';
import { SimpleProgramEditor } from '@/components/workouts/SimpleProgramEditor';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function ProgramDetailRoute() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const { workouts, isRestoringState } = useAppContext();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const routeState = useMemo(() => resolveWorkoutProgramRouteState({ programId, workouts, isRestoringState }), [isRestoringState, programId, workouts]);
  const program = useMemo(() => (routeState.status === 'ready' ? getWorkoutProgramById(routeState.workoutId, workouts) : null), [routeState, workouts]);

  const workoutRows = useMemo(
    () =>
      (program?.days ?? [])
        .filter((day) => !day.restDay && Boolean(day.workoutTemplateId))
        .map((day, index) => ({
          id: day.id ?? `${day.weekday}-${index}`,
          title: day.workoutTemplateName ?? day.workoutTemplateId ?? 'Workout',
          exerciseCount: workouts.find((workout) => workout.id === day.workoutTemplateId)?.exercises.length ?? 0,
          secondary: day.notes?.trim() ? day.notes.trim() : undefined,
        })),
    [program, workouts],
  );

  if (isRestoringState) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
          <Text selectable style={styles.loadingLabel}>
            Loading workout…
          </Text>
        </View>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrap}>
          <Text selectable style={styles.emptyTitle}>
            Program not found
          </Text>
          <AppButton label="Back to workouts" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const showOverflow = () => {
    const duplicate = () => {
      const duplicated = duplicateWorkoutProgram(program.id, workouts);
      if (duplicated) {
        router.replace({ pathname: '/workouts/program/[programId]', params: { programId: duplicated.id } });
      }
    };

    const buttons: any[] = [{ text: 'Edit program', onPress: () => router.push({ pathname: '/workouts/builder', params: { programId: program.id } }) }, { text: 'Duplicate program', onPress: duplicate }];

    if (program.isCustom) {
      buttons.push({
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

    buttons.push({ text: 'Favorite / unfavorite', onPress: () => toggleWorkoutProgramFavorite(program.id) });
    buttons.push({ text: 'Advanced settings', onPress: () => Alert.alert('Advanced settings', 'Hidden fields are preserved automatically.') });

    Alert.alert(program.name, undefined, [{ text: 'Cancel', style: 'cancel' }, ...buttons]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 104 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text selectable style={styles.title}>
              Program
            </Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={showOverflow} style={({ pressed }) => [styles.menuButton, pressed && styles.menuPressed]}>
              <Text style={styles.menuLabel}>⋯</Text>
            </Pressable>
          </View>

          <SimpleProgramEditor
            colors={colors}
            name={program.name}
            onOpenWorkout={(id) => router.push({ pathname: '/workouts/template/[workoutId]', params: { workoutId: id } })}
            readOnly
            workoutRows={workoutRows}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton label="Edit program" onPress={() => router.push({ pathname: '/workouts/builder', params: { programId: program.id } })} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
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
      letterSpacing: -0.3,
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
    headerRow: {
      alignItems: 'center',
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    loadingWrap: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    menuButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      minWidth: 32,
    },
    menuPressed: {
      opacity: 0.65,
    },
    menuLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
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
