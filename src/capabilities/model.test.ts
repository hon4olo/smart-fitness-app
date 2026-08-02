import { describe, expect, it } from 'vitest';

import type { ProviderCapability } from './contracts';
import {
  buildCapabilityScopeKey,
  resolveCapabilityAvailability,
} from './model';

const capability = (
  patch: Partial<ProviderCapability> = {},
): ProviderCapability => ({
  schemaVersion: 1,
  sourceSupported: true,
  configured: true,
  ready: true,
  enabled: true,
  state: 'available',
  ...patch,
});

describe('capability availability model', () => {
  it('fails closed while checking or after an invalid refresh', () => {
    expect(resolveCapabilityAvailability(null, 'checking')).toBe('checking');
    expect(resolveCapabilityAvailability(null, 'recheck_required')).toBe(
      'recheck_required',
    );
  });

  it('maps bounded backend states without exposing raw status text', () => {
    expect(
      resolveCapabilityAvailability(
        capability({
          configured: false,
          ready: false,
          state: 'configuration_required',
        }),
        'ready',
      ),
    ).toBe('configuration_required');
    expect(
      resolveCapabilityAvailability(
        capability({ ready: false, state: 'temporarily_unavailable' }),
        'ready',
      ),
    ).toBe('temporarily_unavailable');
    expect(
      resolveCapabilityAvailability(
        capability({ enabled: false, state: 'disabled' }),
        'ready',
      ),
    ).toBe('unavailable');
    expect(
      resolveCapabilityAvailability(
        capability({
          sourceSupported: false,
          configured: false,
          ready: false,
          enabled: false,
          state: 'unsupported',
        }),
        'ready',
      ),
    ).toBe('unavailable');
  });

  it('allows use only for an internally complete available capability', () => {
    expect(resolveCapabilityAvailability(capability(), 'ready')).toBe(
      'available',
    );
    expect(
      resolveCapabilityAvailability(
        capability({ configured: false }),
        'ready',
      ),
    ).toBe('recheck_required');
  });

  it('isolates anonymous, account, and session capability scopes', () => {
    expect(
      buildCapabilityScopeKey({
        authReady: false,
        accountId: null,
        sessionId: null,
      }),
    ).toBe('auth:restoring');
    expect(
      buildCapabilityScopeKey({
        authReady: true,
        accountId: null,
        sessionId: null,
      }),
    ).toBe('auth:anonymous');
    expect(
      buildCapabilityScopeKey({
        authReady: true,
        accountId: 'account-a',
        sessionId: 'session-a',
      }),
    ).not.toBe(
      buildCapabilityScopeKey({
        authReady: true,
        accountId: 'account-a',
        sessionId: 'session-b',
      }),
    );
  });
});
