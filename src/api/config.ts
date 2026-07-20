export const PRODUCTION_API_BASE_URL = 'https://peptonio.com';

const readConfiguredBaseUrl = (): string | undefined =>
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const normalizeMobileApiBaseUrl = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('API base URL is required');
  }

  if (!normalized.toLowerCase().startsWith('https://')) {
    throw new Error(`API base URL must use HTTPS: ${normalized}`);
  }

  return stripTrailingSlash(normalized);
};

export const getMobileApiBaseUrl = (): string => {
  const configured = readConfiguredBaseUrl();
  if (!configured) {
    return PRODUCTION_API_BASE_URL;
  }

  return normalizeMobileApiBaseUrl(configured);
};
