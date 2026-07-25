import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import type { WeightSyncStatus } from '@/context/SyncContext';

export type SupportDiagnostics = {
  appVersion: string;
  buildNumber: string;
  runtimeVersion: string;
  channel: string;
  updateId: string;
  updateSource: 'embedded' | 'downloaded';
  environment: string;
  syncStatus: WeightSyncStatus;
  pendingOperations: number;
  conflictCount: number;
};

const safeText = (value: string | null | undefined, fallback = 'unknown'): string => {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 120) : fallback;
};

export const createSupportDiagnostics = ({
  conflictCount,
  pendingOperations,
  syncStatus,
}: {
  conflictCount: number;
  pendingOperations: number;
  syncStatus: WeightSyncStatus;
}): SupportDiagnostics => ({
  appVersion: safeText(Constants.expoConfig?.version ?? Constants.nativeAppVersion),
  buildNumber: safeText(Constants.nativeBuildVersion),
  runtimeVersion: safeText(Updates.runtimeVersion),
  channel: safeText(Updates.channel),
  updateId: safeText(Updates.updateId, 'embedded'),
  updateSource: Updates.isEmbeddedLaunch ? 'embedded' : 'downloaded',
  environment: safeText(process.env.EXPO_PUBLIC_APP_ENV, __DEV__ ? 'development' : 'production'),
  syncStatus,
  pendingOperations: Math.max(0, Math.floor(pendingOperations)),
  conflictCount: Math.max(0, Math.floor(conflictCount)),
});

export const serializeSupportDiagnostics = (diagnostics: SupportDiagnostics): string =>
  [
    `App: ${diagnostics.appVersion} (${diagnostics.buildNumber})`,
    `Runtime: ${diagnostics.runtimeVersion}`,
    `Channel: ${diagnostics.channel}`,
    `Update: ${diagnostics.updateId} (${diagnostics.updateSource})`,
    `Environment: ${diagnostics.environment}`,
    `Sync: ${diagnostics.syncStatus}`,
    `Pending: ${diagnostics.pendingOperations}`,
    `Conflicts: ${diagnostics.conflictCount}`,
  ].join('\n');
