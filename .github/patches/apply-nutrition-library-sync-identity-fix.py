from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


# Stable UUID identity for local saved-food records, including persisted legacy IDs.
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "import type { DraftItem } from './addFoodModel';\n",
    "import { createDeterministicUuid, isUuid } from '@/lib/ids';\n\nimport type { DraftItem } from './addFoodModel';\n",
)
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "const STORAGE_PREFIX = 'smart-fitness:nutrition-food-library:v1';\n",
    "const STORAGE_PREFIX = 'smart-fitness:nutrition-food-library:v1';\nconst SYNC_ENTITY_NAMESPACE = 'nutritionLibraryItems';\n\nexport const getNutritionLibrarySyncEntityId = (libraryId: string): string => {\n  const normalized = libraryId.trim();\n  return isUuid(normalized)\n    ? normalized.toLowerCase()\n    : createDeterministicUuid(`${SYNC_ENTITY_NAMESPACE}:${normalized}`);\n};\n",
)
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "    typeof item.libraryId !== 'string' ||\n",
    "    typeof item.libraryId !== 'string' ||\n    !item.libraryId.trim() ||\n",
)
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "  const syncedRevision =\n    typeof item.syncedRevision === 'number' && Number.isFinite(item.syncedRevision)\n      ? Math.min(revision, Math.max(0, Math.floor(item.syncedRevision)))\n      : 0;\n\n  return {\n    ...(item as NutritionLibraryFood),\n",
    "  const syncedRevision =\n    typeof item.syncedRevision === 'number' && Number.isFinite(item.syncedRevision)\n      ? Math.min(revision, Math.max(0, Math.floor(item.syncedRevision)))\n      : 0;\n  const libraryId = getNutritionLibrarySyncEntityId(item.libraryId);\n\n  return {\n    ...(item as NutritionLibraryFood),\n    libraryId,\n",
)
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "export const getNutritionLibraryId = (draft: DraftItem): string =>\n  draft.externalId\n    ? `${draft.source}:${draft.externalId}`\n    : `custom:${draft.name.trim().toLowerCase()}:${draft.brandName?.trim().toLowerCase() ?? ''}`;\n",
    "export const getNutritionLibraryId = (draft: DraftItem): string => {\n  const sourceId = draft.externalId\n    ? `${draft.source}:${draft.externalId}`\n    : `custom:${draft.name.trim().toLowerCase()}:${draft.brandName?.trim().toLowerCase() ?? ''}`;\n  return getNutritionLibrarySyncEntityId(sourceId);\n};\n",
)

# Repair already persisted queue entries before building the production envelope.
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "import { ensureUuid } from '@/lib/ids';\n",
    "import { getNutritionLibrarySyncEntityId } from '@/features/nutrition/nutritionFoodLibrary';\nimport { ensureUuid } from '@/lib/ids';\n",
)
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "const isWeightHistoryEntity = (value: string): boolean =>\n  value === 'weightHistory' || value === 'weight_history';\n",
    "const isWeightHistoryEntity = (value: string): boolean =>\n  value === 'weightHistory' || value === 'weight_history';\nconst isNutritionLibraryEntity = (value: string): boolean =>\n  value === 'nutritionLibraryItems' || value === 'nutrition_library_items';\n",
)
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "const normalizePayloadForServer = (\n  entityType: string,\n  payload: Record<string, unknown> | undefined,\n): { payload: Record<string, unknown> | undefined; changed: boolean } => {\n  if (\n    !payload ||\n    !isServerStrictIdentityPayloadEntity(entityType) ||\n    !Object.prototype.hasOwnProperty.call(payload, 'deviceId')\n  ) {\n    return { payload, changed: false };\n  }\n\n  const compatiblePayload = { ...payload };\n  delete compatiblePayload.deviceId;\n  return { payload: compatiblePayload, changed: true };\n};\n",
    "const normalizePayloadForServer = (\n  entityType: string,\n  entityId: string,\n  payload: Record<string, unknown> | undefined,\n): { payload: Record<string, unknown> | undefined; changed: boolean } => {\n  if (!payload) return { payload, changed: false };\n\n  let compatiblePayload = payload;\n  let changed = false;\n  if (\n    isServerStrictIdentityPayloadEntity(entityType) &&\n    Object.prototype.hasOwnProperty.call(compatiblePayload, 'deviceId')\n  ) {\n    compatiblePayload = { ...compatiblePayload };\n    delete compatiblePayload.deviceId;\n    changed = true;\n  }\n  if (\n    isNutritionLibraryEntity(entityType) &&\n    compatiblePayload.libraryId !== entityId\n  ) {\n    compatiblePayload = { ...compatiblePayload, libraryId: entityId };\n    changed = true;\n  }\n  return { payload: compatiblePayload, changed };\n};\n",
)
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "  const entityId = isWeightHistoryEntity(entityType)\n    ? ensureUuid(rawEntityId)\n    : rawEntityId;\n",
    "  const entityId = isWeightHistoryEntity(entityType)\n    ? ensureUuid(rawEntityId)\n    : isNutritionLibraryEntity(entityType)\n      ? getNutritionLibrarySyncEntityId(rawEntityId)\n      : rawEntityId;\n  const entityIdChanged = entityId !== rawEntityId;\n",
)
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "  const payloadCompatibility = normalizePayloadForServer(entityType, normalizedPayload);\n",
    "  const payloadCompatibility = normalizePayloadForServer(\n    entityType,\n    entityId,\n    normalizedPayload,\n  );\n",
)
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "  const idempotencyKey =\n    !payloadCompatibility.changed &&\n    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)\n",
    "  const idempotencyKey =\n    !entityIdChanged &&\n    !payloadCompatibility.changed &&\n    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)\n",
)

