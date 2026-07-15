import type { ApiClient } from '@/api/client';

export type AuthDeviceInfo = {
  deviceName: string;
  platform: string;
  appVersion: string;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthDevice = {
  id: string;
  userId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  lastSeenAt: string;
};

export type AuthSessionRecord = {
  id: string;
  userId: string;
  deviceId: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
};

export type AuthEnvelope = {
  user: AuthUser;
  device: AuthDevice;
  session: AuthSessionRecord;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
};

export type AuthProfile = Pick<AuthUser, 'id' | 'email' | 'displayName' | 'avatarUrl' | 'createdAt' | 'updatedAt'>;

export type AuthProfileUpdate = {
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
  displayName?: string;
  avatarUrl?: string | null;
  device?: Partial<AuthDeviceInfo>;
};

export type AuthSession = {
  user: AuthUser;
  device: AuthDevice;
  session: AuthSessionRecord;
  tokens: AuthTokens;
};

export type TokenManager = {
  loadTokens(): Promise<AuthTokens | null>;
  saveTokens(tokens: AuthTokens, now?: string): Promise<AuthTokens>;
  clearTokens(): Promise<void>;
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  isAccessTokenExpired(token?: string, now?: Date | string, skewSeconds?: number): boolean;
  isRefreshTokenExpired(token?: string, now?: Date | string, skewSeconds?: number): boolean;
};

export type AuthService = {
  loadSession(): Promise<AuthSession | null>;
  register(credentials: AuthCredentials): Promise<AuthSession>;
  login(credentials: AuthCredentials): Promise<AuthSession>;
  refresh(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  fetchProfile(): Promise<AuthProfile | null>;
  updateProfile(patch: AuthProfileUpdate): Promise<AuthProfile | null>;
  getAccessToken(): Promise<string | null>;
  getCurrentSession(): Promise<AuthSession | null>;
  isAuthenticated(): Promise<boolean>;
};

export type CreateAuthServiceOptions = {
  apiClient: ApiClient;
  tokenManager: TokenManager;
  sessionStorage: {
    read(key: string): Promise<string | null>;
    write(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  sessionStorageKey?: string;
  defaultDevice?: AuthDeviceInfo;
  onSessionChange?: (session: AuthSession | null) => void;
};
