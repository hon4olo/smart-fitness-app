from pathlib import Path

path = Path('src/context/SyncContext.tsx')
text = path.read_text()
old_import = """import {
  repairOfflineSyncQueueOperationIdempotencyKey,
  type SyncCoordinator,
} from '@/cloud';
"""
new_import = """import type { SyncCoordinator } from '@/cloud';
"""
if text.count(old_import) != 1:
    raise RuntimeError(f'import count: {text.count(old_import)}')
text = text.replace(old_import, new_import, 1)

anchor = """import { applySyncPullResult } from './applySyncPullResult';
"""
replacement = """import { applySyncPullResult } from './applySyncPullResult';
import { repairRejectedSyncIdempotencyKeys } from './repairRejectedSyncOperations';
"""
if text.count(anchor) != 1:
    raise RuntimeError(f'local import anchor count: {text.count(anchor)}')
text = text.replace(anchor, replacement, 1)

old_block = """      const reusedKeyOperationIds = new Set(
        (pushResult?.rejectedOperations ?? [])
          .filter(
            (operation) =>
              operation.status === 409 &&
              operation.code?.toUpperCase() === 'SYNC_IDEMPOTENCY_KEY_REUSE',
          )
          .map((operation) => operation.operationId),
      );
      if (reusedKeyOperationIds.size > 0) {
        const queuedOperations = await queueStore.loadOperations();
        for (const operation of queuedOperations) {
          if (!reusedKeyOperationIds.has(operation.opId)) continue;
          const repaired = repairOfflineSyncQueueOperationIdempotencyKey(operation);
          if (repaired.idempotencyKey === operation.idempotencyKey) continue;
          await queueStore.updateOperation(operation.opId, {
            idempotencyKey: repaired.idempotencyKey,
            metadata: repaired.metadata,
            status: 'pending',
            lastError: undefined,
            nextRetryAt: undefined,
          });
        }
      }
"""
new_block = """      await repairRejectedSyncIdempotencyKeys(
        queueStore,
        pushResult?.rejectedOperations ?? [],
      );
"""
if text.count(old_block) != 1:
    raise RuntimeError(f'inline repair block count: {text.count(old_block)}')
path.write_text(text.replace(old_block, new_block, 1))
