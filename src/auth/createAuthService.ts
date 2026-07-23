import type { ApiClient } from '@/api/client';
import { isApiError } from '@/api/client';

import {
  createRemoteProfileRepository,
  type RemoteProfileRepository,
} from '@/repositories/RemoteProfileRepository';

import { getDefaultAuthDeviceInfo } from './device';
import { createTokenManager } from './token-manager';
import type {
  AuthCredentials,
  AuthEnvelope,
  AuthProfileUpdate,
  AuthService,
  AuthSession,
  AuthTokens,
  CreateAuthServiceOptions,
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

const parseSessionMetadata = (value: string | null): ParsedSessionMetadata | null => {
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
  sessionStorageKey = AUTH_SESSION_STORAGE_KEY,
  defaultDevice = getDefaultAuthDeviceInfo(),
  onSessionChange,
}: CreateAuthServiceOptions): AuthService & { profileRepository: RemoteProfileRepository } => {
  const profileRepository = createRemoteProfileRepository(apiClient, tokenManager);

  const saveSession = async (session: AuthSession): Promise<AuthSession> => {
    await tokenManager.saveTokens(session.tokens);
    await persistSessionMetadata(sessionStorage, sessionStorageKey, session);
    onSessionChange?.(session);
    return session;
  };

  const loadSession = async (): Promise<AuthSession | null> => {
    const parsed = parseSessionMetadata(await sessionStorage.read(sessionStorageKey));
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

    if (!tokenManager.isAccessTokenExpired(tokens.accessToken)) return cachedSession;

    const refreshed = await refresh();
    if (refreshed) return refreshed;

    const currentTokens = await tokenManager.loadTokens();
    return currentTokens ? { ...parsed.metadata, tokens: currentTokens } : null;
  };

  const performAuth = async (
    path: '/v1/auth/register' | '/v1/auth/login',
    credentials: AuthCredentials,
  ): Promise<AuthSession> => {
    const response = await apiClient.post<AuthEnvelope, Record<string, unknown>>(
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

  const refresh = async (): Promise<AuthSession | null> => {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await apiClient.post<AuthEnvelope, { refreshToken: string }>(
        '/v1/auth/refresh',
        { refreshToken },
        { retry: false },
      );
      return await saveSession(toSession(response));
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        await tokenManager.clearTokens();
        await sessionStorage.remove(sessionStorageKey);
        onSessionChange?.(null);
      }
      return null;
    }
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
    register: (credentials) => performAuth('/v1/auth/register', credentials),
    login: (credentials) => performAuth('/v1/auth/login', credentials),
    refresh,
    logout: async () => {
      const accessToken = await tokenManager.getAccessToken();
      try {
        if (accessToken) {
          await apiClient.post<void, undefined>('/v1/auth/logout', undefined, {
            headers: authHeader(accessToken),
            retry: false,
          });
        }
      } catch {
        // Offline fallback: always clear local session.
      } finally {
        await tokenManager.clearTokens();
        await sessionStorage.remove(sessionStorageKey);
        onSessionChange?.(null);
      }
    },
    fetchProfile: async () => {
      const accessToken = await getAccessToken();
      return accessToken ? profileRepository.fetchProfile(accessToken) : null;
    },
    updateProfile: async (patch: AuthProfileUpdate) => {
      const accessToken = await getAccessToken();
      return accessToken ? profileRepository.updateProfile(patch, accessToken) : null;
    },
    getAccessToken,
    getCurrentSession: loadSession,
    isAuthenticated: async () => Boolean(await getAccessToken()),
  };
};
