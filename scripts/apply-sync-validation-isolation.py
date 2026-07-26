from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/cloud/CloudProvider.ts',
    "import type { ConflictRecord, SyncBatch, SyncOperation, SyncRevision, SyncSnapshot, SyncState } from './CloudSyncTypes';\n\nexport type CloudPushResult = SyncState & {\n",
    "import type { ConflictRecord, SyncBatch, SyncOperation, SyncRevision, SyncSnapshot, SyncState } from './CloudSyncTypes';\n\nexport type RejectedSyncOperation = {\n  operationId: string;\n  entityType: string;\n  entityId?: string;\n  status?: number;\n  code?: string;\n  message: string;\n  requestId?: string;\n  details?: unknown;\n};\n\nexport type CloudPushResult = SyncState & {\n",
)
replace_once(
    'src/cloud/CloudProvider.ts',
    "  duplicateIdempotencyKeys?: string[];\n};\n",
    "  duplicateIdempotencyKeys?: string[];\n  rejectedOperations?: RejectedSyncOperation[];\n};\n",
)

replace_once(
    'src/cloud/SyncCoordinatorOperations.ts',
    "import type { CloudPullResult, CloudPushResult } from './CloudProvider';\n",
    "import type {\n  CloudProvider,\n  CloudPullResult,\n  CloudPushResult,\n  RejectedSyncOperation,\n} from './CloudProvider';\n",
)
replace_once(
    'src/cloud/SyncCoordinatorOperations.ts',
    "export const simulatePush = async (\n  dependencies: Pick<SyncCoordinatorDependencies, 'provider'>,\n  batch: SyncBatch,\n): Promise<SyncPushSimulation> => {\n  if (batch.operations.length === 0) {\n    return { phase: 'Uploading', attempted: false };\n  }\n  const state = await dependencies.provider.pushOperations(batch);\n  return {\n    phase: 'Uploading',\n    attempted: true,\n    state,\n    result: state as CloudPushResult,\n  };\n};\n",
    "type PushFailureDetails = {\n  code?: string;\n  details?: unknown;\n  message: string;\n  requestId?: string;\n  status?: number;\n};\n\nconst readOptionalString = (value: unknown): string | undefined =>\n  typeof value === 'string' && value.trim() ? value.trim() : undefined;\n\nconst readPushFailure = (error: unknown): PushFailureDetails => {\n  const record = isSyncCoordinatorRecord(error) ? error : undefined;\n  const body = record?.body;\n  const bodyRecord = isSyncCoordinatorRecord(body) ? body : undefined;\n  const bodyMessage = bodyRecord\n    ? [bodyRecord.message, bodyRecord.error, bodyRecord.detail, bodyRecord.reason]\n        .map(readOptionalString)\n        .find((value): value is string => Boolean(value))\n    : readOptionalString(body);\n  const message =\n    bodyMessage ??\n    readOptionalString(record?.message) ??\n    (error instanceof Error ? error.message : 'Sync operation rejected');\n  const details =\n    bodyRecord?.details ??\n    bodyRecord?.issues ??\n    bodyRecord?.errors ??\n    (bodyRecord && Object.keys(bodyRecord).length > 1 ? bodyRecord : undefined);\n\n  return {\n    message,\n    ...(typeof record?.status === 'number' && Number.isFinite(record.status)\n      ? { status: Math.floor(record.status) }\n      : {}),\n    ...(readOptionalString(record?.code) ? { code: readOptionalString(record?.code) } : {}),\n    ...(readOptionalString(record?.requestId)\n      ? { requestId: readOptionalString(record?.requestId) }\n      : {}),\n    ...(details === undefined ? {} : { details }),\n  };\n};\n\nconst isIsolatablePushFailure = (error: unknown): boolean => {\n  const failure = readPushFailure(error);\n  return (\n    failure.status === 400 ||\n    failure.status === 422 ||\n    failure.code === 'validation_error'\n  );\n};\n\nconst toRejectedSyncOperation = (\n  operation: SyncBatch['operations'][number],\n  error: unknown,\n): RejectedSyncOperation => {\n  const failure = readPushFailure(error);\n  return {\n    operationId: operation.id,\n    entityType: operation.entity,\n    ...(operation.entityId ? { entityId: operation.entityId } : {}),\n    ...failure,\n  };\n};\n\nconst latestTimestamp = (values: Array<string | undefined>): string | undefined => {\n  const timestamps = values.filter(\n    (value): value is string => typeof value === 'string' && Boolean(value),\n  );\n  timestamps.sort();\n  return timestamps[timestamps.length - 1];\n};\n\nconst mergePushResults = (results: CloudPushResult[]): CloudPushResult => {\n  const appliedOperations = [\n    ...new Map(\n      results\n        .flatMap((result) => result.appliedOperations ?? [])\n        .map((operation) => [operation.id, operation] as const),\n    ).values(),\n  ];\n  const conflicts = [\n    ...new Map(\n      results\n        .flatMap((result) => result.conflicts ?? [])\n        .map((conflict) => [conflict.conflictId, conflict] as const),\n    ).values(),\n  ];\n  const rejectedOperations = [\n    ...new Map(\n      results\n        .flatMap((result) => result.rejectedOperations ?? [])\n        .map((operation) => [operation.operationId, operation] as const),\n    ).values(),\n  ];\n  const duplicateIdempotencyKeys = [\n    ...new Set(results.flatMap((result) => result.duplicateIdempotencyKeys ?? [])),\n  ];\n  const revisions = results\n    .map((result) => result.revision)\n    .filter((revision): revision is number =>\n      typeof revision === 'number' && Number.isFinite(revision),\n    );\n  const revision = revisions.length ? Math.max(...revisions) : undefined;\n  const serverTimestamp = latestTimestamp(results.map((result) => result.serverTimestamp));\n  const lastSyncedAt = latestTimestamp(\n    results.map((result) => result.lastSyncedAt ?? result.serverTimestamp),\n  );\n  const reportedPending = results.reduce(\n    (maximum, result) => Math.max(maximum, result.pendingOperations),\n    0,\n  );\n  const reportedConflicts = results.reduce(\n    (maximum, result) => Math.max(maximum, result.conflictCount),\n    0,\n  );\n  const fallbackStatus = results.find((result) => result.status !== 'idle')?.status ?? 'idle';\n\n  return {\n    status: rejectedOperations.length\n      ? 'error'\n      : conflicts.length\n        ? 'conflict'\n        : fallbackStatus,\n    pendingOperations: Math.max(rejectedOperations.length, reportedPending),\n    conflictCount: Math.max(conflicts.length, reportedConflicts),\n    ...(revision === undefined ? {} : { revision }),\n    ...(serverTimestamp ? { serverTimestamp } : {}),\n    ...(lastSyncedAt ? { lastSyncedAt } : {}),\n    ...(appliedOperations.length ? { appliedOperations } : {}),\n    ...(conflicts.length ? { conflicts } : {}),\n    ...(duplicateIdempotencyKeys.length ? { duplicateIdempotencyKeys } : {}),\n    ...(rejectedOperations.length ? { rejectedOperations } : {}),\n  };\n};\n\nconst pushBatchWithValidationIsolation = async (\n  provider: CloudProvider,\n  batch: SyncBatch,\n): Promise<CloudPushResult> => {\n  try {\n    return await provider.pushOperations(batch);\n  } catch (error) {\n    if (!isIsolatablePushFailure(error)) throw error;\n\n    if (batch.operations.length === 1) {\n      return {\n        status: 'error',\n        pendingOperations: 1,\n        conflictCount: 0,\n        rejectedOperations: [toRejectedSyncOperation(batch.operations[0], error)],\n      };\n    }\n\n    const midpoint = Math.ceil(batch.operations.length / 2);\n    const partitions = [\n      batch.operations.slice(0, midpoint),\n      batch.operations.slice(midpoint),\n    ].filter((operations) => operations.length > 0);\n    const results: CloudPushResult[] = [];\n\n    for (const [index, operations] of partitions.entries()) {\n      results.push(\n        await pushBatchWithValidationIsolation(provider, {\n          ...batch,\n          id: `${batch.id}:validation:${index}`,\n          operations,\n        }),\n      );\n    }\n\n    return mergePushResults(results);\n  }\n};\n\nexport const simulatePush = async (\n  dependencies: Pick<SyncCoordinatorDependencies, 'provider'>,\n  batch: SyncBatch,\n): Promise<SyncPushSimulation> => {\n  if (batch.operations.length === 0) {\n    return { phase: 'Uploading', attempted: false };\n  }\n  const state = await pushBatchWithValidationIsolation(dependencies.provider, batch);\n  return {\n    phase: 'Uploading',\n    attempted: true,\n    state,\n    result: state,\n  };\n};\n",
)

