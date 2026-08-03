import type { ConfigContext, ExpoConfig } from 'expo/config';

import {
  PASSWORD_RESET_APP_LINK_ENV,
  withPasswordResetAppLink,
} from './src/config/passwordResetAppLink';

const environment = (
  globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env;

export default ({ config }: ConfigContext): ExpoConfig =>
  withPasswordResetAppLink(config, environment?.[PASSWORD_RESET_APP_LINK_ENV]);
