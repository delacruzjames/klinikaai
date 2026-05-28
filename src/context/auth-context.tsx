import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type AuthUser = {
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_EMAIL = 'admin@klinikaai.com';
const DEMO_PASSWORD = 'Klinika123!';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        throw new Error('Invalid email or password.');
      }

      setUser({ email: email.trim().toLowerCase() });
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = () => setUser(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isSigningIn,
      signIn,
      signOut,
    }),
    [isSigningIn, user]
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
