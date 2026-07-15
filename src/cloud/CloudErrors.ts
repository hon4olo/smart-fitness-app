export const CLOUD_ERROR_CODES = ['offline', 'conflict', 'authentication_required', 'unavailable', 'unknown'] as const;

export type CloudErrorCode = (typeof CLOUD_ERROR_CODES)[number];

export type CloudError = {
  code: CloudErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
  cause?: unknown;
};
