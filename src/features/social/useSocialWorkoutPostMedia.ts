import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  uploadSignedSocialMedia,
  type SocialApi,
  type SocialMediaOwnerAssetDto,
  type SocialWorkoutPostMediaInput,
} from "@/api/social";

import {
  clearSocialWorkoutPostMediaDraft,
  loadSocialWorkoutPostMediaDraft,
  saveSocialWorkoutPostMediaDraft,
} from "./socialWorkoutPostMediaDraftStore";
import {
  prepareSocialWorkoutPostImage,
  recoverPendingSocialWorkoutPostImage,
  selectSocialWorkoutPostImage,
  type SelectedSocialWorkoutPostImage,
} from "./socialWorkoutPostImage";
import {
  getApprovedSocialWorkoutPostMediaInput,
  getSocialWorkoutPostMediaErrorMessage,
  type SocialWorkoutPostMediaCopy,
  type SocialWorkoutPostMediaOperation,
} from "./socialWorkoutPostMediaModel";

const POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2_000;

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const createIdempotencyKey = (): string => {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `workout-image-${randomUuid}`;
  return `workout-image-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const isTerminal = (asset: SocialMediaOwnerAssetDto): boolean =>
  asset.state === "approved" ||
  asset.state === "review_required" ||
  asset.state === "rejected" ||
  asset.state === "failed" ||
  asset.state === "deleted";

type UseSocialWorkoutPostMediaInput = {
  accountId: string | null;
  sessionId: string;
  api: SocialApi;
  copy: SocialWorkoutPostMediaCopy;
};

export type SocialWorkoutPostMediaController = {
  asset: SocialMediaOwnerAssetDto | null;
  attachment: SocialWorkoutPostMediaInput | null;
  previewUri: string | null;
  operation: SocialWorkoutPostMediaOperation;
  uploadProgress: number | null;
  errorMessage: string | null;
  hasImageDraft: boolean;
  chooseImage(): Promise<void>;
  refresh(): Promise<void>;
  remove(): Promise<void>;
  releaseAfterPublish(): Promise<void>;
  clearError(): void;
};

export const useSocialWorkoutPostMedia = ({
  accountId,
  sessionId,
  api,
  copy,
}: UseSocialWorkoutPostMediaInput): SocialWorkoutPostMediaController => {
  const sequence = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const recoveredPendingKey = useRef<string | null>(null);
  const [asset, setAsset] = useState<SocialMediaOwnerAssetDto | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [operation, setOperation] =
    useState<SocialWorkoutPostMediaOperation>("loading");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const attachment = useMemo(
    () => getApprovedSocialWorkoutPostMediaInput(asset),
    [asset],
  );

  const isCurrent = useCallback(
    (requestSequence: number): boolean => requestSequence === sequence.current,
    [],
  );

  const clearDraft = useCallback(
    async (requestSequence?: number) => {
      if (accountId && sessionId) {
        await clearSocialWorkoutPostMediaDraft(accountId, sessionId);
      }
      if (requestSequence !== undefined && !isCurrent(requestSequence)) return;
      setAsset(null);
      setPreviewUri(null);
    },
    [accountId, isCurrent, sessionId],
  );

  const refreshAsset = useCallback(
    async (
      assetId: string,
      requestSequence: number,
    ): Promise<SocialMediaOwnerAssetDto> => {
      const next = await api.getMediaAsset(assetId);
      if (!isCurrent(requestSequence)) return next;
      if (next.assetType !== "workout_post_image") {
        await clearDraft(requestSequence);
        throw new Error("Invalid workout post media asset type");
      }
      setAsset(next);
      if (next.state === "deleted") await clearDraft(requestSequence);
      return next;
    },
    [api, clearDraft, isCurrent],
  );

  const pollAsset = useCallback(
    async (assetId: string, requestSequence: number): Promise<void> => {
      if (!isCurrent(requestSequence)) return;
      setOperation("polling");
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        if (!isCurrent(requestSequence)) return;
        const next = await refreshAsset(assetId, requestSequence);
        if (isTerminal(next)) return;
        await wait(POLL_INTERVAL_MS);
      }
    },
    [isCurrent, refreshAsset],
  );

  const load = useCallback(async () => {
    const requestSequence = ++sequence.current;
    abortController.current?.abort();
    setAsset(null);
    setPreviewUri(null);
    setUploadProgress(null);
    setErrorMessage(null);
    if (!accountId || !sessionId) {
      setOperation("idle");
      return;
    }
    setOperation("loading");
    try {
      const draft = await loadSocialWorkoutPostMediaDraft(accountId, sessionId);
      if (!isCurrent(requestSequence) || !draft) return;
      setPreviewUri(draft.previewUri);
      const restored = await api.getMediaAsset(draft.assetId);
      if (!isCurrent(requestSequence)) return;
      if (
        restored.assetType !== "workout_post_image" ||
        restored.state === "deleted"
      ) {
        await clearDraft(requestSequence);
        return;
      }
      setAsset(restored);
    } catch (error) {
      if (isCurrent(requestSequence)) {
        setErrorMessage(getSocialWorkoutPostMediaErrorMessage(error, copy));
      }
    } finally {
      if (isCurrent(requestSequence)) setOperation("idle");
    }
  }, [accountId, api, clearDraft, copy, isCurrent, sessionId]);

  useEffect(() => {
    void load();
    return () => {
      sequence.current += 1;
      abortController.current?.abort();
    };
  }, [load]);

  const uploadSelected = useCallback(
    async (selected: SelectedSocialWorkoutPostImage): Promise<void> => {
      if (!accountId || !sessionId) return;
      const requestSequence = ++sequence.current;
      setPreviewUri(selected.uri);
      setErrorMessage(null);
      setUploadProgress(null);
      setOperation("preparing");
      try {
        const prepared = await prepareSocialWorkoutPostImage(selected);
        if (!isCurrent(requestSequence)) return;
        setPreviewUri(prepared.uri);
        const created = await api.createWorkoutPostImageUpload({
          schemaVersion: 1,
          assetType: "workout_post_image",
          mediaType: prepared.mediaType,
          byteSize: prepared.byteSize,
          idempotencyKey: createIdempotencyKey(),
        });
        if (created.asset.assetType !== "workout_post_image") {
          throw new Error("Invalid workout post media asset type");
        }
        await saveSocialWorkoutPostMediaDraft(accountId, sessionId, {
          assetId: created.asset.assetId,
          previewUri: prepared.uri,
        });
        if (!isCurrent(requestSequence)) return;
        setAsset(created.asset);
        const controller = new AbortController();
        abortController.current = controller;
        setOperation("uploading");
        setUploadProgress(0);
        await uploadSignedSocialMedia({
          uri: prepared.uri,
          byteSize: prepared.byteSize,
          mediaType: prepared.mediaType,
          upload: created.upload,
          onProgress: (value) => {
            if (isCurrent(requestSequence)) setUploadProgress(value);
          },
          signal: controller.signal,
        });
        if (!isCurrent(requestSequence)) return;
        setOperation("completing");
        const completed = await api.completeMediaUpload(
          created.asset.assetId,
          created.asset.stateVersion,
        );
        if (!isCurrent(requestSequence)) return;
        setAsset(completed);
        await pollAsset(completed.assetId, requestSequence);
      } catch (error) {
        if (isCurrent(requestSequence)) {
          setErrorMessage(getSocialWorkoutPostMediaErrorMessage(error, copy));
        }
      } finally {
        if (isCurrent(requestSequence)) {
          setOperation("idle");
          setUploadProgress(null);
        }
      }
    },
    [accountId, api, copy, isCurrent, pollAsset, sessionId],
  );

  const chooseImage = useCallback(async () => {
    if (!accountId || !sessionId || operation !== "idle") return;
    const requestSequence = sequence.current;
    const previousAsset = asset;
    setErrorMessage(null);
    setOperation("selecting");
    try {
      const selected = await selectSocialWorkoutPostImage();
      if (!selected || !isCurrent(requestSequence)) {
        if (isCurrent(requestSequence)) setOperation("idle");
        return;
      }
      if (previousAsset && previousAsset.state !== "deleted") {
        setOperation("deleting");
        await api.deleteMediaAsset(
          previousAsset.assetId,
          previousAsset.stateVersion,
        );
        if (!isCurrent(requestSequence)) return;
        await clearDraft(requestSequence);
        if (!isCurrent(requestSequence)) return;
      }
      await uploadSelected(selected);
    } catch (error) {
      if (isCurrent(requestSequence)) {
        setErrorMessage(getSocialWorkoutPostMediaErrorMessage(error, copy));
        setOperation("idle");
      }
    }
  }, [
    accountId,
    api,
    asset,
    clearDraft,
    copy,
    isCurrent,
    operation,
    sessionId,
    uploadSelected,
  ]);

  useEffect(() => {
    if (!accountId || !sessionId) {
      recoveredPendingKey.current = null;
      return;
    }
    const recoveryKey = `${accountId}:${sessionId}`;
    if (operation !== "idle" || recoveredPendingKey.current === recoveryKey) {
      return;
    }
    recoveredPendingKey.current = recoveryKey;
    const requestSequence = sequence.current;
    void recoverPendingSocialWorkoutPostImage()
      .then((selected) => {
        if (selected && isCurrent(requestSequence)) {
          void uploadSelected(selected);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent(requestSequence)) {
          setErrorMessage(getSocialWorkoutPostMediaErrorMessage(error, copy));
        }
      });
  }, [accountId, copy, operation, sessionId, uploadSelected]);

  const refresh = useCallback(async () => {
    if (operation !== "idle" || !asset) return;
    const requestSequence = sequence.current;
    setErrorMessage(null);
    setOperation("loading");
    try {
      await refreshAsset(asset.assetId, requestSequence);
    } catch (error) {
      if (isCurrent(requestSequence)) {
        setErrorMessage(getSocialWorkoutPostMediaErrorMessage(error, copy));
      }
    } finally {
      if (isCurrent(requestSequence)) setOperation("idle");
    }
  }, [asset, copy, isCurrent, operation, refreshAsset]);

  const remove = useCallback(async () => {
    if (operation !== "idle") return;
    const requestSequence = sequence.current;
    const target = asset;
    setErrorMessage(null);
    setOperation("deleting");
    try {
      if (target && target.state !== "deleted") {
        await api.deleteMediaAsset(target.assetId, target.stateVersion);
      }
      if (!isCurrent(requestSequence)) return;
      await clearDraft(requestSequence);
    } catch (error) {
      if (isCurrent(requestSequence)) {
        setErrorMessage(getSocialWorkoutPostMediaErrorMessage(error, copy));
      }
    } finally {
      if (isCurrent(requestSequence)) setOperation("idle");
    }
  }, [api, asset, clearDraft, copy, isCurrent, operation]);

  const releaseAfterPublish = useCallback(async () => {
    const requestSequence = ++sequence.current;
    abortController.current?.abort();
    if (accountId && sessionId) {
      await clearSocialWorkoutPostMediaDraft(accountId, sessionId);
    }
    if (!isCurrent(requestSequence)) return;
    setAsset(null);
    setPreviewUri(null);
  }, [accountId, isCurrent, sessionId]);

  return {
    asset,
    attachment,
    previewUri,
    operation,
    uploadProgress,
    errorMessage,
    hasImageDraft: Boolean(asset || previewUri),
    chooseImage,
    refresh,
    remove,
    releaseAfterPublish,
    clearError: () => setErrorMessage(null),
  };
};
