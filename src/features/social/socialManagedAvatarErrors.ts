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
