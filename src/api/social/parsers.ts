import type {
  SocialProfile,
  SocialProfileView,
  SocialRelationship,
} from './contracts';

const PROFILE_KEYS = new Set([
  'schemaVersion',
  'username',
  'displayName',
  'bio',
  'avatarUrl',
  'visibility',
  'createdAt',
  'updatedAt',
]);
const RELATIONSHIP_KEYS = new Set([
  'schemaVersion',
  'following',
  'followedBy',
  'outgoingRequest',
  'incomingRequest',
  'blockedByViewer',
  'blocksViewer',
]);
const PROFILE_ENVELOPE_KEYS = new Set(['profile']);
const PROFILE_VIEW_KEYS = new Set(['profile', 'relationship']);
const RELATIONSHIP_ENVELOPE_KEYS = new Set(['relationship']);
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertExactKeys = (
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  label: string,
): void => {
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new Error(`Invalid ${label} fields`);
  }
};

const readString = (
  value: unknown,
  field: string,
  maxLength: number,
): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error(`Invalid social ${field}`);
  }
  return value;
};

const readNullableString = (
  value: unknown,
  field: string,
  maxLength: number,
): string | null => {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new Error(`Invalid social ${field}`);
  }
  return value;
};

const readTimestamp = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) {
    throw new Error(`Invalid social ${field}`);
  }
  return value;
};

const readAvatarUrl = (value: unknown): string | null => {
  const avatarUrl = readNullableString(value, 'avatarUrl', 2_048);
  if (avatarUrl === null) return null;
  let parsed: URL;
  try {
    parsed = new URL(avatarUrl);
  } catch {
    throw new Error('Invalid social avatarUrl');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Invalid social avatarUrl');
  }
  return avatarUrl;
};

export const parseSocialProfile = (value: unknown): SocialProfile => {
  if (!isRecord(value)) throw new Error('Invalid social profile');
  assertExactKeys(value, PROFILE_KEYS, 'profile');
  if (value.schemaVersion !== 1) {
    throw new Error('Unsupported social profile schema');
  }
  const username = readString(value.username, 'username', 30);
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('Invalid social username');
  }
  if (value.visibility !== 'public' && value.visibility !== 'private') {
    throw new Error('Invalid social visibility');
  }
  return {
    schemaVersion: 1,
    username,
    displayName: readString(value.displayName, 'displayName', 80),
    bio: readNullableString(value.bio, 'bio', 280),
    avatarUrl: readAvatarUrl(value.avatarUrl),
    visibility: value.visibility,
    createdAt: readTimestamp(value.createdAt, 'createdAt'),
    updatedAt: readTimestamp(value.updatedAt, 'updatedAt'),
  };
};

export const parseSocialRelationship = (
  value: unknown,
): SocialRelationship => {
  if (!isRecord(value)) throw new Error('Invalid social relationship');
  assertExactKeys(value, RELATIONSHIP_KEYS, 'relationship');
  if (value.schemaVersion !== 1) {
    throw new Error('Unsupported social relationship schema');
  }
  const booleanFields = [
    'following',
    'followedBy',
    'outgoingRequest',
    'incomingRequest',
    'blockedByViewer',
    'blocksViewer',
  ] as const;
  if (booleanFields.some((field) => typeof value[field] !== 'boolean')) {
    throw new Error('Invalid social relationship state');
  }

  const relationship: SocialRelationship = {
    schemaVersion: 1,
    following: value.following as boolean,
    followedBy: value.followedBy as boolean,
    outgoingRequest: value.outgoingRequest as boolean,
    incomingRequest: value.incomingRequest as boolean,
    blockedByViewer: value.blockedByViewer as boolean,
    blocksViewer: value.blocksViewer as boolean,
  };
  const hasBlock = relationship.blockedByViewer || relationship.blocksViewer;
  const hasConnection =
    relationship.following ||
    relationship.followedBy ||
    relationship.outgoingRequest ||
    relationship.incomingRequest;
  if (
    (hasBlock && hasConnection) ||
    (relationship.following && relationship.outgoingRequest) ||
    (relationship.followedBy && relationship.incomingRequest)
  ) {
    throw new Error('Invalid social relationship state');
  }
  return relationship;
};

export const parseOwnSocialProfileEnvelope = (
  value: unknown,
): SocialProfile | null => {
  if (!isRecord(value)) throw new Error('Invalid social profile envelope');
  assertExactKeys(value, PROFILE_ENVELOPE_KEYS, 'profile envelope');
  return value.profile === null ? null : parseSocialProfile(value.profile);
};

export const parseSocialProfileView = (value: unknown): SocialProfileView => {
  if (!isRecord(value)) throw new Error('Invalid social profile view');
  assertExactKeys(value, PROFILE_VIEW_KEYS, 'profile view');
  return {
    profile: parseSocialProfile(value.profile),
    relationship: parseSocialRelationship(value.relationship),
  };
};

export const parseSocialRelationshipEnvelope = (
  value: unknown,
): SocialRelationship => {
  if (!isRecord(value)) throw new Error('Invalid social relationship envelope');
  assertExactKeys(value, RELATIONSHIP_ENVELOPE_KEYS, 'relationship envelope');
  return parseSocialRelationship(value.relationship);
};
