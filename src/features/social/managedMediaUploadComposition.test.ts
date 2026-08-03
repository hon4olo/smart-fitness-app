import { describe, expect, it, vi } from "vitest";

import type {
  CreateSocialMediaUploadResult,
  SocialMediaOwnerAssetDto,
  SocialMediaState,
} from "@/api/social";

import { runManagedMediaUploadComposition } from "./managedMediaUploadComposition";

const createAsset = ({
  assetId = "11111111-1111-4111-8111-111111111111",
  assetType = "workout_post_image",
  state = "upload_pending",
  stateVersion = 1,
}: {
  assetId?: string;
  assetType?: SocialMediaOwnerAssetDto["assetType"];
  state?: SocialMediaState;
  stateVersion?: number;
} = {}): SocialMediaOwnerAssetDto => ({
  schemaVersion: 1,
  assetId,
  assetType,
  state,
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

const createUploadResult = (
  asset: SocialMediaOwnerAssetDto = createAsset(),
): CreateSocialMediaUploadResult => ({
  asset,
  upload: {
    schemaVersion: 1,
    method: "PUT",
    url: "https://uploads.example.test/private-upload",
    headers: {
      "content-type": "image/jpeg",
      "content-length": "3",
    },
    expiresAt: "2026-08-03T18:00:00.000Z",
  },
});

const prepared = {
  uri: "file:///prepared.jpg",
  byteSize: 3,
  mediaType: "image/jpeg" as const,
};

const validateWorkoutImage = (asset: SocialMediaOwnerAssetDto): void => {
  if (asset.assetType !== "workout_post_image") {
    throw new Error("Invalid workout post media asset type");
  }
};

describe("runManagedMediaUploadComposition", () => {
  it("preserves create, draft, signed upload, and completion order", async () => {
    const events: string[] = [];
    const created = createUploadResult();
    const completed = createAsset({ state: "quarantined", stateVersion: 2 });
    const createUpload = vi.fn(async () => {
      events.push("create");
      return created;
    });
    const persistDraft = vi.fn(async () => {
      events.push("persist");
    });
    const uploadSigned = vi.fn(async (input) => {
      events.push("upload");
      input.onProgress?.(0.5);
    });
    const completeUpload = vi.fn(async () => {
      events.push("complete");
      return completed;
    });
    const onAsset = vi.fn((asset: SocialMediaOwnerAssetDto) => {
      events.push(`asset:${asset.state}`);
    });
    const onStage = vi.fn((stage: string) => {
      events.push(`stage:${stage}`);
    });
    const onProgress = vi.fn((progress: number) => {
      events.push(`progress:${progress}`);
    });

    const result = await runManagedMediaUploadComposition({
      prepared,
      createUpload,
      persistDraft,
      uploadSigned,
      completeUpload,
      validateAsset: validateWorkoutImage,
      isCurrent: () => true,
      onAsset,
      onStage,
      onProgress,
    });

    expect(result).toEqual({ outcome: "completed", asset: completed });
    expect(persistDraft).toHaveBeenCalledWith(created.asset);
    expect(uploadSigned).toHaveBeenCalledWith(
      expect.objectContaining({
        ...prepared,
        upload: created.upload,
      }),
    );
    expect(completeUpload).toHaveBeenCalledWith(
      created.asset.assetId,
      created.asset.stateVersion,
    );
    expect(events).toEqual([
      "create",
      "persist",
      "asset:upload_pending",
      "stage:uploading",
      "progress:0",
      "upload",
      "progress:0.5",
      "stage:completing",
      "complete",
      "asset:quarantined",
    ]);
  });

  it("persists the created asset before respecting stale cancellation", async () => {
    let current = true;
    const created = createUploadResult();
    const persistDraft = vi.fn(async () => {
      current = false;
    });
    const uploadSigned = vi.fn(async () => undefined);
    const completeUpload = vi.fn(async () => createAsset());
    const onAsset = vi.fn();

    const result = await runManagedMediaUploadComposition({
      prepared,
      createUpload: vi.fn(async () => created),
      persistDraft,
      uploadSigned,
      completeUpload,
      validateAsset: validateWorkoutImage,
      isCurrent: () => current,
      onAsset,
      onStage: vi.fn(),
      onProgress: vi.fn(),
    });

    expect(result).toEqual({ outcome: "cancelled" });
    expect(persistDraft).toHaveBeenCalledWith(created.asset);
    expect(uploadSigned).not.toHaveBeenCalled();
    expect(completeUpload).not.toHaveBeenCalled();
    expect(onAsset).not.toHaveBeenCalled();
  });

  it("does not complete after the signed upload becomes stale", async () => {
    let current = true;
    const completeUpload = vi.fn(async () => createAsset());

    const result = await runManagedMediaUploadComposition({
      prepared,
      createUpload: vi.fn(async () => createUploadResult()),
      persistDraft: vi.fn(async () => undefined),
      uploadSigned: vi.fn(async () => {
        current = false;
      }),
      completeUpload,
      validateAsset: validateWorkoutImage,
      isCurrent: () => current,
      onAsset: vi.fn(),
      onStage: vi.fn(),
      onProgress: vi.fn(),
    });

    expect(result).toEqual({ outcome: "cancelled" });
    expect(completeUpload).not.toHaveBeenCalled();
  });

  it("stops before persistence when the created asset violates domain policy", async () => {
    const persistDraft = vi.fn(async () => undefined);
    const uploadSigned = vi.fn(async () => undefined);

    await expect(
      runManagedMediaUploadComposition({
        prepared,
        createUpload: vi.fn(async () =>
          createUploadResult(createAsset({ assetType: "avatar" })),
        ),
        persistDraft,
        uploadSigned,
        completeUpload: vi.fn(async () => createAsset()),
        validateAsset: validateWorkoutImage,
        isCurrent: () => true,
        onAsset: vi.fn(),
        onStage: vi.fn(),
        onProgress: vi.fn(),
      }),
    ).rejects.toThrow("Invalid workout post media asset type");

    expect(persistDraft).not.toHaveBeenCalled();
    expect(uploadSigned).not.toHaveBeenCalled();
  });

  it("propagates signed upload failure without attempting completion", async () => {
    const completeUpload = vi.fn(async () => createAsset());
    const failure = new Error("bounded upload failure");

    await expect(
      runManagedMediaUploadComposition({
        prepared,
        createUpload: vi.fn(async () => createUploadResult()),
        persistDraft: vi.fn(async () => undefined),
        uploadSigned: vi.fn(async () => {
          throw failure;
        }),
        completeUpload,
        validateAsset: validateWorkoutImage,
        isCurrent: () => true,
        onAsset: vi.fn(),
        onStage: vi.fn(),
        onProgress: vi.fn(),
      }),
    ).rejects.toBe(failure);

    expect(completeUpload).not.toHaveBeenCalled();
  });
});
