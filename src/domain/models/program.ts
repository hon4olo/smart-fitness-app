export type WeekdayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const WEEKDAY_KEYS: WeekdayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export type TrainingProgramDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TrainingProgramProgressionStrategy = 'linear progression' | 'double progression' | 'top set + backoff' | 'autoregulated' | 'custom';

export type TrainingProgramDay = {
  id: string;
  weekday: WeekdayKey;
  workoutTemplateId?: string;
  workoutTemplateName?: string;
  notes?: string;
  restDay?: boolean;
};

export type TrainingProgramProgression = {
  targetReps?: number;
  targetWeight?: number;
  rir?: number;
  strategy?: TrainingProgramProgressionStrategy | string;
};

export type TrainingProgram = {
  id: string;
  name: string;
  description?: string;
  goal: string;
  difficulty: TrainingProgramDifficulty;
  durationWeeks: number;
  days: TrainingProgramDay[];
  progression?: TrainingProgramProgression;
  createdAt: string;
  updatedAt?: string;
  isCustom?: boolean;
  metadata?: Record<string, unknown>;
};

export const createTrainingProgram = (program: Partial<TrainingProgram> & Pick<TrainingProgram, 'id' | 'name' | 'goal' | 'difficulty' | 'durationWeeks' | 'days' | 'createdAt'>) => ({
  ...program,
});
