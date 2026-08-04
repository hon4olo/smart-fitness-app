import type { SyncConflictSnapshot } from "@/storage";

export type SyncConflictPayloadKind = "delete" | "upsert";

export type SyncConflictResolutionCandidate = {
  conflictId: string;
  entityType: string;
  entityId: string;
  expectedConflictRevision: number;
  expectedRemoteRevision: number;
  localKind: SyncConflictPayloadKind;
  remoteKind: SyncConflictPayloadKind;
  detectedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIntegerRevision = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const payloadKind = (value: unknown): SyncConflictPayloadKind | null => {
  if (value === null) return "delete";
  return isRecord(value) ? "upsert" : null;
};

const isValidTimestamp = (value: string): boolean =>
  value.trim().length > 0 && Number.isFinite(Date.parse(value));

export const toSyncConflictResolutionCandidate = (
  snapshot: SyncConflictSnapshot,
): SyncConflictResolutionCandidate | null => {
  if (
    snapshot.status !== "pending" ||
    (snapshot.source !== "push" && snapshot.source !== "pull") ||
    !isValidTimestamp(snapshot.detectedAt) ||
    !isRecord(snapshot.details)
  ) {
    return null;
  }

  const details = snapshot.details;
  const conflictId =
    typeof details.id === "string"
      ? details.id
      : typeof details.conflictId === "string"
        ? details.conflictId
        : null;
  const localKind = payloadKind(details.localPayload);
  const remoteKind = payloadKind(details.remotePayload);

  if (
    conflictId !== snapshot.conflictId ||
    details.status !== "pending" ||
    details.conflictType !== "revision_mismatch" ||
    details.entityType !== snapshot.entityType ||
    details.entityId !== snapshot.entityId ||
    !isIntegerRevision(details.revision) ||
    !isIntegerRevision(details.remoteRevision) ||
    localKind === null ||
    remoteKind === null ||
    localKind === remoteKind
  ) {
    return null;
  }

  return {
    conflictId: snapshot.conflictId,
    entityType: snapshot.entityType,
    entityId: snapshot.entityId,
    expectedConflictRevision: details.revision,
    expectedRemoteRevision: details.remoteRevision,
    localKind,
    remoteKind,
    detectedAt: snapshot.detectedAt,
  };
};

export const listSyncConflictResolutionCandidates = (
  snapshots: readonly SyncConflictSnapshot[],
): SyncConflictResolutionCandidate[] =>
  snapshots
    .map(toSyncConflictResolutionCandidate)
    .filter(
      (candidate): candidate is SyncConflictResolutionCandidate =>
        candidate !== null,
    )
    .sort((left, right) =>
      left.detectedAt === right.detectedAt
        ? left.conflictId.localeCompare(right.conflictId)
        : left.detectedAt.localeCompare(right.detectedAt),
    );
