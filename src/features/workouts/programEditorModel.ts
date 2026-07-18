import type { TrainingProgram, TrainingProgramDay, Workout } from '@/types';
import type { DraftWorkoutExercise } from '@/components/workouts/workout-builder-types';

const cloneProgramDays = (days: TrainingProgramDay[]) => days.map((day) => ({ ...day }));

const getRestDayTemplate = (day: TrainingProgramDay): TrainingProgramDay => ({
  ...day,
  restDay: true,
  workoutTemplateId: undefined,
  workoutTemplateName: undefined,
  notes: undefined,
});

export const createProgramDraftFromProgram = (program: TrainingProgram): TrainingProgram => ({
  ...program,
  days: cloneProgramDays(program.days),
  progression: program.progression ? { ...program.progression } : undefined,
  metadata: program.metadata ? { ...program.metadata } : undefined,
});

export const createBlankProgramDraft = (programTemplate: TrainingProgram): TrainingProgram => createProgramDraftFromProgram(programTemplate);

export const serializeProgramDraft = (program: TrainingProgram) =>
  JSON.stringify({
    id: program.id,
    name: program.name.trim(),
    description: program.description?.trim() ?? '',
    goal: program.goal,
    difficulty: program.difficulty,
    durationWeeks: program.durationWeeks,
    days: program.days.map((day) => ({
      id: day.id,
      weekday: day.weekday,
      restDay: Boolean(day.restDay),
      workoutTemplateId: day.workoutTemplateId ?? null,
      workoutTemplateName: day.workoutTemplateName ?? null,
      notes: day.notes?.trim() ?? null,
    })),
    progression: program.progression
      ? {
          targetReps: program.progression.targetReps ?? null,
          targetWeight: program.progression.targetWeight ?? null,
          rir: program.progression.rir ?? null,
          strategy: program.progression.strategy ?? null,
        }
      : null,
  });

export const attachWorkoutsToProgramDraft = (
  program: TrainingProgram,
  workouts: Workout[],
  workoutIds: string[],
): TrainingProgram => {
  const nextDays = cloneProgramDays(program.days);
  const usedIds = new Set(nextDays.map((day) => day.workoutTemplateId).filter(Boolean) as string[]);

  for (const workoutId of workoutIds) {
    if (usedIds.has(workoutId)) {
      continue;
    }

    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) {
      continue;
    }

    const emptyDayIndex = nextDays.findIndex((day) => day.restDay || !day.workoutTemplateId);
    if (emptyDayIndex === -1) {
      break;
    }

    const targetDay = nextDays[emptyDayIndex] ?? nextDays[0];
    if (!targetDay) {
      break;
    }

    nextDays[emptyDayIndex] = {
      ...targetDay,
      restDay: false,
      workoutTemplateId: workout.id,
      workoutTemplateName: workout.title,
      notes: targetDay.notes,
    };
    usedIds.add(workoutId);
  }

  return {
    ...program,
    days: nextDays,
  };
};

export const removeWorkoutFromProgramDraft = (program: TrainingProgram, dayId: string): TrainingProgram => ({
  ...program,
  days: program.days.map((day) => (day.id === dayId ? getRestDayTemplate(day) : { ...day })),
});

export const createWorkoutDraftFromWorkout = (workout?: Workout | null): {
  editingWorkoutId?: string;
  title: string;
  description: string;
  exercises: DraftWorkoutExercise[];
} => ({
  editingWorkoutId: workout?.id,
  title: workout?.title ?? '',
  description: workout?.description ?? '',
  exercises:
    workout?.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      notes: '',
      restSeconds: '90',
      targetReps: '8',
      targetSets: '3',
    })) ?? [],
});
