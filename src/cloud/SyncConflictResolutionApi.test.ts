import { describe, expect, it } from "vitest";

import {
  parseSyncConflictResolutionResult,
  SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION,
} from "./SyncConflictResolutionApi";

const validResponse = {
  schemaVersion: SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION,
  conflictId: "55555555-5555-4555-8555-555555555555",
  entityType: "weightHistory",
  entityId: "33333333-3333-4333-8333-333333333333",
  status: "resolved",
  choice: "keep_local",
  revision: 12,
  resolvedPayload: null,
  resolvedAt: "2026-08-04T08:30:00.000Z",
  duplicate: false,
} as const;

describe("sync conflict resolution API parser", () => {
  it("accepts the exact versioned response contract", () => {
    expect(parseSyncConflictResolutionResult(validResponse)).toEqual(
      validResponse,
    );
  });

  it("accepts a bounded object payload and replay result", () => {
    expect(
      parseSyncConflictResolutionResult({
        ...validResponse,
        choice: "keep_remote",
        resolvedPayload: { id: validResponse.entityId, weight: 70 },
        duplicate: true,
      }),
    ).toMatchObject({
      choice: "keep_remote",
      resolvedPayload: { id: validResponse.entityId, weight: 70 },
      duplicate: true,
    });
  });

  it.each([
    null,
    { ...validResponse, schemaVersion: "v2" },
    { ...validResponse, conflictId: "not-a-uuid" },
    { ...validResponse, entityType: "" },
    { ...validResponse, status: "pending" },
    { ...validResponse, choice: "merge" },
    { ...validResponse, revision: 1.5 },
    { ...validResponse, resolvedPayload: [] },
    { ...validResponse, resolvedAt: "not-a-date" },
    { ...validResponse, duplicate: "false" },
    { ...validResponse, unexpected: true },
  ])("rejects malformed or expanded responses", (value) => {
    expect(() => parseSyncConflictResolutionResult(value)).toThrow(
      "invalid sync conflict resolution response",
    );
  });
});
