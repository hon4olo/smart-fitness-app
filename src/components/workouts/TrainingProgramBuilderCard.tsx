import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { Exercise, TrainingProgram, TrainingProgramDay, WeekdayKey, Workout } from '@/types';
import {
  getTrainingProgramOverview,
  getTrainingProgramValidation,
  parseWorkoutPlanDescription,
} from '@/lib/workouts';
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from '@/domain/models';

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

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.statCard}>
      <Text selectable style={styles.statLabel}>
        {label}
      </Text>
      <Text selectable style={styles.statValue}>
        {value}
      </Text>
      <Text selectable style={styles.statDetail}>
        {detail}
      </Text>
    </View>
  );
}

function DayRow({
  day,
  onAssignSelected,
  onDuplicate,
  onMove,
  onToggleRest,
  onUpdate,
  selectedWorkoutTitle,
  workoutTitle,
  workoutsCount,
}: {
  day: TrainingProgramDay;
  onAssignSelected: () => void;
  onDuplicate: (dayId: string) => void;
  onMove: (dayId: string, direction: -1 | 1) => void;
  onToggleRest: (dayId: string) => void;
  onUpdate: (dayId: string, patch: Partial<TrainingProgramDay>) => void;
  selectedWorkoutTitle?: string;
  workoutTitle?: string | null;
  workoutsCount: number;
}) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={styles.dayCopy}>
          <Text selectable style={styles.dayTitle}>
            {WEEKDAY_LABELS[day.weekday]}
          </Text>
          <Text selectable style={styles.dayMeta}>
            {workoutTitle ?? (day.restDay ? 'Rest day' : 'Empty slot')}
          </Text>
        </View>
        <View style={styles.dayActions}>
          <AppButton disabled={!selectedWorkoutTitle || workoutsCount === 0} label="Assign" onPress={onAssignSelected} variant="secondary" />
          <AppButton label="Dup" onPress={() => onDuplicate(day.id)} variant="secondary" />
          <AppButton label="↑" onPress={() => onMove(day.id, -1)} variant="secondary" />
          <AppButton label="↓" onPress={() => onMove(day.id, 1)} variant="secondary" />
        </View>
      </View>

      <View style={styles.weekdayStrip}>
        {WEEKDAY_KEYS.map((weekday) => {
          const selected = weekday === day.weekday;

          return (
            <Pressable
              key={`${day.id}-${weekday}`}
              onPress={() => onUpdate(day.id, { weekday })}
              style={({ pressed }) => [styles.weekdayChip, selected && styles.weekdayChipSelected, pressed && styles.weekdayChipPressed]}>
              <Text style={[styles.weekdayChipLabel, selected && styles.weekdayChipLabelSelected]}>{weekday.slice(0, 3).toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text selectable style={styles.dayNotesLabel}>
        Notes
      </Text>
      <TextInput
        onChangeText={(value) => onUpdate(day.id, { notes: value })}
        placeholder="Optional notes for the day"
        placeholderTextColor={Colors.dark.textSecondary}
        style={styles.notesInput}
        value={day.notes ?? ''}
      />

      <View style={styles.selectionRow}>
        <AppButton
          label={day.restDay ? 'Mark active' : 'Rest day'}
          onPress={() => onToggleRest(day.id)}
          variant="secondary"
        />
      </View>
    </View>
  );
}

export function TrainingProgramBuilderCard({ exercises, isExpanded, onProgramChange, onToggleExpanded, program, workouts }: TrainingProgramBuilderCardProps) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | undefined>(workouts[0]?.id);
  const selectedWorkout = useMemo(
    () => workouts.find((workout) => workout.id === selectedWorkoutId) ?? workouts[0] ?? null,
    [selectedWorkoutId, workouts],
  );

  const overview = getTrainingProgramOverview(program, workouts, exercises);
  const warnings = getTrainingProgramValidation(program, workouts, exercises);

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

  if (!isExpanded) {
    return (
      <AppCard>
        <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.sectionTitle}>Training program builder</Text>
              <Text style={styles.subtitle}>Structure weekly templates, progression, and muscle coverage.</Text>
            </View>
            <Text style={styles.toggle}>+</Text>
          </View>
        </Pressable>
        <AppButton label="Open program builder" onPress={onToggleExpanded} variant="secondary" />
      </AppCard>
    );
  }

  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.sectionTitle}>Training program builder</Text>
            <Text style={styles.subtitle}>Turn existing workout templates into a structured weekly plan without changing session logging.</Text>
          </View>
          <Text style={styles.toggle}>−</Text>
        </View>
      </Pressable>

      <View style={styles.stack}>
        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>Program name</Text>
          <TextInput
            onChangeText={(value) => updateField({ name: value })}
            placeholder="8-week strength block"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={program.name}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>Description</Text>
          <TextInput
            multiline
            onChangeText={(value) => updateField({ description: value })}
            placeholder="Training intent, split, or coaching notes"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.notesInput}
            value={program.description ?? ''}
          />
        </View>

        <View style={styles.pillRow}>
          {PROGRAM_GOALS.map((goal) => (
            <Pressable key={goal} onPress={() => updateField({ goal })} style={({ pressed }) => [styles.pill, program.goal === goal && styles.pillSelected, pressed && styles.pillPressed]}>
              <Text style={[styles.pillLabel, program.goal === goal && styles.pillLabelSelected]}>{goal}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.pillRow}>
          {PROGRAM_DIFFICULTIES.map((difficulty) => (
            <Pressable key={difficulty} onPress={() => updateField({ difficulty })} style={({ pressed }) => [styles.pill, program.difficulty === difficulty && styles.pillSelected, pressed && styles.pillPressed]}>
              <Text style={[styles.pillLabel, program.difficulty === difficulty && styles.pillLabelSelected]}>{difficulty}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryGrid}>
          <StatCard label="Workouts" value={`${overview.assignedWorkouts}`} detail="Assigned templates in the week" />
          <StatCard label="Weekly sets" value={formatSets(overview.weeklySets)} detail="Planned working sets" />
          <StatCard label="Duration" value={formatDuration(overview.estimatedWorkoutDurationMinutes)} detail="Estimated weekly training time" />
          <StatCard label="Muscles trained" value={`${overview.musclesTrained.length}`} detail={overview.musclesTrained.length > 0 ? overview.musclesTrained.join(' · ') : 'No muscles mapped yet'} />
        </View>

        <View style={styles.coverageBlock}>
          <Text selectable style={styles.blockTitle}>Muscle coverage</Text>
          <Text selectable style={styles.blockMeta}>
            Trained this week: {overview.musclesTrained.join(', ') || 'none'}
          </Text>
          <Text selectable style={styles.blockMeta}>
            Missing groups: {overview.missingMuscleGroups.join(', ') || 'none'}
          </Text>
          <View style={styles.frequencyList}>
            {overview.muscleFrequency.map((item) => (
              <View key={item.key} style={styles.frequencyRow}>
                <Text selectable style={styles.frequencyLabel}>{item.label}</Text>
                <Text selectable style={styles.frequencyValue}>{item.trainingFrequency} day{item.trainingFrequency === 1 ? '' : 's'} · {formatSets(item.workingSets)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>Progression strategy</Text>
          <View style={styles.pillRow}>
            {PROGRAM_STRATEGIES.map((strategy) => (
              <Pressable
                key={strategy}
                onPress={() => updateProgression({ strategy })}
                style={({ pressed }) => [styles.pill, program.progression?.strategy === strategy && styles.pillSelected, pressed && styles.pillPressed]}>
                <Text style={[styles.pillLabel, program.progression?.strategy === strategy && styles.pillLabelSelected]}>{strategy}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.progressionGrid}>
          {[
            ['Target reps', 'targetReps', program.progression?.targetReps] as const,
            ['Target weight', 'targetWeight', program.progression?.targetWeight] as const,
            ['RIR', 'rir', program.progression?.rir] as const,
          ].map(([label, key, value]) => (
            <View key={label} style={styles.progressionItem}>
              <Text selectable style={styles.inputLabel}>{label}</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(nextValue) => updateProgression({ [key]: nextValue ? Number(nextValue) : undefined })}
                placeholder="—"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={value === undefined ? '' : String(value)}
              />
            </View>
          ))}
          <View style={styles.progressionItem}>
            <Text selectable style={styles.inputLabel}>Duration (weeks)</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => updateField({ durationWeeks: value ? Number(value) : 0 })}
              placeholder="8"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={String(program.durationWeeks)}
            />
          </View>
        </View>

        {warnings.length > 0 ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningLabel}>Warnings</Text>
            {warnings.slice(0, 3).map((warning) => (
              <Text key={warning.id} selectable style={styles.warningText}>
                • {warning.message}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.templatesBlock}>
          <View style={styles.blockHeaderRow}>
            <Text selectable style={styles.blockTitle}>Template bank</Text>
            <Text selectable style={styles.blockMeta}>
              Selected: {selectedWorkout?.title ?? 'none'}
            </Text>
          </View>
          <View style={styles.templateGrid}>
            {workouts.map((workout) => {
              const plannedExercises = parseWorkoutPlanDescription(workout.description).exercises;
              const selected = workout.id === selectedWorkout?.id;

              return (
                <Pressable key={workout.id} onPress={() => setSelectedWorkoutId(workout.id)} style={({ pressed }) => [styles.templateChip, selected && styles.templateChipSelected, pressed && styles.pillPressed]}>
                  <Text style={styles.templateTitle}>{workout.title}</Text>
                  <Text style={styles.templateMeta}>{plannedExercises.length > 0 ? `${plannedExercises.length} planned exercises` : `${workout.exercises.length} exercises`}</Text>
                  <Text style={styles.templateMeta}>{workout.description ? 'Has plan notes' : 'Template ready'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.daysBlock}>
          <Text selectable style={styles.blockTitle}>Weekly planner</Text>
          {program.days.map((day) => {
            const assignedWorkout = day.workoutTemplateId ? workouts.find((workout) => workout.id === day.workoutTemplateId) ?? null : null;
            return (
              <DayRow
                key={day.id}
                day={day}
                onAssignSelected={() => assignSelectedWorkout(day.id)}
                onDuplicate={duplicateDay}
                onMove={moveDay}
                onToggleRest={(dayId) => {
                  const currentDay = program.days.find((item) => item.id === dayId);
                  if (!currentDay) {
                    return;
                  }

                  updateDay(dayId, {
                    restDay: !currentDay.restDay,
                    workoutTemplateId: !currentDay.restDay ? currentDay.workoutTemplateId : selectedWorkout?.id ?? currentDay.workoutTemplateId,
                    workoutTemplateName: !currentDay.restDay ? currentDay.workoutTemplateName : selectedWorkout?.title ?? currentDay.workoutTemplateName,
                  });
                }}
                onUpdate={updateDay}
                selectedWorkoutTitle={selectedWorkout?.title}
                workoutTitle={assignedWorkout?.title ?? day.workoutTemplateName ?? null}
                workoutsCount={workouts.length}
              />
            );
          })}
        </View>

        <View style={styles.coverageBlock}>
          <Text selectable style={styles.blockTitle}>Overview</Text>
          <Text selectable style={styles.blockMeta}>Equipment required: {overview.equipmentRequired.join(', ') || 'none'}</Text>
          <Text selectable style={styles.blockMeta}>Warnings: {warnings.length}</Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  assignedMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  assignedSummary: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.two,
  },
  assignedTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  blockHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  blockMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  blockTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  coverageBlock: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  dayActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    justifyContent: 'flex-end',
  },
  dayCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  dayCopy: {
    flex: 1,
    gap: 2,
  },
  dayHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dayMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  dayNotesLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  dayTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '900',
  },
  daysBlock: {
    gap: Spacing.two,
  },
  frequencyLabel: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  frequencyList: {
    gap: 4,
    marginTop: Spacing.one,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  frequencyValue: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
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
  notesInput: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 15,
    minHeight: 88,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    textAlignVertical: 'top',
  },
  pill: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  pillLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  pillLabelSelected: {
    color: Colors.dark.text,
  },
  pillPressed: {
    opacity: 0.84,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  pillSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
  },
  progressionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  progressionItem: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 130,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stack: {
    gap: Spacing.three,
  },
  statCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    flex: 1,
    minWidth: 150,
    padding: Spacing.two,
  },
  statDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  templatesBlock: {
    gap: Spacing.two,
  },
  templateChip: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    padding: Spacing.two,
  },
  templateChipSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
  },
  templateGrid: {
    gap: Spacing.two,
  },
  templateMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  templateTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  toggle: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '700',
  },
  warningBullet: {
    color: Colors.dark.accent,
    fontSize: 15,
    fontWeight: '900',
    width: 14,
  },
  warningCard: {
    backgroundColor: Colors.dark.accentMuted,
    borderColor: Colors.dark.accent,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.three,
  },
  warningLabel: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  warningList: {
    gap: Spacing.one,
  },
  warningText: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  weekdayChip: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  weekdayChipLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  weekdayChipLabelSelected: {
    color: Colors.dark.text,
  },
  weekdayChipPressed: {
    opacity: 0.84,
  },
  weekdayChipSelected: {
    backgroundColor: Colors.dark.accentMuted,
    borderColor: Colors.dark.accent,
  },
  weekdayStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
