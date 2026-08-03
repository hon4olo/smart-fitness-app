import { describe, expect, it, vi } from "vitest";

import type {
  SocialMediaOwnerAssetDto,
  SocialMediaState,
} from "@/api/social";

import { pollManagedMediaAsset } from "./managedMediaPolling";

const createAsset = (
  state: SocialMediaState,
  stateVersion: number,
): SocialMediaOwnerAssetDto => ({
  schemaVersion: 1,
  assetId: "11111111-1111-4111-8111-111111111111",
  assetType: "workout_post_image",
  state,
  stateVersion,
  stateReasonCode: null,
  uploadExpiresAt: null,
  declaredMediaType: "image/jpeg",
  declaredByteSize: 3,
  source: null,
  moderation: null,
  publicDescriptor: null,
  createdAt: "2026-08-03T15:00:00.000Z",
  updatedAt: "2026-08-03T15:00:00.000Z",
  quarantinedAt: null,
  failedAt: null,
  deletedAt: null,
});

const isTerminal = (asset: SocialMediaOwnerAssetDto): boolean =>
  asset.state === "approved" ||
  asset.state === "review_required" ||
  asset.state === "rejected" ||
  asset.state === "failed" ||
  asset.state === "deleted";

describe("pollManagedMediaAsset", () => {
  it("stops immediately on the first terminal owner asset", async () => {
    const terminal = createAsset("approved", 3);
    const refreshAsset = vi.fn(async () => terminal);
    const wait = vi.fn(async () => undefined);

    const result = await pollManagedMediaAsset({
      assetId: terminal.assetId,
      attempts: 12,
      intervalMs: 2_000,
      isCurrent: () => true,
      refreshAsset,
      isTerminal,
      wait,
    });

    expect(result).toEqual({ outcome: "terminal", asset: terminal });
    expect(refreshAsset).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it("preserves the bounded wait after every non-terminal attempt", async () => {
    const states = [
      createAsset("quarantined", 2),
      createAsset("processing", 3),
      createAsset("processing", 4),
    ];
    const refreshAsset = vi.fn(async () => states.shift()!);
    const wait = vi.fn(async () => undefined);

    const result = await pollManagedMediaAsset({
      assetId: "11111111-1111-4111-8111-111111111111",
      attempts: 3,
      intervalMs: 25,
      isCurrent: () => true,
      refreshAsset,
      isTerminal,
      wait,
    });

    expect(result).toEqual({
      outcome: "exhausted",
      asset: expect.objectContaining({ stateVersion: 4 }),
    });
    expect(refreshAsset).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenNthCalledWith(1, 25);
    expect(wait).toHaveBeenNthCalledWith(2, 25);
    expect(wait).toHaveBeenNthCalledWith(3, 25);
  });

  it("cancels before issuing a stale refresh", async () => {
    const refreshAsset = vi.fn(async () => createAsset("processing", 2));

    const result = await pollManagedMediaAsset({
      assetId: "11111111-1111-4111-8111-111111111111",
      attempts: 3,
      intervalMs: 25,
      isCurrent: () => false,
      refreshAsset,
      isTerminal,
      wait: vi.fn(async () => undefined),
    });

    expect(result).toEqual({ outcome: "cancelled" });
    expect(refreshAsset).not.toHaveBeenCalled();
  });

  it("cancels between attempts after the current request changes", async () => {
    let current = true;
    const refreshAsset = vi.fn(async () => createAsset("processing", 2));
    const wait = vi.fn(async () => {
      current = false;
    });

    const result = await pollManagedMediaAsset({
      assetId: "11111111-1111-4111-8111-111111111111",
      attempts: 3,
      intervalMs: 25,
      isCurrent: () => current,
      refreshAsset,
      isTerminal,
      wait,
    });

    expect(result).toEqual({ outcome: "cancelled" });
    expect(refreshAsset).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid bounds before any refresh", async () => {
    const refreshAsset = vi.fn(async () => createAsset("processing", 2));

    await expect(
      pollManagedMediaAsset({
        assetId: "11111111-1111-4111-8111-111111111111",
        attempts: 0,
        intervalMs: 25,
        isCurrent: () => true,
        refreshAsset,
        isTerminal,
      }),
    ).rejects.toThrow("polling attempts");

    expect(refreshAsset).not.toHaveBeenCalled();
  });

  it("propagates refresh failure without an automatic retry", async () => {
    const failure = new Error("bounded refresh failure");
    const refreshAsset = vi.fn(async () => {
      throw failure;
    });

    await expect(
      pollManagedMediaAsset({
        assetId: "11111111-1111-4111-8111-111111111111",
        attempts: 3,
        intervalMs: 25,
        isCurrent: () => true,
        refreshAsset,
        isTerminal,
        wait: vi.fn(async () => undefined),
      }),
    ).rejects.toBe(failure);

    expect(refreshAsset).toHaveBeenCalledTimes(1);
  });
});
