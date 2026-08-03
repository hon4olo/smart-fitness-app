import type { SocialMediaOwnerAssetDto } from "@/api/social";

export type ManagedMediaPollingResult =
  | {
      outcome: "terminal";
      asset: SocialMediaOwnerAssetDto;
    }
  | {
      outcome: "exhausted";
      asset: SocialMediaOwnerAssetDto;
    }
  | {
      outcome: "cancelled";
    };

export type ManagedMediaPollingInput = {
  assetId: string;
  attempts: number;
  intervalMs: number;
  isCurrent(): boolean;
  refreshAsset(assetId: string): Promise<SocialMediaOwnerAssetDto>;
  isTerminal(asset: SocialMediaOwnerAssetDto): boolean;
  wait?: (milliseconds: number) => Promise<void>;
};

const defaultWait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const pollManagedMediaAsset = async ({
  assetId,
  attempts,
  intervalMs,
  isCurrent,
  refreshAsset,
  isTerminal,
  wait = defaultWait,
}: ManagedMediaPollingInput): Promise<ManagedMediaPollingResult> => {
  if (!Number.isSafeInteger(attempts) || attempts < 1) {
    throw new Error("Managed media polling attempts are invalid");
  }
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 0) {
    throw new Error("Managed media polling interval is invalid");
  }

  let latest: SocialMediaOwnerAssetDto | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!isCurrent()) return { outcome: "cancelled" };
    latest = await refreshAsset(assetId);
    if (isTerminal(latest)) return { outcome: "terminal", asset: latest };
    await wait(intervalMs);
  }

  return { outcome: "exhausted", asset: latest as SocialMediaOwnerAssetDto };
};
