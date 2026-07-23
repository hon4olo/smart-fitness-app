import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { getWorkoutTemplateEntityId } from './WorkoutTemplateSync';
import { ensureUuid } from '@/lib/ids';
import type {
  TrainingProgram,
  TrainingProgramDay,
  TrainingProgramDifficulty,
  TrainingProgramProgression,
  WeekdayKey,
} from '@/types';
import type {
  TrainingProgramSyncMetadata,
  TrainingProgramSyncSnapshot,
} from '@/storage/TrainingProgramSyncMetadataStore';

export const TRAINING_PROGRAM_WEEKDAYS = new Set<WeekdayKey>([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const TRAINING_PROGRAM_DIFFICULTIES =
  new Set<TrainingProgramDifficulty>([
    'beginner',
    'intermediate',
    'advanced',
  ]);

export const isSyncRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSyncTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

export const isTrainingProgramEntity = (entityType: string): boolean =>
  entityType === 'trainingPrograms' || entityType === 'training_programs';

export const isTrainingProgramQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isTrainingProgramEntity(operation.entityType);

export const getTrainingProgramEntityId = (programId: string): string =>
  ensureUuid(programId);

const normalizeProgression = (
  progression: TrainingProgramProgression | undefined,
): TrainingProgramProgression | undefined => {
  if (!progression) return undefined;
  const normalized = {
    ...(typeof progression.targetReps === 'number' &&
    Number.isSafeInteger(progression.targetReps) &&
    progression.targetReps > 0
      ? { targetReps: progression.targetReps }
      : {}),
    ...(typeof progression.targetWeight === 'number' &&
    Number.isFinite(progression.targetWeight) &&
    progression.targetWeight >= 0
      ? { targetWeight: progression.targetWeight }
      : {}),
    ...(typeof progression.rir === 'number' &&
    Number.isFinite(progression.rir) &&
    progression.rir >= 0 &&
    progression.rir <= 10
      ? { rir: progression.rir }
      : {}),
    ...(typeof progression.strategy === 'string' && progression.strategy.trim()
      ? { strategy: progression.strategy.trim() }
      : {}),
  };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const normalizeDay = (day: TrainingProgramDay): TrainingProgramDay => {
  const restDay = Boolean(day.restDay);
  const workoutTemplateId =
    !restDay && day.workoutTemplateId?.trim()
      ? getWorkoutTemplateEntityId(day.workoutTemplateId)
      : undefined;
  return {
    id: day.id.trim(),
    weekday: day.weekday,
    ...(workoutTemplateId ? { workoutTemplateId } : {}),
    ...(day.workoutTemplateName?.trim()
      ? { workoutTemplateName: day.workoutTemplateName.trim() }
      : {}),
    ...(day.notes?.trim() ? { notes: day.notes.trim() } : {}),
    ...(restDay ? { restDay: true } : {}),
  };
};

export const normalizeTrainingProgramForSync = (
  program: TrainingProgram,
  now = new Date().toISOString(),
): TrainingProgram => {
  const createdAt = isSyncTimestamp(program.createdAt)
    ? new Date(program.createdAt).toISOString()
    : now;
  const updatedAt = isSyncTimestamp(program.updatedAt)
    ? new Date(program.updatedAt).toISOString()
    : undefined;
  const progression = normalizeProgression(program.progression);
  return {
    id: getTrainingProgramEntityId(program.id),
    name: program.name.trim(),
    ...(program.description?.trim()
      ? { description: program.description.trim() }
      : {}),
    goal: program.goal.trim(),
    difficulty: TRAINING_PROGRAM_DIFFICULTIES.has(program.difficulty)
      ? program.difficulty
      : 'beginner',
    durationWeeks:
      Number.isSafeInteger(program.durationWeeks) && program.durationWeeks > 0
        ? program.durationWeeks
        : 1,
    days: program.days
      .map(normalizeDay)
      .filter(
        (day) =>
          day.id &&
          TRAINING_PROGRAM_WEEKDAYS.has(day.weekday) &&
          (day.restDay || Boolean(day.workoutTemplateId)),
      ),
    ...(progression ? { progression } : {}),
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
    isCustom: true,
    ...(isSyncRecord(program.metadata)
      ? { metadata: { ...program.metadata } }
      : {}),
  };
};

export const toTrainingProgramSyncSnapshot = (
  program: TrainingProgram,
): TrainingProgramSyncSnapshot => ({
  name: program.name.trim(),
  description: program.description?.trim() || null,
  goal: program.goal.trim(),
  difficulty: program.difficulty,
  durationWeeks: program.durationWeeks,
  days: program.days.map((day) => ({
    id: day.id.trim(),
    weekday: day.weekday,
    workoutTemplateId: day.workoutTemplateId?.trim() || null,
    workoutTemplateName: day.workoutTemplateName?.trim() || null,
    notes: day.notes?.trim() || null,
    restDay: Boolean(day.restDay),
  })),
  progression: program.progression
    ? {
        targetReps: program.progression.targetReps ?? null,
        targetWeight: program.progression.targetWeight ?? null,
        rir: program.progression.rir ?? null,
        strategy:
          typeof program.progression.strategy === 'string'
            ? program.progression.strategy.trim() || null
            : null,
      }
    : null,
  isCustom: true,
  metadata: isSyncRecord(program.metadata) ? { ...program.metadata } : null,
});

export const areTrainingProgramSnapshotsEqual = (
  left: TrainingProgramSyncSnapshot,
  right: TrainingProgramSyncSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const trainingProgramFromMetadata = (
  metadata: TrainingProgramSyncMetadata,
): TrainingProgram => ({
  id: metadata.id,
  name: metadata.snapshot.name,
  ...(metadata.snapshot.description
    ? { description: metadata.snapshot.description }
    : {}),
  goal: metadata.snapshot.goal,
  difficulty: metadata.snapshot.difficulty,
  durationWeeks: metadata.snapshot.durationWeeks,
  days: metadata.snapshot.days.map((day) => ({
    id: day.id,
    weekday: day.weekday,
    ...(day.workoutTemplateId
      ? { workoutTemplateId: day.workoutTemplateId }
      : {}),
    ...(day.workoutTemplateName
      ? { workoutTemplateName: day.workoutTemplateName }
      : {}),
    ...(day.notes ? { notes: day.notes } : {}),
    ...(day.restDay ? { restDay: true } : {}),
  })),
  ...(metadata.snapshot.progression
    ? {
        progression: {
          ...(metadata.snapshot.progression.targetReps !== null
            ? { targetReps: metadata.snapshot.progression.targetReps }
            : {}),
          ...(metadata.snapshot.progression.targetWeight !== null
            ? { targetWeight: metadata.snapshot.progression.targetWeight }
            : {}),
          ...(metadata.snapshot.progression.rir !== null
            ? { rir: metadata.snapshot.progression.rir }
            : {}),
          ...(metadata.snapshot.progression.strategy
            ? { strategy: metadata.snapshot.progression.strategy }
            : {}),
        },
      }
    : {}),
  createdAt: metadata.createdAt,
  updatedAt: metadata.syncedAt,
  isCustom: true,
  ...(metadata.snapshot.metadata
    ? { metadata: { ...metadata.snapshot.metadata } }
    : {}),
});

const toPayloadDays = (snapshot: TrainingProgramSyncSnapshot) =>
  snapshot.days.map((day) => ({
    id: day.id,
    weekday: day.weekday,
    ...(day.workoutTemplateId
      ? { workoutTemplateId: day.workoutTemplateId }
      : {}),
    ...(day.workoutTemplateName
      ? { workoutTemplateName: day.workoutTemplateName }
      : {}),
    ...(day.notes ? { notes: day.notes } : {}),
    ...(day.restDay ? { restDay: true } : {}),
  }));

const toPayloadProgression = (snapshot: TrainingProgramSyncSnapshot) =>
  snapshot.progression
    ? {
        ...(snapshot.progression.targetReps !== null
          ? { targetReps: snapshot.progression.targetReps }
          : {}),
        ...(snapshot.progression.targetWeight !== null
          ? { targetWeight: snapshot.progression.targetWeight }
          : {}),
        ...(snapshot.progression.rir !== null
          ? { rir: snapshot.progression.rir }
          : {}),
        ...(snapshot.progression.strategy
          ? { strategy: snapshot.progression.strategy }
          : {}),
      }
    : null;

export const createTrainingProgramQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  program: TrainingProgram;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: TrainingProgramSyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const now = isSyncTimestamp(input.now)
    ? new Date(input.now).toISOString()
    : new Date().toISOString();
  const program = normalizeTrainingProgramForSync(input.program, now);
  const snapshot = toTrainingProgramSyncSnapshot(program);
  const previous =
    input.previous?.userId === input.userId ? input.previous : null;
  const baseRevision = {
    id: previous ? `rev-${previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: previous?.syncedAt ?? now,
  };
  const progression = toPayloadProgression(snapshot);
  const payload =
    input.action === 'delete'
      ? { id: program.id, deletedAt: now, deviceId: input.deviceId }
      : {
          schemaVersion: 1,
          id: program.id,
          name: snapshot.name,
          ...(snapshot.description ? { description: snapshot.description } : {}),
          goal: snapshot.goal,
          difficulty: snapshot.difficulty,
          durationWeeks: snapshot.durationWeeks,
          days: toPayloadDays(snapshot),
          ...(progression ? { progression } : {}),
          isCustom: true,
          ...(snapshot.metadata ? { metadata: snapshot.metadata } : {}),
          createdAt: previous?.createdAt ?? program.createdAt,
          updatedAt: now,
          deviceId: input.deviceId,
        };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'trainingPrograms',
    entityId: program.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `trainingPrograms:${program.id}`,
    entityType: 'trainingPrograms',
    entityId: program.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'trainingPrograms',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};
