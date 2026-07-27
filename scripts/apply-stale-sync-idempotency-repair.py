from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


# Pending queue records can retain a syntactically valid key that no longer matches
# their current payload. Recompute the canonical key and preserve only exact matches.
replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """  const idempotencyKey =
    !entityIdChanged &&
    !payloadCompatibility.changed &&
    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey)
      ? operation.idempotencyKey
      : createOfflineSyncQueueIdempotencyKey({
        entityType,
        entityId,
        action,
        clientTimestamp,
        actorId,
          baseRevision,
          payload,
        });
""",
    """  const canonicalIdempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType,
    entityId,
    action,
    clientTimestamp,
    actorId,
    baseRevision,
    payload,
  });
  const idempotencyKey =
    !entityIdChanged &&
    !payloadCompatibility.changed &&
    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey) &&
    operation.idempotencyKey === canonicalIdempotencyKey
      ? operation.idempotencyKey
      : canonicalIdempotencyKey;
""",
)

# Read backend AppError envelopes instead of seeing every HTTP 409 as the generic
# API-client `conflict` code. The deterministic key-reuse failure is safe to isolate.
replace_once(
    'src/cloud/SyncCoordinatorOperations.ts',
    """const readPushFailure = (error: unknown): PushFailureDetails => {
  const record = isSyncCoordinatorRecord(error) ? error : undefined;
  const body = record?.body;
  const bodyRecord = isSyncCoordinatorRecord(body) ? body : undefined;
  const bodyMessage = bodyRecord
    ? [bodyRecord.message, bodyRecord.error, bodyRecord.detail, bodyRecord.reason]
        .map(readOptionalString)
        .find((value): value is string => Boolean(value))
    : readOptionalString(body);
  const message =
    bodyMessage ??
    readOptionalString(record?.message) ??
    (error instanceof Error ? error.message : 'Sync operation rejected');
  const details =
    bodyRecord?.details ??
    bodyRecord?.issues ??
    bodyRecord?.errors ??
    (bodyRecord && Object.keys(bodyRecord).length > 1 ? bodyRecord : undefined);

  return {
    message,
    ...(typeof record?.status === 'number' && Number.isFinite(record.status)
      ? { status: Math.floor(record.status) }
      : {}),
    ...(readOptionalString(record?.code) ? { code: readOptionalString(record?.code) } : {}),
    ...(readOptionalString(record?.requestId)
      ? { requestId: readOptionalString(record?.requestId) }
      : {}),
    ...(details === undefined ? {} : { details }),
  };
};

const isIsolatablePushFailure = (error: unknown): boolean => {
  const failure = readPushFailure(error);
  return (
    failure.status === 400 ||
    failure.status === 422 ||
    failure.code === 'validation_error'
  );
};
""",
    """const readPushFailure = (error: unknown): PushFailureDetails => {
  const record = isSyncCoordinatorRecord(error) ? error : undefined;
  const body = record?.body;
  const bodyRecord = isSyncCoordinatorRecord(body) ? body : undefined;
  const nestedError = isSyncCoordinatorRecord(bodyRecord?.error)
    ? bodyRecord.error
    : undefined;
  const message =
    readOptionalString(nestedError?.message) ??
    readOptionalString(bodyRecord?.message) ??
    readOptionalString(bodyRecord?.error) ??
    readOptionalString(bodyRecord?.detail) ??
    readOptionalString(bodyRecord?.reason) ??
    readOptionalString(body) ??
    readOptionalString(record?.message) ??
    (error instanceof Error ? error.message : 'Sync operation rejected');
  const details =
    nestedError?.details ??
    nestedError?.issues ??
    nestedError?.errors ??
    bodyRecord?.details ??
    bodyRecord?.issues ??
    bodyRecord?.errors;
  const code =
    readOptionalString(nestedError?.code) ??
    readOptionalString(bodyRecord?.code) ??
    readOptionalString(bodyRecord?.errorCode) ??
    readOptionalString(record?.code);
  const requestId =
    readOptionalString(nestedError?.requestId) ??
    readOptionalString(bodyRecord?.requestId) ??
    readOptionalString(record?.requestId);

  return {
    message,
    ...(typeof record?.status === 'number' && Number.isFinite(record.status)
      ? { status: Math.floor(record.status) }
      : {}),
    ...(code ? { code } : {}),
    ...(requestId ? { requestId } : {}),
    ...(details === undefined ? {} : { details }),
  };
};

const isIsolatablePushFailure = (error: unknown): boolean => {
  const failure = readPushFailure(error);
  const backendCode = failure.code?.toUpperCase();
  return (
    failure.status === 400 ||
    failure.status === 422 ||
    failure.code === 'validation_error' ||
    (failure.status === 409 && backendCode === 'SYNC_IDEMPOTENCY_KEY_REUSE')
  );
};
""",
)

