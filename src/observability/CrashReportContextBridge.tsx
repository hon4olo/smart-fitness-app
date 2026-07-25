import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useWeightSync } from '@/context/SyncContext';
import type { AppMutationFailure } from '@/types';

import {
  captureOperationalFailure,
  setCrashReportRuntimeContext,
} from './crashReporting';

export function CrashReportContextBridge() {
  const pathname = usePathname();
  const { error, status } = useWeightSync();
  const lastCapturedSyncErrorRef = useRef<string | null>(null);

  useEffect(() => {
    setCrashReportRuntimeContext({ pathname, syncStatus: status });
  }, [pathname, status]);

  useEffect(() => {
    if (status !== 'error' || !error || lastCapturedSyncErrorRef.current === error) return;
    lastCapturedSyncErrorRef.current = error;
    const safeError = new Error('Synchronization failed');
    safeError.name = 'SyncFailure';
    captureOperationalFailure('sync', safeError);
  }, [error, status]);

  return null;
}

export function MutationFailureTelemetry({
  failure,
}: {
  failure: AppMutationFailure | null;
}) {
  const lastCapturedFailureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!failure || lastCapturedFailureRef.current === failure.id) return;
    lastCapturedFailureRef.current = failure.id;
    const safeError = new Error('Application data mutation failed');
    safeError.name = failure.stage === 'outbox' ? 'OutboxMutationFailure' : 'LocalPersistenceFailure';
    captureOperationalFailure('persistence', safeError);
  }, [failure]);

  return null;
}
