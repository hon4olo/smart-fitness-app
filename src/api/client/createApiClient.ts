import { ApiError } from './errors';
import type { ApiClient, ApiClientOptions, ApiRequestOptions, ApiRetryOptions, HttpMethod } from './types';

const SAFE_RETRY_METHODS: HttpMethod[] = ['GET', 'HEAD', 'OPTIONS'];
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY: ApiRetryOptions = {
  attempts: 2,
  delayMs: 250,
  factor: 2,
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRetryableStatus = (status: number): boolean => status === 408 || status === 425 || status === 429 || status >= 500;

const sleep = (ms: number) => new Promise<void>((resolve) => {
  if (ms <= 0) {
    resolve();
    return;
  }

  setTimeout(resolve, ms);
});

const createRequestId = (): string => {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
};

const buildUrl = (baseUrl: string, path: string, query?: ApiRequestOptions['query']): string => {
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

const inferMessage = (status: number, body: unknown): string => {
  if (isPlainRecord(body)) {
    const message = body.message ?? body.error ?? body.detail ?? body.reason;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  switch (status) {
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation failed';
    case 429:
      return 'Rate limited';
    case 408:
      return 'Request timed out';
    default:
      return `Request failed with status ${status}`;
  }
};

const inferErrorCode = (status: number): ApiError['code'] => {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation_error';
    case 429:
      return 'rate_limited';
    case 408:
      return 'timeout';
    default:
      return status >= 500 ? 'unavailable' : 'unknown';
  }
};

const normalizeRetry = (retry: ApiRequestOptions['retry'], defaults: Partial<ApiRetryOptions> | undefined): ApiRetryOptions | false => {
  if (retry === false) {
    return false;
  }

  const merged: ApiRetryOptions = {
    attempts: retry?.attempts ?? defaults?.attempts ?? DEFAULT_RETRY.attempts,
    delayMs: retry?.delayMs ?? defaults?.delayMs ?? DEFAULT_RETRY.delayMs,
    factor: retry?.factor ?? defaults?.factor ?? DEFAULT_RETRY.factor,
  };

  return {
    attempts: Math.max(0, Math.floor(merged.attempts)),
    delayMs: Math.max(0, Math.floor(merged.delayMs)),
    factor: Math.max(1, merged.factor),
  };
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawText) as unknown;
    } catch (error) {
      throw new ApiError({
        code: 'parse_error',
        message: 'Failed to parse JSON response',
        status: response.status,
        retryable: false,
        body: rawText,
        cause: error,
      });
    }
  }

  return rawText;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException ? error.name === 'AbortError' : error instanceof Error && error.name === 'AbortError';

const mapNetworkError = (error: unknown): ApiError => {
  if (isAbortError(error)) {
    return new ApiError({
      code: 'timeout',
      message: 'Request timed out',
      retryable: true,
      cause: error,
    });
  }

  return new ApiError({
    code: 'network_error',
    message: error instanceof Error ? error.message : 'Network request failed',
    retryable: true,
    cause: error,
  });
};

const createRequestInit = <TBody>(options: ApiRequestOptions<TBody>, requestId: string, timeoutMs: number, defaultHeaders: Record<string, string> | undefined) => {
  const headers = new Headers({
    Accept: 'application/json',
    'x-request-id': requestId,
    ...defaultHeaders,
    ...options.headers,
  });

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (typeof options.body === 'string' || options.body instanceof FormData || options.body instanceof Blob || options.body instanceof URLSearchParams) {
      body = options.body as BodyInit;
    } else {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(options.body);
    }
  }

  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (options.signal) {
      options.signal.removeEventListener('abort', abortFromSignal);
    }
  };
  const abortFromSignal = () => controller.abort(options.signal?.reason);

  if (options.signal?.aborted) {
    controller.abort(options.signal.reason);
  } else if (options.signal) {
    options.signal.addEventListener('abort', abortFromSignal, { once: true });
  }

  if (timeoutMs > 0) {
    timeoutHandle = setTimeout(() => controller.abort(new DOMException('Request timed out', 'AbortError')), timeoutMs);
  }

  return { init: { method: options.method, headers, body, signal: controller.signal } as RequestInit, cleanup };
};

export const createApiClient = (options: ApiClientOptions): ApiClient => {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  const request = async <TResponse, TBody = unknown>(requestOptions: ApiRequestOptions<TBody>): Promise<TResponse> => {
    const timeoutMs = requestOptions.timeoutMs ?? options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    const retryConfig = normalizeRetry(requestOptions.retry, options.defaultRetry);
    const safeMethod = SAFE_RETRY_METHODS.includes(requestOptions.method);
    const maxAttempts = safeMethod && retryConfig ? retryConfig.attempts + 1 : 1;
    const requestId = options.requestIdFactory?.() ?? createRequestId();
    const url = buildUrl(options.baseUrl, requestOptions.path, requestOptions.query);

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const { init, cleanup } = createRequestInit(requestOptions, requestId, timeoutMs, options.defaultHeaders);
      try {
        const response = await fetchImpl(url, init);
        const body = await parseResponseBody(response);

        if (!response.ok) {
          const message = inferMessage(response.status, body);
          const error = new ApiError({
            code: inferErrorCode(response.status),
            message,
            status: response.status,
            requestId,
            retryable: isRetryableStatus(response.status) && safeMethod,
            body,
          });

          if (attempt < maxAttempts && error.retryable) {
            lastError = error;
            cleanup();
            const delay = retryConfig ? retryConfig.delayMs * retryConfig.factor ** (attempt - 1) : 0;
            await sleep(delay);
            continue;
          }

          throw error;
        }

        cleanup();
        return body as TResponse;
      } catch (error) {
        cleanup();
        const mappedError = error instanceof ApiError ? error : mapNetworkError(error);
        if (attempt < maxAttempts && mappedError.retryable && safeMethod) {
          lastError = mappedError;
          const delay = retryConfig ? retryConfig.delayMs * retryConfig.factor ** (attempt - 1) : 0;
          await sleep(delay);
          continue;
        }

        throw mappedError;
      }
    }

    throw lastError instanceof Error ? lastError : new ApiError({ code: 'unknown', message: 'Request failed', retryable: false, cause: lastError });
  };

  return {
    request,
    get: (path, requestOptions) => request({ ...requestOptions, method: 'GET', path }),
    post: (path, body, requestOptions) => request({ ...requestOptions, method: 'POST', path, body }),
    put: (path, body, requestOptions) => request({ ...requestOptions, method: 'PUT', path, body }),
    patch: (path, body, requestOptions) => request({ ...requestOptions, method: 'PATCH', path, body }),
    delete: (path, requestOptions) => request({ ...requestOptions, method: 'DELETE', path }),
  };
};
