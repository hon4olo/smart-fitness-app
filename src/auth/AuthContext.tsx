import { createContext, PropsWithChildren, useEffect, useMemo, useState } from 'react';

import type { AuthCredentials, AuthProfile, AuthProfileUpdate, AuthSession, AuthService } from './types';
import { resolveAuthGateStatus, type AuthGateStatus } from './auth-ui';

export type AuthContextValue = {
  ready: boolean;
  status: AuthGateStatus;
  error: string | null;
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  profile: AuthProfile | null;
  isAuthenticated: boolean;
  register(credentials: AuthCredentials): Promise<AuthSession>;
  login(credentials: AuthCredentials): Promise<AuthSession>;
  refresh(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  fetchProfile(): Promise<AuthProfile | null>;
  updateProfile(patch: AuthProfileUpdate): Promise<AuthProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = PropsWithChildren<{
  service: AuthService;
}>;

const AUTH_ERROR_MESSAGE = 'Unable to restore your account right now.';

export function AuthProvider({ children, service }: AuthProviderProps) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const cached = await service.loadSession();
        if (cancelled) {
          return;
        }

        setSession(cached);
        setProfile(cached?.user ?? null);
        setError(null);
        setReady(true);

        if (!cached) {
          return;
        }

        try {
          const remoteProfile = await service.fetchProfile();
          if (!cancelled && remoteProfile) {
            setProfile(remoteProfile);
          }
        } catch {
          // Offline fallback: preserve the cached session/profile.
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setProfile(null);
          setError(AUTH_ERROR_MESSAGE);
          setReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [service]);

  const syncSession = async (nextSession: AuthSession | null) => {
    if (nextSession) {
      setSession(nextSession);
      setProfile(nextSession.user);
      setError(null);
      return;
    }

    const currentSession = await service.getCurrentSession();
    if (!currentSession) {
      setSession(null);
      setProfile(null);
      setError(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      status: resolveAuthGateStatus({ ready, session, error }),
      error,
      session,
      user: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session?.tokens.accessToken),
      register: async (credentials) => {
        const nextSession = await service.register(credentials);
        setSession(nextSession);
        setProfile(nextSession.user);
        setError(null);
        return nextSession;
      },
      login: async (credentials) => {
        const nextSession = await service.login(credentials);
        setSession(nextSession);
        setProfile(nextSession.user);
        setError(null);
        return nextSession;
      },
      refresh: async () => {
        const nextSession = await service.refresh();
        await syncSession(nextSession);
        return nextSession;
      },
      logout: async () => {
        await service.logout();
        setSession(null);
        setProfile(null);
        setError(null);
      },
      fetchProfile: async () => {
        const nextProfile = await service.fetchProfile();
        if (nextProfile) {
          setProfile(nextProfile);
          setError(null);
          return nextProfile;
        }

        await syncSession(await service.getCurrentSession());
        return null;
      },
      updateProfile: async (patch) => {
        const nextProfile = await service.updateProfile(patch);
        if (nextProfile) {
          setProfile(nextProfile);
          setError(null);
          return nextProfile;
        }

        await syncSession(await service.getCurrentSession());
        return null;
      },
    }),
    [error, profile, ready, service, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
