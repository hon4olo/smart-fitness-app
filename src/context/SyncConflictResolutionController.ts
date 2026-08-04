import {
  createSyncConflictResolutionSubmission,
  createSyncConflictResolutionWorkflow,
  listSyncConflictResolutionCandidates,
  type SyncConflictResolutionCandidate,
  type SyncConflictResolutionChoice,
  type SyncConflictResolutionClient,
  type SyncConflictResolutionWorkflowOutcome,
} from '@/cloud';
import type {
  SyncConflictResolutionIntentStore,
  SyncConflictStore,
  SyncCursorStore,
} from '@/storage';

export type SyncConflictResolutionController = {
  listCandidates(userId: string): Promise<SyncConflictResolutionCandidate[]>;
  resolve(
    userId: string,
    candidate: SyncConflictResolutionCandidate,
    choice: SyncConflictResolutionChoice,
  ): Promise<SyncConflictResolutionWorkflowOutcome>;
};

export type CreateSyncConflictResolutionControllerOptions = {
  client: SyncConflictResolutionClient;
  conflictStore: SyncConflictStore;
  cursorStore: SyncCursorStore;
  intentStore: SyncConflictResolutionIntentStore;
  synchronize(): Promise<void>;
};

export const createSyncConflictResolutionController = (
  options: CreateSyncConflictResolutionControllerOptions,
): SyncConflictResolutionController => {
  const submission = createSyncConflictResolutionSubmission({
    client: options.client,
    intentStore: options.intentStore,
  });
  const workflow = createSyncConflictResolutionWorkflow({
    conflictStore: options.conflictStore,
    cursorStore: options.cursorStore,
    intentStore: options.intentStore,
    submission,
    synchronize: options.synchronize,
  });

  return {
    async listCandidates(userId) {
      return listSyncConflictResolutionCandidates(
        await options.conflictStore.list(userId),
      );
    },
    resolve(userId, candidate, choice) {
      return workflow.resolve(userId, candidate, choice);
    },
  };
};
