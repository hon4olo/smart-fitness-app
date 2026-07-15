export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type ApiRetryOptions = {
  attempts: number;
  delayMs: number;
  factor: number;
};

export type ApiRequestOptions<TBody = unknown> = {
  method: HttpMethod;
  path: string;
  body?: TBody;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: Partial<ApiRetryOptions> | false;
  signal?: AbortSignal;
};

export type ApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  defaultTimeoutMs?: number;
  defaultRetry?: Partial<ApiRetryOptions>;
  defaultHeaders?: Record<string, string>;
  requestIdFactory?: () => string;
};

export type ApiClient = {
  request<TResponse, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TResponse>;
  get<TResponse>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'path' | 'body'>): Promise<TResponse>;
  post<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, 'method' | 'path' | 'body'>): Promise<TResponse>;
  put<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, 'method' | 'path' | 'body'>): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, 'method' | 'path' | 'body'>): Promise<TResponse>;
  delete<TResponse>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'path' | 'body'>): Promise<TResponse>;
};
