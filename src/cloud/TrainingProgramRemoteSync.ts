import { isUuid } from '@/lib/ids';
import type {
  AppState,
  TrainingProgram,
  TrainingProgramDay,
  TrainingProgramDifficulty,
  TrainingProgramProgression,
  WeekdayKey,
} from '@/types';
import type { TrainingProgramSyncMetadata } from '@/storage/TrainingProgramSyncMetadataStore';

import {
  getTrainingProgramEntityId,
  isSyncRecord,
  isSyncTimestamp,
  isTrainingProgramEntity,
  toTrainingProgramSyncSnapshot,
  TRAINING_PROGRAM_DIFFICULTIES,
  TRAINING_PROGRAM_WEEKDAYS,
} from './TrainingProgramSync';

const metadataKey = (userId: string, id: string): string => `${userId}:${id}`;

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim();
};

const readRemoteDay = (value: unknown): TrainingProgramDay | null => {
  if (
    !isSyncRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.weekday !== 'string' ||
    !TRAINING_PROGRAM_WEEKDAYS.has(value.weekday as WeekdayKey)
  ) {
    return null;
  }
  const restDay = value.restDay === true;
  const workoutTemplateId = readNullableString(value.workoutTemplateId);
  const workoutTemplateName = readNullableString(value.workoutTemplateName);
  const notes = readNullableString(value.notes);
  if (
    workoutTemplateId === undefined ||
    workoutTemplateName === undefined ||
    notes === undefined ||
    (workoutTemplateId !== null && !isUuid(workoutTemplateId)) ||
    (!restDay && !workoutTemplateId)
  ) {
    return null;
  }
  return {
    id: value.id.trim(),
    weekday: value.weekday as WeekdayKey,
    ...(workoutTemplateId ? { workoutTemplateId } : {}),
    ...(workoutTemplateName ? { workoutTemplateName } : {}),
    ...(notes ? { notes } : {}),
    ...(restDay ? { restDay: true } : {}),
  };
};

const readRemoteProgression = (
  value: unknown,
): TrainingProgramProgression | null | undefined => {
  if (value === undefined || value === null) return null;
  if (!isSyncRecord(value)) return undefined;
  const targetReps = value.targetReps;
  const targetWeight = value.targetWeight;
  const rir = value.rir;
  const strategy = readNullableString(value.strategy);
  if (
    (targetReps !== undefined &&
      (!Number.isSafeInteger(targetReps) || (targetReps as number) < 1)) ||
    (targetWeight !== undefined &&
      (typeof targetWeight !== 'number' ||
        !Number.isFinite(targetWeight) ||
        targetWeight < 0)) ||
    (rir !== undefined &&
      (typeof rir !== 'number' || !Number.isFinite(rir) || rir < 0 || rir > 10)) ||
    strategy === undefined
  ) {
    return undefined;
  }
  return {
    ...(typeof targetReps === 'number' ? { targetReps } : {}),
    ...(typeof targetWeight === 'number' ? { targetWeight } : {}),
    ...(typeof rir === 'number' ? { rir } : {}),
    ...(strategy ? { strategy } : {}),
  };
};

const readRemoteProgram = (
  payload: Record<string, unknown>,
): TrainingProgram | null => {
  const progression = readRemoteProgression(payload.progression);
  if (
    payload.schemaVersion !== 1 ||
    typeof payload.id !== 'string' ||
    !isUuid(payload.id) ||
    typeof payload.name !== 'string' ||
    !payload.name.trim() ||
    typeof payload.goal !== 'string' ||
    !payload.goal.trim() ||
    typeof payload.difficulty !== 'string' ||
    !TRAINING_PROGRAM_DIFFICULTIES.has(
      payload.difficulty as TrainingProgramDifficulty,
    ) ||
    typeof payload.durationWeeks !== 'number' ||
    !Number.isSafeInteger(payload.durationWeeks) ||
    payload.durationWeeks < 1 ||
    !Array.isArray(payload.days) ||
    payload.days.length === 0 ||
    payload.isCustom !== true ||
    !isSyncTimestamp(payload.createdAt) ||
    progression === undefined ||
    (payload.description !== undefined &&
      (typeof payload.description !== 'string' || !payload.description.trim())) ||
    (payload.metadata !== undefined && !isSyncRecord(payload.metadata))
  ) {
    return null;
  }
  const days = payload.days.map(readRemoteDay);
  if (days.some((day) => !day)) return null;
  const dayIds = new Set<string>();
  const weekdays = new Set<WeekdayKey>();
  for (const day of days as TrainingProgramDay[]) {
    if (dayIds.has(day.id) || weekdays.has(day.weekday)) return null;
    dayIds.add(day.id);
    weekdays.add(day.weekday);
  }
  return {
    id: payload.id,
    name: payload.name.trim(),
    ...(typeof payload.description === 'string'
      ? { description: payload.description.trim() }
      : {}),
    goal: payload.goal.trim(),
    difficulty: payload.difficulty as TrainingProgramDifficulty,
    durationWeeks: payload.durationWeeks,
    days: days as TrainingProgramDay[],
    ...(progression ? { progression } : {}),
    createdAt: new Date(payload.createdAt).toISOString(),
    ...(isSyncTimestamp(payload.updatedAt)
      ? { updatedAt: new Date(payload.updatedAt).toISOString() }
      : {}),
    isCustom: true,
    ...(isSyncRecord(payload.metadata)
      ? { metadata: { ...payload.metadata } }
      : {}),
  };
};

export type TrainingProgramSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: TrainingProgramSyncMetadata[];
};

export const applyRemoteTrainingProgramChanges = (
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
  existingMetadata: Map<string, TrainingProgramSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): TrainingProgramSyncResult => {
  const metadata = new Map(existingMetadata);
  let trainingPrograms = [...state.trainingPrograms];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (
      !isTrainingProgramEntity(entity.entityType) ||
      entity.operationType === 'delete'
    ) {
      continue;
    }
    const payload = isSyncRecord(entity.payload) ? entity.payload : null;
    const program = payload ? readRemoteProgram(payload) : null;
    const entityId = entity.entityId ?? program?.id ?? '';
    if (!program || program.id !== entityId) continue;

    trainingPrograms = [
      ...trainingPrograms.filter(
        (item) => getTrainingProgramEntityId(item.id) !== program.id,
      ),
      program,
    ];
    appliedRecordIds.push(program.id);
    metadata.set(metadataKey(userId, program.id), {
      id: program.id,
      userId,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId:
        typeof payload?.deviceId === 'string' && payload.deviceId.trim()
          ? payload.deviceId.trim()
          : 'unknown',
      createdAt: program.createdAt,
      syncedAt,
      snapshot: toTrainingProgramSyncSnapshot(program),
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isTrainingProgramEntity(deleted.entityType)) continue;
    const id = deleted.entityId ?? deleted.id;
    if (!id || !isUuid(id)) continue;
    trainingPrograms = trainingPrograms.filter(
      (item) => getTrainingProgramEntityId(item.id) !== id,
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
    nextState: { ...state, trainingPrograms },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
