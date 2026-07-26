from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


# Preserve local semantic IDs; UUID conversion belongs only at the sync boundary.
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "  const syncedRevision =\n    typeof item.syncedRevision === 'number' && Number.isFinite(item.syncedRevision)\n      ? Math.min(revision, Math.max(0, Math.floor(item.syncedRevision)))\n      : 0;\n  const libraryId = getNutritionLibrarySyncEntityId(item.libraryId);\n\n  return {\n    ...(item as NutritionLibraryFood),\n    libraryId,\n",
    "  const syncedRevision =\n    typeof item.syncedRevision === 'number' && Number.isFinite(item.syncedRevision)\n      ? Math.min(revision, Math.max(0, Math.floor(item.syncedRevision)))\n      : 0;\n\n  return {\n    ...(item as NutritionLibraryFood),\n",
)
replace_once(
    'src/features/nutrition/nutritionFoodLibrary.ts',
    "export const getNutritionLibraryId = (draft: DraftItem): string => {\n  const sourceId = draft.externalId\n    ? `${draft.source}:${draft.externalId}`\n    : `custom:${draft.name.trim().toLowerCase()}:${draft.brandName?.trim().toLowerCase() ?? ''}`;\n  return getNutritionLibrarySyncEntityId(sourceId);\n};\n",
    "export const getNutritionLibraryId = (draft: DraftItem): string =>\n  draft.externalId\n    ? `${draft.source}:${draft.externalId}`\n    : `custom:${draft.name.trim().toLowerCase()}:${draft.brandName?.trim().toLowerCase() ?? ''}`;\n",
)

# Only nutrition-library identity migration should force a new idempotency key.
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "  const entityIdChanged = entityId !== rawEntityId;\n",
    "  const entityIdChanged =\n    isNutritionLibraryEntity(entityType) && entityId !== rawEntityId;\n",
)
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    "  const metadata = {\n    ...rawMetadata,\n    ...(isWeightHistoryEntity(entityType) ? { entityName: 'weightHistory' } : {}),\n    requestId: idempotencyKey,\n  };\n",
    "  const metadata = {\n    ...rawMetadata,\n    ...(isWeightHistoryEntity(entityType) ? { entityName: 'weightHistory' } : {}),\n    ...(isNutritionLibraryEntity(entityType)\n      ? { clientId: isString(rawMetadata?.clientId) ? rawMetadata.clientId.trim() : rawEntityId }\n      : {}),\n    requestId: idempotencyKey,\n  };\n",
)

