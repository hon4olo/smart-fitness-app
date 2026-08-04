import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "@/api/client";
import type { AuthService } from "@/auth";

import { createSyncConflictResolutionClient } from "./createSyncConflictResolutionClient";
import { SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION } from "./SyncConflictResolutionApi";

const conflictId = "55555555-5555-4555-8555-555555555555";
const entityId = "33333333-3333-4333-8333-333333333333";
const deviceId = "22222222-2222-4222-8222-222222222222";

const response = {
  schemaVersion: SYNC_CONFLICT_RESOLUTION_SCHEMA_VERSION,
  conflictId,
  entityType: "weightHistory",
  entityId,
  status: "resolved",
  choice: "keep_local",
  revision: 12,
  resolvedPayload: null,
  resolvedAt: "2026-08-04T08:30:00.000Z",
  duplicate: false,
} as const;

const createOptions = (request = vi.fn().mockResolvedValue(response)) => ({
  request,
  apiClient: { request } as unknown as ApiClient,
  authService: {
    getAccessToken: vi.fn().mockResolvedValue("access-token"),
    refresh: vi.fn().mockResolvedValue(null),
    getCurrentSession: vi.fn().mockResolvedValue({ device: { id: deviceId } }),
  } as unknown as Pick<
    AuthService,
    "getAccessToken" | "refresh" | "getCurrentSession"
  >,
});

describe("sync conflict resolution client", () => {
  it("derives device identity and sends the bounded request", async () => {
    const options = createOptions();
    const client = createSyncConflictResolutionClient(options);

    await expect(
      client.resolve({
        conflictId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        choice: "keep_local",
        idempotencyKey: `resolve:${conflictId}`,
      }),
    ).resolves.toEqual(response);

    expect(options.request).toHaveBeenCalledWith({
      method: "POST",
      path: `/v1/sync/conflicts/${conflictId}/resolve`,
      body: {
        deviceId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        choice: "keep_local",
        idempotencyKey: `resolve:${conflictId}`,
      },
      headers: { authorization: "Bearer access-token" },
      retry: false,
    });
  });

  it("fails closed when session identity or response shape is missing", async () => {
    const missingIdentity = createOptions();
    vi.mocked(missingIdentity.authService.getCurrentSession).mockResolvedValue(
      null,
    );
    const invalidResponse = createOptions(
      vi.fn().mockResolvedValue({ ...response, unexpected: true }),
    );

    await expect(
      createSyncConflictResolutionClient(missingIdentity).resolve({
        conflictId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        choice: "keep_local",
        idempotencyKey: "missing-identity",
      }),
    ).rejects.toThrow("authentication required");

    await expect(
      createSyncConflictResolutionClient(invalidResponse).resolve({
        conflictId,
        expectedConflictRevision: 11,
        expectedRemoteRevision: 8,
        choice: "keep_remote",
        idempotencyKey: "invalid-response",
      }),
    ).rejects.toThrow("invalid sync conflict resolution response");
  });
});
