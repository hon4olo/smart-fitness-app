import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';

import {
  captureOperationalFailure,
  setCrashReportRuntimeContext,
} from './crashReporting';

export function CrashReportContextBridge() {
  const pathname = usePathname();
  const { mutationFailure } = useAppContext();
  const { error, status } = useWeightSync();
  const lastCapturedSyncErrorRef = useRef<string | null>(null);
  const lastCapturedMutationFailureRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!mutationFailure || lastCapturedMutationFailureRef.current === mutationFailure.id) return;
    lastCapturedMutationFailureRef.current = mutationFailure.id;
    const safeError = new Error('Application data mutation failed');
    safeError.name = mutationFailure.stage === 'outbox'
      ? 'OutboxMutationFailure'
      : 'LocalPersistenceFailure';
    captureOperationalFailure('persistence', safeError);
  }, [mutationFailure]);

  return null;
}
