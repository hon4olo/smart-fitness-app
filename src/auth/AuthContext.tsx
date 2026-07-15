import { createContext, PropsWithChildren, useEffect, useMemo, useState } from 'react';

import type { AuthCredentials, AuthProfile, AuthProfileUpdate, AuthSession, AuthService } from './types';

export type AuthContextValue = {
  ready: boolean;
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

export function AuthProvider({ children, service }: AuthProviderProps) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const cached = await service.loadSession();
      if (cancelled) {
        return;
      }

      setSession(cached);
      setProfile(cached?.user ?? null);
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
        // Offline fallback: keep cached session/profile.
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session?.tokens.accessToken),
      register: async (credentials) => {
        const nextSession = await service.register(credentials);
        setSession(nextSession);
        setProfile(nextSession.user);
        return nextSession;
      },
      login: async (credentials) => {
        const nextSession = await service.login(credentials);
        setSession(nextSession);
        setProfile(nextSession.user);
        return nextSession;
      },
      refresh: async () => {
        const nextSession = await service.refresh();
        if (nextSession) {
          setSession(nextSession);
          setProfile(nextSession.user);
        }
        return nextSession;
      },
      logout: async () => {
        await service.logout();
        setSession(null);
        setProfile(null);
      },
      fetchProfile: async () => {
        const nextProfile = await service.fetchProfile();
        if (nextProfile) {
          setProfile(nextProfile);
        }
        return nextProfile;
      },
      updateProfile: async (patch) => {
        const nextProfile = await service.updateProfile(patch);
        if (nextProfile) {
          setProfile(nextProfile);
        }
        return nextProfile;
      },
    }),
    [profile, ready, service, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
