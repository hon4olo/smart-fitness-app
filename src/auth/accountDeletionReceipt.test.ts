import { describe, expect, it } from 'vitest';

import {
  PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY,
  createAccountDeletionReceiptIdentity,
  parseAccountDeletionReceiptIdentity,
  parseAccountDeletionReceiptStatus,
  readAccountDeletionReceiptIdentity,
  type AccountDeletionReceiptStorage,
} from './accountDeletionReceipt';

const createMemoryStorage = (
  initial: Record<string, string> = {},
): AccountDeletionReceiptStorage & { values: Map<string, string> } => {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
  };
};

describe('account deletion receipt identity', () => {
  it('creates a UUID v4 and a 256-bit secret from injected secure bytes', () => {
    let offset = 0;
    const identity = createAccountDeletionReceiptIdentity(' user-1 ', {
      now: () => '2026-08-04T18:00:00.000Z',
      randomBytes: (length) => {
        const bytes = Uint8Array.from(
          { length },
          (_, index) => (offset + index) % 256,
        );
        offset += length;
        return bytes;
      },
    });

    expect(identity).toMatchObject({
      schemaVersion: 1,
      userId: 'user-1',
      requestedAt: '2026-08-04T18:00:00.000Z',
    });
    expect(identity.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(identity.statusSecret).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects malformed or secret-free persisted receipt data', () => {
    expect(
      parseAccountDeletionReceiptIdentity(
        JSON.stringify({
          schemaVersion: 1,
          userId: 'user-1',
          requestId: '11111111-1111-4111-8111-111111111111',
          requestedAt: '2026-08-04T18:00:00.000Z',
        }),
      ),
    ).toBeNull();
  });

  it('removes malformed secure receipt state during read', async () => {
    const storage = createMemoryStorage({
      [PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY]: '{broken',
    });

    await expect(readAccountDeletionReceiptIdentity(storage)).resolves.toBeNull();
    expect(
      storage.values.has(PENDING_ACCOUNT_DELETION_RECEIPT_STORAGE_KEY),
    ).toBe(false);
  });

  it('strictly validates bounded server status', () => {
    const requestId = '11111111-1111-4111-8111-111111111111';
    expect(
      parseAccountDeletionReceiptStatus(
        {
          schemaVersion: 1,
          requestId,
          status: 'completed',
          blockerCode: null,
          expiresAt: '2026-09-03T18:00:00.000Z',
          completedAt: '2026-08-04T18:00:01.000Z',
        },
        requestId,
      ),
    ).toMatchObject({ status: 'completed', blockerCode: null });

    expect(() =>
      parseAccountDeletionReceiptStatus(
        {
          schemaVersion: 1,
          requestId,
          status: 'completed',
          blockerCode: null,
          expiresAt: '2026-09-03T18:00:00.000Z',
          completedAt: null,
          rawPayload: { private: true },
        },
        requestId,
      ),
    ).toThrow('Invalid account deletion status');
  });
});
