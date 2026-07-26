from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one replacement, found {count}: {old!r}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    "const isFitnessProfileEntity = (value: string): boolean =>\n  value === 'fitnessProfiles' || value === 'fitness_profiles';",
    "const SERVER_STRICT_IDENTITY_PAYLOAD_ENTITIES = new Set([\n  'fitnessProfiles',\n  'fitness_profiles',\n  'bodyMeasurements',\n  'body_measurements',\n  'trainingPrograms',\n  'training_programs',\n]);\nconst isServerStrictIdentityPayloadEntity = (value: string): boolean =>\n  SERVER_STRICT_IDENTITY_PAYLOAD_ENTITIES.has(value);",
)
replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    "    !isFitnessProfileEntity(entityType) ||",
    "    !isServerStrictIdentityPayloadEntity(entityType) ||",
)

replace_once(
    "src/cloud/BodyMeasurementSync.ts",
    "      ? { id: measurement.id, deletedAt: now, deviceId: input.deviceId }",
    "      ? { id: measurement.id, deletedAt: now }",
)
replace_once(
    "src/cloud/BodyMeasurementSync.ts",
    "          updatedAt: now,\n          deviceId: input.deviceId,",
    "          updatedAt: now,",
)

replace_once(
    "src/cloud/TrainingProgramSync.ts",
    "      ? { id: program.id, deletedAt: now, deviceId: input.deviceId }",
    "      ? { id: program.id, deletedAt: now }",
)
replace_once(
    "src/cloud/TrainingProgramSync.ts",
    "          updatedAt: now,\n          deviceId: input.deviceId,",
    "          updatedAt: now,",
)

replace_once(
    "src/context/syncContextModel.ts",
    "import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';",
    "import { isApiError } from '@/api/client';\nimport type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';",
)
replace_once(
    "src/context/syncContextModel.ts",
    "export type RemoteChangedEntity = {",
    "export const resolveSyncFailureStatus = (error: unknown): WeightSyncStatus => {\n  if (isApiError(error)) {\n    if (error.code === 'unauthorized' || error.status === 401) return 'local-only';\n    if (\n      error.code === 'network_error' ||\n      error.code === 'timeout' ||\n      error.code === 'unavailable'\n    ) {\n      return 'offline';\n    }\n    return 'error';\n  }\n\n  return error instanceof Error && error.message.toLowerCase().includes('auth')\n    ? 'local-only'\n    : 'error';\n};\n\nexport type RemoteChangedEntity = {",
)
replace_once(
    "src/context/SyncContext.tsx",
    "  resolveStatus,\n  type SyncPullResult,",
    "  resolveStatus,\n  resolveSyncFailureStatus,\n  type SyncPullResult,",
)
replace_once(
    "src/context/SyncContext.tsx",
    "      setStatus(message.toLowerCase().includes('auth') ? 'local-only' : 'offline');",
    "      setStatus(resolveSyncFailureStatus(syncError));",
)

Path("test/strict-sync-payload-compatibility.test.ts").write_text("""import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import { createBodyMeasurementQueueOperation } from '@/cloud/BodyMeasurementSync';
import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';
import { createTrainingProgramQueueOperation } from '@/cloud/TrainingProgramSync';
import { resolveSyncFailureStatus } from '@/context/syncContextModel';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const now = '2026-07-26T19:00:00.000Z';

const createBodyOperation = () =>
  createBodyMeasurementQueueOperation({
    action: 'create',
    measurement: {
      id: 'waist-local-id',
      label: 'Waist',
      value: '80 cm',
      metric: 'waist',
      numericValue: 80,
      unit: 'cm',
      createdAt: now,
    },
    userId,
    deviceId,
    baseRevision: 0,
    now,
  });

const createProgramOperation = () =>
  createTrainingProgramQueueOperation({
    action: 'create',
    program: {
      id: 'program-local-id',
      name: 'Test program',
      goal: 'maintenance',
      difficulty: 'beginner',
      durationWeeks: 1,
      days: [{ id: 'rest-day', weekday: 'monday', restDay: true }],
      createdAt: now,
      isCustom: true,
    },
    userId,
    deviceId,
    baseRevision: 0,
    now,
  });

describe('strict sync payload compatibility', () => {
  it('keeps body measurement device identity in metadata only', () => {
    const operation = createBodyOperation();
    expect(operation).not.toBeNull();
    expect(operation?.metadata?.deviceId).toBe(deviceId);
    expect(operation?.payload).not.toHaveProperty('deviceId');
  });

  it('repairs persisted body measurement payloads and aliases', () => {
    const operation = createBodyOperation();
    expect(operation).not.toBeNull();
    const legacyKey = `queue:body_measurements:${operation!.entityId}:create:legacy`;
    const normalized = normalizeOfflineSyncQueueOperation({
      ...operation,
      entityType: 'body_measurements',
      idempotencyKey: legacyKey,
      metadata: { ...operation!.metadata, requestId: legacyKey },
      payload: { ...operation!.payload, deviceId },
    });

    expect(normalized?.payload).not.toHaveProperty('deviceId');
    expect(normalized?.idempotencyKey).not.toBe(legacyKey);
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
  });

  it('keeps training program device identity in metadata only', () => {
    const operation = createProgramOperation();
    expect(operation.metadata?.deviceId).toBe(deviceId);
    expect(operation.payload).not.toHaveProperty('deviceId');
  });

  it('repairs persisted training program payloads and aliases', () => {
    const operation = createProgramOperation();
    const legacyKey = `queue:training_programs:${operation.entityId}:create:legacy`;
    const normalized = normalizeOfflineSyncQueueOperation({
      ...operation,
      entityType: 'training_programs',
      idempotencyKey: legacyKey,
      metadata: { ...operation.metadata, requestId: legacyKey },
      payload: { ...operation.payload, deviceId },
    });

    expect(normalized?.payload).not.toHaveProperty('deviceId');
    expect(normalized?.idempotencyKey).not.toBe(legacyKey);
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
  });
});

describe('sync failure status classification', () => {
  it('uses offline only for transport and service availability errors', () => {
    expect(resolveSyncFailureStatus(new ApiError({ code: 'network_error', message: 'Network request failed' }))).toBe('offline');
    expect(resolveSyncFailureStatus(new ApiError({ code: 'timeout', message: 'Request timed out' }))).toBe('offline');
    expect(resolveSyncFailureStatus(new ApiError({ code: 'unavailable', message: 'Unavailable', status: 503 }))).toBe('offline');
  });

  it('reports validation failures as errors instead of no network', () => {
    expect(resolveSyncFailureStatus(new ApiError({ code: 'validation_error', message: 'Invalid request payload', status: 400 }))).toBe('error');
    expect(resolveSyncFailureStatus(new Error('Sync failed'))).toBe('error');
  });

  it('keeps authentication failures local-only', () => {
    expect(resolveSyncFailureStatus(new ApiError({ code: 'unauthorized', message: 'Unauthorized', status: 401 }))).toBe('local-only');
  });
});
""")
