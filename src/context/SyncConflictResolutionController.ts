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
  SyncConflictResolutionIntentState,
  SyncConflictResolutionIntentStore,
  SyncConflictStore,
  SyncCursorStore,
} from '@/storage';

export type SyncConflictResolutionControllerReviewItem = {
  candidate: SyncConflictResolutionCandidate | null;
  conflictId: string;
  intentChoice: SyncConflictResolutionChoice | null;
  intentState: SyncConflictResolutionIntentState | null;
};

export type SyncConflictResolutionController = {
  listCandidates(userId: string): Promise<SyncConflictResolutionCandidate[]>;
  listReviewItems(
    userId: string,
  ): Promise<SyncConflictResolutionControllerReviewItem[]>;
  resolve(
    userId: string,
    candidate: SyncConflictResolutionCandidate,
    choice: SyncConflictResolutionChoice,
  ): Promise<SyncConflictResolutionWorkflowOutcome>;
  resume(
    userId: string,
    conflictId: string,
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

  const listCandidates = async (userId: string) =>
    listSyncConflictResolutionCandidates(
      await options.conflictStore.list(userId),
    );

  return {
    listCandidates,
    async listReviewItems(userId) {
      const [candidates, intents] = await Promise.all([
        listCandidates(userId),
        options.intentStore.list(userId),
      ]);
      const intentsByConflictId = new Map(
        intents.map((intent) => [intent.conflictId, intent]),
      );
      const candidateIds = new Set(
        candidates.map((candidate) => candidate.conflictId),
      );
      const candidateItems = candidates.map((candidate) => {
        const intent = intentsByConflictId.get(candidate.conflictId);
        return {
          candidate,
          conflictId: candidate.conflictId,
          intentChoice: intent?.choice ?? null,
          intentState: intent?.state ?? null,
        } satisfies SyncConflictResolutionControllerReviewItem;
      });
      const orphanIntentItems = intents
        .filter((intent) => !candidateIds.has(intent.conflictId))
        .map(
          (intent) =>
            ({
              candidate: null,
              conflictId: intent.conflictId,
              intentChoice: intent.choice,
              intentState: intent.state,
            }) satisfies SyncConflictResolutionControllerReviewItem,
        );
      return [...candidateItems, ...orphanIntentItems];
    },
    resolve(userId, candidate, choice) {
      return workflow.resolve(userId, candidate, choice);
    },
    resume(userId, conflictId) {
      return workflow.resume(userId, conflictId);
    },
  };
};
