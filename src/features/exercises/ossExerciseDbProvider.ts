import { localExerciseProvider } from './localProvider';
import { createExerciseSlug, normalizeExerciseQuery } from './provider';
import type { Exercise, ExerciseProvider, ExerciseProviderResult } from './types';

const OSS_EXERCISE_DB_ENDPOINT = 'https://oss.exercisedb.dev/api/v1/exercises';
const OSS_PROVIDER_VERSION = 'oss-exercisedb-v2';
const OSS_PAGE_LIMIT = 25;
const OSS_INITIAL_PAGE_COUNT = 4;
const REQUEST_TIMEOUT_MS = 20000;
const PAGE_DELAY_MS = 175;

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

const hasText = (value?: string) => Boolean(value?.trim());

const preferRemoteStrings = (remoteValues: Array<string | undefined | null>, localValues: string[] = []) => {
  const remote = uniqueStrings(remoteValues);
  return remote.length > 0 ? remote : localValues;
};

const localExerciseMatchesRemote = (localExercise: Exercise, remoteName: string, remoteEquipment: string[]) => {
  const localName = normalizeExerciseQuery(localExercise.name);
  const normalizedRemoteName = normalizeExerciseQuery(remoteName);
  const localEquipment = localExercise.equipment.map(normalizeExerciseQuery);
  const normalizedRemoteEquipment = remoteEquipment.map(normalizeExerciseQuery);
  const equipmentMatches =
    normalizedRemoteEquipment.length === 0 ||
    localEquipment.length === 0 ||
    normalizedRemoteEquipment.some((equipment) => localEquipment.includes(equipment));

  if (!equipmentMatches) {
    return false;
  }

  const localAliases = [localExercise.name, ...localExercise.aliases].map(normalizeExerciseQuery);
  return localAliases.some((alias) => alias.length > 0 && (normalizedRemoteName === alias || normalizedRemoteName.includes(alias)));
};

const findLocalMatch = (name: string, equipment: string[], localBySignature: Map<string, Exercise>, localExercises: Exercise[]) =>
  localBySignature.get(exerciseSignature({ name, equipment })) ??
  localExercises.find((localExercise) => localExerciseMatchesRemote(localExercise, name, equipment));

export const normalizeOssExercise = (row: OssExerciseDbExercise, localBySignature: Map<string, Exercise>): Exercise => {
  return normalizeOssExerciseWithLocalRows(row, localBySignature, Array.from(localBySignature.values()));
};

export const normalizeOssExerciseWithLocalRows = (
  row: OssExerciseDbExercise,
  localBySignature: Map<string, Exercise>,
  localExercises: Exercise[],
): Exercise => {
  const name = row.name?.trim() || 'Untitled exercise';
  const equipment = uniqueStrings(row.equipments ?? []);
  const sourceId = row.exerciseId?.trim();
  const localMatch = findLocalMatch(name, equipment, localBySignature, localExercises);
  const id = localMatch?.id ?? (sourceId ? `exdb-${sourceId}` : `exdb-${createExerciseSlug(name)}`);
  const animationUrl = row.gifUrl?.trim();
  const bodyPart = firstString(row.bodyParts) ?? localMatch?.bodyPart ?? 'general';
  const primaryMuscles = preferRemoteStrings(row.targetMuscles ?? [], localMatch?.primaryMuscles ?? []);
  const secondaryMuscles = preferRemoteStrings(row.secondaryMuscles ?? [], localMatch?.secondaryMuscles ?? []);
  const instructions = preferRemoteStrings((row.instructions ?? []).map(stripInstructionPrefix), localMatch?.instructions ?? []);
  const localMedia = localMatch?.media ?? {};

  return {
    id,
    source: {
      provider: 'oss-exercisedb',
      sourceId,
    },
    name: localMatch?.name ?? name,
    aliases: uniqueStrings([...(localMatch?.aliases ?? []), name, localMatch?.name]),
    equipment: equipment.length > 0 ? equipment : (localMatch?.equipment ?? []),
    bodyPart,
    primaryMuscles,
    secondaryMuscles,
    instructions,
    coachingTips: localMatch?.coachingTips ?? [],
    media: {
      animationUrl: hasText(animationUrl) ? animationUrl : localMedia.animationUrl,
      gifUri: hasText(animationUrl) ? animationUrl : localMedia.gifUri,
      imageUrl: localMedia.imageUrl,
      thumbnailUrl: hasText(animationUrl) ? animationUrl : localMedia.thumbnailUrl,
      thumbnailUri: hasText(animationUrl) ? animationUrl : localMedia.thumbnailUri,
      videoUrl: localMedia.videoUrl,
      videoUri: localMedia.videoUri,
    },
  };
};

const delay = (durationMs: number) => new Promise((resolve) => setTimeout(resolve, durationMs));

const fetchOssExercisePage = async (params: Record<string, string>) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(OSS_EXERCISE_DB_ENDPOINT);
  url.searchParams.set('limit', `${OSS_PAGE_LIMIT}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`ExerciseDB request failed with ${response.status}`);
    }

    return (await response.json()) as OssExerciseDbResponse;
  } finally {
    clearTimeout(timeoutId);
  }
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

    const rows: OssExerciseDbExercise[] = [];
    let after = '';

    for (let page = 0; page < OSS_INITIAL_PAGE_COUNT; page += 1) {
      if (page > 0) {
        await delay(PAGE_DELAY_MS);
      }

      const payload = await fetchOssExercisePage(after ? { after } : {});
      rows.push(...(Array.isArray(payload.data) ? payload.data : []));

      if (!payload.meta?.hasNextPage || !payload.meta.nextCursor) {
        break;
      }

      after = payload.meta.nextCursor;
    }

    if (rows.length === 0) {
      throw new Error('ExerciseDB returned no exercises');
    }

    const localExercises = (await localExerciseProvider.listExercises()).exercises;
    const localBySignature = new Map(localExercises.map((exercise) => [exerciseSignature(exercise), exercise] as const));
    const seenSourceIds = new Set(rows.map((row) => row.exerciseId).filter((value): value is string => Boolean(value)));

    for (const localExercise of localExercises) {
      await delay(PAGE_DELAY_MS);
      const query = [localExercise.equipment[0], localExercise.name].filter(Boolean).join(' ');
      try {
        const payload = await fetchOssExercisePage({ name: query });
        for (const row of Array.isArray(payload.data) ? payload.data : []) {
          if (!row.exerciseId || !seenSourceIds.has(row.exerciseId)) {
            rows.push(row);
            if (row.exerciseId) {
              seenSourceIds.add(row.exerciseId);
            }
          }
        }
      } catch {
        // Targeted local-record enrichment is best effort; keep the broader remote catalog usable.
      }
    }

    const deduped = new Map<string, Exercise>();

    for (const row of rows) {
      const exercise = normalizeOssExerciseWithLocalRows(row, localBySignature, localExercises);
      deduped.set(exercise.id, exercise);
    }

    this.exercises = Array.from(deduped.values()).sort((left, right) => left.name.localeCompare(right.name));

    return {
      exercises: this.exercises,
      providerVersion: OSS_PROVIDER_VERSION,
      refreshedAt: new Date().toISOString(),
    };
  }

  async getExerciseById(exerciseId: string): Promise<Exercise | null> {
    const result = await this.listExercises();
    return result.exercises.find((exercise) => exercise.id === exerciseId) ?? null;
  }
}

export const createOssExerciseDbProvider = () => new OssExerciseDbProvider();