replace_once(
    'src/context/syncContextModel.ts',
    "import type { CloudPushResult } from '@/cloud/CloudProvider';\n",
    "import type {\n  CloudPushResult,\n  RejectedSyncOperation,\n} from '@/cloud/CloudProvider';\n",
)
replace_once(
    'src/context/syncContextModel.ts',
    "export const collectAcknowledgedSyncOperationKeys = (\n  pushResult?: Pick<CloudPushResult, 'appliedOperations' | 'duplicateIdempotencyKeys'> | null,\n): Set<string> =>\n  new Set([\n    ...(pushResult?.appliedOperations ?? []).map((operation) => operation.id),\n    ...(pushResult?.duplicateIdempotencyKeys ?? []),\n  ].filter((key): key is string => typeof key === 'string' && Boolean(key.trim())));\n",
    "export const collectAcknowledgedSyncOperationKeys = (\n  pushResult?: Pick<CloudPushResult, 'appliedOperations' | 'duplicateIdempotencyKeys'> | null,\n): Set<string> =>\n  new Set([\n    ...(pushResult?.appliedOperations ?? []).map((operation) => operation.id),\n    ...(pushResult?.duplicateIdempotencyKeys ?? []),\n  ].filter((key): key is string => typeof key === 'string' && Boolean(key.trim())));\n\nconst formatRejectedDetails = (details: unknown): string | null => {\n  if (typeof details === 'string' && details.trim()) return details.trim().slice(0, 800);\n  if (details === undefined || details === null) return null;\n  try {\n    return JSON.stringify(details).slice(0, 800);\n  } catch {\n    return null;\n  }\n};\n\nexport const formatRejectedSyncOperationsError = (\n  operations: RejectedSyncOperation[],\n): string | null => {\n  if (!operations.length) return null;\n  const first = operations[0];\n  const countLabel = operations.length === 1\n    ? '1 sync operation rejected'\n    : `${operations.length} sync operations rejected`;\n  const identity = [first.entityType, first.entityId].filter(Boolean).join(' • ');\n  const transport = [\n    first.status === undefined ? null : `HTTP ${first.status}`,\n    first.code,\n    first.requestId ? `request ${first.requestId}` : null,\n  ].filter((value): value is string => Boolean(value));\n  const details = formatRejectedDetails(first.details);\n  const description = [\n    first.message,\n    details && details !== first.message ? details : null,\n  ].filter((value): value is string => Boolean(value));\n\n  return `${countLabel}: ${[identity, ...transport].filter(Boolean).join(' • ')} — ${description.join(' • ')}`;\n};\n",
)

