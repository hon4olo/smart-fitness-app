import { isApiError, type ApiClient } from '@/api/client';

import {
  clearAccountDeletionReceiptIdentity,
  createAccountDeletionReceiptIdentity,
  parseAccountDeletionReceiptStatus,
  persistAccountDeletionReceiptIdentity,
  readAccountDeletionReceiptIdentity,
  type AccountDeletionReceiptDeleteEnvelope,
  type AccountDeletionReceiptIdentity,
  type AccountDeletionReceiptIdentityFactory,
  type AccountDeletionReceiptStatusDto,
  type AccountDeletionReceiptStatusEnvelope,
} from './accountDeletionReceipt';
import type { AccountDeletionResult, AuthStorage } from './types';

type ConfirmedDeletionHandler = (
  userId: string,
) => Promise<AccountDeletionResult>;

type ControllerOptions = {
  apiClient: ApiClient;
  storage: AuthStorage;
  identityFactory?: AccountDeletionReceiptIdentityFactory;
  onConfirmedDeletion: ConfirmedDeletionHandler;
};

export type AccountDeletionReceiptController = {
  deleteAccount(input: {
    userId: string;
    password: string;
    accessToken: string;
  }): Promise<AccountDeletionResult>;
  reconcilePending(): Promise<'completed' | 'none' | 'unresolved'>;
};

const authHeader = (accessToken: string): Record<string, string> => ({
  authorization: `Bearer ${accessToken}`,
});

const readDeletionStatus = async (
  apiClient: ApiClient,
  identity: AccountDeletionReceiptIdentity,
): Promise<AccountDeletionReceiptStatusDto> => {
  const envelope = await apiClient.post<
    AccountDeletionReceiptStatusEnvelope,
    { requestId: string; statusSecret: string }
  >(
    '/v1/auth/account-deletion/status',
    {
      requestId: identity.requestId,
      statusSecret: identity.statusSecret,
    },
    { retry: false },
  );
  return parseAccountDeletionReceiptStatus(
    envelope.deletion,
    identity.requestId,
  );
};

const shouldDiscardUnregisteredIdentity = (error: unknown): boolean =>
  isApiError(error) && (error.status === 404 || error.status === 410);

export const createAccountDeletionReceiptController = ({
  apiClient,
  storage,
  identityFactory = createAccountDeletionReceiptIdentity,
  onConfirmedDeletion,
}: ControllerOptions): AccountDeletionReceiptController => {
  const finishConfirmedDeletion = async (
    identity: AccountDeletionReceiptIdentity,
  ): Promise<AccountDeletionResult> => {
    const result = await onConfirmedDeletion(identity.userId);
    if (!result.localCleanupComplete) return result;
    try {
      await clearAccountDeletionReceiptIdentity(storage);
      return result;
    } catch {
      return { localCleanupComplete: false };
    }
  };

  const reconcileIdentity = async (
    identity: AccountDeletionReceiptIdentity,
  ): Promise<'completed' | 'unresolved'> => {
    try {
      const status = await readDeletionStatus(apiClient, identity);
      if (status.status !== 'completed') return 'unresolved';
      await finishConfirmedDeletion(identity);
      return 'completed';
    } catch (error) {
      if (shouldDiscardUnregisteredIdentity(error)) {
        await clearAccountDeletionReceiptIdentity(storage);
      }
      return 'unresolved';
    }
  };

  return {
    async reconcilePending() {
      const identity = await readAccountDeletionReceiptIdentity(storage);
      if (!identity) return 'none';
      return reconcileIdentity(identity);
    },

    async deleteAccount({ userId, password, accessToken }) {
      let identity = await readAccountDeletionReceiptIdentity(storage);
      if (identity && identity.userId !== userId) {
        const reconciliation = await reconcileIdentity(identity);
        if (reconciliation !== 'completed') {
          throw new Error(
            'A different account deletion confirmation is still pending.',
          );
        }
        identity = null;
      }
      if (!identity) {
        identity = identityFactory(userId);
        await persistAccountDeletionReceiptIdentity(storage, identity);
      }

      try {
        const envelope = await apiClient.request<
          AccountDeletionReceiptDeleteEnvelope,
          {
            password: string;
            requestId: string;
            statusSecret: string;
          }
        >({
          method: 'DELETE',
          path: '/v1/auth/account',
          body: {
            password,
            requestId: identity.requestId,
            statusSecret: identity.statusSecret,
          },
          headers: authHeader(accessToken),
          retry: false,
        });
        const status = parseAccountDeletionReceiptStatus(
          envelope.deletion,
          identity.requestId,
        );
        if (status.status !== 'completed') {
          throw new Error('Account deletion confirmation is still pending.');
        }
        return finishConfirmedDeletion(identity);
      } catch (error) {
        try {
          const status = await readDeletionStatus(apiClient, identity);
          if (status.status === 'completed') {
            return finishConfirmedDeletion(identity);
          }
        } catch (statusError) {
          if (
            shouldDiscardUnregisteredIdentity(statusError) &&
            isApiError(error) &&
            (error.status === 400 ||
              error.status === 401 ||
              error.status === 404 ||
              error.status === 422)
          ) {
            await clearAccountDeletionReceiptIdentity(storage);
          }
        }
        throw error;
      }
    },
  };
};
