export const API_ERROR_CODES = [
  'network_error',
  'timeout',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'validation_error',
  'rate_limited',
  'unavailable',
  'parse_error',
  'unknown',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorOptions = {
  code: ApiErrorCode;
  message: string;
  status?: number;
  requestId?: string;
  retryable?: boolean;
  details?: unknown;
  body?: unknown;
  cause?: unknown;
};

export class ApiError extends Error {
  code: ApiErrorCode;

  status?: number;

  requestId?: string;

  retryable: boolean;

  details?: unknown;

  body?: unknown;

  cause?: unknown;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
    this.body = options.body;
    this.cause = options.cause;
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;
