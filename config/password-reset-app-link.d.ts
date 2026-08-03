import type { ExpoConfig } from 'expo/config';

type PasswordResetAppLink = {
  baseUrl: string;
  hostname: string;
  path: '/auth/reset-password';
};

declare const passwordResetAppLinkConfig: {
  PASSWORD_RESET_APP_LINK_ENV: 'PASSWORD_RESET_APP_LINK_BASE_URL';
  PASSWORD_RESET_ROUTE_PATH: '/auth/reset-password';
  parsePasswordResetAppLink(
    rawValue: string | undefined,
  ): PasswordResetAppLink | null;
  withPasswordResetAppLink(
    config: ExpoConfig,
    rawValue: string | undefined,
  ): ExpoConfig;
};

export = passwordResetAppLinkConfig;
