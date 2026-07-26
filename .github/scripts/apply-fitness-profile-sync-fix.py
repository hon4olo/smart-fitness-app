from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    content = file_path.read_text()
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:80]!r}")
    file_path.write_text(content.replace(old, new, 1))


replace_once(
    "src/cloud/FitnessProfileSync.ts",
    """  const payload = input.action === 'delete'\n    ? { id: entityId, deletedAt: now, deviceId: input.deviceId }\n    : {\n""",
    """  const payload = input.action === 'delete'\n    ? { id: entityId, deletedAt: now }\n    : {\n""",
)
replace_once(
    "src/cloud/FitnessProfileSync.ts",
    """        createdAt: input.previous?.syncedAt ?? now,\n        updatedAt: now,\n        deviceId: input.deviceId,\n      };\n""",
    """        createdAt: input.previous?.syncedAt ?? now,\n        updatedAt: now,\n      };\n""",
)

replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    """const isWeightHistoryEntity = (value: string): boolean =>\n  value === 'weightHistory' || value === 'weight_history';\n\nconst stableStringify""",
    """const isWeightHistoryEntity = (value: string): boolean =>\n  value === 'weightHistory' || value === 'weight_history';\nconst isFitnessProfileEntity = (value: string): boolean =>\n  value === 'fitnessProfiles' || value === 'fitness_profiles';\n\nconst stableStringify""",
)
replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    """const normalizePayload = (\n  value: unknown,\n): Record<string, unknown> | undefined => (isRecord(value) ? value : undefined);\n\nconst normalizeRevision""",
    """const normalizePayload = (\n  value: unknown,\n): Record<string, unknown> | undefined => (isRecord(value) ? value : undefined);\n\nconst normalizePayloadForServer = (\n  entityType: string,\n  payload: Record<string, unknown> | undefined,\n): { payload: Record<string, unknown> | undefined; changed: boolean } => {\n  if (\n    !payload ||\n    !isFitnessProfileEntity(entityType) ||\n    !Object.prototype.hasOwnProperty.call(payload, 'deviceId')\n  ) {\n    return { payload, changed: false };\n  }\n\n  const compatiblePayload = { ...payload };\n  delete compatiblePayload.deviceId;\n  return { payload: compatiblePayload, changed: true };\n};\n\nconst normalizeRevision""",
)
replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    """  const payload =\n    rawPayload && isWeightHistoryEntity(entityType)\n      ? {\n          ...rawPayload,\n          id: ensureUuid(rawPayload.id ?? rawEntityId),\n        }\n      : rawPayload;\n  const baseRevision""",
    """  const normalizedPayload =\n    rawPayload && isWeightHistoryEntity(entityType)\n      ? {\n          ...rawPayload,\n          id: ensureUuid(rawPayload.id ?? rawEntityId),\n        }\n      : rawPayload;\n  const payloadCompatibility = normalizePayloadForServer(entityType, normalizedPayload);\n  const payload = payloadCompatibility.payload;\n  const baseRevision""",
)
replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    """  const idempotencyKey = isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)\n    ? operation.idempotencyKey\n    : createOfflineSyncQueueIdempotencyKey({\n""",
    """  const idempotencyKey =\n    !payloadCompatibility.changed &&\n    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)\n      ? operation.idempotencyKey\n      : createOfflineSyncQueueIdempotencyKey({\n""",
)
replace_once(
    "src/cloud/CloudQueueHelpers.ts",
    """        baseRevision,\n        payload,\n      });\n  const rawMetadata""",
    """          baseRevision,\n          payload,\n        });\n  const rawMetadata""",
)

replace_once(
    "src/context/SyncContext.tsx",
    """      const result = await syncCoordinator.syncNow();\n      const pushResult = result.push?.result;\n""",
    """      const result = await syncCoordinator.syncNow();\n      if (result.status.phase === 'Failed') {\n        const cause = result.error?.cause;\n        throw cause instanceof Error\n          ? cause\n          : new Error(result.error?.message ?? 'Sync failed');\n      }\n      const pushResult = result.push?.result;\n""",
)
replace_once(
    "src/context/SyncContext.tsx",
    """      setPendingOperations(countSupportedQueueOperations(afterPending));\n      setLastSyncAt(pushResult?.serverTimestamp ?? pullResult?.serverTimestamp ?? new Date().toISOString());\n      setStatus(resolveStatus(result.status.phase, nextConflictCount > 0, true));\n""",
    """      setPendingOperations(countSupportedQueueOperations(afterPending));\n      const successfulSyncAt = pushResult?.serverTimestamp ?? pullResult?.serverTimestamp;\n      if (successfulSyncAt) setLastSyncAt(successfulSyncAt);\n      setStatus(resolveStatus(result.status.phase, nextConflictCount > 0, true));\n""",
)

