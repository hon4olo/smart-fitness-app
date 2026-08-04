import type { ApiClient } from '@/api/client';
import { isApiError } from '@/api/client';

import {
  createRemoteProfileRepository,
  type RemoteProfileRepository,
} from '@/repositories/RemoteProfileRepository';

import {
  completeLocalAccountCleanup,
  PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
} from './accountDataCleanup';
import { createAccountDeletionReceiptController } from './accountDeletionReceiptController';
import { getDefaultAuthDeviceInfo } from './device';
import type {
  AccountDeletionResult,
  AuthCredentials,
  AuthEnvelope,
  AuthProfileUpdate,
  AuthService,
  AuthSession,
  ChangePasswordInput,
  CreateAuthServiceOptions,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './types';

export const AUTH_SESSION_STORAGE_KEY = '@smart_fitness_mvp_auth_session';
const AUTH_SESSION_SCHEMA_VERSION = 2;

type PersistedAuthSession = Pick<AuthSession, 'user' | 'device' | 'session'> & {
  schemaVersion: typeof AUTH_SESSION_SCHEMA_VERSION;
  updatedAt: string;
};

type ParsedSessionMetadata = {
  metadata: Pick<AuthSession, 'user' | 'device' | 'session'>;
  requiresRewrite: boolean;
};

const authHeader = (token?: string): Record<string, string> | undefined =>
  token ? { authorization: `Bearer ${token}` } : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseSessionMetadata = (
  value: string | null,
): ParsedSessionMetadata | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) return null;

    const user = parsed.user;
    const device = parsed.device;
    const session = parsed.session;
    if (!isRecord(user) || !isRecord(device) || !isRecord(session)) return null;

    if (
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      typeof device.id !== 'string' ||
      typeof session.id !== 'string'
    ) {
      return null;
    }

    return {
      metadata: {
        user: user as AuthSession['user'],
        device: device as AuthSession['device'],
        session: session as AuthSession['session'],
      },
      requiresRewrite:
        parsed.schemaVersion !== AUTH_SESSION_SCHEMA_VERSION ||
        Object.prototype.hasOwnProperty.call(parsed, 'tokens') ||
        Object.prototype.hasOwnProperty.call(parsed, 'accessToken') ||
        Object.prototype.hasOwnProperty.call(parsed, 'refreshToken'),
    };
  } catch {
    return null;
  }
};

const persistSessionMetadata = async (
  storage: CreateAuthServiceOptions['sessionStorage'],
  storageKey: string,
  session: AuthSession,
  now = new Date().toISOString(),
): Promise<void> => {
  const envelope: PersistedAuthSession = {
    schemaVersion: AUTH_SESSION_SCHEMA_VERSION,
    user: session.user,
    device: session.device,
    session: session.session,
    updatedAt: now,
  };
  await storage.write(storageKey, JSON.stringify(envelope));
};

const toSession = (envelope: AuthEnvelope): AuthSession => ({
  user: envelope.user,
  device: envelope.device,
  session: envelope.session,
  tokens: {
    accessToken: envelope.accessToken,
    refreshToken: envelope.refreshToken,
    tokenType: envelope.tokenType,
  },
});

const mergeDeviceInfo = (
  credentials: AuthCredentials,
  defaults: ReturnType<typeof getDefaultAuthDeviceInfo>,
) => ({
  deviceName: credentials.device?.deviceName ?? defaults.deviceName,
  platform: credentials.device?.platform ?? defaults.platform,
  appVersion: credentials.device?.appVersion ?? defaults.appVersion,
});

