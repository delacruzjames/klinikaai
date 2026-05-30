import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loginWithCredentials } from '@/services/auth-api';
import { clearSession, loadSession, saveSession } from '@/services/auth-storage';
import { fetchUserProfile } from '@/services/profile-api';

export type AuthUser = {
  email: string;
  establishmentId: string;
  subDomain: string;
  fullname?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  isRestoring: boolean;
  isLocked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  lockScreen: () => void;
  unlockScreen: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function baseUserFromSession(session: {
  email: string;
  establishmentId: string;
  subDomain: string;
}): AuthUser {
  return {
    email: session.email,
    establishmentId: session.establishmentId,
    subDomain: session.subDomain,
  };
}

async function enrichUserWithProfile(user: AuthUser, token: string): Promise<AuthUser> {
  try {
    const profile = await fetchUserProfile(token);
    return {
      ...user,
      fullname: profile.fullname,
      role: profile.type || profile.position,
      firstName: profile.first_name,
      lastName: profile.last_name,
      profilePictureUrl: profile.profile_picture_url,
    };
  } catch {
    return user;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadSession()
      .then(async session => {
        if (!mounted || !session) return;

        setToken(session.token);
        const baseUser = baseUserFromSession(session);
        setUser(baseUser);

        const enriched = await enrichUserWithProfile(baseUser, session.token);
        if (mounted) setUser(enriched);
      })
      .finally(() => {
        if (mounted) setIsRestoring(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsSigningIn(true);
    try {
      const data = await loginWithCredentials(email, password);

      const session = {
        token: data.token,
        email: data.email,
        establishmentId: String(data.establishment_id),
        subDomain: data.sub_domain,
      };

      await saveSession(session);
      setToken(session.token);

      const baseUser = baseUserFromSession(session);
      setUser(baseUser);

      const enriched = await enrichUserWithProfile(baseUser, session.token);
      setUser(enriched);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setToken(null);
    setUser(null);
    setIsLocked(false);
  }, []);

  const lockScreen = useCallback(() => setIsLocked(true), []);
  const unlockScreen = useCallback(() => setIsLocked(false), []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: user !== null && token !== null,
      isSigningIn,
      isRestoring,
      isLocked,
      signIn,
      signOut,
      lockScreen,
      unlockScreen,
    }),
    [isLocked, isRestoring, isSigningIn, lockScreen, signIn, signOut, token, unlockScreen, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
