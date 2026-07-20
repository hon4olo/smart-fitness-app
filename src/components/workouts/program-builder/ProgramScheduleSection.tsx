import { View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import type { TrainingProgram, TrainingProgramDay, Workout } from '@/types';

import { SectionHeading } from './ProgramBuilderUi';
import { ScheduleDayRow } from './ScheduleDayRow';

type ProgramScheduleSectionProps = {
  expandedDayId?: string;
  onAssignSelectedWorkout: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onMoveDay: (dayId: string, direction: -1 | 1) => void;
  onToggleDayExpanded: (dayId: string) => void;
  onToggleRestDay: (dayId: string) => void;
  onUpdateDay: (dayId: string, patch: Partial<TrainingProgramDay>) => void;
  program: TrainingProgram;
  selectedWorkoutTitle?: string;
  styles: Record<string, any>;
  workouts: Workout[];
};

export function ProgramScheduleSection({
  expandedDayId,
  onAssignSelectedWorkout,
  onDuplicateDay,
  onMoveDay,
  onToggleDayExpanded,
  onToggleRestDay,
  onUpdateDay,
  program,
  selectedWorkoutTitle,
  styles,
  workouts,
}: ProgramScheduleSectionProps) {
  return (
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
              onAssignSelected={() => onAssignSelectedWorkout(day.id)}
              onDuplicate={onDuplicateDay}
              onMove={onMoveDay}
              onToggleExpanded={onToggleDayExpanded}
              onToggleRest={onToggleRestDay}
              onUpdate={onUpdateDay}
              selectedWorkoutTitle={selectedWorkoutTitle}
              styles={styles}
              workoutTitle={assignedWorkout?.title ?? day.workoutTemplateName ?? null}
            />
          );
        })}
      </View>
    </AppCard>
  );
}
