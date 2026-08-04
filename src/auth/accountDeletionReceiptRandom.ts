export const getAccountDeletionSecureRandomBytes = (
  length: number,
): Uint8Array => {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('Invalid account deletion random byte length');
  }
  const crypto = globalThis.crypto;
  if (!crypto?.getRandomValues) {
    throw new Error('Cryptographically secure randomness is unavailable');
  }
  return crypto.getRandomValues(new Uint8Array(length));
};
