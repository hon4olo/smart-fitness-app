import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import type { WeightSyncStatus } from '@/context/SyncContext';

import {
  createSupportIdentifier,
  normalizeRouteForTelemetry,
  sanitizeCrashEvent,
  type CrashEventLike,
  type OperationalFailureCategory,
  type TelemetryOnlineState,
} from './crashReportingModel';

const readPublicEnvironmentValue = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

const sentryDsn = readPublicEnvironmentValue('EXPO_PUBLIC_SENTRY_DSN');
const reportingEnabled = Boolean(sentryDsn) && !__DEV__;
let initialized = false;

const readReleaseMetadata = () => ({
  appVersion: Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'unknown',
  buildNumber: Constants.nativeBuildVersion ?? 'unknown',
  channel: Updates.channel ?? 'unknown',
  gitCommit: readPublicEnvironmentValue('EXPO_PUBLIC_GIT_COMMIT_SHA') ?? 'unknown',
  isEmbeddedUpdate: Updates.isEmbeddedLaunch ? 'true' : 'false',
  runtimeVersion: Updates.runtimeVersion ?? 'unknown',
  updateId: Updates.updateId ?? 'embedded',
});

export const initializeCrashReporting = (): void => {
  if (initialized) return;
  initialized = true;

  Sentry.init({
    beforeBreadcrumb: () => null,
    beforeSend: (event) =>
      sanitizeCrashEvent(event as unknown as CrashEventLike) as unknown as typeof event,
    dsn: sentryDsn,
    enabled: reportingEnabled,
    enableAutoSessionTracking: false,
    environment: readPublicEnvironmentValue('EXPO_PUBLIC_APP_ENV') ?? (__DEV__ ? 'development' : 'production'),
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });

  const metadata = readReleaseMetadata();
  Sentry.setTags({
    'app-version': metadata.appVersion,
    'build-number': metadata.buildNumber,
    'expo-channel': metadata.channel,
    'expo-update-id': metadata.updateId,
    'git-commit': metadata.gitCommit,
    'is-embedded-update': metadata.isEmbeddedUpdate,
    'runtime-version': metadata.runtimeVersion,
  });
};

export const resolveOnlineStateFromSync = (status: WeightSyncStatus): TelemetryOnlineState => {
  if (status === 'offline') return 'offline';
  if (status === 'local-only') return 'unknown';
  return 'online';
};

export const setCrashReportRuntimeContext = ({
  pathname,
  syncStatus,
}: {
  pathname: string;
  syncStatus: WeightSyncStatus;
}): void => {
  if (!initialized) initializeCrashReporting();
  Sentry.setTags({
    'online-state': resolveOnlineStateFromSync(syncStatus),
    route: normalizeRouteForTelemetry(pathname),
    'sync-status': syncStatus,
  });
};

const captureError = (
  error: Error,
  category: OperationalFailureCategory,
  supportId: string,
  level: 'error' | 'fatal',
): void => {
  if (!initialized) initializeCrashReporting();
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setTag('failure-category', category);
    scope.setTag('support-id', supportId);
    Sentry.captureException(error);
  });
};

export const captureFatalError = (error: Error): string => {
  const supportId = createSupportIdentifier(error, Updates.updateId);
  captureError(error, 'ui_fatal', supportId, 'fatal');
  return supportId;
};

export const captureOperationalFailure = (
  category: Exclude<OperationalFailureCategory, 'ui_fatal'>,
  error: Error,
): string => {
  const supportId = createSupportIdentifier(error, Updates.updateId);
  captureError(error, category, supportId, 'error');
  return supportId;
};

export const restartApplicationAsync = async (): Promise<boolean> => {
  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
};

export const wrapRootComponent = Sentry.wrap;
