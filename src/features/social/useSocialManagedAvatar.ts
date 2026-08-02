import { useCallback, useEffect, useRef, useState } from "react";

import {
  uploadSignedSocialMedia,
  type SocialApi,
  type SocialMediaOwnerAssetDto,
} from "@/api/social";

import type { SocialManagedAvatarCopy } from "./socialManagedAvatarCopy";
import {
  clearSocialManagedAvatarDraft,
  loadSocialManagedAvatarDraft,
  saveSocialManagedAvatarDraft,
} from "./socialManagedAvatarDraftStore";
import {
  prepareSocialAvatarImage,
  recoverPendingSocialAvatarImage,
  selectSocialAvatarImage,
  type SelectedSocialAvatarImage,
} from "./socialManagedAvatarImage";
import {
  getSocialManagedAvatarErrorMessage,
  type SocialManagedAvatarOperation,
} from "./socialManagedAvatarModel";

const POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2_000;

type UseSocialManagedAvatarInput = {
  accountId: string | null;
  api: SocialApi;
  copy: SocialManagedAvatarCopy;
  profileExists: boolean;
};

export type SocialManagedAvatarController = {
  currentAsset: SocialMediaOwnerAssetDto | null;
  candidateAsset: SocialMediaOwnerAssetDto | null;
  previewUri: string | null;
  operation: SocialManagedAvatarOperation;
  uploadProgress: number | null;
  errorMessage: string | null;
  profileExists: boolean;
  chooseImage(): Promise<void>;
  refresh(): Promise<void>;
  remove(): Promise<void>;
  clearError(): void;
};

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const createIdempotencyKey = (): string => {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `avatar-${randomUuid}`;
  return `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const isCandidateTerminal = (asset: SocialMediaOwnerAssetDto): boolean =>
  asset.state === "review_required" ||
  asset.state === "rejected" ||
  asset.state === "failed" ||
  asset.state === "deleted";

export const useSocialManagedAvatar = ({
  accountId,
  api,
  copy,
  profileExists,
}: UseSocialManagedAvatarInput): SocialManagedAvatarController => {
  const sequence = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const [currentAsset, setCurrentAsset] =
    useState<SocialMediaOwnerAssetDto | null>(null);
  const [candidateAsset, setCandidateAsset] =
    useState<SocialMediaOwnerAssetDto | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [operation, setOperation] =
    useState<SocialManagedAvatarOperation>("loading");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearDraft = useCallback(async () => {
    if (accountId) await clearSocialManagedAvatarDraft(accountId);
    setCandidateAsset(null);
    setPreviewUri(null);
  }, [accountId]);

  const bindApproved = useCallback(
    async (asset: SocialMediaOwnerAssetDto): Promise<void> => {
      if (
        !profileExists ||
        asset.state !== "approved" ||
        !asset.publicDescriptor
      ) {
        return;
      }
      setOperation("binding");
      const bound = await api.bindOwnManagedAvatar({
        schemaVersion: 1,
        assetId: asset.assetId,
        expectedStateVersion: asset.stateVersion,
      });
      setCurrentAsset(bound.asset);
      await clearDraft();
    },
    [api, clearDraft, profileExists],
  );

  const refreshCandidate = useCallback(
    async (assetId: string): Promise<SocialMediaOwnerAssetDto> => {
      const asset = await api.getMediaAsset(assetId);
      setCandidateAsset(asset);
      if (asset.state === "approved") await bindApproved(asset);
      if (asset.state === "deleted") await clearDraft();
      return asset;
    },
    [api, bindApproved, clearDraft],
  );

  const pollCandidate = useCallback(
    async (assetId: string, requestSequence: number): Promise<void> => {
      setOperation("polling");
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        if (requestSequence !== sequence.current) return;
        const asset = await refreshCandidate(assetId);
        if (asset.state === "approved" || isCandidateTerminal(asset)) return;
        await wait(POLL_INTERVAL_MS);
      }
    },
    [refreshCandidate],
  );

  const load = useCallback(async () => {
    const requestSequence = ++sequence.current;
    abortController.current?.abort();
    setOperation("loading");
    setErrorMessage(null);
    try {
      const [attached, draft] = await Promise.all([
        api.getOwnManagedAvatar(),
        accountId
          ? loadSocialManagedAvatarDraft(accountId)
          : Promise.resolve(null),
      ]);
      if (requestSequence !== sequence.current) return;
      setCurrentAsset(attached);
      if (!draft) {
        setCandidateAsset(null);
        setPreviewUri(null);
        return;
      }
      setPreviewUri(draft.previewUri);
      const candidate = await api.getMediaAsset(draft.assetId);
      if (requestSequence !== sequence.current) return;
      if (
        candidate.assetId === attached?.assetId ||
        candidate.state === "deleted"
      ) {
        await clearDraft();
        return;
      }
      setCandidateAsset(candidate);
      if (candidate.state === "approved") await bindApproved(candidate);
    } catch (error) {
      if (requestSequence === sequence.current) {
        setErrorMessage(getSocialManagedAvatarErrorMessage(error, copy));
      }
    } finally {
      if (requestSequence === sequence.current) setOperation("idle");
    }
  }, [accountId, api, bindApproved, clearDraft, copy]);

  useEffect(() => {
    void load();
    return () => {
      sequence.current += 1;
      abortController.current?.abort();
    };
  }, [load]);

  const uploadSelected = useCallback(
    async (selected: SelectedSocialAvatarImage): Promise<void> => {
      if (!accountId || !profileExists) return;
      const requestSequence = ++sequence.current;
      setPreviewUri(selected.uri);
      setErrorMessage(null);
      setUploadProgress(null);
      setOperation("preparing");
      try {
        const prepared = await prepareSocialAvatarImage(selected);
        if (requestSequence !== sequence.current) return;
        setPreviewUri(prepared.uri);
        const created = await api.createAvatarUpload({
          schemaVersion: 1,
          assetType: "avatar",
          mediaType: prepared.mediaType,
          byteSize: prepared.byteSize,
          idempotencyKey: createIdempotencyKey(),
        });
        setCandidateAsset(created.asset);
        await saveSocialManagedAvatarDraft(accountId, {
          assetId: created.asset.assetId,
          previewUri: prepared.uri,
        });
        const controller = new AbortController();
        abortController.current = controller;
        setOperation("uploading");
        setUploadProgress(0);
        await uploadSignedSocialMedia({
          uri: prepared.uri,
          byteSize: prepared.byteSize,
          mediaType: prepared.mediaType,
          upload: created.upload,
          onProgress: setUploadProgress,
          signal: controller.signal,
        });
        if (requestSequence !== sequence.current) return;
        setOperation("completing");
        const completed = await api.completeMediaUpload(
          created.asset.assetId,
          created.asset.stateVersion,
        );
        setCandidateAsset(completed);
        await pollCandidate(completed.assetId, requestSequence);
      } catch (error) {
        if (requestSequence === sequence.current) {
          setErrorMessage(getSocialManagedAvatarErrorMessage(error, copy));
        }
      } finally {
        if (requestSequence === sequence.current) {
          setOperation("idle");
          setUploadProgress(null);
        }
      }
    },
    [accountId, api, copy, pollCandidate, profileExists],
  );

  const chooseImage = useCallback(async () => {
    if (!accountId || !profileExists || operation !== "idle") return;
    setErrorMessage(null);
    setOperation("selecting");
    try {
      const selected = await selectSocialAvatarImage();
      if (!selected) {
        setOperation("idle");
        return;
      }
      await uploadSelected(selected);
    } catch (error) {
      setErrorMessage(getSocialManagedAvatarErrorMessage(error, copy));
      setOperation("idle");
    }
  }, [accountId, copy, operation, profileExists, uploadSelected]);

  useEffect(() => {
    if (!accountId || !profileExists || operation !== "idle") return;
    void recoverPendingSocialAvatarImage().then((selected) => {
      if (selected) void uploadSelected(selected);
    });
  }, [accountId, operation, profileExists, uploadSelected]);

  const refresh = useCallback(async () => {
    if (operation !== "idle") return;
    setErrorMessage(null);
    setOperation("loading");
    try {
      if (candidateAsset) {
        await refreshCandidate(candidateAsset.assetId);
      } else {
        setCurrentAsset(await api.getOwnManagedAvatar());
      }
    } catch (error) {
      setErrorMessage(getSocialManagedAvatarErrorMessage(error, copy));
    } finally {
      setOperation("idle");
    }
  }, [api, candidateAsset, copy, operation, refreshCandidate]);

  const remove = useCallback(async () => {
    if (operation !== "idle") return;
    const target = candidateAsset ?? currentAsset;
    if (!target || target.state === "deleted") return;
    setErrorMessage(null);
    setOperation("deleting");
    try {
      const deleted = await api.deleteMediaAsset(
        target.assetId,
        target.stateVersion,
      );
      if (candidateAsset) {
        setCandidateAsset(deleted);
        await clearDraft();
      } else {
        setCurrentAsset(null);
      }
    } catch (error) {
      setErrorMessage(getSocialManagedAvatarErrorMessage(error, copy));
    } finally {
      setOperation("idle");
    }
  }, [api, candidateAsset, clearDraft, copy, currentAsset, operation]);

  return {
    currentAsset,
    candidateAsset,
    previewUri,
    operation,
    uploadProgress,
    errorMessage,
    profileExists,
    chooseImage,
    refresh,
    remove,
    clearError: () => setErrorMessage(null),
  };
};
