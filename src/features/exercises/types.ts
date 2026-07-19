export type ExerciseMedia = {
  animationUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  thumbnailUri?: string;
  gifUri?: string;
  videoUri?: string;
};

export type ExerciseSource = {
  provider: 'local-fixture' | 'exercisedb';
  sourceId?: string;
};

export type Exercise = {
  id: string;
  source: ExerciseSource;
  name: string;
  aliases: string[];
  equipment: string[];
  bodyPart: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  coachingTips: string[];
  media: ExerciseMedia;
};

export type ExerciseProviderResult = {
  exercises: Exercise[];
};

export interface ExerciseProvider {
  listExercises(): Promise<ExerciseProviderResult>;
  getExerciseById(exerciseId: string): Promise<Exercise | null>;
}

export type ExerciseFilters = {
  equipment?: string;
  muscle?: string;
};
