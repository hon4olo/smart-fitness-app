import { createApiClient, type ApiClient } from "@/api/client";
import { getMobileApiBaseUrl } from "@/api/config";

import {
  requestSocialApiWithAuth,
  requireSocialPathSegment,
} from "./authenticated-request";
import type { SocialApiAuth } from "./contracts";
import type {
  BindSocialManagedAvatarInput,
  BindSocialManagedAvatarResult,
  CreateSocialMediaUploadInput,
  CreateSocialMediaUploadResult,
  SocialMediaOwnerAssetDto,
} from "./media-contracts";
import {
  parseBindManagedAvatarResponse,
  parseCreateSocialMediaUploadResponse,
  parseOwnManagedAvatarResponse,
  parseSocialMediaAssetResponse,
} from "./media-parsers";

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 12_000,
  defaultRetry: { attempts: 1, delayMs: 300, factor: 2 },
});

const requireAssetPath = (assetId: string): string =>
  requireSocialPathSegment(assetId, "Managed media asset ID");

export type SocialMediaApi = {
  createAvatarUpload(
    input: CreateSocialMediaUploadInput,
  ): Promise<CreateSocialMediaUploadResult>;
  completeMediaUpload(
    assetId: string,
    expectedStateVersion: number,
  ): Promise<SocialMediaOwnerAssetDto>;
  getMediaAsset(assetId: string): Promise<SocialMediaOwnerAssetDto>;
  deleteMediaAsset(
    assetId: string,
    expectedStateVersion: number,
  ): Promise<SocialMediaOwnerAssetDto>;
  getOwnManagedAvatar(): Promise<SocialMediaOwnerAssetDto | null>;
  bindOwnManagedAvatar(
    input: BindSocialManagedAvatarInput,
  ): Promise<BindSocialManagedAvatarResult>;
};

const stateVersionBody = (expectedStateVersion: number) => {
  if (!Number.isSafeInteger(expectedStateVersion) || expectedStateVersion < 1) {
    throw new Error("Managed media state version must be a positive integer");
  }
  return { schemaVersion: 1 as const, expectedStateVersion };
};

export const createSocialMediaApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient = defaultApiClient,
): SocialMediaApi => ({
  async createAvatarUpload(input) {
    if (
      input.schemaVersion !== 1 ||
      input.assetType !== "avatar" ||
      !Number.isSafeInteger(input.byteSize) ||
      input.byteSize < 1 ||
      input.byteSize > 8 * 1024 * 1024 ||
      input.idempotencyKey.trim().length < 16 ||
      input.idempotencyKey.trim().length > 128
    ) {
      throw new Error("Managed avatar upload input is invalid");
    }
    return parseCreateSocialMediaUploadResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        "POST",
        "/v1/social/media/uploads",
        { ...input, idempotencyKey: input.idempotencyKey.trim() },
      ),
    );
  },

  async completeMediaUpload(assetId, expectedStateVersion) {
    return parseSocialMediaAssetResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        "POST",
        `/v1/social/media/assets/${requireAssetPath(assetId)}/complete`,
        stateVersionBody(expectedStateVersion),
      ),
    );
  },

  async getMediaAsset(assetId) {
    return parseSocialMediaAssetResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        "GET",
        `/v1/social/media/assets/${requireAssetPath(assetId)}`,
      ),
    );
  },

  async deleteMediaAsset(assetId, expectedStateVersion) {
    return parseSocialMediaAssetResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        "DELETE",
        `/v1/social/media/assets/${requireAssetPath(assetId)}`,
        stateVersionBody(expectedStateVersion),
      ),
    );
  },

  async getOwnManagedAvatar() {
    return parseOwnManagedAvatarResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        "GET",
        "/v1/social/profile/avatar",
      ),
    );
  },

  async bindOwnManagedAvatar(input) {
    if (input.schemaVersion !== 1) {
      throw new Error("Managed avatar binding version is invalid");
    }
    return parseBindManagedAvatarResponse(
      await requestSocialApiWithAuth(
        auth,
        apiClient,
        "PUT",
        "/v1/social/profile/avatar",
        {
          schemaVersion: 1,
          assetId: requireSocialPathSegment(
            input.assetId,
            "Managed avatar asset ID",
          ),
          expectedStateVersion: stateVersionBody(input.expectedStateVersion)
            .expectedStateVersion,
        },
      ),
    );
  },
});
