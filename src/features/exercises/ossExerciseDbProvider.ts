import { localExerciseProvider } from './localProvider';
import { createExerciseSlug, normalizeExerciseQuery } from './provider';
import type { Exercise, ExerciseProvider, ExerciseProviderResult } from './types';

const OSS_EXERCISE_DB_ENDPOINT = 'https://oss.exercisedb.dev/api/v1/exercises';
const OSS_PROVIDER_VERSION = 'oss-exercisedb-v1';
const OSS_DEV_LIMIT = 25;
const REQUEST_TIMEOUT_MS = 12000;

type OssExerciseDbExercise = {
  bodyParts?: string[];
  equipments?: string[];
  exerciseId?: string;
  gifUrl?: string;
  instructions?: string[];
  name?: string;
  secondaryMuscles?: string[];
  targetMuscles?: string[];
};

type OssExerciseDbResponse = {
  data?: OssExerciseDbExercise[];
  meta?: {
    total?: number;
    nextCursor?: string;
    hasNextPage?: boolean;
  };
  success?: boolean;
};

const firstString = (values?: string[]) => values?.find((value) => value.trim().length > 0)?.trim();

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));

const exerciseSignature = (exercise: Pick<Exercise, 'equipment' | 'name'>) =>
  `${normalizeExerciseQuery(exercise.name)}::${exercise.equipment.map(normalizeExerciseQuery).sort().join('|')}`;

const stripInstructionPrefix = (value: string) => value.replace(/^step\s*:?\s*\d+\s*/i, '').trim();

export const normalizeOssExercise = (row: OssExerciseDbExercise, localBySignature: Map<string, Exercise>): Exercise => {
  const name = row.name?.trim() || 'Untitled exercise';
  const equipment = uniqueStrings(row.equipments ?? []);
  const sourceId = row.exerciseId?.trim();
  const localMatch = localBySignature.get(exerciseSignature({ name, equipment }));
  const id = localMatch?.id ?? (sourceId ? `exdb-${sourceId}` : `exdb-${createExerciseSlug(name)}`);
  const bodyPart = firstString(row.bodyParts) ?? localMatch?.bodyPart ?? 'general';
  const primaryMuscles = uniqueStrings(row.targetMuscles ?? localMatch?.primaryMuscles ?? []);
  const secondaryMuscles = uniqueStrings(row.secondaryMuscles ?? localMatch?.secondaryMuscles ?? []);
  const instructions = uniqueStrings((row.instructions ?? localMatch?.instructions ?? []).map(stripInstructionPrefix));

  return {
    id,
    source: {
      provider: 'oss-exercisedb',
      sourceId,
    },
    name,
    aliases: localMatch?.aliases ?? [name],
    equipment: equipment.length > 0 ? equipment : (localMatch?.equipment ?? []),
    bodyPart,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    coachingTips: localMatch?.coachingTips ?? [],
    media: {
      animationUrl: row.gifUrl,
      gifUri: row.gifUrl,
      thumbnailUrl: row.gifUrl,
      thumbnailUri: row.gifUrl,
    },
  };
};

export class OssExerciseDbProvider implements ExerciseProvider {
  private exercises: Exercise[] | null = null;

  async listExercises(): Promise<ExerciseProviderResult> {
    if (this.exercises) {
      return {
        exercises: this.exercises,
        providerVersion: OSS_PROVIDER_VERSION,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${OSS_EXERCISE_DB_ENDPOINT}?limit=${OSS_DEV_LIMIT}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ExerciseDB request failed with ${response.status}`);
      }

      const payload = (await response.json()) as OssExerciseDbResponse;
      const rows = Array.isArray(payload.data) ? payload.data : [];

      if (rows.length === 0) {
        throw new Error('ExerciseDB returned no exercises');
      }

      const localExercises = (await localExerciseProvider.listExercises()).exercises;
      const localBySignature = new Map(localExercises.map((exercise) => [exerciseSignature(exercise), exercise] as const));
      const deduped = new Map<string, Exercise>();

      for (const row of rows) {
        const exercise = normalizeOssExercise(row, localBySignature);
        deduped.set(exercise.id, exercise);
      }

      this.exercises = Array.from(deduped.values()).sort((left, right) => left.name.localeCompare(right.name));

      return {
        exercises: this.exercises,
        providerVersion: OSS_PROVIDER_VERSION,
        refreshedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getExerciseById(exerciseId: string): Promise<Exercise | null> {
    const result = await this.listExercises();
    return result.exercises.find((exercise) => exercise.id === exerciseId) ?? null;
  }
}

export const createOssExerciseDbProvider = () => new OssExerciseDbProvider();
