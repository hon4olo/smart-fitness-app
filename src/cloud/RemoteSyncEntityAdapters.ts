import type { DomainEntityName } from '@/domain';

import type { SyncOperation } from './CloudSyncTypes';

export type RemoteSyncOperationRecord = {
  id?: unknown;
  entityType?: unknown;
  entityId?: unknown;
  operationType?: unknown;
  payload?: unknown;
  revision?: unknown;
  appliedAt?: unknown;
  createdAt?: unknown;
  deviceId?: unknown;
  userId?: unknown;
};

const ENTITY_TYPE_ALIASES: Record<string, DomainEntityName> = {
  appstate: 'appState',
  app_state: 'appState',
  bodymeasurements: 'bodyMeasurements',
  body_measurements: 'bodyMeasurements',
  exercises: 'exercises',
  foodentries: 'foodEntries',
  food_entries: 'foodEntries',
  mealtemplates: 'mealTemplates',
  meal_templates: 'mealTemplates',
  nutritiontargets: 'nutritionTargets',
  nutrition_targets: 'nutritionTargets',
  profile: 'profile',
  user_profile: 'profile',
  trainingprograms: 'trainingPrograms',
  training_programs: 'trainingPrograms',
  weighthistory: 'weightHistory',
  weight_history: 'weightHistory',
  workouts: 'workouts',
  workouttemplates: 'workouts',
  workout_templates: 'workouts',
  workoutsessions: 'workoutSessions',
  workout_sessions: 'workoutSessions',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeEntityTypeKey = (value: string): string =>
  value.trim().replace(/[\s-]+/g, '_').toLowerCase();

export const normalizeRemoteEntityType = (value: unknown): DomainEntityName | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return ENTITY_TYPE_ALIASES[normalizeEntityTypeKey(value)] ?? null;
};

const normalizeRevision = (value: unknown, fallbackRevision: number): number => {
  const revision = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(revision) ? Math.max(0, Math.floor(revision)) : fallbackRevision;
};

export const toRemoteSyncOperation = (
  record: RemoteSyncOperationRecord,
  fallbackRevision = 0,
  fallbackCreatedAt = new Date().toISOString(),
): SyncOperation | null => {
  const entity = normalizeRemoteEntityType(record.entityType);
  if (!entity) {
    return null;
  }

  const entityId =
    typeof record.entityId === 'string' && record.entityId.trim()
      ? record.entityId.trim()
      : null;
  if (!entityId) {
    return null;
  }

  const revisionNumber = normalizeRevision(record.revision, fallbackRevision);
  const operationId =
    typeof record.id === 'string' && record.id.trim()
      ? record.id.trim()
      : `remote:${entity}:${entityId}:${revisionNumber}`;
  const createdAt =
    typeof record.appliedAt === 'string' && record.appliedAt.trim()
      ? record.appliedAt.trim()
      : typeof record.createdAt === 'string' && record.createdAt.trim()
        ? record.createdAt.trim()
        : fallbackCreatedAt;

  return {
    id: operationId,
    entity,
    entityId,
    action: record.operationType === 'delete' ? 'delete' : 'upsert',
    ...(isRecord(record.payload) ? { payload: record.payload } : {}),
    revision: {
      id: `rev-${revisionNumber}`,
      number: revisionNumber,
      createdAt,
      source: 'remote',
    },
    metadata: {
      entityName: entity,
      source: 'remote',
      ...(typeof record.deviceId === 'string' ? { deviceId: record.deviceId } : {}),
      ...(typeof record.userId === 'string' ? { userId: record.userId } : {}),
    },
    createdAt,
  };
};
