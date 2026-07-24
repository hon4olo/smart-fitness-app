import type { CloudError } from './CloudErrors';
import { createConflictPolicyRegistry } from './CloudConflictPolicies';
import { createConflictResolver } from './CloudConflictResolver';
import { estimateSyncCoordinatorDurationMs } from './SyncCoordinatorHelpers';
import {
  buildSyncBatch,
  buildSyncResult,
  prepareSync,
  resolveConflicts,
  simulatePull,
  simulatePush,
} from './SyncCoordinatorOperations';
import type {
  SyncBuildResult,
  SyncConflictResolution,
  SyncCoordinator,
  SyncCoordinatorDependencies,
  SyncCoordinatorPhase,
  SyncCoordinatorStatistics,
  SyncCoordinatorStatus,
  SyncPreparation,
  SyncPreview,
  SyncPreviewPull,
  SyncPullSimulation,
} from './SyncCoordinatorTypes';

const emptyConflictResolution = (): SyncConflictResolution => ({
  phase: 'Resolving',
  records: [],
  results: [],
  unresolvedCount: 0,
});

export const createSyncCoordinator = (
  dependencies: SyncCoordinatorDependencies,
): SyncCoordinator => {
  const resolver =
    dependencies.resolver ??
    createConflictResolver(
      dependencies.registry ?? createConflictPolicyRegistry(),
    );
  const registry =
    dependencies.registry ?? createConflictPolicyRegistry();
  let status: SyncCoordinatorStatus = { phase: 'Idle', cancelled: false };
  let lastStatistics: SyncCoordinatorStatistics = {
    pendingOperations: 0,
    failedOperations: 0,
    queueSize: 0,
    estimatedUploadCount: 0,
    estimatedDownloadCount: 0,
    conflictCount: 0,
  };
  let lastSyncTimestamp: string | undefined;

  const updateStatus = (
    next: Partial<SyncCoordinatorStatus> &
      Pick<SyncCoordinatorStatus, 'phase'>,
  ): SyncCoordinatorStatus => {
    status = { ...status, ...next };
    return status;
  };

  const captureStatistics = (
    preparation: SyncPreparation,
    conflicts: SyncConflictResolution,
    pull?: SyncPullSimulation,
  ): SyncCoordinatorStatistics => {
    lastStatistics = {
      ...preparation.statistics,
      estimatedDownloadCount:
        pull?.operationCount ??
        preparation.statistics.estimatedDownloadCount,
      conflictCount: conflicts.records.length,
      lastSyncTimestamp,
    };
    return lastStatistics;
  };

  const prepare = async (): Promise<SyncPreparation> => {
    if (status.cancelled) {
      updateStatus({ phase: 'Idle', reason: 'cancelled' });
      return {
        phase: 'Preparing',
        operationsToUpload: [],
        batch: buildSyncBatch(
          [],
          dependencies.now?.() ?? new Date().toISOString(),
        ),
        validation: { valid: true, errors: [] },
        expectedConflicts: [],
        statistics: lastStatistics,
        estimatedDurationMs:
          estimateSyncCoordinatorDurationMs(lastStatistics),
      };
    }

    updateStatus({
      phase: 'Preparing',
      reason: undefined,
      lastError: undefined,
    });
    const preparation = await prepareSync(
      dependencies,
      dependencies.now?.() ?? new Date().toISOString(),
    );
    lastStatistics = preparation.statistics;
    return preparation;
  };

  const previewSync = async (): Promise<SyncPreview> => {
    const preparation = await prepare();
    const expectedPull: SyncPreviewPull = {
      estimatedOperationCount: 0,
      expectedBatchId: `preview:${preparation.batch.id}`,
    };
    return {
      phase: 'Preparing',
      operationsToUpload: preparation.operationsToUpload,
      expectedPull,
      expectedConflicts: preparation.expectedConflicts,
      estimatedDurationMs: preparation.estimatedDurationMs,
      statistics: preparation.statistics,
    };
  };

  const syncNow = async (): Promise<SyncBuildResult> => {
    if (status.cancelled) {
      const now = dependencies.now?.() ?? new Date().toISOString();
      const preparation = await prepareSync(dependencies, now);
      const conflicts = emptyConflictResolution();
      const statistics = captureStatistics(preparation, conflicts);
      updateStatus({ phase: 'Idle', reason: 'cancelled' });
      return buildSyncResult(
        status,
        statistics,
        preparation,
        conflicts,
        ['Idle'],
        undefined,
        undefined,
      );
    }

    const transitions: SyncCoordinatorPhase[] = ['Idle'];
    const now = dependencies.now?.() ?? new Date().toISOString();
    updateStatus({
      phase: 'Preparing',
      reason: undefined,
      lastError: undefined,
    });
    transitions.push('Preparing');

    try {
      const preparation = await prepareSync(dependencies, now);
      lastStatistics = preparation.statistics;

      if (!preparation.validation.valid) {
        const error: CloudError = {
          code: 'unknown',
          message: 'batch validation failed',
        };
        updateStatus({
          phase: 'Failed',
          reason: 'validation failed',
          lastError: error,
        });
        return buildSyncResult(
          status,
          preparation.statistics,
          preparation,
          emptyConflictResolution(),
          [...transitions, 'Failed'],
          undefined,
          undefined,
          error,
        );
      }

      const health = await dependencies.provider.healthCheck();
      if (
        health.status === 'offline' ||
        health.error?.code === 'offline'
      ) {
        updateStatus({
          phase: 'Offline',
          reason: 'provider offline',
          lastError: health.error,
        });
        return buildSyncResult(
          status,
          preparation.statistics,
          preparation,
          emptyConflictResolution(),
          [...transitions, 'Offline'],
          undefined,
          undefined,
          health.error,
        );
      }

      if (
        health.status === 'needsAuthentication' ||
        health.error?.code === 'authentication_required'
      ) {
        updateStatus({
          phase: 'NeedsAuthentication',
          reason: 'authentication required',
          lastError: health.error,
        });
        return buildSyncResult(
          status,
          preparation.statistics,
          preparation,
          emptyConflictResolution(),
          [...transitions, 'NeedsAuthentication'],
          undefined,
          undefined,
          health.error,
        );
      }

      updateStatus({ phase: 'Uploading' });
      transitions.push('Uploading');
      const push = await simulatePush(dependencies, preparation.batch);

      updateStatus({ phase: 'Downloading' });
      transitions.push('Downloading');
      const pull = await simulatePull(dependencies, now);

      updateStatus({ phase: 'Resolving' });
      transitions.push('Resolving');
      const conflicts = await resolveConflicts(
        { resolver, registry },
        preparation.operationsToUpload,
        pull.batch,
        now,
      );
      const unresolved = conflicts.results.filter(
        (result) => result.requiresManualReview,
      );

      lastSyncTimestamp = now;
      const statistics = captureStatistics(
        preparation,
        conflicts,
        pull,
      );
      if (unresolved.length > 0) {
        updateStatus({
          phase: 'Conflict',
          reason: 'conflicts require review',
        });
        return buildSyncResult(
          status,
          statistics,
          preparation,
          conflicts,
          [...transitions, 'Conflict'],
          push,
          pull,
        );
      }

      updateStatus({
        phase: 'Completed',
        reason: 'sync completed',
        lastSyncAt: now,
      });
      return buildSyncResult(
        status,
        statistics,
        preparation,
        conflicts,
        [...transitions, 'Completed'],
        push,
        pull,
      );
    } catch (cause) {
      const error: CloudError = {
        code: 'unknown',
        message: 'sync failed',
        cause,
      };
      updateStatus({
        phase: 'Failed',
        reason: 'sync failed',
        lastError: error,
      });
      const preparation = await prepareSync(dependencies, now);
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
    }
  };

  const cancel = (): SyncCoordinatorStatus =>
    updateStatus({ phase: 'Idle', cancelled: true, reason: 'cancelled' });
  const resume = (): SyncCoordinatorStatus =>
    updateStatus({ phase: 'Idle', cancelled: false, reason: undefined });
  const reset = (): SyncCoordinatorStatus => {
    lastStatistics = {
      pendingOperations: 0,
      failedOperations: 0,
      queueSize: 0,
      estimatedUploadCount: 0,
      estimatedDownloadCount: 0,
      conflictCount: 0,
    };
    lastSyncTimestamp = undefined;
    status = { phase: 'Idle', cancelled: false };
    return status;
  };

  const getStatus = (): SyncCoordinatorStatus => ({
    ...status,
    lastSyncAt: lastSyncTimestamp,
  });
  const getStatistics = (): SyncCoordinatorStatistics => ({
    ...lastStatistics,
    lastSyncTimestamp,
  });

  return {
    prepare,
    syncNow,
    cancel,
    resume,
    getStatus,
    getStatistics,
    previewSync,
    reset,
  };
};
