import { describe, expect, it } from 'vitest';

import type { StorageAdapter } from '@/storage';

import { classifyApiDiagnosticCategory, createApiClient } from './createApiClient';
import {
  createLocalApiDiagnosticsRecorder,
  LOCAL_API_DIAGNOSTICS_STORAGE_KEY,
} from './LocalApiDiagnostics';
import type { ApiRequestOutcome } from './types';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const createMemoryStorage = (): StorageAdapter & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
  };
};

describe('API diagnostics', () => {
  it('maps paths to bounded categories without retaining route parameters', () => {
    expect(classifyApiDiagnosticCategory('/v1/auth/refresh')).toBe('auth_refresh');
    expect(classifyApiDiagnosticCategory('/v1/auth/login')).toBe('auth');
    expect(classifyApiDiagnosticCategory('/v1/sync/push')).toBe('sync');
    expect(classifyApiDiagnosticCategory('/v1/coach/runs/private-id')).toBe('coach');
    expect(classifyApiDiagnosticCategory('/v1/food/search?q=private')).toBe('food');
    expect(classifyApiDiagnosticCategory('/v1/user')).toBe('profile');
    expect(classifyApiDiagnosticCategory('/health')).toBe('other');
  });

  it('reports one bounded success outcome and omits path, body, query, and request ID', async () => {
    const outcomes: ApiRequestOutcome[] = [];
    const timestamps = [100, 135];
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: async () => jsonResponse({ ok: true }),
      now: () => timestamps.shift() ?? 135,
      onRequestOutcome: (outcome) => outcomes.push(outcome),
      requestIdFactory: () => 'private-request-id',
    });

    await client.post('/v1/auth/login', {
      email: 'private@example.com',
      password: 'private-password',
    });

    expect(outcomes).toEqual([
      {
        category: 'auth',
        method: 'POST',
        outcome: 'success',
        attempts: 1,
        durationMs: 35,
      },
    ]);
    expect(Object.keys(outcomes[0])).toEqual([
      'category',
      'method',
      'outcome',
      'attempts',
      'durationMs',
    ]);
  });

  it('reports only the final failure after retries and counts auth refresh separately', async () => {
    const outcomes: ApiRequestOutcome[] = [];
    let calls = 0;
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      defaultRetry: { attempts: 1, delayMs: 0 },
      fetchImpl: async () => {
        calls += 1;
        throw new Error('private network details');
      },
      now: (() => {
        const timestamps = [10, 50];
        return () => timestamps.shift() ?? 50;
      })(),
      onRequestOutcome: (outcome) => outcomes.push(outcome),
    });

    await expect(client.get('/v1/auth/refresh')).rejects.toMatchObject({
      code: 'network_error',
    });

    expect(calls).toBe(2);
    expect(outcomes).toEqual([
      {
        category: 'auth_refresh',
        method: 'GET',
        outcome: 'network_error',
        attempts: 2,
        durationMs: 40,
      },
    ]);
  });

  it('keeps observer failures outside the request contract', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: async () => jsonResponse({ ok: true }),
      onRequestOutcome: () => {
        throw new Error('diagnostics unavailable');
      },
    });

    await expect(client.get('/v1/user')).resolves.toEqual({ ok: true });
  });

  it('persists only aggregate categories and failure codes locally', async () => {
    const storage = createMemoryStorage();
    const recorder = createLocalApiDiagnosticsRecorder(storage, {
      now: () => new Date('2026-07-30T00:00:00.000Z'),
    });
    recorder.record({
      category: 'auth_refresh',
      method: 'POST',
      outcome: 'timeout',
      attempts: 2,
      durationMs: 15,
    });
    recorder.record({
      category: 'sync',
      method: 'POST',
      outcome: 'success',
      attempts: 1,
      durationMs: 8,
    });
    await recorder.flush();

    await expect(recorder.read()).resolves.toMatchObject({
      totalRequests: 2,
      totalFailures: 1,
      authRefreshFailures: 1,
      lastCategory: 'sync',
      lastOutcome: 'success',
      maximumAttempts: 2,
      maximumDurationMs: 15,
      byCategory: {
        auth_refresh: { requests: 1, failures: 1 },
        sync: { requests: 1, failures: 0 },
      },
      byFailureCode: { timeout: 1 },
    });

    const stored = storage.values.get(LOCAL_API_DIAGNOSTICS_STORAGE_KEY) ?? '';
    expect(stored).not.toContain('/v1/');
    expect(stored).not.toContain('private@example.com');
    expect(stored).not.toContain('request-id');
    expect(stored).not.toContain('password');
  });
});
