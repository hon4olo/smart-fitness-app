import type { Exercise, TrainingProgram, TrainingProgramDay, Workout, WorkoutSession } from '@/types';

export type WorkoutDefinition = Workout;
export type WorkoutTemplate = Workout;
export type Program = TrainingProgram;
export type ProgramDay = TrainingProgramDay;
export type WorkoutExercise = Exercise;
export type WorkoutSet = WorkoutSession['sets'][number];
export type WorkoutHistoryItem = WorkoutSession;
export type WorkoutSessionStatus = 'idle' | 'starting' | 'active' | 'finishing' | 'completed';

export type WorkoutPlanExercise = {
  name: string;
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};

export type WorkoutTemplateDraftExercise = WorkoutPlanExercise;

export type WorkoutSessionDraft = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  sets: WorkoutSet[];
};

export type SimilarExerciseMatch = {
  exercise: Exercise;
  score: number;
  sharedEquipment: string[];
  sharedMovementPatterns: string[];
  sharedMuscles: string[];
};

export type ProgramMuscleGroupKey = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';

export type TrainingProgramWorkoutPlan = {
  workout: TrainingProgramDay & { workoutTitle: string | null; workout?: Workout | null };
  estimatedDurationMinutes: number;
  workingSets: number;
  muscleGroups: ProgramMuscleGroupKey[];
  equipment: string[];
};

export type TrainingProgramOverview = {
  assignedWorkouts: number;
  weeklySets: number;
  estimatedWorkoutDurationMinutes: number;
  musclesTrained: string[];
  missingMuscleGroups: string[];
  equipmentRequired: string[];
  muscleFrequency: Array<{ key: ProgramMuscleGroupKey; label: string; workingSets: number; trainingFrequency: number }>;
};

export type TrainingProgramValidationWarning = {
  id: string;
  severity: 'warning' | 'info';
  message: string;
};

export type WorkoutTemplateSummary = {
  workout: Workout;
  exerciseCount: number;
  estimatedDuration: string;
  lastUsedLabel?: string;
  subtitle: string;
};

export type WorkoutProgramSummary = {
  isFavorite: boolean;
  program: TrainingProgram;
  workoutCount: number;
  daysPerWeek: number;
  subtitle: string;
  goalLabel: string;
  difficultyLabel: string;
};

export type WorkoutHubViewModel = {
  activeWorkout?: WorkoutTemplateSummary & { completedExercises: number; elapsedLabel: string; progressLabel: string };
  favoritePrograms: WorkoutProgramSummary[];
  mode: 'start-now' | 'programs';
  recentWorkouts: WorkoutTemplateSummary[];
  suggestedWorkouts: WorkoutTemplateSummary[];
  starterWorkout?: WorkoutTemplateSummary;
  stickyActionLabel: string;
  stickyActionType: 'continue' | 'start-empty';
  programs: WorkoutProgramSummary[];
  hasFreshStartNowState: boolean;
  hasFreshProgramsState: boolean;
};
