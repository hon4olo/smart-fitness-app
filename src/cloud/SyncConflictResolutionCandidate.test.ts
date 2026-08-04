import { describe, expect, it } from "vitest";

import type { SyncConflictSnapshot } from "@/storage";

import {
  listSyncConflictResolutionCandidates,
  toSyncConflictResolutionCandidate,
} from "./SyncConflictResolutionCandidate";

const conflictId = "11111111-1111-4111-8111-111111111111";
const entityId = "22222222-2222-4222-8222-222222222222";
const detectedAt = "2026-08-04T10:30:00.000Z";

const createSnapshot = (
  overrides: Partial<SyncConflictSnapshot> = {},
  detailOverrides: Record<string, unknown> = {},
): SyncConflictSnapshot => ({
  conflictId,
  source: "pull",
  status: "pending",
  entityType: "weightHistory",
  entityId,
  detectedAt,
  details: {
    id: conflictId,
    userId: "33333333-3333-4333-8333-333333333333",
    deviceId: "44444444-4444-4444-8444-444444444444",
    entityType: "weightHistory",
    entityId,
    conflictType: "revision_mismatch",
    status: "pending",
    baseRevision: 4,
    localRevision: 4,
    remoteRevision: 8,
    localPayload: null,
    remotePayload: { id: entityId, weight: 70 },
    resolvedPayload: null,
    resolutionStrategy: "server_wins",
    reason: "internal reason",
    detectedAt,
    resolvedAt: null,
    revision: 11,
    ...detailOverrides,
  },
  ...overrides,
});

describe("sync conflict resolution candidates", () => {
  it("derives a bounded local-delete versus remote-upsert candidate", () => {
    expect(toSyncConflictResolutionCandidate(createSnapshot())).toEqual({
      conflictId,
      entityType: "weightHistory",
      entityId,
      expectedConflictRevision: 11,
      expectedRemoteRevision: 8,
      localKind: "delete",
      remoteKind: "upsert",
      detectedAt,
    });
  });

  it("supports local-upsert versus remote-delete without exposing payloads", () => {
    const candidate = toSyncConflictResolutionCandidate(
      createSnapshot({}, {
        localPayload: { id: entityId, weight: 71 },
        remotePayload: null,
      }),
    );

    expect(candidate).toMatchObject({
      localKind: "upsert",
      remoteKind: "delete",
    });
    expect(candidate).not.toHaveProperty("details");
    expect(candidate).not.toHaveProperty("localPayload");
    expect(candidate).not.toHaveProperty("remotePayload");
    expect(candidate).not.toHaveProperty("userId");
    expect(candidate).not.toHaveProperty("reason");
  });

  it.each([
    ["client-only conflict", createSnapshot({ source: "client" })],
    ["terminal conflict", createSnapshot({ status: "resolved" })],
    [
      "upsert versus upsert",
      createSnapshot({}, { localPayload: { id: entityId }, remotePayload: { id: entityId } }),
    ],
    ["delete versus delete", createSnapshot({}, { remotePayload: null })],
    ["unsupported conflict type", createSnapshot({}, { conflictType: "field_conflict" })],
    ["mismatched identity", createSnapshot({}, { id: "55555555-5555-4555-8555-555555555555" })],
    ["mismatched entity", createSnapshot({}, { entityId: "55555555-5555-4555-8555-555555555555" })],
    ["missing remote revision", createSnapshot({}, { remoteRevision: null })],
    ["fractional conflict revision", createSnapshot({}, { revision: 11.5 })],
    ["array payload", createSnapshot({}, { remotePayload: [] })],
    ["invalid detection time", createSnapshot({ detectedAt: "not-a-date" })],
  ])("rejects %s", (_name, snapshot) => {
    expect(toSyncConflictResolutionCandidate(snapshot)).toBeNull();
  });

  it("returns only candidates in deterministic detection order", () => {
    const laterConflictId = "66666666-6666-4666-8666-666666666666";
    const later = createSnapshot(
      {
        conflictId: laterConflictId,
        detectedAt: "2026-08-04T11:00:00.000Z",
      },
      { id: laterConflictId },
    );

    expect(
      listSyncConflictResolutionCandidates([
        later,
        createSnapshot({ source: "client" }),
        createSnapshot(),
      ]).map((candidate) => candidate.conflictId),
    ).toEqual([conflictId, laterConflictId]);
  });
});