# Keep the successful upload result if a later pull or conflict-resolution stage
# fails. The context can then acknowledge uploaded queue operations safely.
replace_once(
    'src/cloud/SyncCoordinatorStateMachine.ts',
    """  SyncPreviewPull,
  SyncPullSimulation,
} from './SyncCoordinatorTypes';
""",
    """  SyncPreviewPull,
  SyncPullSimulation,
  SyncPushSimulation,
} from './SyncCoordinatorTypes';
""",
)
replace_once(
    'src/cloud/SyncCoordinatorStateMachine.ts',
    """    transitions.push('Preparing');

    try {
      const preparation = await prepareSync(dependencies, now);
""",
    """    transitions.push('Preparing');

    let preparation: SyncPreparation | undefined;
    let push: SyncPushSimulation | undefined;
    let pull: SyncPullSimulation | undefined;

    try {
      preparation = await prepareSync(dependencies, now);
""",
)
replace_once(
    'src/cloud/SyncCoordinatorStateMachine.ts',
    """      const push = await simulatePush(dependencies, preparation.batch);

      updateStatus({ phase: 'Downloading' });
      transitions.push('Downloading');
      const pull = await simulatePull(dependencies, now);
""",
    """      push = await simulatePush(dependencies, preparation.batch);

      updateStatus({ phase: 'Downloading' });
      transitions.push('Downloading');
      pull = await simulatePull(dependencies, now);
""",
)
replace_once(
    'src/cloud/SyncCoordinatorStateMachine.ts',
    """      const preparation = await prepareSync(dependencies, now);
      const conflicts = emptyConflictResolution();
      const statistics = captureStatistics(preparation, conflicts);
      return buildSyncResult(
        status,
        statistics,
        preparation,
        conflicts,
        [...transitions, 'Failed'],
        undefined,
        undefined,
        error,
      );
""",
    """      const failedPreparation =
        preparation ?? (await prepareSync(dependencies, now));
      const conflicts = emptyConflictResolution();
      const statistics = captureStatistics(failedPreparation, conflicts, pull);
      return buildSyncResult(
        status,
        statistics,
        failedPreparation,
        conflicts,
        [...transitions, 'Failed'],
        push,
        pull,
        error,
      );
""",
)

