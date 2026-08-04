import type { WeightSyncStatus } from '@/context/SyncContext';

export const SUPPORT_DIAGNOSTICS_EVENT_NAME =
  'support_diagnostics_snapshot' as const;
export const SUPPORT_DIAGNOSTICS_SCHEMA_VERSION = 1 as const;

export type SupportDiagnosticsEnvironment =
  | 'development'
  | 'preview'
  | 'production'
  | 'unknown';
export type SupportDiagnosticsCountState = 'none' | 'present';

export type SupportDiagnostics = {
  eventName: typeof SUPPORT_DIAGNOSTICS_EVENT_NAME;
  schemaVersion: typeof SUPPORT_DIAGNOSTICS_SCHEMA_VERSION;
  evidenceTimestamp: string;
  sourceCommit: string;
  appVersion: string;
  buildNumber: string;
  runtimeVersion: string;
  channel: string;
  updateId: string;
  updateSource: 'embedded' | 'downloaded';
  environment: SupportDiagnosticsEnvironment;
  syncStatus: WeightSyncStatus;
  pendingOperations: number;
  pendingState: SupportDiagnosticsCountState;
  conflictCount: number;
  conflictState: SupportDiagnosticsCountState;
};

export type SupportDiagnosticsInput = Omit<
  SupportDiagnostics,
  | 'eventName'
  | 'schemaVersion'
  | 'pendingState'
  | 'conflictState'
  | 'environment'
  | 'sourceCommit'
> & {
  environment: unknown;
  sourceCommit: unknown;
};

const MAX_TEXT_LENGTH = 120;
const MAX_COUNT = 9_999;
const EXACT_GIT_SHA_PATTERN = /^[0-9a-f]{40}$/iu;

const safeText = (
  value: string | null | undefined,
  fallback = 'unknown',
): string => {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, MAX_TEXT_LENGTH) : fallback;
};

export const normalizeSupportSourceCommit = (value: unknown): string => {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  return EXACT_GIT_SHA_PATTERN.test(normalized) ? normalized : 'unknown';
};

export const normalizeSupportEnvironment = (
  value: unknown,
): SupportDiagnosticsEnvironment => {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'development') return 'development';
  if (normalized === 'preview' || normalized === 'staging') return 'preview';
  if (normalized === 'production') return 'production';
  return 'unknown';
};

export const normalizeSupportEvidenceTimestamp = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return 'unknown';
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime())
    ? timestamp.toISOString()
    : 'unknown';
};

const normalizeCount = (value: number): number =>
  Math.min(MAX_COUNT, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));

const toCountState = (value: number): SupportDiagnosticsCountState =>
  value === 0 ? 'none' : 'present';

export const createSupportDiagnosticsSnapshot = (
  input: SupportDiagnosticsInput,
): SupportDiagnostics => {
  const pendingOperations = normalizeCount(input.pendingOperations);
  const conflictCount = normalizeCount(input.conflictCount);

  return {
    eventName: SUPPORT_DIAGNOSTICS_EVENT_NAME,
    schemaVersion: SUPPORT_DIAGNOSTICS_SCHEMA_VERSION,
    evidenceTimestamp: normalizeSupportEvidenceTimestamp(
      input.evidenceTimestamp,
    ),
    sourceCommit: normalizeSupportSourceCommit(input.sourceCommit),
    appVersion: safeText(input.appVersion),
    buildNumber: safeText(input.buildNumber),
    runtimeVersion: safeText(input.runtimeVersion),
    channel: safeText(input.channel),
    updateId: safeText(input.updateId, 'embedded'),
    updateSource: input.updateSource,
    environment: normalizeSupportEnvironment(input.environment),
    syncStatus: input.syncStatus,
    pendingOperations,
    pendingState: toCountState(pendingOperations),
    conflictCount,
    conflictState: toCountState(conflictCount),
  };
};

export const serializeSupportDiagnostics = (
  diagnostics: SupportDiagnostics,
): string =>
  [
    `Event: ${diagnostics.eventName} v${diagnostics.schemaVersion}`,
    `Evidence: ${diagnostics.evidenceTimestamp}`,
    `Source: ${diagnostics.sourceCommit}`,
    `App: ${diagnostics.appVersion} (${diagnostics.buildNumber})`,
    `Runtime: ${diagnostics.runtimeVersion}`,
    `Channel: ${diagnostics.channel}`,
    `Update: ${diagnostics.updateId} (${diagnostics.updateSource})`,
    `Environment: ${diagnostics.environment}`,
    `Sync: ${diagnostics.syncStatus}`,
    `Pending: ${diagnostics.pendingState} (${diagnostics.pendingOperations})`,
    `Conflicts: ${diagnostics.conflictState} (${diagnostics.conflictCount})`,
  ].join('\n');
