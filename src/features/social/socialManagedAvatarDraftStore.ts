import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'smart-fitness:social-managed-avatar:v1:';
const MAX_PREVIEW_URI_LENGTH = 4_096;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export type SocialManagedAvatarDraft = {
  schemaVersion: 1;
  assetId: string;
  previewUri: string | null;
  updatedAt: string;
};

const keyForAccount = (accountId: string): string =>
  `${STORAGE_PREFIX}${accountId}`;

const isDraft = (value: unknown): value is SocialManagedAvatarDraft => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Object.keys(candidate).length === 4 &&
    candidate.schemaVersion === 1 &&
    typeof candidate.assetId === 'string' &&
    UUID_PATTERN.test(candidate.assetId) &&
    (candidate.previewUri === null ||
      (typeof candidate.previewUri === 'string' &&
        candidate.previewUri.length > 0 &&
        candidate.previewUri.length <= MAX_PREVIEW_URI_LENGTH)) &&
    typeof candidate.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.updatedAt))
  );
};

export const loadSocialManagedAvatarDraft = async (
  accountId: string,
): Promise<SocialManagedAvatarDraft | null> => {
  try {
    const stored = await AsyncStorage.getItem(keyForAccount(accountId));
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isDraft(parsed)) {
      await AsyncStorage.removeItem(keyForAccount(accountId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveSocialManagedAvatarDraft = async (
  accountId: string,
  draft: Omit<SocialManagedAvatarDraft, 'schemaVersion' | 'updatedAt'>,
): Promise<void> => {
  const value: SocialManagedAvatarDraft = {
    schemaVersion: 1,
    assetId: draft.assetId,
    previewUri: draft.previewUri,
    updatedAt: new Date().toISOString(),
  };
  if (!isDraft(value)) throw new Error('Managed avatar draft is invalid');
  await AsyncStorage.setItem(keyForAccount(accountId), JSON.stringify(value));
};

export const clearSocialManagedAvatarDraft = async (
  accountId: string,
): Promise<void> => {
  await AsyncStorage.removeItem(keyForAccount(accountId));
};
