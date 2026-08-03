import type {
  CreateSocialMediaUploadResult,
  SignedSocialMediaUploadDto,
  SocialMediaOwnerAssetDto,
  SocialMediaUploadType,
} from "@/api/social";

export type PreparedManagedMediaUpload = {
  uri: string;
  byteSize: number;
  mediaType: SocialMediaUploadType;
};

export type ManagedMediaUploadCompositionStage =
  | "uploading"
  | "completing";

export type ManagedMediaSignedUploadInput = PreparedManagedMediaUpload & {
  upload: SignedSocialMediaUploadDto;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

export type ManagedMediaUploadCompositionResult =
  | {
      outcome: "completed";
      asset: SocialMediaOwnerAssetDto;
    }
  | {
      outcome: "cancelled";
    };

export type ManagedMediaUploadCompositionInput = {
  prepared: PreparedManagedMediaUpload;
  createUpload(): Promise<CreateSocialMediaUploadResult>;
  persistDraft(asset: SocialMediaOwnerAssetDto): Promise<void>;
  uploadSigned(input: ManagedMediaSignedUploadInput): Promise<void>;
  completeUpload(
    assetId: string,
    expectedStateVersion: number,
  ): Promise<SocialMediaOwnerAssetDto>;
  validateAsset(asset: SocialMediaOwnerAssetDto): void;
  isCurrent(): boolean;
  onAsset(asset: SocialMediaOwnerAssetDto): void;
  onStage(stage: ManagedMediaUploadCompositionStage): void;
  onProgress(progress: number): void;
  signal?: AbortSignal;
};

export const runManagedMediaUploadComposition = async ({
  prepared,
  createUpload,
  persistDraft,
  uploadSigned,
  completeUpload,
  validateAsset,
  isCurrent,
  onAsset,
  onStage,
  onProgress,
  signal,
}: ManagedMediaUploadCompositionInput): Promise<ManagedMediaUploadCompositionResult> => {
  const created = await createUpload();
  validateAsset(created.asset);
  await persistDraft(created.asset);

  if (!isCurrent()) return { outcome: "cancelled" };
  onAsset(created.asset);
  onStage("uploading");
  onProgress(0);

  await uploadSigned({
    ...prepared,
    upload: created.upload,
    onProgress: (progress) => {
      if (isCurrent()) onProgress(progress);
    },
    ...(signal ? { signal } : {}),
  });

  if (!isCurrent()) return { outcome: "cancelled" };
  onStage("completing");

  const completed = await completeUpload(
    created.asset.assetId,
    created.asset.stateVersion,
  );
  validateAsset(completed);

  if (!isCurrent()) return { outcome: "cancelled" };
  onAsset(completed);
  return { outcome: "completed", asset: completed };
};
