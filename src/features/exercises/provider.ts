import type { Exercise, ExerciseProvider } from './types';

export type ExerciseDbExercise = {
  bodyPart?: string;
  equipment?: string;
  gifUrl?: string;
  imageUrl?: string;
  internalId?: string;
  id?: string;
  name?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  target?: string;
  instructions?: string[];
  aliases?: string[];
  animationUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  tips?: string[];
};

const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const createExerciseSlug = (value: string) =>
  normalizeText(value).replace(/\s+/g, '-').replace(/(^-|-$)/g, '');

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));

export const normalizeExerciseQuery = normalizeText;

export const normalizeExerciseDbExercise = (exercise: ExerciseDbExercise, provider: Exercise['source']['provider'] = 'exercisedb'): Exercise => {
  const name = exercise.name?.trim() || 'Untitled exercise';
  const bodyPart = exercise.bodyPart?.trim() || 'general';
  const equipment = exercise.equipment?.trim() || 'bodyweight';
  const primaryMuscles = exercise.primaryMuscles && exercise.primaryMuscles.length > 0 ? exercise.primaryMuscles : [exercise.target];
  const sourceId = exercise.id?.trim();
  const animationUrl = exercise.animationUrl ?? exercise.gifUrl;
  const thumbnailUrl = exercise.thumbnailUrl ?? exercise.imageUrl ?? animationUrl;

  return {
    id: exercise.internalId?.trim() || createExerciseSlug(name),
    source: {
      provider,
      sourceId,
    },
    name,
    aliases: uniqueStrings([...(exercise.aliases ?? []), name]),
    equipment: uniqueStrings([equipment]),
    bodyPart,
    primaryMuscles: uniqueStrings(primaryMuscles),
    secondaryMuscles: uniqueStrings(exercise.secondaryMuscles ?? []),
    instructions: uniqueStrings(exercise.instructions ?? []),
    coachingTips: uniqueStrings(exercise.tips ?? []),
    media: {
      animationUrl,
      gifUri: animationUrl,
      imageUrl: exercise.imageUrl,
      thumbnailUrl,
      thumbnailUri: thumbnailUrl,
      videoUrl: exercise.videoUrl,
      videoUri: exercise.videoUrl,
    },
  };
};

export const createExerciseDbProvider = (rows: ExerciseDbExercise[]): ExerciseProvider => {
  const exercises = rows.map((row) => normalizeExerciseDbExercise(row, 'local-fixture'));
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise] as const));

  return {
    async listExercises() {
      return { exercises };
    },
    async getExerciseById(exerciseId: string) {
      return byId.get(exerciseId) ?? null;
    },
  };
};
