import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { ensureUuid } from '@/lib/ids';
import type { CustomExerciseSyncMetadata, CustomExerciseSyncSnapshot } from '@/storage';
import type { Exercise } from '@/types';

const DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced'] as const);
const EXERCISE_TYPES = new Set([
  'compound',
  'isolation',
  'cardio',
  'mobility',
  'skill',
] as const);

export const isCustomExerciseEntity = (entityType: string): boolean =>
  entityType === 'customExercises' || entityType === 'custom_exercises';

export const isCustomExerciseQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isCustomExerciseEntity(operation.entityType);

export const getCustomExerciseEntityId = (exerciseId: string): string =>
  ensureUuid(exerciseId);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const normalizeStringList = (value: string[] | undefined): string[] =>
  Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean)));

const normalizeSource = (
  value: Exercise['source'],
): 'user' | 'imported' | 'remote' =>
  value === 'imported' || value === 'remote' ? value : 'user';

export const normalizeCustomExerciseForSync = (
  exercise: Exercise,
  now = new Date().toISOString(),
): Exercise => {
  const createdAt = isTimestamp(exercise.createdAt)
    ? new Date(exercise.createdAt).toISOString()
    : now;
  const updatedAt = isTimestamp(exercise.updatedAt)
    ? new Date(exercise.updatedAt).toISOString()
    : now;
  return {
    id: getCustomExerciseEntityId(exercise.id),
    name: exercise.name.trim(),
    aliases: normalizeStringList(exercise.aliases),
    ...(exercise.category?.trim() ? { category: exercise.category.trim() } : {}),
    primaryMuscles: normalizeStringList(exercise.primaryMuscles),
    secondaryMuscles: normalizeStringList(exercise.secondaryMuscles),
    equipment: normalizeStringList(exercise.equipment),
    movementPattern: normalizeStringList(exercise.movementPattern),
    difficulty: DIFFICULTIES.has(exercise.difficulty ?? 'intermediate')
      ? (exercise.difficulty ?? 'intermediate')
      : 'intermediate',
    exerciseType: EXERCISE_TYPES.has(exercise.exerciseType ?? 'compound')
      ? (exercise.exerciseType ?? 'compound')
      : 'compound',
    unilateral: Boolean(exercise.unilateral),
    tags: normalizeStringList(exercise.tags),
    instructions: normalizeStringList(exercise.instructions),
    tips: normalizeStringList(exercise.tips),
    commonMistakes: normalizeStringList(exercise.commonMistakes),
    ...(typeof exercise.estimatedSetupTime === 'number' &&
    Number.isFinite(exercise.estimatedSetupTime) &&
    exercise.estimatedSetupTime >= 0
      ? { estimatedSetupTime: Math.round(exercise.estimatedSetupTime) }
      : {}),
    ...(exercise.muscleGroup?.trim()
      ? { muscleGroup: exercise.muscleGroup.trim() }
      : {}),
    ...(exercise.notes?.trim() ? { notes: exercise.notes.trim() } : {}),
    isCustom: true,
    createdAt,
    updatedAt,
    source: normalizeSource(exercise.source),
    favorite: Boolean(exercise.favorite),
    ...(isRecord(exercise.metadata)
      ? { metadata: { ...exercise.metadata } }
      : {}),
  };
};

export const toCustomExerciseSyncSnapshot = (
  exercise: Exercise,
): CustomExerciseSyncSnapshot => ({
  name: exercise.name.trim(),
  aliases: normalizeStringList(exercise.aliases),
  category: exercise.category?.trim() || null,
  primaryMuscles: normalizeStringList(exercise.primaryMuscles),
  secondaryMuscles: normalizeStringList(exercise.secondaryMuscles),
  equipment: normalizeStringList(exercise.equipment),
  movementPattern: normalizeStringList(exercise.movementPattern),
  difficulty: exercise.difficulty ?? 'intermediate',
  exerciseType: exercise.exerciseType ?? 'compound',
  unilateral: Boolean(exercise.unilateral),
  tags: normalizeStringList(exercise.tags),
  instructions: normalizeStringList(exercise.instructions),
  tips: normalizeStringList(exercise.tips),
  commonMistakes: normalizeStringList(exercise.commonMistakes),
  estimatedSetupTime:
    typeof exercise.estimatedSetupTime === 'number' &&
    Number.isFinite(exercise.estimatedSetupTime) &&
    exercise.estimatedSetupTime >= 0
      ? Math.round(exercise.estimatedSetupTime)
      : null,
  muscleGroup: exercise.muscleGroup?.trim() || null,
  notes: exercise.notes?.trim() || null,
  source: normalizeSource(exercise.source),
  favorite: Boolean(exercise.favorite),
  metadata: isRecord(exercise.metadata) ? { ...exercise.metadata } : null,
});

