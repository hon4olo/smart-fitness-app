import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { defaultState } from '@/data/defaults';
import { createDeterministicUuid, isUuid } from '@/lib/ids';
import type { AppState, ProfileGoalType, ProfileState } from '@/types';
import type {
  FitnessProfileSyncMetadata,
  FitnessProfileSyncSnapshot,
} from '@/storage/FitnessProfileSyncMetadataStore';

let fitnessProfileOutboxSuppressionDepth = 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const isDateOnly = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDateOfBirth = (value: string | null): string | null => {
  if (!value || !isDateOnly(value)) return null;
  const today = new Date().toISOString().slice(0, 10);
  return value >= '1900-01-01' && value <= today ? value : null;
};

const normalizeHeight = (value: string): number | null => {
  const parsed = parseNumber(value);
  return parsed !== null && parsed >= 50 && parsed <= 300 ? round(parsed, 2) : null;
};

const normalizeActivityLevel = (
  value: string,
): FitnessProfileSyncSnapshot['activityLevel'] => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, FitnessProfileSyncSnapshot['activityLevel']> = {
    sedentary: 'sedentary',
    light: 'light',
    lightly_active: 'light',
    moderate: 'moderate',
    moderately_active: 'moderate',
    high: 'high',
    very_active: 'high',
    very_high: 'very_high',
    athlete: 'very_high',
  };
  return aliases[normalized] ?? null;
};

const mapGoalToServer = (
  goalType: ProfileGoalType,
): FitnessProfileSyncSnapshot['goal'] => {
  if (goalType === 'lose_fat') return 'fat_loss';
  if (goalType === 'gain_muscle') return 'muscle_gain';
  return 'maintain';
};

const mapGoalToLocal = (
  goal: FitnessProfileSyncSnapshot['goal'],
  fallback: ProfileGoalType,
): ProfileGoalType => {
  if (goal === 'fat_loss') return 'lose_fat';
  if (goal === 'muscle_gain') return 'gain_muscle';
  if (goal === 'maintain' || goal === 'recomposition') return 'maintain';
  return fallback;
};

const normalizeWeeklyChange = (profile: ProfileState): number => {
  const magnitude = Math.abs(Number(profile.weeklyWeightChangeGoal) || 0);
  if (profile.goalType === 'lose_fat') return -round(magnitude, 3);
  if (profile.goalType === 'gain_muscle') return round(magnitude, 3);
  return 0;
};

export const isFitnessProfileEntity = (entityType: string): boolean =>
  entityType === 'fitnessProfiles' || entityType === 'fitness_profiles';

export const isFitnessProfileQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isFitnessProfileEntity(operation.entityType);

export const getFitnessProfileEntityId = (userId: string): string =>
  createDeterministicUuid(`fitnessProfiles:profile:${userId.trim().toLowerCase()}`);

export const normalizeFitnessProfileForSync = (
  profile: ProfileState,
): FitnessProfileSyncSnapshot => {
  const targetWeight = Number(profile.targetWeight);
  const trainingDays = Number(profile.trainingDaysPerWeek);

  return {
    dateOfBirth: normalizeDateOfBirth(profile.dateOfBirth),
    calculationSex: profile.calculationSex,
    heightCm: normalizeHeight(profile.height),
    goal: mapGoalToServer(profile.goalType),
    activityLevel: normalizeActivityLevel(profile.activityLevel),
    trainingExperience: profile.trainingExperience,
    trainingDaysPerWeek:
      Number.isInteger(trainingDays) && trainingDays >= 0 && trainingDays <= 7
        ? trainingDays
        : null,
    targetWeightKg:
      Number.isFinite(targetWeight) && targetWeight > 0 && targetWeight <= 1_000
        ? round(targetWeight, 3)
        : null,
    targetWeeklyWeightChangeKg: normalizeWeeklyChange(profile),
  };
};