Path("test/fitness-profile-sync-payload.test.ts").write_text(
    """import { describe, expect, it } from 'vitest';\n\nimport { createFitnessProfileQueueOperation } from '@/cloud/FitnessProfileSync';\nimport { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';\nimport { defaultState } from '@/data/defaults';\n\nconst userId = '11111111-1111-4111-8111-111111111111';\nconst deviceId = '22222222-2222-4222-8222-222222222222';\nconst now = '2026-07-26T18:00:00.000Z';\n\nconst createProfileOperation = () =>\n  createFitnessProfileQueueOperation({\n    action: 'create',\n    profile: {\n      ...defaultState.profile,\n      activityLevel: 'moderate',\n      dateOfBirth: '2008-01-01',\n      goalType: 'gain_muscle',\n      targetWeight: 82.7,\n      trainingDaysPerWeek: 3,\n    },\n    userId,\n    deviceId,\n    baseRevision: 0,\n    now,\n  });\n\ndescribe('fitness profile sync payload compatibility', () => {\n  it('keeps device identity in queue metadata, not the strict entity payload', () => {\n    const operation = createProfileOperation();\n\n    expect(operation.metadata?.deviceId).toBe(deviceId);\n    expect(operation.payload).not.toHaveProperty('deviceId');\n  });\n\n  it('repairs a persisted legacy profile operation before retrying it', () => {\n    const operation = createProfileOperation();\n    const legacyIdempotencyKey =\n      `queue:fitnessProfiles:${operation.entityId}:create:legacy`;\n    const normalized = normalizeOfflineSyncQueueOperation({\n      ...operation,\n      idempotencyKey: legacyIdempotencyKey,\n      metadata: { ...operation.metadata, requestId: legacyIdempotencyKey },\n      payload: { ...operation.payload, deviceId },\n    });\n\n    expect(normalized).not.toBeNull();\n    expect(normalized?.payload).not.toHaveProperty('deviceId');\n    expect(normalized?.idempotencyKey).not.toBe(legacyIdempotencyKey);\n    expect(normalized?.metadata?.requestId).toBe(normalized?.idempotencyKey);\n  });\n\n  it('does not strip deviceId from unrelated persisted entity payloads', () => {\n    const legacyIdempotencyKey =\n      'queue:nutritionTargets:33333333-3333-4333-8333-333333333333:create:legacy';\n    const normalized = normalizeOfflineSyncQueueOperation({\n      opId: 'nutrition-target-test',\n      entityType: 'nutritionTargets',\n      entityId: '33333333-3333-4333-8333-333333333333',\n      action: 'create',\n      payload: { schemaVersion: 1, deviceId },\n      clientTimestamp: now,\n      idempotencyKey: legacyIdempotencyKey,\n      retryCount: 0,\n      status: 'pending',\n    });\n\n    expect(normalized?.payload?.deviceId).toBe(deviceId);\n    expect(normalized?.idempotencyKey).toBe(legacyIdempotencyKey);\n  });\n});\n"""
)

learnings_path = Path("PROJECT_LEARNINGS.md")
learnings = learnings_path.read_text()
lesson = (
    "- Keep authenticated user/device identity in the sync request envelope or operation metadata, "
    "not inside strict entity payloads. When an outbound payload contract changes, normalize persisted "
    "queue entries and regenerate their idempotency keys before retrying.\n"
)
anchor = "- Critical mutations use the ordered application mutation queue and expose persistence or outbox failures with retry controls.\n"
if lesson not in learnings:
    if anchor not in learnings:
        raise RuntimeError("PROJECT_LEARNINGS sync anchor not found")
    learnings = learnings.replace(anchor, anchor + lesson, 1)
    learnings_path.write_text(learnings)
