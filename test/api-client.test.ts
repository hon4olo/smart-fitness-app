import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiClient, isApiError } from '@/api/client';

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('injects a request id and parses JSON responses', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect((init?.headers as Headers).get('x-request-id')).toBe('req-1');
      return jsonResponse({ ok: true });
    });
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1' });

    await expect(client.get<{ ok: boolean }>('/v1/health')).resolves.toEqual({ ok: true });
  });

  it('joins base urls and paths without duplicate slashes', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = createApiClient({ baseUrl: 'https://api.example.com/', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1' });

    await client.get('/v1/user');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/user', expect.anything());
  });

  it('serializes query parameters', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1' });

    await client.get('/v1/user', { query: { page: 2, search: 'alice', includeInactive: false, ignored: null } });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/user?page=2&search=alice&includeInactive=false', expect.anything());
  });

  it('retries safe GET requests after a transient network failure', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1', defaultRetry: { attempts: 1, delayMs: 0, factor: 2 } });

    await expect(client.get<{ ok: boolean }>('/v1/health')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry POST requests on server errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('server error', { status: 500 }));
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1', defaultRetry: { attempts: 3, delayMs: 0, factor: 2 } });

    await expect(client.post('/v1/auth/login', { email: 'a@example.com' })).rejects.toMatchObject({ code: 'unavailable', status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps unauthorized responses to ApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1' });

    try {
      await client.get('/v1/user');
      throw new Error('expected failure');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect(error).toMatchObject({ code: 'unauthorized', status: 401, message: 'nope' });
    }
  });

  it('fails fast on invalid JSON bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('not json', { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1' });

    await expect(client.get('/v1/user')).rejects.toMatchObject({ code: 'parse_error' });
  });

  it('times out hanging requests', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      })
    );
    const client = createApiClient({ baseUrl: 'https://api.example.com', fetchImpl: fetchMock as typeof fetch, requestIdFactory: () => 'req-1', defaultRetry: { attempts: 0, delayMs: 0, factor: 2 } });
    const promise = client.get('/v1/health', { timeoutMs: 10 }).catch((error) => error);

    await vi.advanceTimersByTimeAsync(10);
    await expect(promise).resolves.toMatchObject({ code: 'timeout' });
  });
});
