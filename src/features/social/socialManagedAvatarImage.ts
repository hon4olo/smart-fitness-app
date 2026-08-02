import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type SocialManagedAvatarImageErrorCode =
  | 'permission_denied'
  | 'selection_failed'
  | 'unsupported_image'
  | 'processing_failed'
  | 'too_large';

export class SocialManagedAvatarImageError extends Error {
  constructor(readonly code: SocialManagedAvatarImageErrorCode) {
    super(code);
    this.name = 'SocialManagedAvatarImageError';
  }
}

export type SelectedSocialAvatarImage = {
  uri: string;
  width: number;
  height: number;
};

export type PreparedSocialAvatarImage = SelectedSocialAvatarImage & {
  mediaType: 'image/jpeg';
  byteSize: number;
};

const MAX_LONG_EDGE = 2_048;
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

const toSelectedImage = (
  result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null,
): SelectedSocialAvatarImage | null => {
  if (!result || 'code' in result) {
    if (result && 'code' in result) {
      throw new SocialManagedAvatarImageError('selection_failed');
    }
    return null;
  }
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (
    !asset ||
    asset.type !== 'image' ||
    !asset.uri ||
    !Number.isFinite(asset.width) ||
    !Number.isFinite(asset.height) ||
    asset.width < 1 ||
    asset.height < 1
  ) {
    throw new SocialManagedAvatarImageError('unsupported_image');
  }
  return { uri: asset.uri, width: asset.width, height: asset.height };
};

export const selectSocialAvatarImage = async (): Promise<SelectedSocialAvatarImage | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new SocialManagedAvatarImageError('permission_denied');
  }
  try {
    return toSelectedImage(
      await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        exif: false,
        mediaTypes: ['images'],
        quality: 1,
        selectionLimit: 1,
      }),
    );
  } catch (error) {
    if (error instanceof SocialManagedAvatarImageError) throw error;
    throw new SocialManagedAvatarImageError('selection_failed');
  }
};

export const recoverPendingSocialAvatarImage = async (): Promise<SelectedSocialAvatarImage | null> => {
  try {
    return toSelectedImage(await ImagePicker.getPendingResultAsync());
  } catch (error) {
    if (error instanceof SocialManagedAvatarImageError) throw error;
    return null;
  }
};

const getBlobSize = async (uri: string): Promise<number> => {
  try {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Image cache entry was not readable');
    return (await response.blob()).size;
  } catch {
    throw new SocialManagedAvatarImageError('processing_failed');
  }
};

const renderJpeg = async (
  selected: SelectedSocialAvatarImage,
  compress: number,
): Promise<PreparedSocialAvatarImage> => {
  const context = ImageManipulator.manipulate(selected.uri);
  const longEdge = Math.max(selected.width, selected.height);
  if (longEdge > MAX_LONG_EDGE) {
    if (selected.width >= selected.height) {
      context.resize({ width: MAX_LONG_EDGE, height: null });
    } else {
      context.resize({ width: null, height: MAX_LONG_EDGE });
    }
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress,
    format: SaveFormat.JPEG,
  });
  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    mediaType: 'image/jpeg',
    byteSize: await getBlobSize(saved.uri),
  };
};

export const prepareSocialAvatarImage = async (
  selected: SelectedSocialAvatarImage,
): Promise<PreparedSocialAvatarImage> => {
  try {
    const primary = await renderJpeg(selected, 0.85);
    if (primary.byteSize <= MAX_AVATAR_BYTES) return primary;
    const fallback = await renderJpeg(selected, 0.72);
    if (fallback.byteSize <= MAX_AVATAR_BYTES) return fallback;
    throw new SocialManagedAvatarImageError('too_large');
  } catch (error) {
    if (error instanceof SocialManagedAvatarImageError) throw error;
    throw new SocialManagedAvatarImageError('processing_failed');
  }
};
