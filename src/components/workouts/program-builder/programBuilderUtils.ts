import type { TrainingProgram, TrainingProgramDay, WeekdayKey } from '@/types';

export const PROGRAM_GOALS = ['Strength', 'Hypertrophy', 'Endurance', 'General fitness'] as const;
export const PROGRAM_DIFFICULTIES: TrainingProgram['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
export const PROGRAM_STRATEGIES = ['linear progression', 'double progression', 'top set + backoff', 'autoregulated', 'custom'] as const;

export const cloneProgram = (program: TrainingProgram): TrainingProgram => ({
  ...program,
  days: program.days.map((day) => ({ ...day })),
  progression: program.progression ? { ...program.progression } : undefined,
  metadata: program.metadata ? { ...program.metadata } : undefined,
});

export const createProgramDay = (weekday: WeekdayKey, source?: Partial<TrainingProgramDay>): TrainingProgramDay => ({
  id: `${weekday}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  weekday,
  workoutTemplateId: source?.workoutTemplateId,
  workoutTemplateName: source?.workoutTemplateName,
  notes: source?.notes,
  restDay: source?.restDay ?? false,
});

export const formatDuration = (minutes: number) => `${Math.max(0, Math.round(minutes))} min`;
export const formatSets = (value: number) => `${value} set${value === 1 ? '' : 's'}`;
