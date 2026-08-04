export const SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION =
  "smart-fitness.sync-conflict-resolution.v1" as const;

export const SYNC_CONFLICT_RESOLUTION_CHOICES = [
  "keep_local",
  "keep_remote",
] as const;

export type SyncConflictResolutionChoice =
  (typeof SYNC_CONFLICT_RESOLUTION_CHOICES)[number];

export type ResolveSyncConflictInput = {
  conflictId: string;
  expectedConflictRevision: number;
  expectedRemoteRevision: number;
  choice: SyncConflictResolutionChoice;
  idempotencyKey: string;
};

export type SyncConflictResolutionResult = {
  schemaVersion: typeof SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION;
  conflictId: string;
  entityType: string;
  entityId: string;
  status: "resolved";
  choice: SyncConflictResolutionChoice;
  revision: number;
  resolvedPayload: Record<string, unknown> | null;
  resolvedAt: string;
  duplicate: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isChoice = (value: unknown): value is SyncConflictResolutionChoice =>
  value === "keep_local" || value === "keep_remote";

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  Number.isFinite(Date.parse(value));

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actualKeys = Object.keys(value).sort();
  const sortedExpected = [...expectedKeys].sort();
  return (
    actualKeys.length === sortedExpected.length &&
    actualKeys.every((key, index) => key === sortedExpected[index])
  );
};

export const parseSyncConflictResolutionResult = (
  value: unknown,
): SyncConflictResolutionResult => {
  if (!isRecord(value)) {
    throw new Error("invalid sync conflict resolution response");
  }

  if (
    !hasExactKeys(value, [
      "schemaVersion",
      "conflictId",
      "entityType",
      "entityId",
      "status",
      "choice",
      "revision",
      "resolvedPayload",
      "resolvedAt",
      "duplicate",
    ]) ||
    value.schemaVersion !== SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION ||
    !isUuid(value.conflictId) ||
    typeof value.entityType !== "string" ||
    value.entityType.trim().length === 0 ||
    !isUuid(value.entityId) ||
    value.status !== "resolved" ||
    !isChoice(value.choice) ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 0 ||
    (value.resolvedPayload !== null && !isRecord(value.resolvedPayload)) ||
    !isIsoTimestamp(value.resolvedAt) ||
    typeof value.duplicate !== "boolean"
  ) {
    throw new Error("invalid sync conflict resolution response");
  }

  return {
    schemaVersion: value.schemaVersion,
    conflictId: value.conflictId,
    entityType: value.entityType,
    entityId: value.entityId,
    status: value.status,
    choice: value.choice,
    revision: value.revision,
    resolvedPayload: value.resolvedPayload,
    resolvedAt: value.resolvedAt,
    duplicate: value.duplicate,
  };
};
