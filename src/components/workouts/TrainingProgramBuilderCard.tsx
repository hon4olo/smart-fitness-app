import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import type { Exercise, TrainingProgram, TrainingProgramDay, Workout } from '@/types';
import { getTrainingProgramOverview, getTrainingProgramValidation } from '@/lib/workouts';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { ProgramBasicsSection } from './program-builder/ProgramBasicsSection';
import { ProgramProgressionSection } from './program-builder/ProgramProgressionSection';
import { ProgramReviewSection } from './program-builder/ProgramReviewSection';
import { ProgramScheduleSection } from './program-builder/ProgramScheduleSection';
import { ProgramTemplatePickerSection } from './program-builder/ProgramTemplatePickerSection';
import { createProgramBuilderStyles } from './program-builder/programBuilderStyles';
import {
  PROGRAM_DIFFICULTIES,
  PROGRAM_GOALS,
  PROGRAM_STRATEGIES,
  cloneProgram,
  createProgramDay,
  formatDuration,
  formatSets,
} from './program-builder/programBuilderUtils';

type TrainingProgramBuilderCardProps = {
  exercises: Exercise[];
  isExpanded: boolean;
  onProgramChange: (updater: (current: TrainingProgram) => TrainingProgram) => void;
  onToggleExpanded: () => void;
  program: TrainingProgram;
  workouts: Workout[];
};

export function TrainingProgramBuilderCard({ exercises, isExpanded, onProgramChange, onToggleExpanded, program, workouts }: TrainingProgramBuilderCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createProgramBuilderStyles(colors), [colors]);
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
      <ProgramBasicsSection colors={colors} difficulties={PROGRAM_DIFFICULTIES} goals={PROGRAM_GOALS} onUpdateField={updateField} program={program} styles={styles} />

      <ProgramProgressionSection
        colors={colors}
        onUpdateField={updateField}
        onUpdateProgression={updateProgression}
        program={program}
        strategies={PROGRAM_STRATEGIES}
        styles={styles}
      />

      <ProgramTemplatePickerSection
        onAddSelected={assignSelectedToFirstOpenDay}
        onRemoveTemplate={removeTemplateFromProgram}
        onSelectWorkout={setSelectedWorkoutId}
        selectedTemplateSummaries={selectedTemplateSummaries}
        selectedWorkout={selectedWorkout}
        styles={styles}
        workouts={workouts}
      />

      <ProgramScheduleSection
        expandedDayId={expandedDayId}
        onAssignSelectedWorkout={assignSelectedWorkout}
        onDuplicateDay={duplicateDay}
        onMoveDay={moveDay}
        onToggleDayExpanded={(dayId) => setExpandedDayId((current) => (current === dayId ? undefined : dayId))}
        onToggleRestDay={toggleRestDay}
        onUpdateDay={updateDay}
        program={program}
        selectedWorkoutTitle={selectedWorkout?.title}
        styles={styles}
        workouts={workouts}
      />

      <ProgramReviewSection
        expanded={reviewExpanded}
        formatDuration={formatDuration}
        formatSets={formatSets}
        onToggleExpanded={() => setReviewExpanded((current) => !current)}
        overview={overview}
        styles={styles}
        warnings={warnings}
      />
    </View>
  );
}
