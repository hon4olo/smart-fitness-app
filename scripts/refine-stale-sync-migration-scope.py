from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """export const normalizeOfflineSyncQueueOperation = (
  operation: unknown,
  index = 0,
  now = new Date().toISOString(),
): OfflineSyncQueueOperation | null => {
""",
    """export type NormalizeOfflineSyncQueueOperationOptions = {
  repairStaleIdempotencyKey?: boolean;
};

export const normalizeOfflineSyncQueueOperation = (
  operation: unknown,
  index = 0,
  now = new Date().toISOString(),
  options: NormalizeOfflineSyncQueueOperationOptions = {},
): OfflineSyncQueueOperation | null => {
""",
)

replace_once(
    'src/cloud/CloudQueueHelpers.ts',
    """  const idempotencyKey =
    !entityIdChanged &&
    !payloadCompatibility.changed &&
    isOfflineSyncQueueIdempotencyKey(operation.idempotencyKey) &&
    operation.idempotencyKey === canonicalIdempotencyKey
      ? operation.idempotencyKey
      : canonicalIdempotencyKey;
""",
    """  const storedIdempotencyKey = isOfflineSyncQueueIdempotencyKey(
    operation.idempotencyKey,
  )
    ? operation.idempotencyKey
    : undefined;
  const shouldRepairStaleKey =
    options.repairStaleIdempotencyKey &&
    storedIdempotencyKey !== undefined &&
    storedIdempotencyKey !== canonicalIdempotencyKey;
  const idempotencyKey =
    !entityIdChanged &&
    !payloadCompatibility.changed &&
    storedIdempotencyKey &&
    !shouldRepairStaleKey
      ? storedIdempotencyKey
      : canonicalIdempotencyKey;
""",
)

replace_once(
    'src/storage/AsyncStorageOperationQueueStore.ts',
    """      .map((operation, index) => normalizeOfflineSyncQueueOperation(operation, index, now))
""",
    """      .map((operation, index) =>
        normalizeOfflineSyncQueueOperation(operation, index, now, {
          repairStaleIdempotencyKey: true,
        }),
      )
""",
)

replace_once(
    'test/sync-stale-idempotency-repair.test.ts',
    """    const normalized = normalizeOfflineSyncQueueOperation({
      ...base,
      payload: currentPayload,
      idempotencyKey: keyFor(oldPayload),
    });
""",
    """    const normalized = normalizeOfflineSyncQueueOperation(
      {
        ...base,
        payload: currentPayload,
        idempotencyKey: keyFor(oldPayload),
      },
      0,
      now,
      { repairStaleIdempotencyKey: true },
    );
""",
)

replace_once(
    'test/sync-stale-idempotency-repair.test.ts',
    """  it('preserves the canonical key when it already matches current content', () => {
""",
    """  it('preserves a caller-provided key outside persisted queue migration', () => {
    const oldPayload = { id: base.entityId, calories: 100 };
    const currentPayload = { id: base.entityId, calories: 125 };
    const storedKey = keyFor(oldPayload);
    const normalized = normalizeOfflineSyncQueueOperation({
      ...base,
      payload: currentPayload,
      idempotencyKey: storedKey,
    });

    expect(normalized?.idempotencyKey).toBe(storedKey);
  });

  it('preserves the canonical key when it already matches current content', () => {
""",
)

# Add a store-level migration test proving that real AsyncStorage loads repair old
# persisted keys while enqueue behavior remains unchanged.
path = Path('test/offline-sync-queue.test.ts')
text = path.read_text()
marker = """  it('returns an empty list for empty storage', async () => {
"""
addition = """  it('repairs stale persisted idempotency keys when restoring the queue', async () => {
    const oldPayload = { value: 1 };
    const currentPayload = { value: 2 };
    const current = operation({
      opId: 'op-stale-persisted',
      entityId: 'entity-stale-persisted',
      payload: currentPayload,
      idempotencyKey: createOfflineSyncQueueIdempotencyKey({
        entityType: 'workoutSessions',
        entityId: 'entity-stale-persisted',
        action: 'update',
        clientTimestamp: NOW,
        actorId: 'actor-1',
        baseRevision: REVISION,
        payload: oldPayload,
      }),
    });
    const storage = memoryStorage(
      JSON.stringify({ version: 1, operations: [current], updatedAt: NOW }),
    );
    const store = createAsyncStorageOperationQueueStore(storage);

    const restored = await store.loadOperations();
    const expected = createOfflineSyncQueueIdempotencyKey({
      entityType: current.entityType,
      entityId: current.entityId,
      action: current.action,
      clientTimestamp: current.clientTimestamp,
      actorId: current.actorId,
      baseRevision: current.baseRevision,
      payload: currentPayload,
    });

    expect(restored).toHaveLength(1);
    expect(restored[0]?.idempotencyKey).toBe(expected);
    expect(restored[0]?.metadata?.requestId).toBe(expected);
  });

"""
if text.count(marker) != 1:
    raise RuntimeError(f'offline queue insertion marker count: {text.count(marker)}')
path.write_text(text.replace(marker, addition + marker, 1))

print('Scoped stale idempotency repair to persisted queue restoration')
