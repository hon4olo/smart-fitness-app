import type {
  AppCapabilities,
  AppCapabilityName,
  ProviderCapability,
} from './contracts';

export type CapabilityLoadStatus =
  | 'checking'
  | 'ready'
  | 'recheck_required';

export type CapabilityAvailability =
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'temporarily_unavailable'
  | 'configuration_required'
  | 'recheck_required';

export const resolveCapabilityAvailability = (
  capability: ProviderCapability | null,
  loadStatus: CapabilityLoadStatus,
): CapabilityAvailability => {
  if (loadStatus === 'checking') return 'checking';
  if (loadStatus === 'recheck_required' || !capability) {
    return 'recheck_required';
  }

  switch (capability.state) {
    case 'available':
      return capability.sourceSupported &&
        capability.configured &&
        capability.ready &&
        capability.enabled
        ? 'available'
        : 'recheck_required';
    case 'configuration_required':
      return 'configuration_required';
    case 'temporarily_unavailable':
      return 'temporarily_unavailable';
    case 'disabled':
    case 'unsupported':
      return 'unavailable';
  }
};

export const getCapability = (
  capabilities: AppCapabilities | null,
  name: AppCapabilityName,
): ProviderCapability | null => capabilities?.[name] ?? null;

export const canUseCapability = (
  capabilities: AppCapabilities | null,
  name: AppCapabilityName,
  loadStatus: CapabilityLoadStatus,
): boolean =>
  resolveCapabilityAvailability(
    getCapability(capabilities, name),
    loadStatus,
  ) === 'available';

export const buildCapabilityScopeKey = (input: {
  authReady: boolean;
  accountId: string | null;
  sessionId: string | null;
}): string => {
  if (!input.authReady) return 'auth:restoring';
  if (!input.accountId || !input.sessionId) return 'auth:anonymous';
  return `auth:${input.accountId}:${input.sessionId}`;
};