# Add sanitized diagnostics for all failed stages, not only isolated validation
# records. Never serialize the raw API body or local payload.
replace_once(
    'src/context/syncContextModel.ts',
    """const formatRejectedDetails = (details: unknown): string | null => {
  if (typeof details === 'string' && details.trim()) return details.trim().slice(0, 800);
  if (details === undefined || details === null) return null;
  try {
    return JSON.stringify(details).slice(0, 800);
  } catch {
    return null;
  }
};
""",
    """const SAFE_DIAGNOSTIC_DETAIL_KEYS = new Set([
  'code',
  'entityType',
  'existingEntityId',
  'existingEntityType',
  'expected',
  'field',
  'message',
  'path',
  'reason',
  'received',
  'requestedEntityId',
  'requestedEntityType',
]);

const sanitizeDiagnosticDetails = (value: unknown, depth = 0): unknown => {
  if (depth > 3 || value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim().slice(0, 240);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => sanitizeDiagnosticDetails(item, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof value !== 'object') return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => SAFE_DIAGNOSTIC_DETAIL_KEYS.has(key))
    .map(([key, entryValue]) => [
      key,
      sanitizeDiagnosticDetails(entryValue, depth + 1),
    ] as const)
    .filter(([, entryValue]) => entryValue !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const formatRejectedDetails = (details: unknown): string | null => {
  const safeDetails = sanitizeDiagnosticDetails(details);
  if (safeDetails === undefined) return null;
  if (typeof safeDetails === 'string') return safeDetails;
  try {
    return JSON.stringify(safeDetails).slice(0, 800);
  } catch {
    return null;
  }
};
""",
)
replace_once(
    'src/context/syncContextModel.ts',
    """  return `${countLabel}: ${[identity, ...transport].filter(Boolean).join(' • ')} — ${description.join(' • ')}`;
};

export const resolveSyncFailureStatus = (error: unknown): WeightSyncStatus => {
""",
    """  return `${countLabel}: ${[identity, ...transport].filter(Boolean).join(' • ')} — ${description.join(' • ')}`;
};

const isDiagnosticRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const readDiagnosticString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const resolveSyncFailureStage = (transitions: string[]): string => {
  if (transitions.includes('Resolving')) return 'conflict resolution';
  if (transitions.includes('Downloading')) return 'download';
  if (transitions.includes('Uploading')) return 'upload';
  if (transitions.includes('Preparing')) return 'preparation';
  return 'synchronization';
};

export const formatSyncFailureDiagnostic = (
  error: unknown,
  stage: string,
): string => {
  const record = isDiagnosticRecord(error) ? error : undefined;
  const body = isApiError(error) ? error.body : record?.body;
  const bodyRecord = isDiagnosticRecord(body) ? body : undefined;
  const nestedError = isDiagnosticRecord(bodyRecord?.error)
    ? bodyRecord.error
    : undefined;
  const message =
    readDiagnosticString(nestedError?.message) ??
    readDiagnosticString(bodyRecord?.message) ??
    readDiagnosticString(bodyRecord?.error) ??
    readDiagnosticString(bodyRecord?.detail) ??
    readDiagnosticString(bodyRecord?.reason) ??
    readDiagnosticString(record?.message) ??
    (error instanceof Error ? error.message : 'Unknown synchronization error');
  const status = isApiError(error)
    ? error.status
    : typeof record?.status === 'number' && Number.isFinite(record.status)
      ? Math.floor(record.status)
      : undefined;
  const code =
    readDiagnosticString(nestedError?.code) ??
    readDiagnosticString(bodyRecord?.code) ??
    readDiagnosticString(bodyRecord?.errorCode) ??
    (isApiError(error) ? error.code : readDiagnosticString(record?.code));
  const requestId =
    readDiagnosticString(nestedError?.requestId) ??
    readDiagnosticString(bodyRecord?.requestId) ??
    (isApiError(error) ? error.requestId : readDiagnosticString(record?.requestId));
  const transport = [
    `stage ${stage}`,
    status === undefined ? null : `HTTP ${status}`,
    code,
    requestId ? `request ${requestId}` : null,
  ].filter((value): value is string => Boolean(value));
  return `Synchronization failed: ${transport.join(' • ')} — ${message}`;
};

export const resolveSyncFailureStatus = (error: unknown): WeightSyncStatus => {
""",
)

# Process and acknowledge any preserved push result before returning a failed
# coordinator state, then surface the exact sanitized failure stage.
replace_once(
    'src/context/SyncContext.tsx',
    """  formatRejectedSyncOperationsError,
  resolveStatus,
  resolveSyncFailureStatus,
""",
    """  formatRejectedSyncOperationsError,
  formatSyncFailureDiagnostic,
  resolveStatus,
  resolveSyncFailureStage,
  resolveSyncFailureStatus,
""",
)
replace_once(
    'src/context/SyncContext.tsx',
    """      const result = await syncCoordinator.syncNow();
      if (result.status.phase === 'Failed') {
        const cause = result.error?.cause;
        throw cause instanceof Error
          ? cause
          : new Error(result.error?.message ?? 'Sync failed');
      }
      const pushResult = result.push?.result;
""",
    """      const result = await syncCoordinator.syncNow();
      const pushResult = result.push?.result;
""",
)
replace_once(
    'src/context/SyncContext.tsx',
    """        await queueStore.removeAcknowledged();
      }

      if (pullResult) {
""",
    """        await queueStore.removeAcknowledged();
      }

      if (result.status.phase === 'Failed') {
        const cause = result.error?.cause ?? result.error;
        const afterPending = await queueStore.getPending();
        setPendingOperations(countSupportedQueueOperations(afterPending));
        setDiagnostic(
          formatSyncFailureDiagnostic(
            cause,
            resolveSyncFailureStage(result.transitions),
          ),
        );
        setError('Synchronization failed');
        setStatus(resolveSyncFailureStatus(cause));
        return;
      }

      if (pullResult) {
""",
)
replace_once(
    'src/context/SyncContext.tsx',
    """    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : 'Sync failed';
      setError(message);
      setStatus(resolveSyncFailureStatus(syncError));
""",
    """    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : 'Sync failed';
      setDiagnostic(formatSyncFailureDiagnostic(syncError, 'local processing'));
      setError(message);
      setStatus(resolveSyncFailureStatus(syncError));
""",
)

