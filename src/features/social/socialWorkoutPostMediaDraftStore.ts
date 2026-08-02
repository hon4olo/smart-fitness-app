import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "smart-fitness:social-workout-post-media:v1:";
const MAX_PREVIEW_URI_LENGTH = 4_096;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export type SocialWorkoutPostMediaDraft = {
  schemaVersion: 1;
  assetId: string;
  previewUri: string | null;
  updatedAt: string;
};

const keyForDraft = (accountId: string, sessionId: string): string =>
  `${STORAGE_PREFIX}${accountId}:${sessionId}`;

const isDraft = (value: unknown): value is SocialWorkoutPostMediaDraft => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Object.keys(candidate).length === 4 &&
    candidate.schemaVersion === 1 &&
    typeof candidate.assetId === "string" &&
    UUID_PATTERN.test(candidate.assetId) &&
    (candidate.previewUri === null ||
      (typeof candidate.previewUri === "string" &&
        candidate.previewUri.length > 0 &&
        candidate.previewUri.length <= MAX_PREVIEW_URI_LENGTH)) &&
    typeof candidate.updatedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.updatedAt))
  );
};

export const loadSocialWorkoutPostMediaDraft = async (
  accountId: string,
  sessionId: string,
): Promise<SocialWorkoutPostMediaDraft | null> => {
  const storageKey = keyForDraft(accountId, sessionId);
  try {
    const stored = await AsyncStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isDraft(parsed)) {
      await AsyncStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveSocialWorkoutPostMediaDraft = async (
  accountId: string,
  sessionId: string,
  draft: Omit<SocialWorkoutPostMediaDraft, "schemaVersion" | "updatedAt">,
): Promise<void> => {
  const value: SocialWorkoutPostMediaDraft = {
    schemaVersion: 1,
    assetId: draft.assetId,
    previewUri: draft.previewUri,
    updatedAt: new Date().toISOString(),
  };
  if (!isDraft(value)) throw new Error("Workout post media draft is invalid");
  await AsyncStorage.setItem(
    keyForDraft(accountId, sessionId),
    JSON.stringify(value),
  );
};

export const clearSocialWorkoutPostMediaDraft = async (
  accountId: string,
  sessionId: string,
): Promise<void> => {
  await AsyncStorage.removeItem(keyForDraft(accountId, sessionId));
};
