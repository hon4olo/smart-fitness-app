export const APP_CAPABILITIES_SCHEMA_VERSION = 1 as const;
export const PROVIDER_CAPABILITY_SCHEMA_VERSION = 1 as const;

export const PROVIDER_CAPABILITY_STATES = [
  'available',
  'disabled',
  'configuration_required',
  'temporarily_unavailable',
  'unsupported',
] as const;

export type ProviderCapabilityState =
  (typeof PROVIDER_CAPABILITY_STATES)[number];

export const APP_CAPABILITY_NAMES = [
  'managedAvatars',
  'workoutPostImages',
  'mediaModeration',
  'immutableMediaDelivery',
  'passwordReset',
] as const;

export type AppCapabilityName = (typeof APP_CAPABILITY_NAMES)[number];

export type ProviderCapability = {
  schemaVersion: typeof PROVIDER_CAPABILITY_SCHEMA_VERSION;
  sourceSupported: boolean;
  configured: boolean;
  ready: boolean;
  enabled: boolean;
  state: ProviderCapabilityState;
};

export type AppCapabilities = {
  schemaVersion: typeof APP_CAPABILITIES_SCHEMA_VERSION;
  managedAvatars: ProviderCapability;
  workoutPostImages: ProviderCapability;
  mediaModeration: ProviderCapability;
  immutableMediaDelivery: ProviderCapability;
  passwordReset: ProviderCapability;
};

const CAPABILITY_KEYS = [
  'schemaVersion',
  'sourceSupported',
  'configured',
  'ready',
  'enabled',
  'state',
] as const;

const APP_CAPABILITIES_KEYS = [
  'schemaVersion',
  ...APP_CAPABILITY_NAMES,
] as const;

const stateSet = new Set<string>(PROVIDER_CAPABILITY_STATES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === expected.length &&
    expected.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
};

export const deriveProviderCapabilityState = (
  value: Pick<
    ProviderCapability,
    'sourceSupported' | 'configured' | 'ready' | 'enabled'
  >,
): ProviderCapabilityState => {
  if (!value.sourceSupported) return 'unsupported';
  if (!value.enabled) return 'disabled';
  if (!value.configured) return 'configuration_required';
  if (!value.ready) return 'temporarily_unavailable';
  return 'available';
};

export const parseProviderCapability = (
  value: unknown,
): ProviderCapability => {
  if (!isRecord(value) || !hasExactKeys(value, CAPABILITY_KEYS)) {
    throw new Error('Invalid application capability response');
  }
  if (
    value.schemaVersion !== PROVIDER_CAPABILITY_SCHEMA_VERSION ||
    typeof value.sourceSupported !== 'boolean' ||
    typeof value.configured !== 'boolean' ||
    typeof value.ready !== 'boolean' ||
    typeof value.enabled !== 'boolean' ||
    typeof value.state !== 'string' ||
    !stateSet.has(value.state)
  ) {
    throw new Error('Invalid application capability response');
  }

  const capability: ProviderCapability = {
    schemaVersion: PROVIDER_CAPABILITY_SCHEMA_VERSION,
    sourceSupported: value.sourceSupported,
    configured: value.configured,
    ready: value.ready,
    enabled: value.enabled,
    state: value.state as ProviderCapabilityState,
  };

  if (
    (capability.ready && !capability.configured) ||
    (capability.ready && !capability.sourceSupported) ||
    capability.state !== deriveProviderCapabilityState(capability)
  ) {
    throw new Error('Invalid application capability response');
  }

  return capability;
};

export const parseAppCapabilitiesResponse = (
  value: unknown,
): AppCapabilities => {
  if (!isRecord(value) || !hasExactKeys(value, ['capabilities'])) {
    throw new Error('Invalid application capabilities response');
  }
  const capabilities = value.capabilities;
  if (
    !isRecord(capabilities) ||
    !hasExactKeys(capabilities, APP_CAPABILITIES_KEYS) ||
    capabilities.schemaVersion !== APP_CAPABILITIES_SCHEMA_VERSION
  ) {
    throw new Error('Invalid application capabilities response');
  }

  return {
    schemaVersion: APP_CAPABILITIES_SCHEMA_VERSION,
    managedAvatars: parseProviderCapability(capabilities.managedAvatars),
    workoutPostImages: parseProviderCapability(
      capabilities.workoutPostImages,
    ),
    mediaModeration: parseProviderCapability(capabilities.mediaModeration),
    immutableMediaDelivery: parseProviderCapability(
      capabilities.immutableMediaDelivery,
    ),
    passwordReset: parseProviderCapability(capabilities.passwordReset),
  };
};
