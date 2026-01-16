import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthStatus =
  | 'initializing'
  | 'unauthenticated'
  | 'authenticated'
  | 'pendingProfile';

type AuthContextType = {
  status: AuthStatus;
  login: (token: string) => void;
  logout: () => void;
  completeProfile: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');

  // 🔄 Simulate bootstrapping (replace with AsyncStorage later)
  useEffect(() => {
    const bootstrap = async () => {
      // TODO: check stored token
      setTimeout(() => {
        setStatus('unauthenticated');
      }, 1000);
    };

    bootstrap();
  }, []);

  const login = (token: string) => {
    // TODO: save token securely
    // decide if profile is complete
    const isProfileComplete = false;

    setStatus(isProfileComplete ? 'authenticated' : 'pendingProfile');
  };

  const logout = () => {
    // TODO: clear token
    setStatus('unauthenticated');
  };

  const completeProfile = () => {
    setStatus('authenticated');
  };

  return (
    <AuthContext.Provider value={{ status, login, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