# Focused test: nested backend 409 envelopes are isolated and reported.
path = Path('test/sync-push-validation-isolation.test.ts')
text = path.read_text()
marker = """  it('uses one request when the original batch is valid', async () => {
"""
addition = """  it('isolates backend idempotency-key reuse and keeps valid siblings moving', async () => {
    const pushOperations = vi.fn(async (currentBatch: SyncBatch) => {
      if (currentBatch.operations.some((item) => item.id === 'stale-key')) {
        throw Object.assign(new Error('Conflict'), {
          status: 409,
          code: 'conflict',
          requestId: 'req-reuse',
          body: {
            error: {
              code: 'SYNC_IDEMPOTENCY_KEY_REUSE',
              message: 'Idempotency key was already used for a different sync operation',
              details: {
                existingEntityType: 'foodEntries',
                requestedEntityType: 'foodEntries',
                idempotencyKey: 'must-not-be-displayed',
              },
            },
          },
        });
      }
      return appliedResult(currentBatch);
    });

    const result = await simulatePush(
      { provider: providerWith(pushOperations) },
      batch([
        operation('good-a', '11111111-1111-4111-8111-111111111111'),
        operation('stale-key', '22222222-2222-4222-8222-222222222222'),
      ]),
    );

    expect(result.result?.appliedOperations?.map((item) => item.id)).toEqual(['good-a']);
    expect(result.result?.rejectedOperations).toEqual([
      expect.objectContaining({
        operationId: 'stale-key',
        status: 409,
        code: 'SYNC_IDEMPOTENCY_KEY_REUSE',
        requestId: 'req-reuse',
      }),
    ]);
    const message = formatRejectedSyncOperationsError(
      result.result?.rejectedOperations ?? [],
    );
    expect(message).toContain('SYNC_IDEMPOTENCY_KEY_REUSE');
    expect(message).toContain('HTTP 409');
    expect(message).not.toContain('must-not-be-displayed');
  });

"""
if text.count(marker) != 1:
    raise RuntimeError('validation isolation test insertion marker not found exactly once')
path.write_text(text.replace(marker, addition + marker, 1))

# Focused test: normalization repairs a stale key whenever the payload changed.
Path('test/sync-stale-idempotency-repair.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import {
  createOfflineSyncQueueIdempotencyKey,
  normalizeOfflineSyncQueueOperation,
} from '@/cloud/CloudQueueHelpers';

const now = '2026-07-27T06:00:00.000Z';
const revision = { id: 'rev-3', number: 3, createdAt: now };
const base = {
  opId: 'foodEntries:entry-1',
  entityType: 'foodEntries',
  entityId: '11111111-1111-4111-8111-111111111111',
  action: 'update' as const,
  clientTimestamp: now,
  actorId: '22222222-2222-4222-8222-222222222222',
  baseRevision: revision,
  retryCount: 0,
  status: 'pending' as const,
};

const keyFor = (payload: Record<string, unknown>) =>
  createOfflineSyncQueueIdempotencyKey({ ...base, payload });

