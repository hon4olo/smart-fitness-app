'use strict';

const PASSWORD_RESET_APP_LINK_ENV = 'PASSWORD_RESET_APP_LINK_BASE_URL';
const PASSWORD_RESET_ROUTE_PATH = '/auth/reset-password';
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

const invalidConfiguration = () =>
  new Error(
    `${PASSWORD_RESET_APP_LINK_ENV} must be an exact HTTPS reset route on a DNS hostname`,
  );

const isDnsHostname = (hostname) => {
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

const parsePasswordResetAppLink = (rawValue) => {
  const value = rawValue?.trim();
  if (!value) return null;

  let url;
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

const toIntentFilterData = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const isPasswordResetIntentFilter = (filter, link) =>
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

const withPasswordResetAppLink = (config, rawValue) => {
  const link = parsePasswordResetAppLink(rawValue);
  if (!link) return config;

  const associatedDomain = `applinks:${link.hostname}`;
  const associatedDomains = config.ios?.associatedDomains ?? [];
  const intentFilters = config.android?.intentFilters ?? [];
  const passwordResetFilter = {
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

module.exports = {
  PASSWORD_RESET_APP_LINK_ENV,
  PASSWORD_RESET_ROUTE_PATH,
  parsePasswordResetAppLink,
  withPasswordResetAppLink,
};
