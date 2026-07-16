import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { Exercise, TrainingProgram, TrainingProgramDay, WeekdayKey, Workout } from '@/types';
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from '@/domain/models';
import { getTrainingProgramOverview, getTrainingProgramValidation, parseWorkoutPlanDescription } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';

type TrainingProgramBuilderCardProps = {
  exercises: Exercise[];
  isExpanded: boolean;
  onProgramChange: (updater: (current: TrainingProgram) => TrainingProgram) => void;
  onToggleExpanded: () => void;
  program: TrainingProgram;
  workouts: Workout[];
};

const PROGRAM_GOALS = ['Strength', 'Hypertrophy', 'Endurance', 'General fitness'] as const;
const PROGRAM_DIFFICULTIES: TrainingProgram['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
const PROGRAM_STRATEGIES = ['linear progression', 'double progression', 'top set + backoff', 'autoregulated', 'custom'] as const;

const cloneProgram = (program: TrainingProgram): TrainingProgram => ({
  ...program,
  days: program.days.map((day) => ({ ...day })),
  progression: program.progression ? { ...program.progression } : undefined,
  metadata: program.metadata ? { ...program.metadata } : undefined,
});

const createProgramDay = (weekday: WeekdayKey, source?: Partial<TrainingProgramDay>): TrainingProgramDay => ({
  id: `${weekday}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  weekday,
  workoutTemplateId: source?.workoutTemplateId,
  workoutTemplateName: source?.workoutTemplateName,
  notes: source?.notes,
  restDay: source?.restDay ?? false,
});

const formatDuration = (minutes: number) => `${Math.max(0, Math.round(minutes))} min`;
const formatSets = (value: number) => `${value} set${value === 1 ? '' : 's'}`;

function PillRow({
  label,
  items,
  onSelect,
  selectedValue,
  styles,
}: {
  items: readonly string[];
  label: string;
  onSelect: (value: string) => void;
  selectedValue?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text selectable style={styles.inputLabel}>
        {label}
      </Text>
      <View style={styles.pillRow}>
        {items.map((item) => {
          const selected = item === selectedValue;
          return (
            <Pressable key={item} onPress={() => onSelect(item)} style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pillPressed]}>
              <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MetricTile({ detail, label, styles, value }: { detail: string; label: string; styles: ReturnType<typeof createStyles>; value: string }) {
  return (
    <View style={styles.metricTile}>
      <Text selectable style={styles.metricLabel}>
        {label}
      </Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
      <Text selectable style={styles.metricDetail}>
        {detail}
      </Text>
    </View>
  );
}

function CompactAction({ label, onPress, styles, tone = 'secondary' }: { label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; tone?: 'primary' | 'secondary' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.compactAction, tone === 'primary' ? styles.compactActionPrimary : styles.compactActionSecondary, pressed && styles.compactActionPressed]}>
      <Text style={tone === 'primary' ? styles.compactActionLabelPrimary : styles.compactActionLabelSecondary}>{label}</Text>
    </Pressable>
  );
}

function SectionHeading({
  collapsed,
  onToggle,
  styles,
  subtitle,
  title,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  styles: ReturnType<typeof createStyles>;
  subtitle?: string;
  title: string;
}) {
  return (
    <Pressable disabled={!onToggle} onPress={onToggle} style={({ pressed }) => [styles.sectionHeading, pressed && onToggle && styles.sectionHeadingPressed]}>
      <View style={styles.sectionHeadingCopy}>
        <Text selectable style={styles.sectionTitle}>
          {title}
        </Text>
        {subtitle ? <Text selectable style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onToggle ? <Text style={styles.sectionToggle}>{collapsed ? '+' : '−'}</Text> : null}
    </Pressable>
  );
}

function ScheduleDayRow({
  day,
  expanded,
  onAssignSelected,
  onDuplicate,
  onMove,
  onToggleRest,
  onToggleExpanded,
  onUpdate,
  selectedWorkoutTitle,
  styles,
  workoutTitle,
}: {
  day: TrainingProgramDay;
  expanded: boolean;
  onAssignSelected: () => void;
  onDuplicate: (dayId: string) => void;
  onMove: (dayId: string, direction: -1 | 1) => void;
  onToggleExpanded: (dayId: string) => void;
  onToggleRest: (dayId: string) => void;
  onUpdate: (dayId: string, patch: Partial<TrainingProgramDay>) => void;
  selectedWorkoutTitle?: string;
  styles: ReturnType<typeof createStyles>;
  workoutTitle?: string | null;
}) {
  const isRest = day.restDay;

  return (
    <View style={styles.dayBlock}>
      <Pressable accessibilityRole="button" onPress={() => onToggleExpanded(day.id)} style={({ pressed }) => [styles.dayHeader, pressed && styles.compactActionPressed]}>
        <View style={styles.dayHeaderCopy}>
          <View style={styles.dayTopLine}>
            <Text selectable style={styles.dayTitle}>
              {WEEKDAY_LABELS[day.weekday]}
            </Text>
            <View style={[styles.statePill, isRest ? styles.statePillRest : styles.statePillWorkout]}>
              <Text style={[styles.statePillText, isRest ? styles.statePillTextRest : styles.statePillTextWorkout]}>{isRest ? 'Rest' : 'Workout'}</Text>
            </View>
          </View>
          <Text selectable style={styles.dayWorkoutName}>
            {workoutTitle ?? (isRest ? 'Rest day' : 'Unassigned')}
          </Text>
        </View>
        <Text style={styles.sectionToggle}>{expanded ? '−' : '+'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.dayExpanded}>
          <View style={styles.dayActionGrid}>
            <CompactAction label={`Assign ${selectedWorkoutTitle ?? 'selected'}`} onPress={onAssignSelected} styles={styles} tone="primary" />
            <CompactAction label={isRest ? 'Mark workout' : 'Mark rest'} onPress={() => onToggleRest(day.id)} styles={styles} />
            <CompactAction label="Duplicate" onPress={() => onDuplicate(day.id)} styles={styles} />
            <CompactAction label="Move up" onPress={() => onMove(day.id, -1)} styles={styles} />
            <CompactAction label="Move down" onPress={() => onMove(day.id, 1)} styles={styles} />
          </View>

          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Notes
            </Text>
            <TextInput
              onChangeText={(value) => onUpdate(day.id, { notes: value })}
              placeholder="Optional notes for this day"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.notesInput}
              value={day.notes ?? ''}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function TrainingProgramBuilderCard({ exercises, isExpanded, onProgramChange, onToggleExpanded, program, workouts }: TrainingProgramBuilderCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | undefined>(workouts[0]?.id);
  const [expandedDayId, setExpandedDayId] = useState<string | undefined>();
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const selectedWorkout = useMemo(() => workouts.find((workout) => workout.id === selectedWorkoutId) ?? workouts[0] ?? null, [selectedWorkoutId, workouts]);
  const overview = useMemo(() => getTrainingProgramOverview(program, workouts, exercises), [program, workouts, exercises]);
  const warnings = useMemo(() => getTrainingProgramValidation(program, workouts, exercises), [program, workouts, exercises]);

  const updateProgram = (updater: (current: TrainingProgram) => TrainingProgram) => {
    onProgramChange((current) => updater(cloneProgram(current)));
  };

  const updateField = (patch: Partial<TrainingProgram>) => {
    updateProgram((current) => ({ ...current, ...patch }));
  };

  const updateProgression = (patch: Partial<NonNullable<TrainingProgram['progression']>>) => {
    updateProgram((current) => ({
      ...current,
      progression: {
        ...(current.progression ?? {}),
        ...patch,
      },
    }));
  };

  const updateDay = (dayId: string, patch: Partial<TrainingProgramDay>) => {
    updateProgram((current) => ({
      ...current,
      days: current.days.map((day) => (day.id === dayId ? { ...day, ...patch } : day)),
    }));
  };

  const duplicateDay = (dayId: string) => {
    updateProgram((current) => {
      const sourceIndex = current.days.findIndex((day) => day.id === dayId);
      if (sourceIndex === -1) {
        return current;
      }

      const source = current.days[sourceIndex];
      const nextDays = [...current.days];
      nextDays.splice(sourceIndex + 1, 0, createProgramDay(source.weekday, source));
      return { ...current, days: nextDays };
    });
  };

  const moveDay = (dayId: string, direction: -1 | 1) => {
    updateProgram((current) => {
      const sourceIndex = current.days.findIndex((day) => day.id === dayId);
      const targetIndex = sourceIndex + direction;
      if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= current.days.length) {
        return current;
      }

      const nextDays = [...current.days];
      const [moved] = nextDays.splice(sourceIndex, 1);
      nextDays.splice(targetIndex, 0, moved);
      return { ...current, days: nextDays };
    });
  };

  const toggleRestDay = (dayId: string) => {
    const currentDay = program.days.find((day) => day.id === dayId);
    if (!currentDay) {
      return;
    }

    if (currentDay.restDay) {
      updateDay(dayId, {
        restDay: false,
        workoutTemplateId: currentDay.workoutTemplateId ?? selectedWorkout?.id,
        workoutTemplateName: currentDay.workoutTemplateName ?? selectedWorkout?.title,
      });
      return;
    }

    updateDay(dayId, { restDay: true });
  };

  const assignSelectedWorkout = (dayId: string) => {
    if (!selectedWorkout) {
      return;
    }

    updateDay(dayId, {
      restDay: false,
      workoutTemplateId: selectedWorkout.id,
      workoutTemplateName: selectedWorkout.title,
    });
  };

  const assignSelectedToFirstOpenDay = () => {
    if (!selectedWorkout) {
      return;
    }

    const openDay = program.days.find((day) => day.restDay || !day.workoutTemplateId) ?? program.days[program.days.length - 1];
    if (!openDay) {
      return;
    }

    updateDay(openDay.id, {
      restDay: false,
      workoutTemplateId: selectedWorkout.id,
      workoutTemplateName: selectedWorkout.title,
    });
  };

  const removeTemplateFromProgram = (workoutId: string) => {
    updateProgram((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.workoutTemplateId === workoutId
          ? {
              ...day,
              restDay: true,
              workoutTemplateId: undefined,
              workoutTemplateName: undefined,
            }
          : day,
      ),
    }));
  };

  const selectedTemplateSummaries = useMemo(() => {
    const selectedIds = new Set(program.days.filter((day) => !day.restDay && day.workoutTemplateId).map((day) => day.workoutTemplateId as string));
    return workouts.filter((workout) => selectedIds.has(workout.id));
  }, [program.days, workouts]);

  if (!isExpanded) {
    return (
      <AppCard>
        <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
          <View style={styles.collapsibleHeaderRow}>
            <View style={styles.collapsibleCopy}>
              <Text style={styles.sectionTitle}>Training program builder</Text>
              <Text style={styles.sectionSubtitle}>Structure weekly templates, progression, and review without a dense form wall.</Text>
            </View>
            <Text style={styles.sectionToggle}>+</Text>
          </View>
        </Pressable>
      </AppCard>
    );
  }

  return (
    <View style={styles.stack}>
      <AppCard style={styles.sectionCard}>
        <SectionHeading styles={styles} subtitle="Name, goal, and experience level." title="Basics" />

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Program name
          </Text>
          <TextInput
            onChangeText={(value) => updateField({ name: value })}
            placeholder="8-week strength block"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={program.name}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Description
          </Text>
          <TextInput
            multiline
            onChangeText={(value) => updateField({ description: value })}
            placeholder="Training intent, split, or coaching notes"
            placeholderTextColor={colors.textSecondary}
            style={styles.notesInput}
            value={program.description ?? ''}
          />
        </View>

        <PillRow label="Goal" items={PROGRAM_GOALS} onSelect={(goal) => updateField({ goal })} selectedValue={program.goal} styles={styles} />
        <PillRow label="Experience level" items={PROGRAM_DIFFICULTIES} onSelect={(difficulty) => updateField({ difficulty: difficulty as TrainingProgram['difficulty'] })} selectedValue={program.difficulty} styles={styles} />
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <SectionHeading styles={styles} subtitle="Progression strategy and target loading." title="Progression" />

        <PillRow label="Progression strategy" items={PROGRAM_STRATEGIES} onSelect={(strategy) => updateProgression({ strategy })} selectedValue={program.progression?.strategy} styles={styles} />

        <View style={styles.progressionGrid}>
          {[
            ['Target reps', 'targetReps', program.progression?.targetReps] as const,
            ['Target weight', 'targetWeight', program.progression?.targetWeight] as const,
            ['RIR', 'rir', program.progression?.rir] as const,
          ].map(([label, key, value]) => (
            <View key={label} style={styles.progressionItem}>
              <Text selectable style={styles.inputLabel}>
                {label}
              </Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(nextValue) => updateProgression({ [key]: nextValue ? Number(nextValue) : undefined })}
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={value === undefined ? '' : String(value)}
              />
            </View>
          ))}
          <View style={styles.progressionItem}>
            <Text selectable style={styles.inputLabel}>
              Duration (weeks)
            </Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => updateField({ durationWeeks: value ? Number(value) : 0 })}
              placeholder="8"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={String(program.durationWeeks)}
            />
          </View>
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <SectionHeading styles={styles} subtitle="Pick templates, add them to the program, or remove them from selected days." title="Workout templates" />

        <View style={styles.templatePickerHeader}>
          <Text selectable style={styles.blockMeta}>
            Selected template: {selectedWorkout?.title ?? 'none'}
          </Text>
          <CompactAction label="Add selected" onPress={assignSelectedToFirstOpenDay} styles={styles} tone="primary" />
        </View>

        <View style={styles.templateBank}>
          {workouts.map((workout) => {
            const parsedPlan = parseWorkoutPlanDescription(workout.description);
            const exerciseCount = parsedPlan.exercises.length > 0 ? parsedPlan.exercises.length : workout.exercises.length;
            const selected = workout.id === selectedWorkout?.id;

            return (
              <Pressable key={workout.id} onPress={() => setSelectedWorkoutId(workout.id)} style={({ pressed }) => [styles.templateBankRow, selected && styles.templateBankRowSelected, pressed && styles.compactActionPressed]}>
                <View style={styles.templateBankCopy}>
                  <Text selectable style={styles.templateBankTitle}>
                    {workout.title}
                  </Text>
                  <Text selectable style={styles.templateBankMeta}>
                    {exerciseCount} exercises · {workout.duration}
                  </Text>
                </View>
                <View style={[styles.statePill, selected ? styles.statePillWorkout : styles.statePillRest]}>
                  <Text style={[styles.statePillText, selected ? styles.statePillTextWorkout : styles.statePillTextRest]}>{selected ? 'Selected' : 'Select'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.selectedTemplatesBlock}>
          <Text selectable style={styles.blockTitle}>
            Selected templates
          </Text>
          {selectedTemplateSummaries.length > 0 ? (
            <View style={styles.selectedTemplateList}>
              {selectedTemplateSummaries.map((workout, index) => (
                <View key={workout.id} style={[styles.selectedTemplateRow, index > 0 && styles.rowDivider]}>
                  <View style={styles.selectedTemplateCopy}>
                    <Text selectable style={styles.selectedTemplateTitle}>
                      {workout.title}
                    </Text>
                    <Text selectable style={styles.selectedTemplateMeta}>
                      {workout.exercises.length} exercises
                    </Text>
                  </View>
                  <CompactAction label="Remove" onPress={() => removeTemplateFromProgram(workout.id)} styles={styles} />
                </View>
              ))}
            </View>
          ) : (
            <Text selectable style={styles.blockMeta}>
              No templates selected yet.
            </Text>
          )}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <SectionHeading styles={styles} subtitle="One compact row per day, with expanded edit mode for secondary actions." title="Weekly schedule" />

        <View style={styles.dayList}>
          {program.days.map((day) => {
            const assignedWorkout = day.workoutTemplateId ? workouts.find((workout) => workout.id === day.workoutTemplateId) ?? null : null;
            const expanded = expandedDayId === day.id;

            return (
              <ScheduleDayRow
                key={day.id}
                day={day}
                expanded={expanded}
                onAssignSelected={() => assignSelectedWorkout(day.id)}
                onDuplicate={duplicateDay}
                onMove={moveDay}
                onToggleExpanded={(dayId) => setExpandedDayId((current) => (current === dayId ? undefined : dayId))}
                onToggleRest={toggleRestDay}
                onUpdate={updateDay}
                selectedWorkoutTitle={selectedWorkout?.title}
                styles={styles}
                workoutTitle={assignedWorkout?.title ?? day.workoutTemplateName ?? null}
              />
            );
          })}
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <SectionHeading
          collapsed={!reviewExpanded}
          onToggle={() => setReviewExpanded((current) => !current)}
          styles={styles}
          subtitle="Review stays secondary and collapsible until the program is mostly configured."
          title="Review"
        />

        {reviewExpanded ? (
          <>
            <View style={styles.metricGrid}>
              <MetricTile detail="Assigned workouts in the current week" label="Weekly workouts" styles={styles} value={`${overview.assignedWorkouts}`} />
              <MetricTile detail="Planned working sets" label="Weekly sets" styles={styles} value={formatSets(overview.weeklySets)} />
              <MetricTile detail="Estimated weekly training time" label="Duration" styles={styles} value={formatDuration(overview.estimatedWorkoutDurationMinutes)} />
              <MetricTile detail={overview.musclesTrained.length > 0 ? overview.musclesTrained.join(' · ') : 'No muscles mapped yet'} label="Muscles trained" styles={styles} value={`${overview.musclesTrained.length}`} />
            </View>

            {warnings.length > 0 ? (
              <View style={styles.reviewBlock}>
                <Text selectable style={styles.blockTitle}>
                  Warnings
                </Text>
                {warnings.slice(0, 4).map((warning) => (
                  <Text key={warning.id} selectable style={styles.reviewText}>
                    • {warning.message}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.reviewBlock}>
              <Text selectable style={styles.blockTitle}>
                Muscle coverage
              </Text>
              <Text selectable style={styles.reviewText}>
                Trained this week: {overview.musclesTrained.join(', ') || 'none'}
              </Text>
              <Text selectable style={styles.reviewText}>
                Missing groups: {overview.missingMuscleGroups.join(', ') || 'none'}
              </Text>
              <View style={styles.frequencyList}>
                {overview.muscleFrequency.map((item) => (
                  <View key={item.key} style={styles.frequencyRow}>
                    <Text selectable style={styles.frequencyLabel}>
                      {item.label}
                    </Text>
                    <Text selectable style={styles.frequencyValue}>
                      {item.trainingFrequency} day{item.trainingFrequency === 1 ? '' : 's'} · {formatSets(item.workingSets)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}
      </AppCard>
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    blockMeta: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    blockTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '900',
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    collapsibleCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    collapsibleHeader: {
      paddingBottom: Spacing.two,
    },
    collapsibleHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    compactAction: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 88,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    compactActionLabelPrimary: {
      color: colors.textOnAccent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '900',
      lineHeight: Typography.caption.lineHeight,
    },
    compactActionLabelSecondary: {
      color: colors.textPrimary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      lineHeight: Typography.caption.lineHeight,
    },
    compactActionPressed: {
      opacity: 0.85,
    },
    compactActionPrimary: {
      backgroundColor: colors.accent,
    },
    compactActionSecondary: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: StyleSheet.hairlineWidth,
    },
    dayActionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    dayBlock: {
      gap: Spacing.two,
      paddingVertical: Spacing.one,
    },
    dayExpanded: {
      gap: Spacing.three,
      paddingLeft: Spacing.two,
    },
    dayHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 56,
      paddingVertical: Spacing.two,
    },
    dayHeaderCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    dayList: {
      gap: Spacing.two,
    },
    dayTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '900',
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    dayTopLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    dayWorkoutName: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    frequencyLabel: {
      color: colors.textPrimary,
      fontSize: Typography.callout.fontSize,
      fontWeight: '800',
      lineHeight: Typography.callout.lineHeight,
    },
    frequencyList: {
      gap: 6,
    },
    frequencyRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    frequencyValue: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      minHeight: 48,
      paddingHorizontal: Spacing.three,
      paddingVertical: 12,
    },
    inputGroup: {
      gap: 4,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    metricDetail: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    metricTile: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexBasis: '48%',
      flexGrow: 1,
      gap: 4,
      minWidth: 140,
      padding: Spacing.three,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    notesInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      minHeight: 88,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.three,
      textAlignVertical: 'top',
    },
    pill: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    pillLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      lineHeight: Typography.caption.lineHeight,
      textTransform: 'capitalize',
    },
    pillLabelSelected: {
      color: colors.textPrimary,
    },
    pillPressed: {
      opacity: 0.88,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    pillSelected: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.accentSoft,
    },
    progressionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    progressionItem: {
      flexBasis: '48%',
      flexGrow: 1,
      gap: 4,
      minWidth: 140,
    },
    reviewBlock: {
      gap: Spacing.two,
      paddingTop: Spacing.one,
    },
    reviewText: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    scheduleCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    sectionCard: {
      gap: Spacing.three,
      padding: Spacing.four,
    },
    sectionHeading: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    sectionHeadingCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    sectionHeadingPressed: {
      opacity: 0.9,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    sectionToggle: {
      color: colors.accent,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
    selectedTemplateCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    selectedTemplateList: {
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    selectedTemplateMeta: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    selectedTemplateRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 54,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    selectedTemplateTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '800',
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    selectedTemplatesBlock: {
      gap: Spacing.two,
    },
    stack: {
      gap: Spacing.three,
    },
    statePill: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      justifyContent: 'center',
      minHeight: 28,
      paddingHorizontal: Spacing.two,
    },
    statePillRest: {
      backgroundColor: colors.backgroundSelected,
    },
    statePillText: {
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      lineHeight: Typography.caption.lineHeight,
    },
    statePillTextRest: {
      color: colors.textSecondary,
    },
    statePillTextWorkout: {
      color: colors.accent,
    },
    statePillWorkout: {
      backgroundColor: colors.accentSoft,
    },
    templateBank: {
      gap: Spacing.two,
    },
    templateBankCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    templateBankHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    templateBankMeta: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    templateBankRow: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 56,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    templateBankRowSelected: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.accentSoft,
    },
    templateBankTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '800',
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    templatePickerHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    weekSectionSpacer: {},
  });