export const areCustomExerciseSnapshotsEqual = (
  left: CustomExerciseSyncSnapshot,
  right: CustomExerciseSyncSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const customExerciseFromMetadata = (
  metadata: CustomExerciseSyncMetadata,
): Exercise => ({
  id: metadata.id,
  name: metadata.snapshot.name,
  aliases: [...metadata.snapshot.aliases],
  ...(metadata.snapshot.category
    ? { category: metadata.snapshot.category }
    : {}),
  primaryMuscles: [...metadata.snapshot.primaryMuscles],
  secondaryMuscles: [...metadata.snapshot.secondaryMuscles],
  equipment: [...metadata.snapshot.equipment],
  movementPattern: [...metadata.snapshot.movementPattern],
  difficulty: metadata.snapshot.difficulty,
  exerciseType: metadata.snapshot.exerciseType,
  unilateral: metadata.snapshot.unilateral,
  tags: [...metadata.snapshot.tags],
  instructions: [...metadata.snapshot.instructions],
  tips: [...metadata.snapshot.tips],
  commonMistakes: [...metadata.snapshot.commonMistakes],
  ...(metadata.snapshot.estimatedSetupTime === null
    ? {}
    : { estimatedSetupTime: metadata.snapshot.estimatedSetupTime }),
  ...(metadata.snapshot.muscleGroup
    ? { muscleGroup: metadata.snapshot.muscleGroup }
    : {}),
  ...(metadata.snapshot.notes ? { notes: metadata.snapshot.notes } : {}),
  isCustom: true,
  createdAt: metadata.createdAt,
  updatedAt: metadata.syncedAt,
  source: metadata.snapshot.source,
  favorite: metadata.snapshot.favorite,
  ...(metadata.snapshot.metadata
    ? { metadata: { ...metadata.snapshot.metadata } }
    : {}),
});

const toPayload = (
  exercise: Exercise,
  snapshot: CustomExerciseSyncSnapshot,
  updatedAt: string,
  createdAt: string,
): Record<string, unknown> => ({
  schemaVersion: 1,
  id: exercise.id,
  name: snapshot.name,
  aliases: snapshot.aliases,
  ...(snapshot.category ? { category: snapshot.category } : {}),
  primaryMuscles: snapshot.primaryMuscles,
  secondaryMuscles: snapshot.secondaryMuscles,
  equipment: snapshot.equipment,
  movementPattern: snapshot.movementPattern,
  difficulty: snapshot.difficulty,
  exerciseType: snapshot.exerciseType,
  unilateral: snapshot.unilateral,
  tags: snapshot.tags,
  instructions: snapshot.instructions,
  tips: snapshot.tips,
  commonMistakes: snapshot.commonMistakes,
  ...(snapshot.estimatedSetupTime === null
    ? {}
    : { estimatedSetupTime: snapshot.estimatedSetupTime }),
  ...(snapshot.muscleGroup ? { muscleGroup: snapshot.muscleGroup } : {}),
  ...(snapshot.notes ? { notes: snapshot.notes } : {}),
  isCustom: true,
  source: snapshot.source,
  favorite: snapshot.favorite,
  ...(snapshot.metadata ? { metadata: snapshot.metadata } : {}),
  createdAt,
  updatedAt,
});

export const createCustomExerciseQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  exercise: Exercise;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: CustomExerciseSyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const now = isTimestamp(input.now)
    ? new Date(input.now).toISOString()
    : new Date().toISOString();
  const exercise = normalizeCustomExerciseForSync(input.exercise, now);
  const snapshot = toCustomExerciseSyncSnapshot(exercise);
  const previous =
    input.previous?.userId === input.userId ? input.previous : null;
  const baseRevision = {
    id: previous ? `rev-${previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: previous?.syncedAt ?? now,
  };
  const createdAt = previous?.createdAt ?? exercise.createdAt;
  const payload =
    input.action === 'delete'
      ? { id: exercise.id, deletedAt: now }
      : toPayload(exercise, snapshot, now, createdAt);
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'customExercises',
    entityId: exercise.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `customExercises:${exercise.id}`,
    entityType: 'customExercises',
    entityId: exercise.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'customExercises',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};
