import type { ConfigContext, ExpoConfig } from 'expo/config';

import passwordResetAppLinkConfig = require('./config/password-reset-app-link');

const { PASSWORD_RESET_APP_LINK_ENV, withPasswordResetAppLink } =
  passwordResetAppLinkConfig;

const environment = (
  globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env;

const requireStaticExpoConfig = (
  config: ConfigContext['config'],
): ExpoConfig => {
  if (!config.name || !config.slug) {
    throw new Error('Static Expo configuration must define name and slug');
  }
  return config as ExpoConfig;
};

export default ({ config }: ConfigContext): ExpoConfig =>
  withPasswordResetAppLink(
    requireStaticExpoConfig(config),
    environment?.[PASSWORD_RESET_APP_LINK_ENV],
  );
