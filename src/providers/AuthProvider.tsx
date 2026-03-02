import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem, removeItem, StorageKeys } from '@/helpers/storage';
import { fetchMe } from '@/services/user.service';

type AuthStatus = 'initializing' | 'unauthenticated' | 'authenticated';

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  country?: string;
  nationality?: string;
  dob?: string;
  dateOfBirth?: string;
  kycStatus?: 'NOT_STARTED' | 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  profileStatus?: string;
};

type AuthContextType = {
  status: AuthStatus;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<User | null>(null);

  /* ---------------- BOOTSTRAP ---------------- */
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await getItem<string>(StorageKeys.AUTH_TOKEN);

        if (!token) {
          setStatus('unauthenticated');
          return;
        }

        const me = await fetchMe();

        await setItem(StorageKeys.AUTH_USER, me);
        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        await removeItem(StorageKeys.AUTH_TOKEN);
        await removeItem(StorageKeys.AUTH_USER);
        setUser(null);
        setStatus('unauthenticated');

        console.error('[Auth] Bootstrap failed:', error);
      }
    };

    bootstrap();
  }, []);

  /* ---------------- LOGIN ---------------- */
  const login = async (token: string, user: User) => {
    await setItem(StorageKeys.AUTH_TOKEN, token);
    try {
      const me = await fetchMe();
      await setItem(StorageKeys.AUTH_USER, me);
      setUser(me);
    } catch (error) {
      console.warn('[Auth] Failed to refresh user after login', error);
      await setItem(StorageKeys.AUTH_USER, user);
      setUser(user);
    }
    setStatus('authenticated');
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    await removeItem(StorageKeys.AUTH_TOKEN);
    await removeItem(StorageKeys.AUTH_USER);

    setUser(null);
    setStatus('unauthenticated');
  };

  /* ---------------- REFRESH USER ---------------- */
  const refreshUser = async () => {
    const me = await fetchMe();
    await setItem(StorageKeys.AUTH_USER, me);
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ status, user, login, logout, refreshUser }}>
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
