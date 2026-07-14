export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'compound' | 'isolation' | 'cardio' | 'mobility' | 'skill';

export type Exercise = {
  id: string;
  name: string;
  aliases?: string[];
  category?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  movementPattern?: string[];
  difficulty?: ExerciseDifficulty;
  exerciseType?: ExerciseType;
  unilateral?: boolean;
  tags?: string[];
  instructions?: string[];
  tips?: string[];
  commonMistakes?: string[];
  estimatedSetupTime?: number;
  muscleGroup?: string;
  notes?: string;
  isCustom?: boolean;
  createdAt: string;
  updatedAt?: string;
  source?: 'local' | 'user' | 'imported' | 'remote';
  favorite?: boolean;
  metadata?: Record<string, unknown>;
};

export const DEFAULT_EXERCISE_CREATED_AT = '2000-01-01T00:00:00.000Z';

export const createExercise = (exercise: Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'createdAt'>) => ({
  aliases: [],
  category: '',
  commonMistakes: [],
  difficulty: 'intermediate' as ExerciseDifficulty,
  equipment: [],
  exerciseType: 'compound' as ExerciseType,
  estimatedSetupTime: 30,
  instructions: [],
  movementPattern: [],
  primaryMuscles: [],
  secondaryMuscles: [],
  tags: [],
  unilateral: false,
  ...exercise,
});
