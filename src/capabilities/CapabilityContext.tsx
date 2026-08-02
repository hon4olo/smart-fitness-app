import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuthSession } from '@/hooks/useAuthSession';

import type { AppCapabilities } from './contracts';
import {
  buildCapabilityScopeKey,
  type CapabilityLoadStatus,
} from './model';
import type { CapabilityService } from './service';

export type CapabilityContextValue = {
  capabilities: AppCapabilities | null;
  status: CapabilityLoadStatus;
  refresh(): Promise<void>;
};

export const CapabilityContext =
  createContext<CapabilityContextValue | null>(null);

type CapabilityProviderProps = PropsWithChildren<{
  service: CapabilityService;
}>;

export function CapabilityProvider({
  children,
  service,
}: CapabilityProviderProps) {
  const { ready: authReady, session } = useAuthSession();
  const [capabilities, setCapabilities] = useState<AppCapabilities | null>(
    null,
  );
  const [status, setStatus] = useState<CapabilityLoadStatus>('checking');
  const requestSequence = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const scopeKey = buildCapabilityScopeKey({
    authReady,
    accountId: session?.user.id ?? null,
    sessionId: session?.session.id ?? null,
  });
  const scopeKeyRef = useRef(scopeKey);

  const load = useCallback(
    async (expectedScopeKey: string): Promise<void> => {
      const sequence = ++requestSequence.current;
      abortController.current?.abort();
      const controller = new AbortController();
      abortController.current = controller;
      setStatus('checking');

      try {
        const nextCapabilities = await service.load(controller.signal);
        if (
          controller.signal.aborted ||
          sequence !== requestSequence.current ||
          expectedScopeKey !== scopeKeyRef.current
        ) {
          return;
        }
        setCapabilities(nextCapabilities);
        setStatus('ready');
      } catch {
        if (
          controller.signal.aborted ||
          sequence !== requestSequence.current ||
          expectedScopeKey !== scopeKeyRef.current
        ) {
          return;
        }
        setCapabilities(null);
        setStatus('recheck_required');
      }
    },
    [service],
  );

  useEffect(() => {
    scopeKeyRef.current = scopeKey;
    requestSequence.current += 1;
    abortController.current?.abort();
    setCapabilities(null);

    if (!authReady) {
      setStatus('checking');
      return;
    }

    void load(scopeKey);
    return () => {
      requestSequence.current += 1;
      abortController.current?.abort();
    };
  }, [authReady, load, scopeKey]);

  const refresh = useCallback(async () => {
    if (!authReady) return;
    await load(scopeKeyRef.current);
  }, [authReady, load]);

  const value = useMemo<CapabilityContextValue>(
    () => ({ capabilities, refresh, status }),
    [capabilities, refresh, status],
  );

  return (
    <CapabilityContext.Provider value={value}>
      {children}
    </CapabilityContext.Provider>
  );
}
