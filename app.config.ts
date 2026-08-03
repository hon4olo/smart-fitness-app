import type { ConfigContext, ExpoConfig } from 'expo/config';

export const PASSWORD_RESET_APP_LINK_ENV =
  'PASSWORD_RESET_APP_LINK_BASE_URL' as const;
export const PASSWORD_RESET_ROUTE_PATH = '/auth/reset-password' as const;

const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

type AndroidIntentFilter = NonNullable<
  NonNullable<ExpoConfig['android']>['intentFilters']
>[number];
type AndroidIntentFilterData = NonNullable<AndroidIntentFilter['data']> extends infer Data
  ? Data extends ReadonlyArray<infer Entry>
    ? Entry
    : Data
  : never;

export type PasswordResetAppLink = {
  baseUrl: string;
  hostname: string;
  path: typeof PASSWORD_RESET_ROUTE_PATH;
};

const invalidConfiguration = (): Error =>
  new Error(
    `${PASSWORD_RESET_APP_LINK_ENV} must be an exact HTTPS reset route on a DNS hostname`,
  );

const isDnsHostname = (hostname: string): boolean => {
  if (
    hostname.length > 253 ||
    !hostname.includes('.') ||
    hostname.includes(':') ||
    /^\d+(?:\.\d+){3}$/u.test(hostname)
  ) {
    return false;
  }

  return hostname.split('.').every((label) => DNS_LABEL_PATTERN.test(label));
};

export const parsePasswordResetAppLink = (
  rawValue: string | undefined,
): PasswordResetAppLink | null => {
  const value = rawValue?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalidConfiguration();
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    url.pathname !== PASSWORD_RESET_ROUTE_PATH ||
    !isDnsHostname(url.hostname)
  ) {
    throw invalidConfiguration();
  }

  return {
    baseUrl: `https://${url.hostname}${PASSWORD_RESET_ROUTE_PATH}`,
    hostname: url.hostname,
    path: PASSWORD_RESET_ROUTE_PATH,
  };
};

const toIntentFilterData = (
  data: AndroidIntentFilter['data'],
): AndroidIntentFilterData[] => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const isPasswordResetIntentFilter = (
  filter: AndroidIntentFilter,
  link: PasswordResetAppLink,
): boolean =>
  filter.action === 'VIEW' &&
  filter.autoVerify === true &&
  filter.category?.includes('BROWSABLE') === true &&
  filter.category.includes('DEFAULT') &&
  toIntentFilterData(filter.data).some(
    (entry) =>
      entry.scheme === 'https' &&
      entry.host === link.hostname &&
      entry.pathPrefix === link.path,
  );

export const withPasswordResetAppLink = (
  config: ExpoConfig,
  rawValue: string | undefined,
): ExpoConfig => {
  const link = parsePasswordResetAppLink(rawValue);
  if (!link) return config;

  const associatedDomain = `applinks:${link.hostname}`;
  const associatedDomains = config.ios?.associatedDomains ?? [];
  const intentFilters = config.android?.intentFilters ?? [];
  const passwordResetFilter: AndroidIntentFilter = {
    action: 'VIEW',
    autoVerify: true,
    category: ['BROWSABLE', 'DEFAULT'],
    data: [
      {
        scheme: 'https',
        host: link.hostname,
        pathPrefix: link.path,
      },
    ],
  };

  return {
    ...config,
    ios: {
      ...config.ios,
      associatedDomains: associatedDomains.includes(associatedDomain)
        ? associatedDomains
        : [...associatedDomains, associatedDomain],
    },
    android: {
      ...config.android,
      intentFilters: intentFilters.some((filter) =>
        isPasswordResetIntentFilter(filter, link),
      )
        ? intentFilters
        : [...intentFilters, passwordResetFilter],
    },
  };
};

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
