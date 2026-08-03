import { describe, expect, it, vi } from "vitest";

import type {
  CreateSocialMediaUploadResult,
  SocialMediaOwnerAssetDto,
} from "@/api/social";

import { runManagedMediaUploadComposition } from "./managedMediaUploadComposition";

const createAvatarAsset = (
  stateVersion = 1,
  assetType: SocialMediaOwnerAssetDto["assetType"] = "avatar",
): SocialMediaOwnerAssetDto => ({
  schemaVersion: 1,
  assetId: "11111111-1111-4111-8111-111111111111",
  assetType,
  state: stateVersion === 1 ? "upload_pending" : "quarantined",
  stateVersion,
  stateReasonCode: null,
  uploadExpiresAt: "2026-08-03T18:00:00.000Z",
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

const createAvatarUpload = (): CreateSocialMediaUploadResult => ({
  asset: createAvatarAsset(),
  upload: {
    schemaVersion: 1,
    method: "PUT",
    url: "https://uploads.example.test/private-avatar",
    headers: { "content-type": "image/jpeg" },
    expiresAt: "2026-08-03T18:00:00.000Z",
  },
});

const validateAvatar = (asset: SocialMediaOwnerAssetDto): void => {
  if (asset.assetType !== "avatar") {
    throw new Error("Invalid managed avatar asset type");
  }
};

describe("managed avatar upload composition", () => {
  it("keeps candidate publication and draft persistence inside the avatar adapter", async () => {
    const events: string[] = [];
    const created = createAvatarUpload();
    const completed = createAvatarAsset(2);

    const result = await runManagedMediaUploadComposition({
      prepared: {
        uri: "file:///prepared-avatar.jpg",
        byteSize: 3,
        mediaType: "image/jpeg",
      },
      createUpload: vi.fn(async () => {
        events.push("create");
        return created;
      }),
      persistDraft: vi.fn(async (asset) => {
        events.push(`candidate:${asset.state}`);
        events.push("persist");
      }),
      uploadSigned: vi.fn(async () => {
        events.push("upload");
      }),
      completeUpload: vi.fn(async (assetId, expectedStateVersion) => {
        events.push(`complete:${assetId}:${expectedStateVersion}`);
        return completed;
      }),
      validateAsset: validateAvatar,
      isCurrent: () => true,
      onAsset: (asset) => events.push(`asset:${asset.state}`),
      onStage: (stage) => events.push(`stage:${stage}`),
      onProgress: (progress) => events.push(`progress:${progress}`),
    });

    expect(result).toEqual({ outcome: "completed", asset: completed });
    expect(events).toEqual([
      "create",
      "candidate:upload_pending",
      "persist",
      "asset:upload_pending",
      "stage:uploading",
      "progress:0",
      "upload",
      "stage:completing",
      `complete:${created.asset.assetId}:${created.asset.stateVersion}`,
      "asset:quarantined",
    ]);
  });

  it("fails closed when completion returns a non-avatar asset", async () => {
    const onAsset = vi.fn();

    await expect(
      runManagedMediaUploadComposition({
        prepared: {
          uri: "file:///prepared-avatar.jpg",
          byteSize: 3,
          mediaType: "image/jpeg",
        },
        createUpload: vi.fn(async () => createAvatarUpload()),
        persistDraft: vi.fn(async () => undefined),
        uploadSigned: vi.fn(async () => undefined),
        completeUpload: vi.fn(async () =>
          createAvatarAsset(2, "workout_post_image"),
        ),
        validateAsset: validateAvatar,
        isCurrent: () => true,
        onAsset,
        onStage: vi.fn(),
        onProgress: vi.fn(),
      }),
    ).rejects.toThrow("Invalid managed avatar asset type");

    expect(onAsset).toHaveBeenCalledTimes(1);
    expect(onAsset).toHaveBeenCalledWith(
      expect.objectContaining({ assetType: "avatar", stateVersion: 1 }),
    );
  });
});
