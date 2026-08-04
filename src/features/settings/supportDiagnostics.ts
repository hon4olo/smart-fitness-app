import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import type { WeightSyncStatus } from '@/context/SyncContext';

import {
  createSupportDiagnosticsSnapshot,
  type SupportDiagnostics,
} from './supportDiagnosticsModel';

export {
  serializeSupportDiagnostics,
  SUPPORT_DIAGNOSTICS_EVENT_NAME,
  SUPPORT_DIAGNOSTICS_SCHEMA_VERSION,
} from './supportDiagnosticsModel';
export type { SupportDiagnostics } from './supportDiagnosticsModel';

type BuildProvenanceExtra = {
  buildProvenance?: {
    sourceCommit?: unknown;
  };
};

type CreateSupportDiagnosticsOptions = {
  now?: () => string;
};

const readSourceCommit = (): unknown =>
  (Constants.expoConfig?.extra as BuildProvenanceExtra | undefined)
    ?.buildProvenance?.sourceCommit;

const resolveRuntimeEnvironment = (): 'development' | 'production' =>
  typeof __DEV__ !== 'undefined' && __DEV__
    ? 'development'
    : 'production';

export const createSupportDiagnostics = (
  {
    conflictCount,
    pendingOperations,
    syncStatus,
  }: {
    conflictCount: number;
    pendingOperations: number;
    syncStatus: WeightSyncStatus;
  },
  options: CreateSupportDiagnosticsOptions = {},
): SupportDiagnostics =>
  createSupportDiagnosticsSnapshot({
    evidenceTimestamp: options.now?.() ?? new Date().toISOString(),
    sourceCommit: readSourceCommit(),
    appVersion:
      Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'unknown',
    buildNumber: Constants.nativeBuildVersion ?? 'unknown',
    runtimeVersion: Updates.runtimeVersion ?? 'unknown',
    channel: Updates.channel ?? 'unknown',
    updateId: Updates.updateId ?? 'embedded',
    updateSource: Updates.isEmbeddedLaunch ? 'embedded' : 'downloaded',
    environment:
      process.env.EXPO_PUBLIC_APP_ENV ?? resolveRuntimeEnvironment(),
    syncStatus,
    pendingOperations,
    conflictCount,
  });