# Convert semantic IDs only in the outbound envelope and map them back on ack/pull.
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  getNutritionFoodLibraryStorageKey,\n  parseNutritionFoodLibrary,\n  serializeNutritionFoodLibrary,\n  type NutritionLibraryFood,\n",
    "  getNutritionFoodLibraryStorageKey,\n  getNutritionLibraryId,\n  getNutritionLibrarySyncEntityId,\n  parseNutritionFoodLibrary,\n  serializeNutritionFoodLibrary,\n  type NutritionLibraryFood,\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "const toPayload = (item: NutritionLibraryFood): Record<string, unknown> => ({\n  schemaVersion: 1,\n  libraryId: item.libraryId,\n",
    "const toPayload = (\n  item: NutritionLibraryFood,\n  syncEntityId: string,\n): Record<string, unknown> => ({\n  schemaVersion: 1,\n  libraryId: syncEntityId,\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  const syncedRevision = getSyncedRevision(input.item);\n  const action = input.item.deletedAt ? 'delete' : syncedRevision === 0 ? 'create' : 'update';\n",
    "  const syncedRevision = getSyncedRevision(input.item);\n  const syncEntityId = getNutritionLibrarySyncEntityId(input.item.libraryId);\n  const action = input.item.deletedAt ? 'delete' : syncedRevision === 0 ? 'create' : 'update';\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  const payload = action === 'delete'\n    ? { libraryId: input.item.libraryId, deletedAt: input.item.deletedAt }\n    : toPayload(input.item);\n",
    "  const payload = action === 'delete'\n    ? { libraryId: syncEntityId, deletedAt: input.item.deletedAt }\n    : toPayload(input.item, syncEntityId);\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "    entityId: input.item.libraryId,\n",
    "    entityId: syncEntityId,\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "    opId: `nutritionLibraryItems:${input.item.libraryId}`,\n    entityType: 'nutritionLibraryItems',\n    entityId: input.item.libraryId,\n",
    "    opId: `nutritionLibraryItems:${syncEntityId}`,\n    entityType: 'nutritionLibraryItems',\n    entityId: syncEntityId,\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "      entityName: 'nutritionLibraryItems',\n      deviceId: input.deviceId,\n",
    "      entityName: 'nutritionLibraryItems',\n      clientId: input.item.libraryId,\n      deviceId: input.deviceId,\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  const pendingIds = new Set(\n    input.pendingOperations\n      .filter(isNutritionLibraryQueueOperation)\n      .map((operation) => operation.entityId),\n  );\n",
    "  const pendingIds = new Set(\n    input.pendingOperations\n      .filter(isNutritionLibraryQueueOperation)\n      .map((operation) => operation.metadata?.clientId ?? operation.entityId),\n  );\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  const libraryId = typeof payload.libraryId === 'string' ? payload.libraryId : entity.entityId;\n  if (!libraryId || typeof payload.name !== 'string') return null;\n",
    "  if (typeof payload.name !== 'string') return null;\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  const revision = Math.max(0, Math.floor(entity.revision ?? Number(payload.revision) ?? 0));\n  return {\n    libraryId,\n",
    "  const revision = Math.max(0, Math.floor(entity.revision ?? Number(payload.revision) ?? 0));\n  const libraryId = getNutritionLibraryId({\n    name: payload.name,\n    ...(typeof payload.brandName === 'string' ? { brandName: payload.brandName } : {}),\n    calories: payload.calories as number,\n    protein: payload.protein as number,\n    carbs: payload.carbs as number,\n    fats: payload.fats as number,\n    servingSize: payload.servingSize as number,\n    servingUnit: payload.servingUnit,\n    quantity: payload.quantity,\n    source: payload.source,\n    ...(typeof payload.externalId === 'string' ? { externalId: payload.externalId } : {}),\n    ...(isRecord(payload.attribution)\n      ? { attribution: payload.attribution as NutritionLibraryFood['attribution'] }\n      : {}),\n  });\n  return {\n    libraryId,\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "    const revision = revisions.get(item.libraryId);\n",
    "    const revision =\n      revisions.get(item.libraryId) ??\n      revisions.get(getNutritionLibrarySyncEntityId(item.libraryId));\n",
)
replace_once(
    'src/cloud/NutritionLibrarySync.ts',
    "  for (const entity of deletedEntities.filter((item) => isNutritionLibraryEntity(item.entityType))) {\n    const libraryId = entity.entityId?.trim();\n    if (!libraryId) continue;\n    const previous = records.get(libraryId);\n",
    "  for (const entity of deletedEntities.filter((item) => isNutritionLibraryEntity(item.entityType))) {\n    const remoteEntityId = entity.entityId?.trim();\n    if (!remoteEntityId) continue;\n    const libraryId = records.has(remoteEntityId)\n      ? remoteEntityId\n      : [...records.keys()].find(\n          (candidate) => getNutritionLibrarySyncEntityId(candidate) === remoteEntityId,\n        );\n    if (!libraryId) continue;\n    const previous = records.get(libraryId);\n",
)

# Update focused tests to assert local semantic identity + server UUID identity.
path = Path('test/nutrition-library-sync-identity.test.ts')
text = path.read_text()
text = text.replace(
    "    expect(id).toBe(getNutritionLibrarySyncEntityId(legacyLibraryId));\n",
    "    expect(id).toBe(legacyLibraryId);\n    expect(isUuid(getNutritionLibrarySyncEntityId(id))).toBe(true);\n",
)
text = text.replace(
    "    expect(item?.libraryId).toBe(getNutritionLibrarySyncEntityId(legacyLibraryId));\n",
    "    expect(item?.libraryId).toBe(legacyLibraryId);\n",
)
path.write_text(text)

path = Path('test/nutrition-library-sync-alias.test.ts')
text = path.read_text()
text = text.replace(
    "    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);\n",
    "    expect(normalized?.metadata?.clientId).toBe(legacyLibraryId);\n    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);\n",
)
path.write_text(text)

print('Applied refined nutrition library sync identity repair')
