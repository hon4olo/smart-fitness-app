export type SocialProfileVisibility = 'public' | 'private';

export type SocialProfile = {
  schemaVersion: 1;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: SocialProfileVisibility;
  createdAt: string;
  updatedAt: string;
};

export type SocialRelationship = {
  schemaVersion: 1;
  following: boolean;
  followedBy: boolean;
  outgoingRequest: boolean;
  incomingRequest: boolean;
  blockedByViewer: boolean;
  blocksViewer: boolean;
};

export type SocialProfileView = {
  profile: SocialProfile;
  relationship: SocialRelationship;
};

export type UpsertSocialProfileInput = {
  username: string;
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  visibility?: SocialProfileVisibility;
};

export type SocialApi = {
  getOwnProfile(): Promise<SocialProfile | null>;
  upsertOwnProfile(input: UpsertSocialProfileInput): Promise<SocialProfile>;
  getProfile(username: string): Promise<SocialProfileView>;
  follow(username: string): Promise<SocialRelationship>;
  unfollow(username: string): Promise<SocialRelationship>;
  approveFollowRequest(username: string): Promise<SocialRelationship>;
  rejectFollowRequest(username: string): Promise<SocialRelationship>;
  block(username: string): Promise<SocialRelationship>;
  unblock(username: string): Promise<SocialRelationship>;
};

export type SocialApiAuth = {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
};

export type SocialApiAuthErrorCode =
  | 'SOCIAL_AUTH_REQUIRED'
  | 'SOCIAL_SESSION_EXPIRED';

export class SocialApiAuthError extends Error {
  constructor(readonly code: SocialApiAuthErrorCode) {
    super(code);
    this.name = 'SocialApiAuthError';
  }
}
