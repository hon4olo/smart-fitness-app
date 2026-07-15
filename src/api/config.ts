export const getMobileApiBaseUrl = (): string | undefined =>
  (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || process.env.EXPO_PUBLIC_API_URL?.trim() || undefined);
