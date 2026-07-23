export { AuthProvider, AuthContext } from './AuthContext';
export { createAuthService, AUTH_SESSION_STORAGE_KEY } from './createAuthService';
export {
  AUTH_DISCLOSURE_COPY,
  buildProfileAuthViewModel,
  getSafeLoginErrorMessage,
  getSafeRegisterErrorMessage,
  resolveAuthGateStatus,
  validateLoginForm,
  validateRegisterForm,
  type AuthDisclosureCopy,
  type AuthFieldErrors,
  type AuthGateStatus,
  type LoginFormValues,
  type ProfileAuthViewModel,
  type RegisterFormValues,
} from './auth-ui';
export type {
  AuthCredentials,
  AuthDevice,
  AuthDeviceInfo,
  AuthEnvelope,
  AuthProfile,
  AuthProfileUpdate,
  AuthSession,
  AuthSessionRecord,
  AuthService,
  AuthTokens,
  CreateAuthServiceOptions,
  TokenManager,
} from './types';
export { getDefaultAuthDeviceInfo } from './device';
export {
  createMigratingTokenManager,
  SECURE_AUTH_TOKENS_STORAGE_KEY,
} from './migrating-token-manager';
export { createTokenManager, AUTH_TOKENS_STORAGE_KEY } from './token-manager';
