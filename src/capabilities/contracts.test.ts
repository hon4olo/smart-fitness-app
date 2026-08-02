import { describe, expect, it } from 'vitest';

import {
  parseAppCapabilitiesResponse,
  type ProviderCapability,
} from './contracts';

const availableCapability = (): ProviderCapability => ({
  schemaVersion: 1,
  sourceSupported: true,
  configured: true,
  ready: true,
  enabled: true,
  state: 'available',
});

const buildResponse = () => ({
  capabilities: {
    schemaVersion: 1,
    managedAvatars: availableCapability(),
    workoutPostImages: availableCapability(),
    mediaModeration: availableCapability(),
    immutableMediaDelivery: availableCapability(),
    passwordReset: availableCapability(),
  },
});

describe('application capability parser', () => {
  it('parses the exact supported response', () => {
    expect(parseAppCapabilitiesResponse(buildResponse())).toEqual(
      buildResponse().capabilities,
    );
  });

  it('rejects unknown top-level, response, and capability fields', () => {
    expect(() =>
      parseAppCapabilitiesResponse({ ...buildResponse(), provider: 'hidden' }),
    ).toThrow();
    expect(() =>
      parseAppCapabilitiesResponse({
        capabilities: { ...buildResponse().capabilities, extra: true },
      }),
    ).toThrow();
    expect(() =>
      parseAppCapabilitiesResponse({
        capabilities: {
          ...buildResponse().capabilities,
          managedAvatars: {
            ...availableCapability(),
            endpoint: 'https://provider.invalid',
          },
        },
      }),
    ).toThrow();
  });

  it('rejects unsupported versions', () => {
    expect(() =>
      parseAppCapabilitiesResponse({
        capabilities: { ...buildResponse().capabilities, schemaVersion: 2 },
      }),
    ).toThrow();
    expect(() =>
      parseAppCapabilitiesResponse({
        capabilities: {
          ...buildResponse().capabilities,
          passwordReset: { ...availableCapability(), schemaVersion: 2 },
        },
      }),
    ).toThrow();
  });

  it('rejects inconsistent readiness and derived state', () => {
    expect(() =>
      parseAppCapabilitiesResponse({
        capabilities: {
          ...buildResponse().capabilities,
          managedAvatars: {
            ...availableCapability(),
            configured: false,
          },
        },
      }),
    ).toThrow();
    expect(() =>
      parseAppCapabilitiesResponse({
        capabilities: {
          ...buildResponse().capabilities,
          passwordReset: {
            ...availableCapability(),
            enabled: false,
          },
        },
      }),
    ).toThrow();
  });
});