export const areFitnessProfileSnapshotsEqual = (
  left: FitnessProfileSyncSnapshot,
  right: FitnessProfileSyncSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const createFitnessProfileQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  profile: ProfileState;
  userId: string;
  deviceId: string;
  baseRevision: number;
  now?: string;
  previous?: FitnessProfileSyncMetadata | null;
}): OfflineSyncQueueOperation => {
  const now = isTimestamp(input.now) ? new Date(input.now).toISOString() : new Date().toISOString();
  const entityId = getFitnessProfileEntityId(input.userId);
  const snapshot = normalizeFitnessProfileForSync(input.profile);
  const baseRevision = {
    id: input.previous ? `rev-${input.previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: input.previous?.syncedAt ?? now,
  };
  const payload = input.action === 'delete'
    ? { id: entityId, deletedAt: now, deviceId: input.deviceId }
    : {
        schemaVersion: 1,
        id: entityId,
        ...snapshot,
        createdAt: input.previous?.syncedAt ?? now,
        updatedAt: now,
        deviceId: input.deviceId,
      };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'fitnessProfiles',
    entityId,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `fitnessProfiles:${entityId}`,
    entityType: 'fitnessProfiles',
    entityId,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'fitnessProfiles',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: input.previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

const readNullableNumber = (
  record: Record<string, unknown>,
  key: string,
): number | null | undefined => {
  const value = record[key];
  if (value === null) return null;
  const parsed = parseNumber(value);
  return parsed === null ? undefined : parsed;
};

const readRemoteSnapshot = (payload: Record<string, unknown>): FitnessProfileSyncSnapshot | null => {
  const dateOfBirth = payload.dateOfBirth;
  const calculationSex = payload.calculationSex;
  const heightCm = readNullableNumber(payload, 'heightCm');
  const goal = payload.goal;
  const activityLevel = payload.activityLevel;
  const trainingExperience = payload.trainingExperience;
  const trainingDaysPerWeek = readNullableNumber(payload, 'trainingDaysPerWeek');
  const targetWeightKg = readNullableNumber(payload, 'targetWeightKg');
  const targetWeeklyWeightChangeKg = readNullableNumber(
    payload,
    'targetWeeklyWeightChangeKg',
  );

  if (
    (dateOfBirth !== null && !isDateOnly(dateOfBirth)) ||
    (calculationSex !== null && calculationSex !== 'male' && calculationSex !== 'female') ||
    heightCm === undefined ||
    (goal !== null &&
      goal !== 'maintain' &&
      goal !== 'fat_loss' &&
      goal !== 'muscle_gain' &&
      goal !== 'recomposition') ||
    (activityLevel !== null &&
      activityLevel !== 'sedentary' &&
      activityLevel !== 'light' &&
      activityLevel !== 'moderate' &&
      activityLevel !== 'high' &&
      activityLevel !== 'very_high') ||
    (trainingExperience !== null &&
      trainingExperience !== 'beginner' &&
      trainingExperience !== 'intermediate' &&
      trainingExperience !== 'advanced') ||
    trainingDaysPerWeek === undefined ||
    targetWeightKg === undefined ||
    targetWeeklyWeightChangeKg === undefined
  ) {
    return null;
  }

  return {
    dateOfBirth,
    calculationSex,
    heightCm,
    goal,
    activityLevel,
    trainingExperience,
    trainingDaysPerWeek,
    targetWeightKg,
    targetWeeklyWeightChangeKg,
  };
};

export type FitnessProfileSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: FitnessProfileSyncMetadata[];
};

export const applyRemoteFitnessProfileChanges = (
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
  existingMetadata: Map<string, FitnessProfileSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): FitnessProfileSyncResult => {
  const expectedId = getFitnessProfileEntityId(userId);
  const metadata = new Map(existingMetadata);
  let profile = state.profile;
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (!isFitnessProfileEntity(entity.entityType) || entity.operationType === 'delete') continue;
    const payload = isRecord(entity.payload) ? entity.payload : null;
    const rawId = typeof payload?.id === 'string' ? payload.id : entity.entityId ?? '';
    const snapshot = payload ? readRemoteSnapshot(payload) : null;
    if (rawId !== expectedId || !isUuid(rawId) || payload?.schemaVersion !== 1 || !snapshot) {
      continue;
    }

    profile = {
      ...profile,
      dateOfBirth: snapshot.dateOfBirth,
      calculationSex: snapshot.calculationSex,
      height: snapshot.heightCm === null ? '' : String(snapshot.heightCm),
      goalType: mapGoalToLocal(snapshot.goal, profile.goalType),
      activityLevel: snapshot.activityLevel ?? '',
      trainingExperience: snapshot.trainingExperience,
      trainingDaysPerWeek: snapshot.trainingDaysPerWeek ?? profile.trainingDaysPerWeek,
      targetWeight: snapshot.targetWeightKg ?? profile.targetWeight,
      weeklyWeightChangeGoal:
        snapshot.targetWeeklyWeightChangeKg === null
          ? profile.weeklyWeightChangeGoal
          : Math.abs(snapshot.targetWeeklyWeightChangeKg),
    };
    appliedRecordIds.push(expectedId);
    metadata.set(expectedId, {
      id: expectedId,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId:
        typeof payload.deviceId === 'string' && payload.deviceId.trim()
          ? payload.deviceId.trim()
          : 'unknown',
      syncedAt,
      snapshot,
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isFitnessProfileEntity(deleted.entityType)) continue;
    const id = deleted.entityId ?? deleted.id;
    if (id !== expectedId) continue;

    profile = { ...defaultState.profile };
    deletedRecordIds.push(expectedId);
    metadata.set(expectedId, {
      id: expectedId,
      revision:
        typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
          ? Math.max(0, Math.floor(deleted.revision))
          : 0,
      deviceId: 'unknown',
      syncedAt,
      snapshot: normalizeFitnessProfileForSync(defaultState.profile),
      deletedAt: deleted.appliedAt ?? syncedAt,
    });
  }

  return {
    nextState: { ...state, profile },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};

export const isFitnessProfileOutboxSuppressed = (): boolean =>
  fitnessProfileOutboxSuppressionDepth > 0;

export const runWithoutFitnessProfileOutbox = <T>(operation: () => T): T => {
  fitnessProfileOutboxSuppressionDepth += 1;
  try {
    return operation();
  } finally {
    fitnessProfileOutboxSuppressionDepth -= 1;
  }
};
