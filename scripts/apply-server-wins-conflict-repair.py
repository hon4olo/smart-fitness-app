from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/context/syncContextModel.ts',
    """type SyncConflictLike = {
  status?: unknown;
};

const TERMINAL_SYNC_CONFLICT_STATUSES = new Set(['autoResolved', 'resolved', 'ignored']);

export const isUnresolvedSyncConflict = (conflict: SyncConflictLike): boolean =>
  typeof conflict.status !== 'string' ||
  !TERMINAL_SYNC_CONFLICT_STATUSES.has(conflict.status);
""",
    """type SyncConflictLike = {
  status?: unknown;
  resolutionStrategy?: unknown;
};

const normalizeConflictToken = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z]/g, '') : '';
const TERMINAL_SYNC_CONFLICT_STATUSES = new Set(['autoresolved', 'resolved', 'ignored']);
const SERVER_WINS_SYNC_STRATEGIES = new Set(['serverwins', 'remotewins']);

export const isUnresolvedSyncConflict = (conflict: SyncConflictLike): boolean => {
  const status = normalizeConflictToken(conflict.status);
  if (TERMINAL_SYNC_CONFLICT_STATUSES.has(status)) return false;
  return !(
    status === 'pending' &&
    SERVER_WINS_SYNC_STRATEGIES.has(normalizeConflictToken(conflict.resolutionStrategy))
  );
};
""",
)

replace_once(
    'src/context/SyncContext.tsx',
    """      let persistedConflicts: SyncConflictSnapshot[];
      if (shouldClearPersistedSyncConflicts(result.status.phase, activeCycleConflictCount)) {
        await conflictStore.clear(session.user.id);
        persistedConflicts = [];
      } else {
        persistedConflicts = await conflictStore.merge(session.user.id, snapshots);
      }
      const nextConflictCount = Math.max(
        activeCycleConflictCount,
        persistedConflicts.length,
      );
      conflictStateVersionRef.current += 1;
      setConflictCount(nextConflictCount);

""",
    """      let nextConflictCount = activeCycleConflictCount;

""",
)
replace_once(
    'src/context/SyncContext.tsx',
    """      if (result.status.phase === 'Failed') {
        const cause = result.error?.cause ?? result.error;
""",
    """      if (result.status.phase === 'Failed') {
        const persistedConflicts = await conflictStore.merge(session.user.id, snapshots);
        nextConflictCount = Math.max(activeCycleConflictCount, persistedConflicts.length);
        conflictStateVersionRef.current += 1;
        setConflictCount(nextConflictCount);
        const cause = result.error?.cause ?? result.error;
""",
)
replace_once(
    'src/context/SyncContext.tsx',
    """      if (pullResult) {
        await applySyncPullResult({
          bodyMeasurementMetadataStore,
          cursorStore,
          customExerciseMetadataStore,
          fitnessProfileMetadataStore,
          foodEntryMetadataStore,
          getState: () => latestStateRef.current,
          mealTemplateMetadataStore,
          metadataStore,
          nextConflictCount,
          nutritionTargetMetadataStore,
          pullResult: pullResult as SyncPullResult,
          replaceState,
          safetyRecoveryMetadataStore,
          session,
          trainingProgramMetadataStore,
          workoutSessionMetadataStore,
          workoutTemplateMetadataStore,
        });
      }

      const afterPending = await queueStore.getPending();
""",
    """      if (pullResult) {
        await applySyncPullResult({
          bodyMeasurementMetadataStore,
          cursorStore,
          customExerciseMetadataStore,
          fitnessProfileMetadataStore,
          foodEntryMetadataStore,
          getState: () => latestStateRef.current,
          mealTemplateMetadataStore,
          metadataStore,
          nextConflictCount,
          nutritionTargetMetadataStore,
          pullResult: pullResult as SyncPullResult,
          replaceState,
          safetyRecoveryMetadataStore,
          session,
          trainingProgramMetadataStore,
          workoutSessionMetadataStore,
          workoutTemplateMetadataStore,
        });
      }

      let persistedConflicts: SyncConflictSnapshot[];
      if (shouldClearPersistedSyncConflicts(result.status.phase, activeCycleConflictCount)) {
        await conflictStore.clear(session.user.id);
        persistedConflicts = [];
      } else {
        persistedConflicts = await conflictStore.merge(session.user.id, snapshots);
      }
      nextConflictCount = Math.max(activeCycleConflictCount, persistedConflicts.length);
      conflictStateVersionRef.current += 1;
      setConflictCount(nextConflictCount);

      const afterPending = await queueStore.getPending();
""",
)

replace_once(
    'src/features/settings/SyncConflictReviewCard.tsx',
    "{copy.diagnosticLabels[item.key]}:\\u00a0",
    "{copy.diagnosticLabels[item.key]}:{' '}",
)

