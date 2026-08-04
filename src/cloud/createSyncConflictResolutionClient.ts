import { isApiError, type ApiClient } from "@/api/client";
import type { AuthService } from "@/auth";

import {
  parseSyncConflictResolutionResult,
  type ResolveSyncConflictInput,
  type SyncConflictResolutionResult,
} from "./SyncConflictResolutionApi";

export type SyncConflictResolutionClient = {
  resolve(input: ResolveSyncConflictInput): Promise<SyncConflictResolutionResult>;
};

export type CreateSyncConflictResolutionClientOptions = {
  apiClient: ApiClient;
  authService: Pick<
    AuthService,
    "getAccessToken" | "refresh" | "getCurrentSession"
  >;
};

const requireIdentity = async (
  authService: CreateSyncConflictResolutionClientOptions["authService"],
): Promise<{ deviceId: string }> => {
  const session = await authService.getCurrentSession();
  if (!session?.device?.id) {
    throw new Error("authentication required");
  }
  return { deviceId: session.device.id };
};

const requestWithAuth = async (
  options: CreateSyncConflictResolutionClientOptions,
  path: string,
  body: unknown,
): Promise<unknown> => {
  const perform = (token: string) =>
    options.apiClient.request<unknown, unknown>({
      method: "POST",
      path,
      body,
      headers: { authorization: `Bearer ${token}` },
      retry: false,
    });

  const token = await options.authService.getAccessToken();
  if (!token) {
    throw new Error("authentication required");
  }

  try {
    return await perform(token);
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) {
      throw error;
    }

    const refreshed = await options.authService.refresh();
    const nextToken =
      refreshed?.tokens.accessToken ??
      (await options.authService.getAccessToken());
    if (!nextToken) {
      throw new Error("authentication required");
    }
    return perform(nextToken);
  }
};

export const createSyncConflictResolutionClient = (
  options: CreateSyncConflictResolutionClientOptions,
): SyncConflictResolutionClient => ({
  async resolve(input) {
    const identity = await requireIdentity(options.authService);
    const response = await requestWithAuth(
      options,
      `/v1/sync/conflicts/${encodeURIComponent(input.conflictId)}/resolve`,
      {
        deviceId: identity.deviceId,
        expectedConflictRevision: input.expectedConflictRevision,
        expectedRemoteRevision: input.expectedRemoteRevision,
        choice: input.choice,
        idempotencyKey: input.idempotencyKey,
      },
    );
    return parseSyncConflictResolutionResult(response);
  },
});