export const createAuthService = ({
  apiClient,
  tokenManager,
  sessionStorage,
  accountCleanupMarkerStorage = sessionStorage,
  accountDeletionReceiptStorage = accountCleanupMarkerStorage,
  accountDeletionReceiptIdentityFactory,
  sessionStorageKey = AUTH_SESSION_STORAGE_KEY,
  defaultDevice = getDefaultAuthDeviceInfo(),
  onSessionChange,
  onAccountDeleted,
}: CreateAuthServiceOptions): AuthService & {
  profileRepository: RemoteProfileRepository;
} => {
  const profileRepository = createRemoteProfileRepository(apiClient, tokenManager);

  const saveSession = async (session: AuthSession): Promise<AuthSession> => {
    await tokenManager.saveTokens(session.tokens);
    await persistSessionMetadata(sessionStorage, sessionStorageKey, session);
    onSessionChange?.(session);
    return session;
  };

  const clearLocalSession = async (): Promise<boolean> => {
    const results = await Promise.allSettled([
      tokenManager.clearTokens(),
      sessionStorage.remove(sessionStorageKey),
    ]);
    onSessionChange?.(null);
    return results.every((result) => result.status === 'fulfilled');
  };

  const completeConfirmedDeletion = async (
    userId: string,
  ): Promise<AccountDeletionResult> => {
    let accountDataCleanupComplete = true;
    try {
      await onAccountDeleted?.(userId);
    } catch {
      accountDataCleanupComplete = false;
    }

    const authCleanupComplete = await clearLocalSession();
    let markerCleanupComplete = false;
    if (accountDataCleanupComplete && authCleanupComplete) {
      try {
        await completeLocalAccountCleanup(accountCleanupMarkerStorage);
        markerCleanupComplete = true;
      } catch {
        markerCleanupComplete = false;
      }
    }

    return {
      localCleanupComplete:
        accountDataCleanupComplete && authCleanupComplete && markerCleanupComplete,
    };
  };

  const deletionReceipts = createAccountDeletionReceiptController({
    apiClient,
    storage: accountDeletionReceiptStorage,
    identityFactory: accountDeletionReceiptIdentityFactory,
    onConfirmedDeletion: completeConfirmedDeletion,
  });

  const readCachedSession = async (): Promise<AuthSession | null> => {
    const parsed = parseSessionMetadata(
      await sessionStorage.read(sessionStorageKey),
    );
    if (!parsed) return null;

    const tokens = await tokenManager.loadTokens();
    if (!tokens) {
      await sessionStorage.remove(sessionStorageKey);
      return null;
    }

    const cachedSession: AuthSession = { ...parsed.metadata, tokens };
    if (parsed.requiresRewrite) {
      await persistSessionMetadata(sessionStorage, sessionStorageKey, cachedSession);
    }
    return cachedSession;
  };

  const refresh = async (): Promise<AuthSession | null> => {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post<
        AuthEnvelope,
        { refreshToken: string }
      >(
        '/v1/auth/refresh',
        { refreshToken },
        { retry: false },
      );
      return await saveSession(toSession(response));
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        await clearLocalSession();
      }
      return null;
    }
  };

  const loadSession = async (): Promise<AuthSession | null> => {
    if (
      await accountCleanupMarkerStorage.read(
        PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
      )
    ) {
      await clearLocalSession();
      return null;
    }

    const receiptResult = await deletionReceipts.reconcilePending();
    if (receiptResult === 'completed') return null;

    const cachedSession = await readCachedSession();
    if (!cachedSession) return null;
    if (
      !tokenManager.isAccessTokenExpired(cachedSession.tokens.accessToken)
    ) {
      return cachedSession;
    }

    const refreshed = await refresh();
    if (refreshed) return refreshed;

    const currentTokens = await tokenManager.loadTokens();
    return currentTokens
      ? { ...cachedSession, tokens: currentTokens }
      : null;
  };

  const performAuth = async (
    path: '/v1/auth/register' | '/v1/auth/login',
    credentials: AuthCredentials,
  ): Promise<AuthSession> => {
    const response = await apiClient.post<
      AuthEnvelope,
      Record<string, unknown>
    >(
      path,
      {
        email: credentials.email,
        password: credentials.password,
        displayName: credentials.displayName,
        avatarUrl: credentials.avatarUrl,
        ...mergeDeviceInfo(credentials, defaultDevice),
      },
      { retry: false },
    );

    return saveSession(toSession(response));
  };

  const getAccessToken = async (): Promise<string | null> => {
    const tokens = await tokenManager.loadTokens();
    if (!tokens) return null;

    if (tokenManager.isAccessTokenExpired(tokens.accessToken)) {
      return (await refresh())?.tokens.accessToken ?? null;
    }
    return tokens.accessToken;
  };

  return {
    profileRepository,
    loadSession,
    register: (credentials) =>
      performAuth('/v1/auth/register', credentials),
    login: (credentials) => performAuth('/v1/auth/login', credentials),
    refresh,
    logout: async () => {
      const accessToken = await tokenManager.getAccessToken();
      try {
        if (accessToken) {
          await apiClient.post<void, undefined>(
            '/v1/auth/logout',
            undefined,
            {
              headers: authHeader(accessToken),
              retry: false,
            },
          );
        }
      } catch {
        // Offline fallback: always clear local session.
      } finally {
        await clearLocalSession();
      }
    },
    changePassword: async (input: ChangePasswordInput): Promise<void> => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication is required to change the password.');
      }

      await apiClient.post<
        { success: true; requiresReauthentication: true },
        ChangePasswordInput
      >('/v1/auth/change-password', input, {
        headers: authHeader(accessToken),
        retry: false,
      });
      await clearLocalSession();
    },
    requestPasswordReset: async (input: ForgotPasswordInput): Promise<void> => {
      await apiClient.post<{ accepted: true }, ForgotPasswordInput>(
        '/v1/auth/forgot-password',
        input,
        { retry: false },
      );
    },
    resetPassword: async (input: ResetPasswordInput): Promise<void> => {
      await apiClient.post<
        { success: true; requiresReauthentication: true },
        ResetPasswordInput
      >('/v1/auth/reset-password', input, { retry: false });
      await clearLocalSession();
    },
    deleteAccount: async (password: string): Promise<AccountDeletionResult> => {
      const currentSession = await readCachedSession();
      const accessToken = await getAccessToken();
      if (!currentSession || !accessToken) {
        throw new Error('Authentication is required to delete the account.');
      }
      return deletionReceipts.deleteAccount({
        userId: currentSession.user.id,
        password,
        accessToken,
      });
    },
    fetchProfile: async () => {
      const accessToken = await getAccessToken();
      return accessToken
        ? profileRepository.fetchProfile(accessToken)
        : null;
    },
    updateProfile: async (patch: AuthProfileUpdate) => {
      const accessToken = await getAccessToken();
      return accessToken
        ? profileRepository.updateProfile(patch, accessToken)
        : null;
    },
    getAccessToken,
    getCurrentSession: loadSession,
    isAuthenticated: async () => Boolean(await getAccessToken()),
  };
};