replace_once(
    'src/context/SyncContext.tsx',
    "  countUnresolvedSyncConflicts,\n  resolveStatus,\n",
    "  countUnresolvedSyncConflicts,\n  formatRejectedSyncOperationsError,\n  resolveStatus,\n",
)
replace_once(
    'src/context/SyncContext.tsx',
    "      const afterPending = await queueStore.getPending();\n      setPendingOperations(countSupportedQueueOperations(afterPending));\n      const successfulSyncAt = pushResult?.serverTimestamp ?? pullResult?.serverTimestamp;\n      if (successfulSyncAt) setLastSyncAt(successfulSyncAt);\n      setStatus(resolveStatus(result.status.phase, nextConflictCount > 0, true));\n",
    "      const afterPending = await queueStore.getPending();\n      setPendingOperations(countSupportedQueueOperations(afterPending));\n      const rejectedSyncError = formatRejectedSyncOperationsError(\n        pushResult?.rejectedOperations ?? [],\n      );\n      const successfulSyncAt = pushResult?.serverTimestamp ?? pullResult?.serverTimestamp;\n      if (successfulSyncAt && !rejectedSyncError) setLastSyncAt(successfulSyncAt);\n      if (rejectedSyncError) {\n        setError(rejectedSyncError);\n        setStatus('error');\n      } else {\n        setStatus(resolveStatus(result.status.phase, nextConflictCount > 0, true));\n      }\n",
)

