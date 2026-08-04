import * as Crypto from 'expo-crypto';

export const getAccountDeletionSecureRandomBytes = (
  length: number,
): Uint8Array => {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('Invalid account deletion random byte length');
  }
  return Crypto.getRandomValues(new Uint8Array(length));
};
