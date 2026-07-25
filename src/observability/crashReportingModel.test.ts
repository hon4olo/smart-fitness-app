import { describe, expect, it } from 'vitest';

import {
  createSupportIdentifier,
  normalizeRouteForTelemetry,
  sanitizeCrashEvent,
} from './crashReportingModel';

describe('sanitizeCrashEvent', () => {
  it('removes user content and keeps only approved technical metadata', () => {
    const event = sanitizeCrashEvent({
      breadcrumbs: [{ message: 'Ate secret food' }],
      contexts: {
        app: { app_version: '1.0.1', secret: 'remove' },
        device: { model: 'iPhone', name: "Ivan's iPhone" },
        custom: { weight: 70 },
      },
      debug_meta: { images: [{ code_file: 'bundle.js' }] },
      exception: {
        values: [{
          mechanism: { data: { email: 'private@example.com' }, handled: false, type: 'generic' },
          stacktrace: {
            frames: [{ abs_path: '/Users/ivan/app.ts', filename: 'app.ts', function: 'render', vars: { weight: 70 } }],
          },
          type: 'TypeError',
          value: 'private@example.com failed after logging Chicken',
        }],
      },
      extra: { calories: 2200 },
      message: 'private@example.com',
      request: { data: { password: 'secret' } },
      tags: {
        'app-version': '1.0.1',
        email: 'private@example.com',
        route: '/nutrition',
      },
      user: { email: 'private@example.com' },
    });

    expect(event.user).toBeUndefined();
    expect(event.request).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.message).toBeUndefined();
    expect(event.tags).toEqual({ 'app-version': '1.0.1', route: '/nutrition' });
    expect(event.contexts).toEqual({
      app: { app_version: '1.0.1' },
      device: { model: 'iPhone' },
    });
    expect(event.debug_meta).toEqual({ images: [{ code_file: 'bundle.js' }] });
    expect(event.exception?.values?.[0]).toMatchObject({
      mechanism: { handled: false, type: 'generic' },
      type: 'TypeError',
      value: 'Application error',
    });
    expect(event.exception?.values?.[0].stacktrace).toEqual({
      frames: [{ filename: 'app.ts', function: 'render' }],
    });
  });
});

describe('createSupportIdentifier', () => {
  it('is stable without using the error message', () => {
    const first = new Error('first private value');
    const second = new Error('second private value');
    first.name = 'TypeError';
    second.name = 'TypeError';
    first.stack = 'TypeError: first private value\n at render (app.ts:10:2)';
    second.stack = 'TypeError: second private value\n at render (app.ts:10:2)';

    expect(createSupportIdentifier(first, 'update-1')).toBe(
      createSupportIdentifier(second, 'update-1'),
    );
    expect(createSupportIdentifier(first, 'update-1')).toMatch(/^SF-[A-F0-9]{8}$/);
    expect(createSupportIdentifier(first, 'update-1')).not.toBe(
      createSupportIdentifier(first, 'update-2'),
    );
  });
});

describe('normalizeRouteForTelemetry', () => {
  it('keeps safe routes and masks dynamic identifiers', () => {
    expect(normalizeRouteForTelemetry('/nutrition')).toBe('/nutrition');
    expect(normalizeRouteForTelemetry('/exercises/bench-press')).toBe('/exercises/:exerciseId');
    expect(normalizeRouteForTelemetry('/workouts/program/private-program-id')).toBe(
      '/workouts/program/:programId',
    );
    expect(normalizeRouteForTelemetry('/unknown/private-value')).toBe('unknown');
  });
});