replace_once(
    'src/app/sync-backup.tsx',
    "  const { conflictCount, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();\n",
    "  const { conflictCount, error, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();\n",
)
replace_once(
    'src/app/sync-backup.tsx',
    "          <Text style={styles.detail}>{getSyncStatusExplanation(copy, status)}</Text>\n          <Text style={styles.detail}>\n",
    "          <Text style={styles.detail}>{getSyncStatusExplanation(copy, status)}</Text>\n          {error ? <Text selectable style={styles.errorDetail}>{error}</Text> : null}\n          <Text style={styles.detail}>\n",
)
replace_once(
    'src/app/sync-backup.tsx',
    "  detail: {\n    color: Colors.dark.textSecondary,\n    fontSize: Typography.caption.fontSize,\n    lineHeight: Typography.caption.lineHeight,\n    marginTop: Spacing.one,\n  },\n",
    "  detail: {\n    color: Colors.dark.textSecondary,\n    fontSize: Typography.caption.fontSize,\n    lineHeight: Typography.caption.lineHeight,\n    marginTop: Spacing.one,\n  },\n  errorDetail: {\n    backgroundColor: Colors.dark.errorSoft,\n    borderRadius: 12,\n    color: Colors.dark.error,\n    fontSize: Typography.caption.fontSize,\n    lineHeight: Typography.caption.lineHeight,\n    marginTop: Spacing.two,\n    padding: Spacing.two,\n  },\n",
)

replace_once(
    'PROJECT_LEARNINGS.md',
    "- Keep authenticated user/device identity in the sync request envelope or operation metadata, not inside strict entity payloads. When an outbound payload contract changes, normalize persisted queue entries and regenerate their idempotency keys before retrying.\n",
    "- Keep authenticated user/device identity in the sync request envelope or operation metadata, not inside strict entity payloads. When an outbound payload contract changes, normalize persisted queue entries and regenerate their idempotency keys before retrying.\n- A validation failure in one queued operation must not block valid siblings. Isolate HTTP 400/422 operations, acknowledge successful partitions, keep the rejected local operation, and surface its entity, status, and backend request ID.\n",
)

