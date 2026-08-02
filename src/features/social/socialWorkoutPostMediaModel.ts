import { isApiError } from "@/api/client";
import {
  getSocialApiErrorCode,
  type SocialMediaOwnerAssetDto,
  type SocialWorkoutPostMediaInput,
} from "@/api/social";
import { SignedMediaUploadError } from "@/api/social/signed-media-upload";

import { SocialManagedAvatarImageError } from "./socialManagedAvatarErrors";

export type SocialWorkoutPostMediaOperation =
  | "idle"
  | "loading"
  | "selecting"
  | "preparing"
  | "uploading"
  | "completing"
  | "polling"
  | "deleting";

export type SocialWorkoutPostMediaCopy = {
  selectingImage: string;
  preparingImage: string;
  uploadingImage: string;
  completingImage: string;
  processingImage: string;
  removingImage: string;
  imageUploadPending: string;
  imageQuarantined: string;
  imageReviewRequired: string;
  imageApproved: string;
  imageRejected: string;
  imageFailed: string;
  imageDeleted: string;
  imagePermissionDenied: string;
  imageSelectionFailed: string;
  imageUnsupported: string;
  imageProcessingFailed: string;
  imageTooLarge: string;
  imageUploadExpired: string;
  imageUploadUnavailable: string;
  imageValidationFailed: string;
  imageOffline: string;
  imageSessionExpired: string;
  imageStale: string;
  imageAlreadyAttached: string;
  imageGenericError: string;
};

export const isSocialWorkoutPostMediaBusy = (
  operation: SocialWorkoutPostMediaOperation,
): boolean => operation !== "idle";

export const getSocialWorkoutPostMediaOperationLabel = (
  operation: SocialWorkoutPostMediaOperation,
  copy: SocialWorkoutPostMediaCopy,
): string | null => {
  switch (operation) {
    case "selecting":
      return copy.selectingImage;
    case "preparing":
      return copy.preparingImage;
    case "uploading":
      return copy.uploadingImage;
    case "completing":
      return copy.completingImage;
    case "polling":
      return copy.processingImage;
    case "deleting":
      return copy.removingImage;
    case "loading":
    case "idle":
      return null;
  }
};

export const getSocialWorkoutPostMediaStatus = (
  asset: SocialMediaOwnerAssetDto | null,
  copy: SocialWorkoutPostMediaCopy,
): string | null => {
  if (!asset) return null;
  switch (asset.state) {
    case "upload_pending":
      return copy.imageUploadPending;
    case "quarantined":
    case "processing":
      return copy.imageQuarantined;
    case "review_required":
      return copy.imageReviewRequired;
    case "approved":
      return copy.imageApproved;
    case "rejected":
      return copy.imageRejected;
    case "failed":
      return copy.imageFailed;
    case "deleted":
      return copy.imageDeleted;
  }
};

export const canRefreshSocialWorkoutPostMedia = (
  asset: SocialMediaOwnerAssetDto | null,
): boolean =>
  asset?.state === "upload_pending" ||
  asset?.state === "quarantined" ||
  asset?.state === "processing" ||
  asset?.state === "review_required";

export const getApprovedSocialWorkoutPostMediaInput = (
  asset: SocialMediaOwnerAssetDto | null,
): SocialWorkoutPostMediaInput | null =>
  asset?.assetType === "workout_post_image" &&
  asset.state === "approved" &&
  asset.publicDescriptor?.assetType === "workout_post_image"
    ? {
        schemaVersion: 1,
        assetId: asset.assetId,
        expectedStateVersion: asset.stateVersion,
      }
    : null;

export const getSocialWorkoutPostMediaErrorMessage = (
  error: unknown,
  copy: SocialWorkoutPostMediaCopy,
): string => {
  if (error instanceof SocialManagedAvatarImageError) {
    switch (error.code) {
      case "permission_denied":
        return copy.imagePermissionDenied;
      case "selection_failed":
        return copy.imageSelectionFailed;
      case "unsupported_image":
        return copy.imageUnsupported;
      case "processing_failed":
        return copy.imageProcessingFailed;
      case "too_large":
        return copy.imageTooLarge;
    }
  }
  if (error instanceof SignedMediaUploadError) {
    if (error.code === "expired") return copy.imageUploadExpired;
    if (error.code === "size_mismatch") return copy.imageProcessingFailed;
    if (error.code === "network") return copy.imageOffline;
    return copy.imageGenericError;
  }

  const code = getSocialApiErrorCode(error);
  if (
    code === "SOCIAL_MEDIA_UPLOADS_UNAVAILABLE" ||
    code === "SOCIAL_MEDIA_UPLOAD_STORAGE_UNAVAILABLE"
  ) {
    return copy.imageUploadUnavailable;
  }
  if (code === "SOCIAL_MEDIA_UPLOAD_EXPIRED") {
    return copy.imageUploadExpired;
  }
  if (code === "SOCIAL_MEDIA_UPLOAD_VALIDATION_FAILED") {
    return copy.imageValidationFailed;
  }
  if (
    code === "SOCIAL_MEDIA_UPLOAD_STALE_STATE" ||
    code === "SOCIAL_WORKOUT_POST_MEDIA_STALE_STATE"
  ) {
    return copy.imageStale;
  }
  if (code === "SOCIAL_WORKOUT_POST_MEDIA_ALREADY_ATTACHED") {
    return copy.imageAlreadyAttached;
  }
  if (
    code === "SOCIAL_MEDIA_UPLOAD_OBJECT_MISSING" ||
    code === "SOCIAL_MEDIA_UPLOAD_OBJECT_MISMATCH" ||
    code === "SOCIAL_MEDIA_UPLOAD_FINALIZED" ||
    code === "SOCIAL_WORKOUT_POST_MEDIA_NOT_FOUND" ||
    code === "SOCIAL_WORKOUT_POST_MEDIA_INVALID_TYPE" ||
    code === "SOCIAL_WORKOUT_POST_MEDIA_NOT_APPROVED"
  ) {
    return copy.imageGenericError;
  }
  if (isApiError(error)) {
    if (error.status === 401 || error.code === "unauthorized") {
      return copy.imageSessionExpired;
    }
    if (error.code === "network_error" || error.code === "timeout") {
      return copy.imageOffline;
    }
  }
  return copy.imageGenericError;
};
