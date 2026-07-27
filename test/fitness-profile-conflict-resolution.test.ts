import { describe, expect, it } from 'vitest';

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
  it.each(['profile', 'fitnessProfiles', 'fitness_profiles'])(
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