describe('stale sync idempotency repair', () => {
  it('regenerates a syntactically valid key that belongs to older payload content', () => {
    const oldPayload = { id: base.entityId, calories: 100 };
    const currentPayload = { id: base.entityId, calories: 125 };
    const normalized = normalizeOfflineSyncQueueOperation({
      ...base,
      payload: currentPayload,
      idempotencyKey: keyFor(oldPayload),
    });

    expect(normalized?.idempotencyKey).toBe(keyFor(currentPayload));
    expect(normalized?.idempotencyKey).not.toBe(keyFor(oldPayload));
    expect(normalized?.metadata?.requestId).toBe(keyFor(currentPayload));
  });

  it('preserves the canonical key when it already matches current content', () => {
    const payload = { id: base.entityId, calories: 125 };
    const canonicalKey = keyFor(payload);
    const normalized = normalizeOfflineSyncQueueOperation({
      ...base,
      payload,
      idempotencyKey: canonicalKey,
    });

    expect(normalized?.idempotencyKey).toBe(canonicalKey);
  });
});
""")

# Focused test: successful upload evidence survives a later pull failure.
path = Path('test/sync-coordinator.test.ts')
text = path.read_text()
text += """

describe('sync coordinator partial failure preservation', () => {
  it('keeps the successful push result when pull fails afterwards', async () => {
    const pending = makeOperation({ opId: 'op-preserved', entityId: 'preserved' });
    const applied = buildSyncBatch([pending], NOW).operations[0];
    const provider = makeProvider({
      pushOperations: vi.fn(async () => ({
        status: 'idle',
        pendingOperations: 0,
        conflictCount: 0,
        serverTimestamp: NOW,
        appliedOperations: [applied],
      })),
      pullChanges: vi.fn(async () => {
        throw new Error('pull unavailable');
      }),
    });
    const coordinator = createSyncCoordinator({
      queueStore: makeQueueStore([pending]),
      provider,
      now: () => NOW,
    });

    const result = await coordinator.syncNow();

    expect(result.phase).toBe('Failed');
    expect(result.transitions).toEqual([
      'Idle',
      'Preparing',
      'Uploading',
      'Downloading',
      'Failed',
    ]);
    expect(result.push?.result?.appliedOperations?.map((item) => item.id)).toEqual([
      'op-preserved',
    ]);
    expect(result.pull).toBeUndefined();
  });
});
"""
path.write_text(text)

# Focused test: generic failures now expose stage and nested backend code without
# serializing the raw response body.
Path('test/sync-failure-diagnostic.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import {
  formatSyncFailureDiagnostic,
  resolveSyncFailureStage,
} from '@/context/syncContextModel';

describe('sync failure diagnostics', () => {
  it('extracts a nested backend code and message from a generic HTTP conflict', () => {
    const error = Object.assign(new Error('Conflict'), {
      status: 409,
      code: 'conflict',
      requestId: 'req-409',
      body: {
        error: {
          code: 'SYNC_IDEMPOTENCY_KEY_REUSE',
          message: 'Idempotency key was already used for a different sync operation',
          details: { secretPayload: 'must-not-leak' },
        },
      },
    });

    const diagnostic = formatSyncFailureDiagnostic(error, 'upload');

    expect(diagnostic).toContain('stage upload');
    expect(diagnostic).toContain('HTTP 409');
    expect(diagnostic).toContain('SYNC_IDEMPOTENCY_KEY_REUSE');
    expect(diagnostic).toContain('Idempotency key was already used');
    expect(diagnostic).toContain('req-409');
    expect(diagnostic).not.toContain('must-not-leak');
  });

  it('derives the failed provider stage from coordinator transitions', () => {
    expect(
      resolveSyncFailureStage(['Idle', 'Preparing', 'Uploading', 'Downloading']),
    ).toBe('download');
    expect(resolveSyncFailureStage(['Idle', 'Preparing', 'Uploading'])).toBe('upload');
  });
});
""")

replace_once(
    'PROJECT_LEARNINGS.md',
    """- A validation failure in one queued operation must not block valid siblings. Isolate HTTP 400/422 operations, acknowledge successful partitions, keep the rejected local operation, and surface a sanitized diagnostic with its entity, status, validation details, and backend request ID; never display tokens, email, or raw account payloads.
""",
    """- A deterministic client error in one queued operation must not block valid siblings. Recompute pending-operation idempotency keys from the current payload, isolate HTTP 400/422 and `SYNC_IDEMPOTENCY_KEY_REUSE` failures, preserve successful uploads if pull later fails, and surface sanitized stage/entity/status/request diagnostics without tokens, email, raw payloads, or full idempotency keys.
""",
)

print('Applied stale sync idempotency and partial-success repair')