Path('test/sync-push-validation-isolation.test.ts').write_text("""import { describe, expect, it, vi } from 'vitest';

import type { CloudProvider, CloudPushResult } from '@/cloud/CloudProvider';
import { simulatePush } from '@/cloud/SyncCoordinatorOperations';
import type { SyncBatch, SyncOperation } from '@/cloud/CloudSyncTypes';
import { formatRejectedSyncOperationsError } from '@/context/syncContextModel';

const now = '2026-07-26T22:00:00.000Z';

const operation = (id: string, entityId: string): SyncOperation => ({
  id,
  entity: 'weightHistory',
  entityId,
  action: 'upsert',
  payload: { id: entityId, weight: 70, recordedAt: now },
  createdAt: now,
});

const batch = (operations: SyncOperation[]): SyncBatch => ({
  id: 'batch:test',
  operations,
  createdAt: now,
});

const providerWith = (pushOperations: CloudProvider['pushOperations']): CloudProvider =>
  ({ pushOperations } as unknown as CloudProvider);

const appliedResult = (currentBatch: SyncBatch): CloudPushResult => ({
  status: 'idle',
  pendingOperations: 0,
  conflictCount: 0,
  revision: currentBatch.operations.length,
  serverTimestamp: now,
  appliedOperations: currentBatch.operations,
});

describe('sync push validation isolation', () => {
  it('keeps valid siblings moving and reports only the rejected operation', async () => {
    const pushOperations = vi.fn(async (currentBatch: SyncBatch) => {
      if (currentBatch.operations.some((item) => item.id === 'bad')) {
        throw Object.assign(new Error('Validation failed'), {
          status: 400,
          code: 'validation_error',
          requestId: 'req-bad',
          body: {
            message: 'Validation failed',
            details: [
              { path: 'operations[0].entityId', message: 'Invalid UUID' },
            ],
          },
        });
      }
      return appliedResult(currentBatch);
    });
    const provider = providerWith(pushOperations);

    const result = await simulatePush(
      { provider },
      batch([
        operation('good-a', '11111111-1111-4111-8111-111111111111'),
        operation('bad', 'not-a-uuid'),
        operation('good-b', '22222222-2222-4222-8222-222222222222'),
      ]),
    );

    expect(pushOperations.mock.calls.length).toBeGreaterThan(1);
    expect(result.result?.appliedOperations?.map((item) => item.id).sort()).toEqual([
      'good-a',
      'good-b',
    ]);
    expect(result.result?.rejectedOperations).toEqual([
      expect.objectContaining({
        operationId: 'bad',
        entityType: 'weightHistory',
        entityId: 'not-a-uuid',
        status: 400,
        code: 'validation_error',
        requestId: 'req-bad',
      }),
    ]);
    expect(result.result?.pendingOperations).toBe(1);
    expect(result.result?.status).toBe('error');

    const message = formatRejectedSyncOperationsError(
      result.result?.rejectedOperations ?? [],
    );
    expect(message).toContain('weightHistory');
    expect(message).toContain('HTTP 400');
    expect(message).toContain('Invalid UUID');
    expect(message).toContain('req-bad');
  });

  it('uses one request when the original batch is valid', async () => {
    const pushOperations = vi.fn(async (currentBatch: SyncBatch) =>
      appliedResult(currentBatch),
    );
    const provider = providerWith(pushOperations);

    const result = await simulatePush(
      { provider },
      batch([
        operation('good-a', '11111111-1111-4111-8111-111111111111'),
        operation('good-b', '22222222-2222-4222-8222-222222222222'),
      ]),
    );

    expect(pushOperations).toHaveBeenCalledTimes(1);
    expect(result.result?.rejectedOperations).toBeUndefined();
    expect(result.result?.appliedOperations).toHaveLength(2);
  });

  it('does not split transient server failures', async () => {
    const pushOperations = vi.fn(async () => {
      throw Object.assign(new Error('Service unavailable'), {
        status: 503,
        code: 'unavailable',
      });
    });
    const provider = providerWith(pushOperations);

    await expect(
      simulatePush(
        { provider },
        batch([operation('good-a', '11111111-1111-4111-8111-111111111111')]),
      ),
    ).rejects.toThrow('Service unavailable');
    expect(pushOperations).toHaveBeenCalledTimes(1);
  });
});
""")

print('Applied sync validation isolation fix')
