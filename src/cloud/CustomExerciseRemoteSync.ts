import { isUuid } from '@/lib/ids';
import type { CustomExerciseSyncMetadata } from '@/storage';
import type { AppState, Exercise } from '@/types';

import {
  getCustomExerciseEntityId,
  isCustomExerciseEntity,
  toCustomExerciseSyncSnapshot,
} from './CustomExerciseSync';

const DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced'] as const);
const EXERCISE_TYPES = new Set([
  'compound',
  'isolation',
  'cardio',
  'mobility',
  'skill',
] as const);
const SOURCES = new Set(['user', 'imported', 'remote'] as const);

const metadataKey = (userId: string, id: string): string => `${userId}:${id}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const readStringList = (value: unknown): string[] | null => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null;
  }
  return value.map((item) => item.trim()).filter(Boolean);
};

const readRemoteExercise = (
  payload: Record<string, unknown>,
): Exercise | null => {
  const aliases = readStringList(payload.aliases);
  const primaryMuscles = readStringList(payload.primaryMuscles);
  const secondaryMuscles = readStringList(payload.secondaryMuscles);
  const equipment = readStringList(payload.equipment);
  const movementPattern = readStringList(payload.movementPattern);
  const tags = readStringList(payload.tags);
  const instructions = readStringList(payload.instructions);
  const tips = readStringList(payload.tips);
  const commonMistakes = readStringList(payload.commonMistakes);
  if (
    payload.schemaVersion !== 1 ||
    typeof payload.id !== 'string' ||
    !isUuid(payload.id) ||
    typeof payload.name !== 'string' ||
    !payload.name.trim() ||
    !aliases ||
    !primaryMuscles ||
    !secondaryMuscles ||
    !equipment ||
    !movementPattern ||
    !tags ||
    !instructions ||
    !tips ||
    !commonMistakes ||
    typeof payload.difficulty !== 'string' ||
    !DIFFICULTIES.has(payload.difficulty as 'beginner') ||
    typeof payload.exerciseType !== 'string' ||
    !EXERCISE_TYPES.has(payload.exerciseType as 'compound') ||
    typeof payload.unilateral !== 'boolean' ||
    payload.isCustom !== true ||
    typeof payload.source !== 'string' ||
    !SOURCES.has(payload.source as 'user') ||
    typeof payload.favorite !== 'boolean' ||
    !isTimestamp(payload.createdAt) ||
    (payload.updatedAt !== undefined && !isTimestamp(payload.updatedAt)) ||
    (payload.category !== undefined &&
      (typeof payload.category !== 'string' || !payload.category.trim())) ||
    (payload.muscleGroup !== undefined &&
      (typeof payload.muscleGroup !== 'string' || !payload.muscleGroup.trim())) ||
    (payload.notes !== undefined && typeof payload.notes !== 'string') ||
    (payload.estimatedSetupTime !== undefined &&
      (typeof payload.estimatedSetupTime !== 'number' ||
        !Number.isSafeInteger(payload.estimatedSetupTime) ||
        payload.estimatedSetupTime < 0)) ||
    (payload.metadata !== undefined && !isRecord(payload.metadata))
  ) {
    return null;
  }

  return {
    id: payload.id,
    name: payload.name.trim(),
    aliases,
    ...(typeof payload.category === 'string'
      ? { category: payload.category.trim() }
      : {}),
    primaryMuscles,
    secondaryMuscles,
    equipment,
    movementPattern,
    difficulty: payload.difficulty as Exercise['difficulty'],
    exerciseType: payload.exerciseType as Exercise['exerciseType'],
    unilateral: payload.unilateral,
    tags,
    instructions,
    tips,
    commonMistakes,
    ...(typeof payload.estimatedSetupTime === 'number'
      ? { estimatedSetupTime: payload.estimatedSetupTime }
      : {}),
    ...(typeof payload.muscleGroup === 'string'
      ? { muscleGroup: payload.muscleGroup.trim() }
      : {}),
    ...(typeof payload.notes === 'string' && payload.notes.trim()
      ? { notes: payload.notes.trim() }
      : {}),
    isCustom: true,
    createdAt: new Date(payload.createdAt).toISOString(),
    ...(isTimestamp(payload.updatedAt)
      ? { updatedAt: new Date(payload.updatedAt).toISOString() }
      : {}),
    source: payload.source as Exercise['source'],
    favorite: payload.favorite,
    ...(isRecord(payload.metadata)
      ? { metadata: { ...payload.metadata } }
      : {}),
  };
};

export type CustomExerciseSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: CustomExerciseSyncMetadata[];
};

export const applyRemoteCustomExerciseChanges = (
  state: AppState,
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    operationType?: string;
  }>,
  deletedEntities: Array<{
    id?: string;
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }>,
  userId: string,
  existingMetadata: Map<string, CustomExerciseSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): CustomExerciseSyncResult => {
  const metadata = new Map(existingMetadata);
  let exercises = [...state.exercises];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (
      !isCustomExerciseEntity(entity.entityType) ||
      entity.operationType === 'delete'
    ) {
      continue;
    }
    const payload = isRecord(entity.payload) ? entity.payload : null;
    const exercise = payload ? readRemoteExercise(payload) : null;
    const entityId = entity.entityId ?? exercise?.id ?? '';
    if (!exercise || exercise.id !== entityId) continue;

    exercises = [
      ...exercises.filter(
        (item) =>
          !item.isCustom ||
          getCustomExerciseEntityId(item.id) !== exercise.id,
      ),
      exercise,
    ];
    appliedRecordIds.push(exercise.id);
    metadata.set(metadataKey(userId, exercise.id), {
      id: exercise.id,
      userId,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId: 'unknown',
      createdAt: exercise.createdAt,
      syncedAt,
      snapshot: toCustomExerciseSyncSnapshot(exercise),
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isCustomExerciseEntity(deleted.entityType)) continue;
    const id = deleted.entityId ?? deleted.id;
    if (!id || !isUuid(id)) continue;
    exercises = exercises.filter(
      (item) => !item.isCustom || getCustomExerciseEntityId(item.id) !== id,
    );
    deletedRecordIds.push(id);
    const key = metadataKey(userId, id);
    const previous = metadata.get(key);
    if (previous) {
      metadata.set(key, {
        ...previous,
        revision:
          typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
            ? Math.max(0, Math.floor(deleted.revision))
            : previous.revision,
        syncedAt,
        deletedAt: deleted.appliedAt ?? syncedAt,
      });
    }
  }

  return {
    nextState: { ...state, exercises },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
