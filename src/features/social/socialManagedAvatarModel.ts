import { isApiError } from "@/api/client";
import { getSocialApiErrorCode } from "@/api/social/error-parsers";
import type { SocialMediaOwnerAssetDto } from "@/api/social/media-contracts";
import { SignedMediaUploadError } from "@/api/social/signed-media-upload";

import type { SocialManagedAvatarCopy } from "./socialManagedAvatarCopy";
import { SocialManagedAvatarImageError } from "./socialManagedAvatarErrors";

export type SocialManagedAvatarOperation =
  | "idle"
  | "loading"
  | "selecting"
  | "preparing"
  | "uploading"
  | "completing"
  | "polling"
  | "binding"
  | "deleting";

export type SocialManagedAvatarStatusPresentation = {
  title: string;
  body: string;
};

export const getSocialManagedAvatarStatusPresentation = (
  asset: SocialMediaOwnerAssetDto | null,
  copy: SocialManagedAvatarCopy,
): SocialManagedAvatarStatusPresentation | null => {
  if (!asset) return null;
  switch (asset.state) {
    case "upload_pending":
      return { title: copy.uploadPendingTitle, body: copy.uploadPendingBody };
    case "quarantined":
      return { title: copy.quarantinedTitle, body: copy.quarantinedBody };
    case "processing":
      return { title: copy.processingTitle, body: copy.processingBody };
    case "review_required":
      return { title: copy.reviewTitle, body: copy.reviewBody };
    case "approved":
      return { title: copy.approvedTitle, body: copy.approvedBody };
    case "rejected":
      return { title: copy.rejectedTitle, body: copy.rejectedBody };
    case "failed":
      return { title: copy.failedTitle, body: copy.failedBody };
    case "deleted":
      return { title: copy.deletedTitle, body: copy.deletedBody };
  }
};

export const getSocialManagedAvatarOperationLabel = (
  operation: SocialManagedAvatarOperation,
  copy: SocialManagedAvatarCopy,
): string | null => {
  switch (operation) {
    case "selecting":
      return copy.selecting;
    case "preparing":
      return copy.preparing;
    case "uploading":
      return copy.uploading;
    case "completing":
      return copy.completing;
    case "polling":
      return copy.polling;
    case "binding":
      return copy.binding;
    case "deleting":
      return copy.removing;
    case "loading":
    case "idle":
      return null;
  }
};

export const isSocialManagedAvatarBusy = (
  operation: SocialManagedAvatarOperation,
): boolean => operation !== "idle" && operation !== "loading";

export const canRefreshSocialManagedAvatar = (
  asset: SocialMediaOwnerAssetDto | null,
): boolean =>
  asset?.state === "quarantined" ||
  asset?.state === "processing" ||
  asset?.state === "review_required";

export const canRetrySocialManagedAvatar = (
  asset: SocialMediaOwnerAssetDto | null,
): boolean =>
  asset?.state === "upload_pending" ||
  asset?.state === "rejected" ||
  asset?.state === "failed" ||
  asset?.state === "deleted";

export const getSocialManagedAvatarErrorMessage = (
  error: unknown,
  copy: SocialManagedAvatarCopy,
): string => {
  if (error instanceof SocialManagedAvatarImageError) {
    switch (error.code) {
      case "permission_denied":
        return copy.permissionDenied;
      case "selection_failed":
        return copy.selectionFailed;
      case "unsupported_image":
        return copy.unsupportedImage;
      case "processing_failed":
        return copy.processingFailed;
      case "too_large":
        return copy.tooLarge;
    }
  }
  if (error instanceof SignedMediaUploadError) {
    if (error.code === "expired") return copy.uploadExpired;
    if (error.code === "size_mismatch") return copy.processingFailed;
    if (error.code === "network") return copy.offline;
    return copy.genericError;
  }

  const code = getSocialApiErrorCode(error);
  if (
    code === "SOCIAL_MEDIA_UPLOADS_UNAVAILABLE" ||
    code === "SOCIAL_MEDIA_UPLOAD_STORAGE_UNAVAILABLE"
  ) {
    return copy.uploadUnavailable;
  }
  if (code === "SOCIAL_MEDIA_UPLOAD_EXPIRED") return copy.uploadExpired;
  if (code === "SOCIAL_MEDIA_UPLOAD_VALIDATION_FAILED") {
    return copy.validationFailed;
  }
  if (
    code === "SOCIAL_MEDIA_UPLOAD_STALE_STATE" ||
    code === "SOCIAL_MEDIA_AVATAR_STALE_STATE"
  ) {
    return copy.stale;
  }
  if (
    code === "SOCIAL_MEDIA_UPLOAD_OBJECT_MISSING" ||
    code === "SOCIAL_MEDIA_UPLOAD_OBJECT_MISMATCH" ||
    code === "SOCIAL_MEDIA_UPLOAD_FINALIZED" ||
    code === "SOCIAL_MEDIA_AVATAR_NOT_APPROVED"
  ) {
    return copy.genericError;
  }
  if (isApiError(error)) {
    if (error.status === 401 || error.code === "unauthorized") {
      return copy.sessionExpired;
    }
    if (error.code === "network_error" || error.code === "timeout") {
      return copy.offline;
    }
  }
  return copy.genericError;
};

export const getApprovedAvatarUrl = (
  asset: SocialMediaOwnerAssetDto | null,
): string | null =>
  asset?.state === "approved"
    ? (asset.publicDescriptor?.variants.avatar_256?.url ?? null)
    : null;
