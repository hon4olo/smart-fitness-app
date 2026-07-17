import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomTabInset, Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createDefaultTrainingProgram, getActiveWorkoutSessionDraft, getWorkoutPrograms, getWorkoutTemplateSummary, hydrateActiveWorkoutSessionDraft, saveWorkoutProgram, startWorkoutSessionDraft, toggleWorkoutProgramFavorite } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';

const segmentedTabs = [
  { label: 'Start now', value: 'start-now' as const },
  { label: 'Programs', value: 'programs' as const },
];

type ViewMode = (typeof segmentedTabs)[number]['value'];

type Styles = ReturnType<typeof createStyles>;

const sessionDateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

function Row({
  children,
  onPress,
  styles,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  styles: Styles;
}) {
  if (!onPress) {
    return <View style={styles.row}>{children}</View>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {children}
    </Pressable>
  );
}

function TitleLine({ label, meta, secondary, styles }: { label: string; meta?: string; secondary?: string; styles: Styles }) {
  return (
    <View style={styles.rowCopy}>
      <View style={styles.rowHeading}>
        <Text numberOfLines={1} selectable style={styles.rowTitle}>
          {label}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
      {meta ? (
        <Text numberOfLines={1} selectable style={styles.rowMeta}>
          {meta}
        </Text>
      ) : null}
      {secondary ? (
        <Text numberOfLines={1} selectable style={styles.rowSecondary}>
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

function MenuButton({ label, onPress, styles }: { label: string; onPress: () => void; styles: Styles }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={12} style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

function alertProgramActions({
  programId,
  programTitle,
  onDelete,
  onToggleFavorite,
  styles,
}: {
  onDelete: () => void;
  onToggleFavorite: () => void;
  programId: string;
  programTitle: string;
  styles: Styles;
}) {
  Alert.alert(programTitle, undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Favorite', onPress: onToggleFavorite },
    { text: 'Delete', style: 'destructive', onPress: onDelete },
  ]);
}

export default function WorkoutsScreen() {
  const { workoutSessions, workouts } = useAppContext();
  const { colors } = useAppTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('start-now');
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveWorkoutSessionDraft().then(() => {
      if (!cancelled) {
        setDraftReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeDraft = draftReady ? getActiveWorkoutSessionDraft() : null;
  const defaultProgram = useMemo(() => createDefaultTrainingProgram(workouts), [workouts]);
  const programs = useMemo(() => getWorkoutPrograms(workouts), [workouts]);
  const templateSummaries = useMemo(() => workouts.map((workout) => getWorkoutTemplateSummary(workout, workoutSessions)), [workouts, workoutSessions]);
  const sortedRecentSessions = useMemo(() => [...workoutSessions].sort((left, right) => right.finishedAt.localeCompare(left.finishedAt)).slice(0, 4), [workoutSessions]);

  const openWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) {
      return;
    }

    if (activeDraft?.workoutId === workoutId) {
      router.push({ pathname: '/workout-session', params: { workoutId } });
      return;
    }

    startWorkoutSessionDraft(workout);
    router.push({ pathname: '/workout-session', params: { workoutId } });
  };

  const openProgram = (programId: string) => {
    router.push({ pathname: '/workouts/program/[programId]', params: { programId } });
  };

  const handleAddProgram = () => {
    router.push('/workouts/builder');
  };

  const handleStartEmpty = () => {
    Alert.alert('Empty workout unavailable', 'Use a workout template for now.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + BottomTabInset + 104 }]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text selectable style={styles.screenTitle}>
              Workouts
            </Text>
            <View style={styles.segmentedControl}>
              {segmentedTabs.map((tab) => {
                const selected = viewMode === tab.value;
                return (
                  <Pressable
                    key={tab.value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setViewMode(tab.value)}
                    style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && !selected && styles.segmentPressed]}>
                    <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {viewMode === 'start-now' ? (
            <View style={styles.list}>
              {activeDraft ? (
                <View style={styles.rowGroup}>
                  <Row onPress={() => router.push({ pathname: '/workout-session', params: { workoutId: activeDraft.workoutId } })} styles={styles}>
                    <TitleLine
                      label="Workout in progress"
                      meta={`${activeDraft.workoutTitle} · ${sessionDateFormatter.format(new Date(activeDraft.startedAt))}`}
                      secondary={`${activeDraft.sets.length} set${activeDraft.sets.length === 1 ? '' : 's'} logged`}
                      styles={styles}
                    />
                    <View style={styles.inlineAction}>
                      <Text style={styles.inlineActionLabel}>Continue workout</Text>
                    </View>
                  </Row>
                </View>
              ) : null}

              <View style={styles.sectionLabelRow}>
                <Text selectable style={styles.sectionLabel}>
                  Templates
                </Text>
              </View>

              <View style={styles.listGroup}>
                {templateSummaries.map((summary, index) => (
                  <View key={summary.workout.id} style={[styles.rowGroup, index > 0 && styles.dividerTop]}>
                    <Row onPress={() => openWorkout(summary.workout.id)} styles={styles}>
                      <View style={styles.templateIcon}>
                        <Text style={styles.templateIconLabel}>{summary.workout.title.slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <TitleLine
                        label={summary.workout.title}
                        meta={`${summary.exerciseCount} exercises`}
                        secondary={summary.subtitle || summary.estimatedDuration}
                        styles={styles}
                      />
                    </Row>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.list}>
              <Pressable accessibilityRole="button" onPress={handleAddProgram} style={({ pressed }) => [styles.addRow, pressed && styles.rowPressed]}>
                <Text style={styles.addRowPlus}>+</Text>
                <View style={styles.rowCopy}>
                  <Text selectable style={styles.rowTitle}>
                    Create program
                  </Text>
                </View>
              </Pressable>

              <View style={styles.listGroup}>
                {programs.map((program, index) => {
                  const workoutCount = program.days.filter((day) => !day.restDay && Boolean(day.workoutTemplateId)).length;
                  const isDefaultProgram = program.id === defaultProgram.id;

                  return (
                    <View key={program.id} style={[styles.rowGroup, index > 0 && styles.dividerTop]}>
                      <Row onPress={() => openProgram(program.id)} styles={styles}>
                        <View style={styles.templateIcon}>
                          <Text style={styles.templateIconLabel}>P</Text>
                        </View>
                        <TitleLine
                          label={program.name}
                          meta={`${workoutCount} workout${workoutCount === 1 ? '' : 's'}`}
                          secondary={isDefaultProgram ? 'Default program' : undefined}
                          styles={styles}
                        />
                        <MenuButton
                          label="⋯"
                          onPress={() =>
                            alertProgramActions({
                              onDelete: () => Alert.alert('Default program', 'Only custom programs can be deleted.'),
                              onToggleFavorite: () => toggleWorkoutProgramFavorite(program.id),
                              programId: program.id,
                              programTitle: program.name,
                              styles,
                            })
                          }
                          styles={styles}
                        />
                      </Row>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: safeAreaInsets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <AppButton disabled label="Start empty workout" onPress={handleStartEmpty} />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 54,
      paddingVertical: Spacing.two,
    },
    addRowPlus: {
      color: colors.accent,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 24,
      width: 24,
    },
    chevron: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 18,
      marginLeft: Spacing.one,
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
    dividerTop: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
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
    header: {
      gap: Spacing.three,
      marginBottom: Spacing.two,
    },
    inlineAction: {
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.three,
      paddingVertical: 8,
    },
    inlineActionLabel: {
      color: colors.textOnAccent,
      fontSize: 13,
      fontWeight: Typography.button.fontWeight,
    },
    list: {
      gap: Spacing.two,
    },
    listGroup: {
      gap: 0,
    },
    menuButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      minWidth: 36,
    },
    menuButtonPressed: {
      opacity: 0.65,
    },
    menuLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 56,
      paddingVertical: Spacing.two,
    },
    rowCopy: {
      flex: 1,
      gap: 4,
    },
    rowHeading: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    rowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
    rowPressed: {
      opacity: 0.7,
    },
    rowSecondary: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    rowTitle: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 21,
    },
    rowGroup: {
      paddingVertical: 2,
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    sectionLabelRow: {
      paddingTop: Spacing.one,
    },
    segment: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 999,
      flex: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: Spacing.three,
      paddingVertical: 9,
    },
    segmentLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    segmentLabelSelected: {
      color: colors.textPrimary,
      fontWeight: '800',
    },
    segmentPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    segmentSelected: {
      backgroundColor: colors.surfaceSecondary,
    },
    segmentedControl: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 4,
      padding: 4,
    },
    templateIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 12,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    templateIconLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '900',
    },
  });