replace_once(
    'src/context/syncConflictCount.test.ts',
    """  it('ignores terminal server conflict records but counts pending records', () => {
    expect(isUnresolvedSyncConflict({ status: 'pending' })).toBe(true);
    expect(isUnresolvedSyncConflict({ status: 'needsReview' })).toBe(true);
    expect(isUnresolvedSyncConflict({ status: 'autoResolved' })).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'resolved' })).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'ignored' })).toBe(false);

    expect(
      countUnresolvedSyncConflicts({
        localUnresolvedCount: 1,
        pushConflicts: [{ status: 'pending' }, { status: 'resolved' }],
        pullConflicts: [{ status: 'autoResolved' }, { status: 'needsReview' }],
      }),
    ).toBe(3);
  });
""",
    """  it('ignores terminal and deterministic server-wins records but counts review conflicts', () => {
    expect(isUnresolvedSyncConflict({ status: 'pending' })).toBe(true);
    expect(
      isUnresolvedSyncConflict({ status: 'pending', resolutionStrategy: 'server_wins' }),
    ).toBe(false);
    expect(
      isUnresolvedSyncConflict({ status: 'pending', resolutionStrategy: 'remoteWins' }),
    ).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'needsReview' })).toBe(true);
    expect(isUnresolvedSyncConflict({ status: 'auto_resolved' })).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'resolved' })).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'ignored' })).toBe(false);

    expect(
      countUnresolvedSyncConflicts({
        localUnresolvedCount: 1,
        pushConflicts: [
          { status: 'pending', resolutionStrategy: 'server_wins' },
          { status: 'pending' },
          { status: 'resolved' },
        ],
        pullConflicts: [{ status: 'autoResolved' }, { status: 'needsReview' }],
      }),
    ).toBe(3);
  });
""",
)

replace_once(
    'src/context/syncConflictPersistence.test.ts',
    """  it('persists conflict snapshots before deciding whether pull cursor may advance', () => {
    const source = readSource('src/context/SyncContext.tsx');
    const persistIndex = source.indexOf(
      'await conflictStore.merge(session.user.id, snapshots)',
    );
    const pullApplyIndex = source.indexOf('await applySyncPullResult({');

    expect(persistIndex).toBeGreaterThan(-1);
    expect(pullApplyIndex).toBeGreaterThan(persistIndex);
    expect(source).toContain('persistedConflicts.length');
    expect(source).toContain('nextConflictCount,');
  });
""",
    """  it('retains failed conflicts and clears successful snapshots only after pull applies', () => {
    const source = readSource('src/context/SyncContext.tsx');
    const failedIndex = source.indexOf("if (result.status.phase === 'Failed')");
    const failedMergeIndex = source.indexOf(
      'await conflictStore.merge(session.user.id, snapshots)',
      failedIndex,
    );
    const pullApplyIndex = source.indexOf('await applySyncPullResult({');
    const clearIndex = source.indexOf(
      'await conflictStore.clear(session.user.id)',
      pullApplyIndex,
    );
    const successfulMergeIndex = source.indexOf(
      'await conflictStore.merge(session.user.id, snapshots)',
      pullApplyIndex,
    );

    expect(failedIndex).toBeGreaterThan(-1);
    expect(failedMergeIndex).toBeGreaterThan(failedIndex);
    expect(pullApplyIndex).toBeGreaterThan(failedMergeIndex);
    expect(clearIndex).toBeGreaterThan(pullApplyIndex);
    expect(successfulMergeIndex).toBeGreaterThan(pullApplyIndex);
    expect(source).toContain('nextConflictCount = Math.max');
  });
""",
)

Path('test/sync-conflict-review-card.test.ts').write_text("""import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'src/features/settings/SyncConflictReviewCard.tsx'),
  'utf8',
);

describe('sync conflict review card formatting', () => {
  it('renders a real separator instead of a literal unicode escape', () => {
    expect(source).not.toContain('\\\\u00a0');
    expect(source).toContain("{copy.diagnosticLabels[item.key]}:{' '}");
  });
});
""")

path = Path('PROJECT_LEARNINGS.md')
text = path.read_text()
needle = "- Conflict review UI must expose sanitized status, reason, strategy, revision metadata, request ID, conflicting field names, and an opaque fingerprint. Never render raw local/remote versions or raw conflict IDs because current conflict IDs may embed serialized entity content.\n"
addition = needle + "- Backend conflict tokens must be normalized before deciding whether review is required. A successful `pending` conflict with `server_wins` / `remoteWins` is deterministic: apply the pulled server version, then clear the stored snapshot; never clear it before pull application succeeds. Render JSX separators as actual text expressions, not literal `\\uXXXX` source escapes.\n"
if text.count(needle) != 1:
    raise RuntimeError('PROJECT_LEARNINGS conflict lesson anchor not found exactly once')
path.write_text(text.replace(needle, addition, 1))

print('Applied server-wins conflict reconciliation and UI escape repair')
