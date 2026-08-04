export const ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION = 1 as const;
export const PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY =
  'smart_fitness_pending_account_deletion_receipt_v1';

export type AccountDeletionReceiptStorage = {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export type AccountDeletionReceiptStatus = 'pending' | 'blocked' | 'completed';

export type AccountDeletionReceiptBlockerCode =
  | 'database_deletion_incomplete'
  | 'delivery_cleanup_incomplete'
  | 'legal_hold_active'
  | 'private_media_cleanup_incomplete'
  | 'server_cleanup_incomplete';

export type AccountDeletionReceiptIdentity = {
  schemaVersion: typeof ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION;
  userId: string;
  requestId: string;
  statusSecret: string;
  requestedAt: string;
};

export type AccountDeletionReceiptStatusDto = {
  schemaVersion: typeof ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION;
  requestId: string;
  status: AccountDeletionReceiptStatus;
  blockerCode: AccountDeletionReceiptBlockerCode | null;
  expiresAt: string;
  completedAt: string | null;
};

export type AccountDeletionReceiptStatusEnvelope = {
  deletion: AccountDeletionReceiptStatusDto;
};

export type AccountDeletionReceiptDeleteEnvelope = {
  success: true;
  deletion: AccountDeletionReceiptStatusDto;
};

export type AccountDeletionReceiptIdentityFactory = (
  userId: string,
) => AccountDeletionReceiptIdentity;

type CreateIdentityOptions = {
  now?: () => string;
  randomBytes?: (length: number) => Uint8Array;
};

const IDENTITY_KEYS = [
  'schemaVersion',
  'userId',
  'requestId',
  'statusSecret',
  'requestedAt',
] as const;
const STATUS_KEYS = [
  'schemaVersion',
  'requestId',
  'status',
  'blockerCode',
  'expiresAt',
  'completedAt',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const isStatusSecret = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{43,128}$/.test(value);

const defaultRandomBytes = (length: number): Uint8Array => {
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.getRandomValues) {
    throw new Error('Secure randomness is unavailable for account deletion');
  }
  return cryptoObject.getRandomValues(new Uint8Array(length));
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const toUuidV4 = (bytes: Uint8Array): string => {
  if (bytes.length !== 16) throw new Error('Invalid account deletion UUID bytes');
  const normalized = Uint8Array.from(bytes);
  normalized[6] = ((normalized[6] ?? 0) & 0x0f) | 0x40;
  normalized[8] = ((normalized[8] ?? 0) & 0x3f) | 0x80;
  const hex = toHex(normalized);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createAccountDeletionReceiptIdentity = (
  userId: string,
  options: CreateIdentityOptions = {},
): AccountDeletionReceiptIdentity => {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) throw new Error('Account deletion user is required');
  const randomBytes = options.randomBytes ?? defaultRandomBytes;
  const requestedAt = options.now?.() ?? new Date().toISOString();
  if (!isIsoTimestamp(requestedAt)) {
    throw new Error('Invalid account deletion receipt timestamp');
  }

  return {
    schemaVersion: ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION,
    userId: normalizedUserId,
    requestId: toUuidV4(randomBytes(16)),
    statusSecret: toHex(randomBytes(32)),
    requestedAt,
  };
};

export const parseAccountDeletionReceiptIdentity = (
  raw: string | null,
): AccountDeletionReceiptIdentity | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !hasExactKeys(parsed, IDENTITY_KEYS)) return null;
    if (
      parsed.schemaVersion !== ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION ||
      typeof parsed.userId !== 'string' ||
      !parsed.userId.trim() ||
      !isUuid(parsed.requestId) ||
      !isStatusSecret(parsed.statusSecret) ||
      !isIsoTimestamp(parsed.requestedAt)
    ) {
      return null;
    }
    return {
      schemaVersion: ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION,
      userId: parsed.userId.trim(),
      requestId: parsed.requestId,
      statusSecret: parsed.statusSecret,
      requestedAt: parsed.requestedAt,
    };
  } catch {
    return null;
  }
};

export const readAccountDeletionReceiptIdentity = async (
  storage: AccountDeletionReceiptStorage,
): Promise<AccountDeletionReceiptIdentity | null> => {
  const raw = await storage.read(PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY);
  const parsed = parseAccountDeletionReceiptIdentity(raw);
  if (raw && !parsed) {
    await storage.remove(PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY);
  }
  return parsed;
};

export const persistAccountDeletionReceiptIdentity = async (
  storage: AccountDeletionReceiptStorage,
  identity: AccountDeletionReceiptIdentity,
): Promise<void> => {
  const validated = parseAccountDeletionReceiptIdentity(JSON.stringify(identity));
  if (!validated) throw new Error('Invalid account deletion receipt identity');
  await storage.write(
    PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY,
    JSON.stringify(validated),
  );
};

export const clearAccountDeletionReceiptIdentity = async (
  storage: AccountDeletionReceiptStorage,
): Promise<void> => {
  await storage.remove(PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY);
};

export const parseAccountDeletionReceiptStatus = (
  value: unknown,
  expectedRequestId: string,
): AccountDeletionReceiptStatusDto => {
  if (!isRecord(value) || !hasExactKeys(value, STATUS_KEYS)) {
    throw new Error('Invalid account deletion status');
  }
  const status = value.status;
  const blockerCode = value.blockerCode;
  const validBlocker =
    blockerCode === null ||
    blockerCode === 'database_deletion_incomplete' ||
    blockerCode === 'delivery_cleanup_incomplete' ||
    blockerCode === 'legal_hold_active' ||
    blockerCode === 'private_media_cleanup_incomplete' ||
    blockerCode === 'server_cleanup_incomplete';
  if (
    value.schemaVersion !== ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION ||
    value.requestId !== expectedRequestId ||
    (status !== 'pending' && status !== 'blocked' && status !== 'completed') ||
    !validBlocker ||
    !isIsoTimestamp(value.expiresAt) ||
    (value.completedAt !== null && !isIsoTimestamp(value.completedAt)) ||
    (status === 'blocked' ? blockerCode === null : blockerCode !== null) ||
    (status === 'completed'
      ? value.completedAt === null
      : value.completedAt !== null)
  ) {
    throw new Error('Invalid account deletion status');
  }
  return {
    schemaVersion: ACCOUNT_DELETION_RECEIPT_SCHEMA_VERSION,
    requestId: expectedRequestId,
    status,
    blockerCode,
    expiresAt: value.expiresAt,
    completedAt: value.completedAt,
  };
};