# Acknowledge both newly applied and previously applied duplicate deliveries.
replace_once(
    'src/context/syncContextModel.ts',
    "import { isApiError } from '@/api/client';\n",
    "import { isApiError } from '@/api/client';\nimport type { CloudPushResult } from '@/cloud/CloudProvider';\n",
)
replace_once(
    'src/context/syncContextModel.ts',
    "export const resolveSyncFailureStatus = (error: unknown): WeightSyncStatus => {\n",
    "export const collectAcknowledgedSyncOperationKeys = (\n  pushResult?: Pick<CloudPushResult, 'appliedOperations' | 'duplicateIdempotencyKeys'> | null,\n): Set<string> =>\n  new Set([\n    ...(pushResult?.appliedOperations ?? []).map((operation) => operation.id),\n    ...(pushResult?.duplicateIdempotencyKeys ?? []),\n  ].filter((key): key is string => typeof key === 'string' && Boolean(key.trim())));\n\nexport const resolveSyncFailureStatus = (error: unknown): WeightSyncStatus => {\n",
)
replace_once(
    'src/context/SyncContext.tsx',
    "  countSupportedQueueOperations,\n  countUnresolvedSyncConflicts,\n",
    "  collectAcknowledgedSyncOperationKeys,\n  countSupportedQueueOperations,\n  countUnresolvedSyncConflicts,\n",
)
replace_once(
    'src/context/SyncContext.tsx',
    "      if (pushResult?.appliedOperations?.length) {\n        const appliedKeys = new Set(pushResult.appliedOperations.map((operation) => operation.id));\n        const queuedOperations = (await queueStore.loadOperations()) as Array<{\n          opId: string;\n          idempotencyKey: string;\n        }>;\n        for (const operation of queuedOperations) {\n          if (appliedKeys.has(operation.idempotencyKey)) await queueStore.acknowledge(operation.opId);\n        }\n        await queueStore.removeAcknowledged();\n      }\n",
    "      const acknowledgedKeys = collectAcknowledgedSyncOperationKeys(pushResult);\n      if (acknowledgedKeys.size > 0) {\n        const queuedOperations = (await queueStore.loadOperations()) as Array<{\n          opId: string;\n          idempotencyKey: string;\n        }>;\n        for (const operation of queuedOperations) {\n          if (acknowledgedKeys.has(operation.idempotencyKey)) {\n            await queueStore.acknowledge(operation.opId);\n          }\n        }\n        await queueStore.removeAcknowledged();\n      }\n",
)

