from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/cloud/CloudConflictPolicies.ts',
    "  profile: {\n    strategy: 'lastWriteWins',\n    allowDeleteStrategy: 'manualReview',\n    preferStableTieBreak: 'local',\n  },\n",
    "  profile: {\n    strategy: 'lastWriteWins',\n    allowDeleteStrategy: 'manualReview',\n    preferStableTieBreak: 'local',\n  },\n  fitnessProfiles: {\n    strategy: 'lastWriteWins',\n    allowDeleteStrategy: 'manualReview',\n    preferStableTieBreak: 'local',\n  },\n  fitness_profiles: {\n    strategy: 'lastWriteWins',\n    allowDeleteStrategy: 'manualReview',\n    preferStableTieBreak: 'local',\n  },\n",
)

replace_once(
    'src/context/syncContextModel.ts',
    "export const countUnresolvedSyncConflicts = ({\n  localUnresolvedCount,\n  pullConflicts = [],\n  pushConflicts = [],\n}: {\n  localUnresolvedCount: number;\n  pullConflicts?: SyncConflictLike[];\n  pushConflicts?: SyncConflictLike[];\n}): number =>\n  Math.max(0, Math.floor(localUnresolvedCount)) +\n  pushConflicts.filter(isUnresolvedSyncConflict).length +\n  pullConflicts.filter(isUnresolvedSyncConflict).length;\n\n",
    "export const countUnresolvedSyncConflicts = ({\n  localUnresolvedCount,\n  pullConflicts = [],\n  pushConflicts = [],\n}: {\n  localUnresolvedCount: number;\n  pullConflicts?: SyncConflictLike[];\n  pushConflicts?: SyncConflictLike[];\n}): number =>\n  Math.max(0, Math.floor(localUnresolvedCount)) +\n  pushConflicts.filter(isUnresolvedSyncConflict).length +\n  pullConflicts.filter(isUnresolvedSyncConflict).length;\n\nexport const shouldClearPersistedSyncConflicts = (\n  phase: string,\n  activeCycleConflictCount: number,\n): boolean => phase !== 'Failed' && activeCycleConflictCount === 0;\n\n",
)

replace_once(
    'src/context/SyncContext.tsx',
    "  resolveStatus,\n  resolveSyncFailureStage,\n",
    "  resolveStatus,\n  resolveSyncFailureStage,\n  shouldClearPersistedSyncConflicts,\n",
)

replace_once(
    'src/context/SyncContext.tsx',
    "      const persistedConflicts = await conflictStore.merge(session.user.id, snapshots);\n      const nextConflictCount = Math.max(\n        activeCycleConflictCount,\n        persistedConflicts.length,\n      );\n",
    "      let persistedConflicts: SyncConflictSnapshot[];\n      if (shouldClearPersistedSyncConflicts(result.status.phase, activeCycleConflictCount)) {\n        await conflictStore.clear(session.user.id);\n        persistedConflicts = [];\n      } else {\n        persistedConflicts = await conflictStore.merge(session.user.id, snapshots);\n      }\n      const nextConflictCount = Math.max(\n        activeCycleConflictCount,\n        persistedConflicts.length,\n      );\n",
)

Path('test/fitness-profile-conflict-resolution.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { createConflictPolicyRegistry } from '@/cloud/CloudConflictPolicies';
import { createConflictResolver } from '@/cloud/CloudConflictResolver';
import type { ConflictRecord } from '@/cloud/CloudSyncTypes';
import { shouldClearPersistedSyncConflicts } from '@/context/syncContextModel';

const conflict = (entityType: string): ConflictRecord => ({
  conflictId: `conflict:${entityType}:profile-1`,
  entityType,
  entity: entityType,
  entityId: 'profile-1',
  localVersion: { currentWeightKg: 82.7 },
  remoteVersion: { currentWeightKg: 82.5 },
  localRevision: {
    id: 'local-rev',
    number: 1,
    createdAt: '2026-07-27T13:00:00.000Z',
    source: 'local',
  },
  remoteRevision: {
    id: 'remote-rev',
    number: 2,
    createdAt: '2026-07-27T13:01:00.000Z',
    source: 'remote',
  },
  detectedAt: '2026-07-27T13:02:00.000Z',
  status: 'unresolved',
  reason: 'versions differ',
});

describe('fitness profile conflict policy', () => {
  it.each(['fitnessProfiles', 'fitness_profiles'])(
    'auto-resolves %s with last-write-wins',
    (entityType) => {
      const registry = createConflictPolicyRegistry();
      const resolver = createConflictResolver(registry);
      const result = resolver.resolveConflict(conflict(entityType));

      expect(registry.getPolicy(entityType).strategy).toBe('lastWriteWins');
      expect(result.outcome).toBe('autoResolved');
      expect(result.requiresManualReview).toBe(false);
      expect(result.resolvedValue).toEqual({ currentWeightKg: 82.5 });
    },
  );

  it('clears stale persisted conflicts after a clean successful cycle', () => {
    expect(shouldClearPersistedSyncConflicts('Completed', 0)).toBe(true);
    expect(shouldClearPersistedSyncConflicts('Conflict', 1)).toBe(false);
    expect(shouldClearPersistedSyncConflicts('Failed', 0)).toBe(false);
  });
});
""")

path = Path('PROJECT_LEARNINGS.md')
text = path.read_text()
lesson = "- Conflict policy keys must match actual sync entity names and aliases. `fitnessProfiles` / `fitness_profiles` use last-write-wins; after a fully successful cycle with zero active conflicts, clear stale persisted conflict snapshots so resolved items do not remain permanently in Settings.\n"
anchor = "- Queue mutation locking and deduplication protect the queue itself, but do not make application-state persistence and outbox enqueue one atomic storage transaction.\n"
if lesson not in text:
    if text.count(anchor) != 1:
        raise RuntimeError('PROJECT_LEARNINGS sync lesson anchor not found exactly once')
    text = text.replace(anchor, lesson + anchor, 1)
path.write_text(text)

print('Applied fitness profile conflict policy and stale-conflict reconciliation repair')