Path('test/nutrition-library-sync-identity.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';
import { createNutritionLibraryQueueOperation } from '@/cloud/NutritionLibrarySync';
import {
  getNutritionLibraryId,
  getNutritionLibrarySyncEntityId,
  parseNutritionFoodLibrary,
  type NutritionLibraryFood,
} from '@/features/nutrition/nutritionFoodLibrary';
import { isUuid } from '@/lib/ids';

const now = '2026-07-26T20:00:00.000Z';
const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const legacyLibraryId = 'custom:chicken breast:store';

const legacyItem: NutritionLibraryFood = {
  libraryId: legacyLibraryId,
  kind: 'custom',
  name: 'Chicken Breast',
  brandName: 'Store',
  calories: 165,
  protein: 31,
  carbs: 0,
  fats: 3.6,
  servingSize: 100,
  servingUnit: 'g',
  quantity: '100 g',
  source: 'manual',
  savedAt: now,
  updatedAt: now,
  revision: 1,
  syncedRevision: 0,
  deletedAt: null,
};

describe('nutrition library sync identity', () => {
  it('creates stable UUID IDs for new saved foods', () => {
    const id = getNutritionLibraryId(legacyItem);
    expect(isUuid(id)).toBe(true);
    expect(id).toBe(getNutritionLibrarySyncEntityId(legacyLibraryId));
  });

  it('migrates persisted semantic IDs while parsing local storage', () => {
    const [item] = parseNutritionFoodLibrary(JSON.stringify([legacyItem]));
    expect(item).toBeDefined();
    expect(item?.libraryId).toBe(getNutritionLibrarySyncEntityId(legacyLibraryId));
  });

  it('uses the migrated UUID in the operation envelope and payload', () => {
    const [item] = parseNutritionFoodLibrary(JSON.stringify([legacyItem]));
    const operation = createNutritionLibraryQueueOperation({
      item: item!,
      userId,
      deviceId,
    });
    expect(isUuid(operation.entityId)).toBe(true);
    expect(operation.payload?.libraryId).toBe(operation.entityId);
  });

  it('repairs already persisted queue operations and regenerates request identity', () => {
    const legacyKey = `queue:nutritionLibraryItems:${legacyLibraryId}:create:${now}`;
    const normalized = normalizeOfflineSyncQueueOperation({
      opId: `nutritionLibraryItems:${legacyLibraryId}`,
      entityType: 'nutritionLibraryItems',
      entityId: legacyLibraryId,
      action: 'create',
      payload: {
        schemaVersion: 1,
        libraryId: legacyLibraryId,
        kind: 'custom',
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        servingSize: 100,
        servingUnit: 'g',
        quantity: '100 g',
        source: 'manual',
        savedAt: now,
        updatedAt: now,
        revision: 1,
      },
      clientTimestamp: now,
      actorId: userId,
      baseRevision: { id: 'rev-0', number: 0, createdAt: now },
      idempotencyKey: legacyKey,
      retryCount: 0,
      status: 'pending',
      metadata: { requestId: legacyKey, userId, deviceId, source: 'local' },
    });

    expect(normalized).not.toBeNull();
    expect(isUuid(normalized?.entityId)).toBe(true);
    expect(normalized?.payload?.libraryId).toBe(normalized?.entityId);
    expect(normalized?.idempotencyKey).not.toBe(legacyKey);
    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);
  });
});
""")

Path('test/sync-acknowledged-keys.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { collectAcknowledgedSyncOperationKeys } from '@/context/syncContextModel';

describe('sync acknowledged operation keys', () => {
  it('combines applied and duplicate idempotency keys', () => {
    const keys = collectAcknowledgedSyncOperationKeys({
      appliedOperations: [{
        id: 'queue:weightHistory:one:create:now',
        entity: 'weightHistory',
        entityId: '11111111-1111-4111-8111-111111111111',
        action: 'upsert',
        createdAt: '2026-07-26T20:00:00.000Z',
      }],
      duplicateIdempotencyKeys: [
        'queue:foodEntries:two:create:now',
        'queue:weightHistory:one:create:now',
      ],
    });

    expect([...keys]).toEqual([
      'queue:weightHistory:one:create:now',
      'queue:foodEntries:two:create:now',
    ]);
  });
});
""")

print('Applied nutrition library sync identity repair')
